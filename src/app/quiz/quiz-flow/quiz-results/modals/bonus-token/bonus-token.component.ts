import { Component, OnDestroy, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { AttendeeService } from '../../../../../service/attendee/attendee.service';
import { QuizService } from '../../../../../service/quiz/quiz.service';
import { BonusTokenService } from '../../../../../service/user/bonus-token/bonus-token.service';

@Component({
  selector: 'app-bonus-token',
  templateUrl: './bonus-token.component.html',
  styleUrls: ['./bonus-token.component.scss'],
})
export class BonusTokenComponent implements OnInit, OnDestroy {
  public static readonly TYPE = 'BonusTokenComponent';

  private readonly _destroy$ = new Subject();

  public bonusToken;
  public clipboardText = true;
  public quizname: string;
  public nickname: string;
  public date = new Date().toLocaleDateString();

  constructor(
    private activeModal: NgbActiveModal,
    private bonusTokenService: BonusTokenService,
    private quizService: QuizService,
    private attendeeService: AttendeeService,
  ) {}

  public ngOnInit(): void {
    this.quizService.quizUpdateEmitter.pipe(filter(quiz => Boolean(quiz)), takeUntil(this._destroy$)).subscribe(quiz => {
      this.quizname = quiz.name;
    });
    this.bonusTokenService.getBonusToken().subscribe(bonusToken => {
      this.bonusToken = bonusToken;
    }, () => {});
    if (this.attendeeService.ownNick) {
      this.nickname = this.attendeeService.ownNick;
    }
  }

  public ngOnDestroy(): void {
    this._destroy$.next();
    this._destroy$.complete();
  }

  // https://stackoverflow.com/questions/49102724/angular-5-copy-to-clipboard
  public copy(): void {
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = this.bonusToken;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
    this.clipboardText = false;
    setTimeout(() => { this.clipboardText = true; }, 1000);
  }

  public close(): void {
    this.activeModal.close();
  }
}
