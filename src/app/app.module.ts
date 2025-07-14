import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { SlideModule } from './features/slide/slide.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SearchComponent } from './features/search/search.component';
import { NgxColorPaletteComponent } from 'ngx-color-palette';
// import { ShareComponent } from './features/global/dialoge/share/share.component';
// import { ButtonLoaderComponent } from './features/global/button-loader/button-loader.component';
// import { MaterialModule } from './material.module';
import { GlobalModule } from './features/global/global.module';
import { ReactiveFormsModule } from '@angular/forms';
import { ButtonLoaderComponent } from './features/global/button-loader/button-loader.component';
import { provideClientHydration } from '@angular/platform-browser';
@NgModule({
  declarations: [
    // AppComponent,
    SearchComponent,
    // ShareComponent,
    // ButtonLoaderComponent,
  ],
  imports: [
    NgxColorPaletteComponent,
    BrowserModule,
    BrowserAnimationsModule,
    CommonModule,
    HttpClientModule,
    SlideModule,
    RouterModule,
    // MaterialModule,
    GlobalModule,  // Import GlobalModule to use ShareComponent and ButtonLoaderComponent
    // Move AppComponent to imports since it's standalone
    ReactiveFormsModule,
  ],
  exports: [
    // ButtonLoaderComponent,
    GlobalModule,
    // MaterialModule
  ],
  providers: [provideClientHydration()],
  // bootstrap: [AppComponent]
})
export class AppModule { }