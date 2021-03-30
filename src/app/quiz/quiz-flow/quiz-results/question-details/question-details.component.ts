import { isPlatformBrowser, isPlatformServer } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { SimpleMQ } from 'ng2-simple-mq';
import { Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, switchMapTo, takeUntil } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { AbstractQuestionEntity } from '../../../../lib/entities/question/AbstractQuestionEntity';
import { RangedQuestionEntity } from '../../../../lib/entities/question/RangedQuestionEntity';
import { StorageKey } from '../../../../lib/enums/enums';
import { MessageProtocol } from '../../../../lib/enums/Message';
import { IMemberSerialized } from '../../../../lib/interfaces/entities/Member/IMemberSerialized';
import { IHasTriggeredNavigation } from '../../../../lib/interfaces/IHasTriggeredNavigation';
import { ServerUnavailableModalComponent } from '../../../../modals/server-unavailable-modal/server-unavailable-modal.component';
import { AttendeeService } from '../../../../service/attendee/attendee.service';
import { ConnectionService } from '../../../../service/connection/connection.service';
import { FooterBarService } from '../../../../service/footer-bar/footer-bar.service';
import { QuestionTextService } from '../../../../service/question-text/question-text.service';
import { QuizService } from '../../../../service/quiz/quiz.service';

@Component({
  selector: 'app-question-details',
  templateUrl: './question-details.component.html',
  styleUrls: ['./question-details.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionDetailsComponent implements OnInit, OnDestroy, IHasTriggeredNavigation {
  public static readonly TYPE = 'QuestionDetailsComponent';

  private _question: AbstractQuestionEntity;
  private _questionIndex: number;
  private _questionText: string;
  private _selectedAnswerElements: string;
  private _answers: Array<string>;
  private _serverUnavailableModal: NgbModalRef;
  private readonly _messageSubscriptions: Array<string> = [];
  private readonly _destroy = new Subject();

  public hasTriggeredNavigation: boolean;

  get question(): AbstractQuestionEntity {
    return this._question;
  }

  get questionIndex(): number {
    return this._questionIndex;
  }

  set questionIndex(value: number) {
    this._questionIndex = value;
  }

  get questionText(): string {
    return this._questionText;
  }

  get answers(): Array<string> {
    return this._answers;
  }

  get selectedAnswerElements(): string {
    return this._selectedAnswerElements;
  }

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private route: ActivatedRoute,
    private quizService: QuizService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private questionTextService: QuestionTextService,
    private attendeeService: AttendeeService,
    private connectionService: ConnectionService,
    private footerBarService: FooterBarService,
    private ngbModal: NgbModal,
    private messageQueue: SimpleMQ,
    private cd: ChangeDetectorRef,
  ) {

    this.footerBarService.TYPE_REFERENCE = QuestionDetailsComponent.TYPE;
    footerBarService.replaceFooterElements([
      this.footerBarService.footerElemBack,
    ]);

    this.footerBarService.footerElemBack.onClickCallback = () => {
      if (this.hasTriggeredNavigation) {
        return;
      }

      this.hasTriggeredNavigation = true;
      history.back();
    };
  }

  public sanitizeHTML(value: string): string {
    return this.sanitizer.bypassSecurityTrustHtml(`${value}`) as string;
  }

  public normalizeAnswerIndex(index: number): string {
    return String.fromCharCode(65 + index);
  }

  public async ngOnInit(): Promise<void> {
    this.questionTextService.eventEmitter.pipe(takeUntil(this._destroy)).subscribe((value: string | Array<string>) => {
      if (Array.isArray(value)) {
        this._answers = value;
      } else {
        this._questionText = value;
      }
      this.cd.markForCheck();
    });

    this.connectionService.serverStatusEmitter.pipe(takeUntil(this._destroy)).subscribe(isConnected => {
      if (isConnected) {
        if (this._serverUnavailableModal) {
          this._serverUnavailableModal.dismiss();
        }
        return;
      } else if (!isConnected && this._serverUnavailableModal) {
        return;
      }

      this.ngbModal.dismissAll();
      this._serverUnavailableModal = this.ngbModal.open(ServerUnavailableModalComponent, {
        keyboard: false,
        backdrop: 'static',
      });
      this._serverUnavailableModal.result.finally(() => this._serverUnavailableModal = null);
    });

    const questionIndex$ = this.route.paramMap.pipe(map(params => parseInt(params.get('questionIndex'), 10)), distinctUntilChanged());

    this.quizService.quizUpdateEmitter.pipe(switchMapTo(questionIndex$), takeUntil(this._destroy)).subscribe(questionIndex => {
      if (!this.quizService.quiz || isNaN(questionIndex)) {
        return;
      }

      if (this.hasTriggeredNavigation) {
        return;
      }

      this._questionIndex = questionIndex;
      if (this._questionIndex < 0 || this._questionIndex > this.quizService.quiz.currentQuestionIndex) {
        this.hasTriggeredNavigation = true;
        this.router.navigate(['/quiz', 'flow', 'results']);
        return;
      }

      this._question = this.quizService.quiz.questionList[this._questionIndex];
      this.questionTextService.changeMultiple(this._question.answerOptionList.map(answer => answer.answerText)).subscribe();
      this.questionTextService.change(this._question.questionText).subscribe();

      this.attendeeService.attendeeAmount.pipe(
        map(() => this.attendeeService.ownAttendee),
        distinctUntilChanged(),
        filter(v => Boolean(v))
      ).subscribe(mySelf => {
        const res = mySelf.responses[this._questionIndex].value;
        if (Array.isArray(res)) {
          this._selectedAnswerElements = res.map(v => this.normalizeAnswerIndex(v)).join(', ');
        } else {
          this._selectedAnswerElements = res;
        }
        this.cd.markForCheck();
      });
      this.attendeeService.reloadData();
    });

    if (isPlatformServer(this.platformId)) {
      return;
    }

    this.quizService.loadDataToPlay(sessionStorage.getItem(StorageKey.CurrentQuizName)).then(() => {
      this.handleMessages();
    }).catch(() => this.hasTriggeredNavigation = true);
  }

  public ngOnDestroy(): void {
    this.footerBarService.footerElemBack.restoreClickCallback();
    this._messageSubscriptions.forEach(id => this.messageQueue.unsubscribe(id));
    this._destroy.next();
    this._destroy.complete();
    if (isPlatformBrowser(this.platformId) && window['hs']) {
      window['hs'].close();
    }
  }

  public getCurrentQuestionAsRanged(): RangedQuestionEntity {
    if (!this.quizService.quiz) {
      return;
    }

    return this.quizService.quiz.questionList[this.questionIndex] as RangedQuestionEntity;
  }

  public isCorrectAnswerIndex(i): boolean {
    return this.question.answerOptionList[i] && this.question.answerOptionList[i].isCorrect;
  }

  public removeBreakFromAnswer(answers: Array<string>): string {
    if (!Array.isArray(answers) || !answers.length) {
      return;
    }

    const lastBreakIndex = answers[0].lastIndexOf('<br/>');
    if (lastBreakIndex === -1) {
      return answers[0];
    }

    return answers[0].substring(0, answers[0].lastIndexOf('<br/>'));
  }

  private handleMessages(): void {
    this._messageSubscriptions.push(...[
      this.messageQueue.subscribe(MessageProtocol.AllPlayers, payload => {
        payload.members.forEach((elem: IMemberSerialized) => {
          this.attendeeService.addMember(elem);
        });
      }), this.messageQueue.subscribe(MessageProtocol.UpdatedResponse, payload => {
        this.attendeeService.modifyResponse(payload);
      }), this.messageQueue.subscribe(MessageProtocol.NextQuestion, payload => {
        this.quizService.quiz.currentQuestionIndex = payload.nextQuestionIndex;
        sessionStorage.removeItem(StorageKey.CurrentQuestionIndex);
      }), this.messageQueue.subscribe(MessageProtocol.Start, payload => {
        this.quizService.quiz.currentStartTimestamp = payload.currentStartTimestamp;
      }), this.messageQueue.subscribe(MessageProtocol.Reset, payload => {
        if (this.hasTriggeredNavigation) {
          return;
        }

        this.attendeeService.clearResponses();
        this.quizService.quiz.currentQuestionIndex = -1;
        this.hasTriggeredNavigation = true;
        this.router.navigate(['/quiz', 'flow', 'lobby']);
      }), this.messageQueue.subscribe(MessageProtocol.Closed, payload => {
        if (this.hasTriggeredNavigation) {
          return;
        }

        this.hasTriggeredNavigation = true;
        this.router.navigate(['/']);
      }),
    ]);

    this.quizService.isOwner ? this.handleMessagesForOwner() : this.handleMessagesForAttendee();
  }

  private handleMessagesForOwner(): void {}

  private handleMessagesForAttendee(): void {
    this._messageSubscriptions.push(...[
      this.messageQueue.subscribe(MessageProtocol.Start, payload => {
        if (this.hasTriggeredNavigation) {
          return;
        }

        this.hasTriggeredNavigation = true;
        this.router.navigate(['/quiz', 'flow', 'voting']);
      }), this.messageQueue.subscribe(MessageProtocol.UpdatedSettings, payload => {
        this.quizService.quiz.sessionConfig = payload.sessionConfig;
      }), this.messageQueue.subscribe(MessageProtocol.ReadingConfirmationRequested, payload => {
        if (this.hasTriggeredNavigation) {
          return;
        }

        this.hasTriggeredNavigation = true;
        if (environment.readingConfirmationEnabled) {
          this.router.navigate(['/quiz', 'flow', 'reading-confirmation']);
        } else {
          this.router.navigate(['/quiz', 'flow', 'voting']);
        }
      }),
    ]);
  }
}
