import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/pages/home/home.component').then(m => m.HomeComponent),
    pathMatch: 'full'
  },
  {
    path: 'slide',
    loadComponent: () =>
      import('./features/slide/pages/slide/slide.component').then(m => m.SlideComponent)
  }
];