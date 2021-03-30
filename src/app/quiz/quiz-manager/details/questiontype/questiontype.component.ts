import { AfterViewInit, Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Hotkey, HotkeysService } from 'angular2-hotkeys';
import { takeUntil } from 'rxjs/operators';
import { availableQuestionTypes, IAvailableQuestionType } from '../../../../lib/available-question-types';
import { QuestionType } from '../../../../lib/enums/QuestionType';
import { getDefaultQuestionForType } from '../../../../lib/QuizValidator';
import { QuizPoolApiService } from '../../../../service/api/quiz-pool/quiz-pool-api.service';
import { FooterBarService } from '../../../../service/footer-bar/footer-bar.service';
import { HeaderLabelService } from '../../../../service/header-label/header-label.service';
import { I18nService } from '../../../../service/i18n/i18n.service';
import { QuizService } from '../../../../service/quiz/quiz.service';
import { AbstractQuizManagerDetailsComponent } from '../abstract-quiz-manager-details.component';

@Component({
  selector: 'app-questiontype',
  templateUrl: './questiontype.component.html',
  styleUrls: ['./questiontype.component.scss'],
})
export class QuestiontypeComponent extends AbstractQuizManagerDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  public static readonly TYPE = 'QuestiontypeComponent';

  private _selectableQuestionTypes = availableQuestionTypes;

  get selectableQuestionTypes(): Array<IAvailableQuestionType> {
    return this._selectableQuestionTypes;
  }

  private _questionType: string;

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
  ) {
    super(platformId, quizService, headerLabelService, footerBarService, quizPoolApiService, router, route, hotkeysService, translate, i18nService);

    footerBarService.TYPE_REFERENCE = QuestiontypeComponent.TYPE;
    footerBarService.replaceFooterElements([
      footerBarService.footerElemBack,
      footerBarService.footerElemHotkeys
    ]);
  }

  public ngAfterViewInit(): void {
    this.i18nService.initialized.pipe(takeUntil(this.destroy)).subscribe(this.loadHotkeys.bind(this));
    this.translate.onLangChange.pipe(takeUntil(this.destroy)).subscribe(this.loadHotkeys.bind(this));
  }

  public ngOnInit(): void {
    super.ngOnInit();

    const target = ['/quiz', 'manager', this._isQuizPool ? 'quiz-pool' : this._questionIndex, 'overview'];
    this.footerBarService.footerElemBack.onClickCallback = () => this.router.navigate(target);

    this.quizService.quizUpdateEmitter.pipe(takeUntil(this.destroy)).subscribe(() => {
      if (!this.quizService.quiz) {
        return;
      }

      this._questionType = this._question.TYPE;
      this._selectableQuestionTypes = this._selectableQuestionTypes.sort((a) => a.id === this._questionType ? -1 : 0);
    });
  }

  public isActiveQuestionType(type: string): boolean {
    return type === this._questionType;
  }

  public morphToQuestionType(type: QuestionType): void {
    this._question = getDefaultQuestionForType(this.translate, type, this._question);
    this._questionType = type;

    this.quizService.quiz.removeQuestion(this._questionIndex);
    this.quizService.quiz.addQuestion(this._question, this._questionIndex);
    this.quizService.persist();
  }

  private loadHotkeys(): void {
    this.hotkeysService.hotkeys = [];
    this.hotkeysService.reset();

    this.hotkeysService.add([
      new Hotkey('esc', (): boolean => {
        this.footerBarService.footerElemBack.onClickCallback();
        return false;
      }, undefined, this.translate.instant('region.footer.footer_bar.back')),
    ]);
  }
}
