import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { RouterTestingModule } from '@angular/router/testing';
import { JWT_OPTIONS, JwtModule } from '@auth0/angular-jwt';
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap';
import { RxStompService } from '@stomp/ng2-stompjs';
import { SimpleMQ } from 'ng2-simple-mq';
import { TranslatePipeMock } from '../../../../_mocks/_pipes/TranslatePipeMock';
import { jwtOptionsFactory } from '../../../lib/jwt.factory';
import { CustomMarkdownService } from '../../../service/custom-markdown/custom-markdown.service';
import { CustomMarkdownServiceMock } from '../../../service/custom-markdown/CustomMarkdownServiceMock';
import { I18nTestingModule } from '../../../shared/testing/i18n-testing/i18n-testing.module';
import { WordCloudComponent } from '../../../shared/word-cloud/word-cloud.component';

import { QuizPoolOverviewComponent } from './quiz-pool-overview.component';

describe('QuizPoolOverviewComponent', () => {
  let component: QuizPoolOverviewComponent;
  let fixture: ComponentFixture<QuizPoolOverviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        BrowserModule,
        FormsModule, ReactiveFormsModule,
        NgbPopoverModule,
        HttpClientTestingModule, I18nTestingModule, RouterTestingModule, JwtModule.forRoot({
          jwtOptionsProvider: {
            provide: JWT_OPTIONS,
            useFactory: jwtOptionsFactory,
            deps: [PLATFORM_ID],
          },
        }),
      ],
      providers: [
        RxStompService, SimpleMQ, FormBuilder, {
          provide: CustomMarkdownService,
          useClass: CustomMarkdownServiceMock,
        },
      ],
      declarations: [QuizPoolOverviewComponent, TranslatePipeMock, WordCloudComponent],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(QuizPoolOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
