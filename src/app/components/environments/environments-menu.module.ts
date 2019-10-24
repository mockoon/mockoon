import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EnvironmentsMenuComponent } from './environments-menu.component';
import { DragulaModule } from 'ng2-dragula';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
  declarations: [EnvironmentsMenuComponent],
  imports: [
    CommonModule,
    DragulaModule,
    NgbModule
  ],
  exports: [EnvironmentsMenuComponent]
})
export class EnvironmentsMenuModule { }
