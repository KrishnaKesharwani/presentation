import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SlideModule } from './features/slide/slide.module';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: true,
  imports: [CommonModule, SlideModule, RouterOutlet]
})
export class AppComponent {
  title = 'Snackwyze';
}