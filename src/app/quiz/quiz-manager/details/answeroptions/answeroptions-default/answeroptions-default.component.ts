import { ChangeDetectionStrategy, ChangeDetectorRef, Component, HostListener, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { HotkeysService } from 'angular2-hotkeys';
import { Subject } from 'rxjs';
import { switchMapTo, takeUntil } from 'rxjs/operators';
import { AbstractChoiceQuestionEntity } from '../../../../../lib/entities/question/AbstractChoiceQuestionEntity';
import { SurveyQuestionEntity } from '../../../../../lib/entities/question/SurveyQuestionEntity';
import { DeviceType } from '../../../../../lib/enums/DeviceType';
import { LivePreviewEnvironment } from '../../../../../lib/enums/LivePreviewEnvironment';
import { QuestionType } from '../../../../../lib/enums/QuestionType';
import { QuizPoolApiService } from '../../../../../service/api/quiz-pool/quiz-pool-api.service';
import { FooterBarService } from '../../../../../service/footer-bar/footer-bar.service';
import { HeaderLabelService } from '../../../../../service/header-label/header-label.service';
import { I18nService } from '../../../../../service/i18n/i18n.service';
import { QuestionTextService } from '../../../../../service/question-text/question-text.service';
import { QuizService } from '../../../../../service/quiz/quiz.service';
import { AbstractQuizManagerDetailsComponent } from '../../abstract-quiz-manager-details.component';

@Component({
  selector: 'app-answeroptions-default',
  templateUrl: './answeroptions-default.component.html',
  styleUrls: ['./answeroptions-default.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnsweroptionsDefaultComponent extends AbstractQuizManagerDetailsComponent implements OnInit, OnDestroy {
  public static readonly TYPE = 'AnsweroptionsDefaultComponent';
  public readonly DEVICE_TYPE = DeviceType;
  public readonly ENVIRONMENT_TYPE = LivePreviewEnvironment;
  public canAddAnsweroptions = false;
  public canDeleteAnswer: boolean;
  public canEditAnswer: boolean;
  public canShowAnswerContentOnButtons: boolean;
  public canInjectEmojis: boolean;

  protected _question: AbstractChoiceQuestionEntity;
  public onChange = new Subject();

  get question(): AbstractChoiceQuestionEntity {
    return this._question;
  }

  constructor(
    @Inject(PLATFORM_ID) platformId: Object,
    headerLabelService: HeaderLabelService,
    quizService: QuizService,
    route: ActivatedRoute,
    footerBarService: FooterBarService,
    quizPoolApiService: QuizPoolApiService,
    router: Router,
    hotkeysService: HotkeysService,
    translate: TranslateService,
    i18nService: I18nService,
    private cd: ChangeDetectorRef,
    private questionTextService: QuestionTextService,
  ) {
    super(platformId, quizService, headerLabelService, footerBarService, quizPoolApiService, router, route, hotkeysService, translate, i18nService);
  }

  public addAnswer(): void {
    this._question.addDefaultAnswerOption();
    this.questionTextService.changeMultiple(this._question.answerOptionList.map(answer => answer.answerText)).subscribe();
  }

  public deleteAnswer(index: number): void {
    this._question.removeAnswerOption(index);
    this.questionTextService.changeMultiple(this._question.answerOptionList.map(answer => answer.answerText)).subscribe();
  }

  public updateAnswerValue(event: Event, index: number): void {
    this._question.answerOptionList[index].answerText = (
      <HTMLInputElement>event.target
    ).value;
    this.questionTextService.changeMultiple(this._question.answerOptionList.map(answer => answer.answerText)).subscribe();
  }

  public toggleMultipleSelectionSurvey(): void {
    (
      <SurveyQuestionEntity>this._question
    ).multipleSelectionEnabled = !(
      <SurveyQuestionEntity>this._question
    ).multipleSelectionEnabled;
    this.onChange.next();
  }

  public toggleShowOneAnswerPerRow(): void {
    this._question.showOneAnswerPerRow = !this._question.showOneAnswerPerRow;
    this.onChange.next();
  }

  public toggleShowAnswerContentOnButtons(): void {
    this._question.displayAnswerText = !this._question.displayAnswerText;
    this.onChange.next();
  }

  public ngOnInit(): void {
    super.ngOnInit();

    const target = ['/quiz', 'manager', this._isQuizPool ? 'quiz-pool' : this._questionIndex, 'overview'];
    this.footerBarService.footerElemBack.onClickCallback = () => this.router.navigate(target);

    this.initialized$.pipe(switchMapTo(this.quizService.quizUpdateEmitter), takeUntil(this.destroy)).subscribe(() => {
      if (!this.quizService.quiz) {
        return;
      }

      this.canAddAnsweroptions = ![QuestionType.TrueFalseSingleChoiceQuestion, QuestionType.YesNoSingleChoiceQuestion].includes(this._question.TYPE);
      this.canDeleteAnswer = this.canAddAnsweroptions;
      this.canEditAnswer = ![QuestionType.ABCDSurveyQuestion].includes(this._question.TYPE);
      this.canShowAnswerContentOnButtons = ![QuestionType.ABCDSurveyQuestion].includes(this._question.TYPE);
      this.canInjectEmojis = ![QuestionType.ABCDSurveyQuestion].includes(this._question.TYPE);

      this.questionTextService.changeMultiple(this._question.answerOptionList.map(answer => answer.answerText)).subscribe();
    });
  }

  @HostListener('window:beforeunload', [])
  public ngOnDestroy(): void {
    super.ngOnDestroy();

    this.quizService.quiz.questionList[this._questionIndex] = this.question;
    this.quizService.persist();

    this.onChange.complete();
  }

  public getQuestionAsSurvey(question: AbstractChoiceQuestionEntity): SurveyQuestionEntity {
    return question as SurveyQuestionEntity;
  }
}

