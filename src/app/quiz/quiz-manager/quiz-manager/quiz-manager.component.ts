import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {FooterBarService} from '../../../service/footer-bar.service';
import {HeaderLabelService} from '../../../service/header-label.service';
import {ActiveQuestionGroupService} from '../../../service/active-question-group.service';
import {questionReflection} from 'arsnova-click-v2-types/src/questions/question_reflection';
import {IQuestion, IQuestionGroup} from 'arsnova-click-v2-types/src/questions/interfaces';
import {DefaultSettings} from '../../../../lib/default.settings';
import {HttpClient} from '@angular/common/http';
import {CurrentQuizService} from '../../../service/current-quiz.service';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {DefaultAnswerOption} from 'arsnova-click-v2-types/src/answeroptions/answeroption_default';
import {TrackingService} from '../../../service/tracking.service';

@Component({
  selector: 'app-quiz-manager',
  templateUrl: './quiz-manager.component.html',
  styleUrls: ['./quiz-manager.component.scss']
})
export class QuizManagerComponent implements OnInit, OnDestroy {
  public static TYPE = 'QuizManagerComponent';

  readonly selectableQuestionTypes = [
    {
      id: 'MultipleChoiceQuestion',
      translationName: 'component.questions.multiple_choice_question',
      descriptionType: 'component.question_type.description.MultipleChoiceQuestion'
    },
    {
      id: 'SingleChoiceQuestion',
      translationName: 'component.questions.single_choice_question',
      descriptionType: 'component.question_type.description.SingleChoiceQuestion'
    },
    {
      id: 'YesNoSingleChoiceQuestion',
      translationName: 'component.questions.single_choice_question_yes_no',
      descriptionType: 'component.question_type.description.YesNoSingleChoiceQuestion'
    },
    {
      id: 'TrueFalseSingleChoiceQuestion',
      translationName: 'component.questions.single_choice_question_true_false',
      descriptionType: 'component.question_type.description.TrueFalseSingleChoiceQuestion'
    },
    {
      id: 'RangedQuestion',
      translationName: 'component.questions.ranged_question',
      descriptionType: 'component.question_type.description.RangedQuestion'
    },
    {
      id: 'FreeTextQuestion',
      translationName: 'component.questions.free_text_question',
      descriptionType: 'component.question_type.description.FreeTextQuestion'
    },
    {
      id: 'SurveyQuestion',
      translationName: 'component.questions.survey_question',
      descriptionType: 'component.question_type.description.SurveyQuestion'
    }
  ];

  readonly questionGroupItem: IQuestionGroup;

  constructor(
    private footerBarService: FooterBarService,
    private headerLabelService: HeaderLabelService,
    private http: HttpClient,
    private router: Router,
    private currentQuizService: CurrentQuizService,
    private translateService: TranslateService,
    private activeQuestionGroupService: ActiveQuestionGroupService,
    private trackingService: TrackingService,
  ) {

    this.footerBarService.TYPE_REFERENCE = QuizManagerComponent.TYPE;
    footerBarService.replaceFooterElements([
      this.footerBarService.footerElemHome,
      this.footerBarService.footerElemStartQuiz,
      this.footerBarService.footerElemProductTour,
      this.footerBarService.footerElemNicknames,
      this.footerBarService.footerElemSaveAssets,
      this.footerBarService.footerElemMemberGroup
    ]);
    headerLabelService.headerLabel = 'component.quiz_manager.title';
    this.questionGroupItem = activeQuestionGroupService.activeQuestionGroup;
    this.footerBarService.footerElemStartQuiz.isActive = activeQuestionGroupService.activeQuestionGroup.isValid();
    this.footerBarService.footerElemStartQuiz.onClickCallback = async (self) => {
      if (!self.isActive) {
        return;
      }
      this.currentQuizService.quiz = this.questionGroupItem;
      await this.currentQuizService.cacheQuiz(this.questionGroupItem);
      await this.http.put(`${DefaultSettings.httpApiEndpoint}/lobby`, {
        quiz: this.currentQuizService.quiz.serialize()
      }).subscribe(
        () => {
          this.router.navigate(['/quiz', 'flow', 'lobby']);
        }
      );
    };
  }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.footerBarService.footerElemStartQuiz.restoreClickCallback();
  }

  addQuestion(id: string) {
    const question: IQuestion = questionReflection[id](DefaultSettings.defaultQuizSettings.question);
    this.trackingService.trackClickEvent({
      action: QuizManagerComponent.TYPE,
      label: `add-question`
    });
    switch (id) {
      case 'TrueFalseSingleChoiceQuestion':
        question.answerOptionList = [
          new DefaultAnswerOption({answerText: this.translateService.instant('global.true'), isCorrect: false}),
          new DefaultAnswerOption({answerText: this.translateService.instant('global.false'), isCorrect: false}),
        ];
        break;
      case 'YesNoSingleChoiceQuestion':
        question.answerOptionList = [
          new DefaultAnswerOption({answerText: this.translateService.instant('global.yes'), isCorrect: false}),
          new DefaultAnswerOption({answerText: this.translateService.instant('global.no'), isCorrect: false}),
        ];
    }
    this.activeQuestionGroupService.activeQuestionGroup.addQuestion(question);
    this.footerBarService.footerElemStartQuiz.isActive = this.activeQuestionGroupService.activeQuestionGroup.isValid();
    this.activeQuestionGroupService.persist();
  }

  moveQuestionUp(id: number) {
    const question = this.activeQuestionGroupService.activeQuestionGroup.questionList[id];
    this.trackingService.trackClickEvent({
      action: QuizManagerComponent.TYPE,
      label: `move-question-up`,
    });
    this.activeQuestionGroupService.activeQuestionGroup.removeQuestion(id);
    this.activeQuestionGroupService.activeQuestionGroup.addQuestion(question, id - 1);
    this.activeQuestionGroupService.persist();
  }

  moveQuestionDown(id: number) {
    const question = this.activeQuestionGroupService.activeQuestionGroup.questionList[id];
    this.trackingService.trackClickEvent({
      action: QuizManagerComponent.TYPE,
      label: `move-question-down`,
    });
    this.activeQuestionGroupService.activeQuestionGroup.removeQuestion(id);
    this.activeQuestionGroupService.activeQuestionGroup.addQuestion(question, id + 1);
    this.activeQuestionGroupService.persist();
  }

  deleteQuestion(id: number) {
    this.trackingService.trackClickEvent({
      action: QuizManagerComponent.TYPE,
      label: `delete-question`,
    });
    this.activeQuestionGroupService.activeQuestionGroup.removeQuestion(id);
    this.footerBarService.footerElemStartQuiz.isActive = this.activeQuestionGroupService.activeQuestionGroup.isValid();
    this.activeQuestionGroupService.persist();
  }

  trackEditQuestion() {
    this.trackingService.trackClickEvent({
      action: QuizManagerComponent.TYPE,
      label: `edit-question`,
    });
  }
}
