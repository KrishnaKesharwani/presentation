import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { SlideComponent } from './pages/slide/slide.component';
import { SlideService } from './services/slide.service';
import { MatIconModule } from '@angular/material/icon';
@NgModule({
  declarations: [
    
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    SlideComponent,
    MatIconModule
  ],
  providers: [SlideService],
  exports: [
    SlideComponent
  ]
})
export class SlideModule { }
