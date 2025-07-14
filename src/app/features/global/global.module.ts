import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material.module';
import { share } from 'rxjs';
import { ShareComponent } from './dialoge/share/share.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonLoaderComponent } from './button-loader/button-loader.component';
import { InputComponent } from './input/input.component';
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
@NgModule({
  declarations: [ButtonLoaderComponent, InputComponent],
  imports: [
    MaterialModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule
  ], 
  exports: [
    // ShareComponent,
    InputComponent,
    ButtonLoaderComponent,
    MaterialModule
  ],
})
export class GlobalModule { }
