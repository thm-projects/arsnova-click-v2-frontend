import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { TranslateCompiler, TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateMessageFormatCompiler } from 'ngx-translate-messageformat-compiler';
import { createTranslateLoader } from '../../../../../../lib/translation.factory';
import { ActiveQuestionGroupMockService } from '../../../../../service/active-question-group/active-question-group.mock.service';
import { ActiveQuestionGroupService } from '../../../../../service/active-question-group/active-question-group.service';
import { ConnectionMockService } from '../../../../../service/connection/connection.mock.service';
import { ConnectionService } from '../../../../../service/connection/connection.service';
import { FooterBarService } from '../../../../../service/footer-bar/footer-bar.service';
import { HeaderLabelService } from '../../../../../service/header-label/header-label.service';
import { SettingsService } from '../../../../../service/settings/settings.service';
import { SharedService } from '../../../../../service/shared/shared.service';
import { WebsocketMockService } from '../../../../../service/websocket/websocket.mock.service';
import { WebsocketService } from '../../../../../service/websocket/websocket.service';

import { AnsweroptionsRangedComponent } from './answeroptions-ranged.component';

class MockRouter {
  public params = {
    subscribe: (cb) => {
      cb({
        questionIndex: 2,
      });
    },
  };
}

describe('AnsweroptionsRangedComponent', () => {
  let component: AnsweroptionsRangedComponent;
  let fixture: ComponentFixture<AnsweroptionsRangedComponent>;

  beforeEach((() => {
    TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientModule,
        TranslateModule.forRoot({
          loader: {
            provide: TranslateLoader,
            useFactory: (createTranslateLoader),
            deps: [HttpClient],
          },
          compiler: {
            provide: TranslateCompiler,
            useClass: TranslateMessageFormatCompiler,
          },
        }),
      ],
      providers: [
        { provide: ActiveQuestionGroupService, useClass: ActiveQuestionGroupMockService },
        HeaderLabelService,
        FooterBarService,
        SettingsService,
        { provide: ConnectionService, useClass: ConnectionMockService },
        { provide: WebsocketService, useClass: WebsocketMockService },
        { provide: ActivatedRoute, useClass: MockRouter },
        SharedService,
      ],
      declarations: [AnsweroptionsRangedComponent],
    }).compileComponents();
  }));

  beforeEach((() => {
    fixture = TestBed.createComponent(AnsweroptionsRangedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should be created', (() => {
    expect(component).toBeTruthy();
  }));

  it('should contain a TYPE reference', (() => {
    expect(AnsweroptionsRangedComponent.TYPE).toEqual('AnsweroptionsRangedComponent');
  }));

  describe('#updateMinRange', () => {
    it('should replace the min range value with a given number', () => {
      const value = 10;
      const event = <any>{ target: { value } };
      component.updateMinRange(event);
      expect(component.minRange).toEqual(value);
    });
    it('should replace the min range value with a given string as number', () => {
      const value = '10';
      const event = <any>{ target: { value } };
      component.updateMinRange(event);
      expect(component.minRange).toEqual(parseInt(value, 10));
    });
  });

  describe('#updateMaxRange', () => {
    it('should replace the max range value with a given number', () => {
      const value = 10;
      const event = <any>{ target: { value } };
      component.updateMaxRange(event);
      expect(component.maxRange).toEqual(value);
    });
    it('should replace the max range value with a given string as number', () => {
      const value = '10';
      const event = <any>{ target: { value } };
      component.updateMaxRange(event);
      expect(component.maxRange).toEqual(parseInt(value, 10));
    });
  });

  describe('#updateCorrectValue', () => {
    it('should replace the correct value with a given number', () => {
      const value = 10;
      const event = <any>{ target: { value } };
      component.updateCorrectValue(event);
      expect(component.correctValue).toEqual(value);
    });
    it('should replace the correct value with a given string as number', () => {
      const value = '10';
      const event = <any>{ target: { value } };
      component.updateCorrectValue(event);
      expect(component.correctValue).toEqual(parseInt(value, 10));
    });
  });
});
