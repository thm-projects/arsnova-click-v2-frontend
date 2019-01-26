import { Component, OnDestroy } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AutoUnsubscribe } from '../../../../lib/AutoUnsubscribe';
import { Countdown } from '../../../../lib/countdown/countdown';
import { SurveyQuestionEntity } from '../../../../lib/entities/question/SurveyQuestionEntity';
import { MessageProtocol, StatusProtocol } from '../../../../lib/enums/Message';
import { QuestionType } from '../../../../lib/enums/QuestionType';
import { IMessage } from '../../../../lib/interfaces/communication/IMessage';
import { MemberApiService } from '../../../service/api/member/member-api.service';
import { QuizApiService } from '../../../service/api/quiz/quiz-api.service';
import { AttendeeService } from '../../../service/attendee/attendee.service';
import { ConnectionService } from '../../../service/connection/connection.service';
import { FooterBarService } from '../../../service/footer-bar/footer-bar.service';
import { HeaderLabelService } from '../../../service/header-label/header-label.service';
import { QuestionTextService } from '../../../service/question-text/question-text.service';
import { QuizService } from '../../../service/quiz/quiz.service';

@Component({
  selector: 'app-voting',
  templateUrl: './voting.component.html',
  styleUrls: ['./voting.component.scss'],
}) //
@AutoUnsubscribe('_subscriptions')
export class VotingComponent implements OnDestroy {
  public static TYPE = 'VotingComponent';
  public answers: Array<string> = [];

  private _countdown: Countdown;

  get countdown(): Countdown {
    return this._countdown;
  }

  set countdown(value: Countdown) {
    this._countdown = value;
  }

  private _countdownValue: number;

  get countdownValue(): number {
    return this._countdownValue;
  }

  set countdownValue(value: number) {
    this._countdownValue = value;
  }

  private _selectedAnswers: Array<number> | string | number;

  get selectedAnswers(): Array<number> | string | number {
    return this._selectedAnswers;
  }

  // noinspection JSMismatchedCollectionQueryUpdate
  private readonly _subscriptions: Array<Subscription> = [];

  constructor(
    public quizService: QuizService,
    private attendeeService: AttendeeService,
    private footerBarService: FooterBarService,
    private connectionService: ConnectionService,
    private questionTextService: QuestionTextService,
    private headerLabelService: HeaderLabelService,
    private sanitizer: DomSanitizer,
    private router: Router,
    private quizApiService: QuizApiService,
    private memberApiService: MemberApiService,
  ) {

    this.footerBarService.TYPE_REFERENCE = VotingComponent.TYPE;

    headerLabelService.headerLabel = 'component.voting.title';

    this.footerBarService.replaceFooterElements([]);

    this.quizService.loadDataToPlay(sessionStorage.getItem('currentQuizName'));
    this._subscriptions.push(this.quizService.quizUpdateEmitter.subscribe(quiz => {
      if (!quiz) {
        return;
      }

      this.initData();
      this.attendeeService.restoreMembers();
    }));
  }

  public sanitizeHTML(value: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(`${value}`);
  }

  public displayAnswerButtons(): boolean {
    return !this.displayRangedButtons() && //
           !this.displayFreetextInput();
  }

  public displayRangedButtons(): boolean {
    return this.quizService.currentQuestion().TYPE === QuestionType.RangedQuestion;
  }

  public displayFreetextInput(): boolean {
    return this.quizService.currentQuestion().TYPE === QuestionType.FreeTextQuestion;
  }

  public normalizeAnswerOptionIndex(index: number): string {
    return String.fromCharCode(65 + index);
  }

  public isSelected(index: number): boolean {
    return (Array.isArray(this._selectedAnswers) && this._selectedAnswers.indexOf(index) > -1) || this._selectedAnswers === index;
  }

  public parseTextInput(event: Event): void {
    this._selectedAnswers = (<HTMLInputElement>event.target).value;
  }

  public parseNumberInput(event: Event): void {
    this._selectedAnswers = parseInt((<HTMLInputElement>event.target).value, 10);
  }

  public isNumber(value: any): boolean {
    return +value === value;
  }

  public showSendResponseButton(): boolean {
    return this.isNumber(this.selectedAnswers) || (Array.isArray(this.selectedAnswers) && !!this.selectedAnswers.length)
           || (typeof this.selectedAnswers === 'string' && !!this.selectedAnswers.length);
  }

  public toggleSelectAnswer(index: number): void {
    if (!Array.isArray(this._selectedAnswers)) {
      return;
    }
    this.isSelected(index) ? this._selectedAnswers.splice(this._selectedAnswers.indexOf(index), 1) : this.toggleSelectedAnswers()
                                                                                                     ? this._selectedAnswers = [index]
                                                                                                     : this._selectedAnswers.push(index);
    if (this.toggleSelectedAnswers()) {
      this.sendResponses();
    }
  }

  public sendResponses(): void {
    if (this.countdown) {
      this.countdown.onChange.unsubscribe();
      this.countdown.stop();
    }
    this.router.navigate([
      '/quiz', 'flow', this.quizService.quiz.sessionConfig.confidenceSliderEnabled ? 'confidence-rate' : 'results',
    ]);
  }

  public initData(): void {
    switch (this.quizService.currentQuestion().TYPE) {
      case QuestionType.FreeTextQuestion:
        this._selectedAnswers = '';
        break;
      case QuestionType.RangedQuestion:
        this._selectedAnswers = -1;
        break;
      default:
        this._selectedAnswers = [];
    }

    this.connectionService.initConnection().then(() => {
      this.connectionService.connectToChannel(this.quizService.quiz.name);
      this.handleMessages();
    });
    this.questionTextService.eventEmitter.subscribe((value: Array<string>) => this.answers = value);
    this.questionTextService.changeMultiple(this.quizService.currentQuestion().answerOptionList.map(answer => answer.answerText));

    this.quizApiService.getQuizStartTime().subscribe((startTime) => {
      if ((startTime + this.quizService.currentQuestion().timer * 1000) < new Date().getTime()) {
        this.sendResponses();
      }

      this.countdown = new Countdown(this.quizService.currentQuestion(), startTime);
      this.countdown.onChange.subscribe((value) => {
        this.countdownValue = value;
        if (!value || value < 1) {
          this.sendResponses();
        }
      });
    });
  }

  public ngOnDestroy(): void {
    console.log({
      quizName: this.quizService.quiz.name,
      nickname: this.attendeeService.ownNick,
      value: this._selectedAnswers,
    });

    this.memberApiService.putResponse(this._selectedAnswers).subscribe((data: IMessage) => {
      if (data.status !== StatusProtocol.Success) {
        console.log(data);
      }
    });
  }

  private handleMessages(): void {
    this.connectionService.socket.subscribe((data: IMessage) => {
      switch (data.step) {
        case MessageProtocol.UpdatedResponse:
          this.attendeeService.modifyResponse(data.payload);
          break;
        case MessageProtocol.Reset:
          this.attendeeService.clearResponses();
          this.quizService.quiz.currentQuestionIndex = -1;
          this.router.navigate(['/quiz', 'flow', 'lobby']);
          break;
        case MessageProtocol.Closed:
          this.router.navigate(['/']);
          break;
        case MessageProtocol.Stop:
          this._selectedAnswers = [];
          this.router.navigate(['/quiz', 'flow', 'results']);
          break;
      }
    });
  }

  private toggleSelectedAnswers(): boolean {
    const question = this.quizService.currentQuestion();
    if (question.TYPE === QuestionType.SurveyQuestion && !(question as SurveyQuestionEntity).multipleSelectionEnabled) {
      return true;
    }

    return [
      QuestionType.SingleChoiceQuestion,
      QuestionType.TrueFalseSingleChoiceQuestion,
      QuestionType.ABCDSingleChoiceQuestion,
      QuestionType.YesNoSingleChoiceQuestion,
    ].includes(question.TYPE);
  }

}
