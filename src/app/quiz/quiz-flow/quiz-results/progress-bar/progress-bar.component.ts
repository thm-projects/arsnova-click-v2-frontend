import { Component, Input, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Observable, Subject } from 'rxjs';
import { filter, map, takeUntil } from 'rxjs/operators';
import { FreeTextAnswerEntity } from '../../../../lib/entities/answer/FreetextAnwerEntity';
import { AbstractQuestionEntity } from '../../../../lib/entities/question/AbstractQuestionEntity';
import { NumberType } from '../../../../lib/enums/enums';
import { QuestionType } from '../../../../lib/enums/QuestionType';
import { AttendeeService } from '../../../../service/attendee/attendee.service';
import { I18nService } from '../../../../service/i18n/i18n.service';
import { QuizService } from '../../../../service/quiz/quiz.service';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss'],
})
export class ProgressBarComponent implements OnDestroy {
  public static readonly TYPE = 'ProgressBarComponent';

  private readonly _destroy = new Subject();

  @Input() public data: Array<string>;
  @Input() public questionIndex: number;
  @Input() public question: AbstractQuestionEntity;
  @Input() public hideProgressbarCssStyle = true;

  constructor(
    private attendeeService: AttendeeService,
    private translate: TranslateService,
    private quizService: QuizService,
    private i18nService: I18nService,
  ) {
  }

  public ngOnDestroy(): void {
    this._destroy.next();
    this._destroy.complete();
  }

  public attendeeDataForAnswer(answerIndex: number = 0): Observable<object> {
    return this.attendeeService.attendeeAmount.pipe(
      filter(() => Boolean(this.quizService.quiz)),
      map(attendeeAmount => {
        if (!attendeeAmount) {
          return {};
        }

        const question = this.quizService.quiz.questionList[this.questionIndex];
        if (this.hideProgressbarCssStyle) {
          return this.getAnonymousCorrectWrongResults(question);
        }

        const result = {
          answerIndex: answerIndex,
          label: [QuestionType.ABCDSurveyQuestion].includes(question.TYPE) ? null : this.data[answerIndex],
          absolute: 0,
          base: this.attendeeService.attendees.length,
          percent: '0',
          isCorrect: 0,
        };

        if (question.TYPE === QuestionType.RangedQuestion) {
          this.updateResultSetForRangedQuestions(result, question);
        } else if (question.TYPE === QuestionType.FreeTextQuestion) {
          this.updateResultSetForFreetextQuestions(result, question);
        } else {
          this.updateResultSetForQuestions(result, question, answerIndex);
        }

        return result;
      }),
      takeUntil(this._destroy),
    );
  }

  private getAnonymousCorrectWrongResults(question): object {
    let { correct, wrong, neutral } = {
      correct: 0,
      wrong: 0,
      neutral: 0,
    };
    const base = this.attendeeService.attendees.length;
    let storedBase = 0;

    this.attendeeService.attendees.forEach(value => {
      if (typeof value.responses[this.questionIndex] === 'undefined' || value.responses[this.questionIndex].responseTime === -1) {
        return false;
      }
      const responseValue: Array<number | string> | string = value.responses[this.questionIndex].value;
      if (!Array.isArray(responseValue) && !['number', 'string'].includes(typeof responseValue)) {
        return false;
      }

      if (question.TYPE === QuestionType.FreeTextQuestion) {
        const answer = question.answerOptionList[0] = new FreeTextAnswerEntity(question.answerOptionList[0]);
        if (answer.isCorrectInput(responseValue as unknown as string)) {
          correct++;
        } else {
          wrong++;
        }
      } else if (question.TYPE === QuestionType.RangedQuestion) {
        if (responseValue === question.correctValue || //
            (
              responseValue >= question.rangeMin && //
              responseValue <= question.rangeMax
            )) {
          correct++;
        } else {
          wrong++;
        }
      } else if ([QuestionType.SurveyQuestion, QuestionType.ABCDSurveyQuestion].includes(question.TYPE)) {
        neutral++;
      } else {
        question.answerOptionList.forEach((answer, answerIndex) => {
          const hasAnswerSelected = (responseValue as Array<string>).indexOf(answerIndex) > -1;
          if (hasAnswerSelected) {
            storedBase++;
            if (answer.isCorrect) {
              correct++;
            } else {
              wrong++;
            }
          }
        });
      }
    });

    const usedBase = storedBase === 0 ? base : storedBase;
    return {
      correct: {
        absolute: correct,
        percent: this.i18nService.formatNumber(correct / usedBase, NumberType.Percent),
      },
      wrong: {
        absolute: wrong,
        percent: this.i18nService.formatNumber(wrong / usedBase, NumberType.Percent),
      },
      neutral: {
        absolute: neutral,
        percent: this.i18nService.formatNumber(neutral / usedBase, NumberType.Percent),
      },
      base: usedBase,
    };
  }

  private async updateResultSetForQuestions(result, question, answerIndex): Promise<void> {
    if (question.answerOptionList.length <= answerIndex) {
      return;
    }

    const matches = this.attendeeService.attendees.filter(value => {
      if (typeof value.responses[this.questionIndex] === 'undefined') {
        return false;
      }
      const responseValue: any = value.responses[this.questionIndex].value;

      if (Array.isArray(responseValue)) {
        if (isNaN(responseValue[0])) {
          return (
                   <any>responseValue.indexOf(question.answerOptionList[answerIndex].answerText)
                 ) > -1;
        } else {
          return (
                   <any>responseValue.indexOf(answerIndex)
                 ) > -1;
        }
      } else {
        return responseValue === answerIndex;
      }
    });

    if (answerIndex > question.answerOptionList.length - 1) {
      // Race condition with the Mathjax / Markdown parsing in the quiz results component
      result.isCorrect = null;
    } else {
      result.isCorrect = question.answerOptionList[answerIndex].isCorrect ? 1 : -1;
    }
    result.absolute = matches.length;
    result.percent = this.i18nService.formatNumber(matches.length / this.attendeeService.attendees.length, NumberType.Percent);
  }

  private async updateResultSetForRangedQuestions(result, question): Promise<void> {
    const matches = this.attendeeService.attendees.filter(value => {
      if (typeof value.responses[this.questionIndex] === 'undefined') {
        return false;
      }
      const responseValue = parseInt(value.responses[this.questionIndex].value as unknown as string, 10);
      if (Array.isArray(responseValue)) {
        return false;
      }
      if (result.label === 'component.liveResults.guessed_correct') {
        return responseValue === question.correctValue;
      } else if (result.label === 'component.liveResults.guessed_in_range') {
        return responseValue !== question.correctValue && responseValue >= question.rangeMin && responseValue <= question.rangeMax;
      } else {
        const valueString = String(value.responses[this.questionIndex].value);
        if (value.responses[this.questionIndex].value === null || //
            typeof value.responses[this.questionIndex].value === 'undefined' || //
            !valueString) {
          return false;
        }
        return responseValue < question.rangeMin || responseValue > question.rangeMax;
      }
    });

    result.isCorrect = result.label === 'component.liveResults.guessed_correct' ? 1 : result.label === 'component.liveResults.guessed_in_range' ? 0
                                                                                                                                                : -1;
    if (result.label) {
      result.label = this.translate.instant(`${result.label}`);
    }
    result.absolute = matches.length;
    result.percent = this.i18nService.formatNumber(matches.length / this.attendeeService.attendees.length, NumberType.Percent);
  }

  private async updateResultSetForFreetextQuestions(result, question): Promise<void> {
    const matches = this.attendeeService.attendees.filter(value => {
      if (typeof value.responses[this.questionIndex] === 'undefined') {
        return false;
      }
      const responseValue = <string>value.responses[this.questionIndex].value;
      if (!responseValue || !responseValue.length) {
        return;
      }
      const answer = question.answerOptionList[0] = new FreeTextAnswerEntity(question.answerOptionList[0]);
      if (result.label === 'component.liveResults.correct_answer') {
        return answer.isCorrectInput(responseValue);
      } else {
        return !answer.isCorrectInput(responseValue);
      }
    });

    result.isCorrect = result.label === 'component.liveResults.correct_answer' ? 1 : -1;
    if (result.label) {
      result.label = this.translate.instant(`${result.label}`);
    }
    result.absolute = matches.length;
    result.percent = this.i18nService.formatNumber(matches.length / this.attendeeService.attendees.length, NumberType.Percent);
  }
}
