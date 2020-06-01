import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { AddModeComponent } from './add-mode/add-mode.component';
import { AddUserComponent } from './add-user/add-user.component';
import { AvailableQuizzesComponent } from './available-quizzes/available-quizzes.component';
import { HotkeyCheatsheetComponent } from './hotkey-cheatsheet/hotkey-cheatsheet.component';
import { QuizSaveComponent } from './quiz-save/quiz-save.component';
import { ServerUnavailableModalComponent } from './server-unavailable-modal/server-unavailable-modal.component';

@NgModule({
  imports: [
    SharedModule,
  ],
  declarations: [
    AvailableQuizzesComponent, AddModeComponent, AddUserComponent, QuizSaveComponent, ServerUnavailableModalComponent, HotkeyCheatsheetComponent,
  ],
  exports: [
    AvailableQuizzesComponent, AddModeComponent, AddUserComponent, QuizSaveComponent, ServerUnavailableModalComponent,
    HotkeyCheatsheetComponent,
  ],
})
export class ModalsModule {
}
