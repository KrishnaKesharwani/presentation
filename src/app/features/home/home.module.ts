import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeRoutingModule } from './home-routing.module';
import { HomeComponent } from './pages/home/home.component';
import { StartComponent } from '../start/start.component';
import { SearchComponent } from '../search/search.component';
import { NgxColorPaletteComponent } from 'ngx-color-palette';
import { MatDialogModule  } from '@angular/material/dialog';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


@NgModule({
  // declarations: [StartComponent, HomeComponent],
  // declarations: [SearchComponent],
  imports: [
    CommonModule,
    HomeRoutingModule,
    NgxColorPaletteComponent,
    BrowserAnimationsModule ,
    MatDialogModule,
  ],
  exports: [
    // SearchComponent,
    NgxColorPaletteComponent
  ]
})
export class HomeModule { }
