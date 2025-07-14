import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-button-loader',
  standalone: false,
  templateUrl: './button-loader.component.html',
  styleUrl: './button-loader.component.scss',
})
export class ButtonLoaderComponent {
  constructor() { }

  @Input() diameter: string | number = '20';
}
