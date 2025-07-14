import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SlideComponent } from './pages/slide/slide.component';

const routes: Routes = [
  {
    path: '',
    component: SlideComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SlideRoutingModule { }
