// src/app/components/home/home.component.ts
import { Component, NgZone, ChangeDetectorRef, HostListener, Inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GoogleSlidesService } from '../../../../services/google-slide.service';
import { NgxColorPaletteComponent } from 'ngx-color-palette';
import { S3UploadService } from '../../../../services/s3-upload.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule, NgxColorPaletteComponent]
})
export class HomeComponent {
  urlInput: string = '';
  isLoading: boolean = false;
  uploading: boolean = false;
  progress: number = 0;
  position: string = 'right';
  color = '#4F45E6';
  sliderAllJsonData: any;
  private readonly MAX_CONCURRENT_UPLOADS = 5;
  private readonly SLIDE_BATCH_SIZE = 5;
  @HostListener('window:resize', [])
  onResize() {
    this.setPalettePosition();
  }

  setPalettePosition() {
    if (window.innerWidth <= 900) {
      this.position = 'left'; // or 'full' if supported by the library
    } else {
      this.position = 'right';
    }
  }
  constructor(
    private router: Router,
    private googleSlidesService: GoogleSlidesService,
    private snackBar: MatSnackBar,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef,
    private s3UploadService: S3UploadService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) { }



  onColorChange(color: any) {
    this.cdr.detectChanges();
    this.ngZone.run(() => {
      // Your color change logic here
    });
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
  }

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('sliderJsonData', '');
      localStorage.setItem('themeColor', '#4F45E6');
      this.setPalettePosition();
    }
  }

  public currentColor(event: any) {
    if (isPlatformBrowser(this.platformId)) {
      setTimeout(() => {
        localStorage.setItem('themeColor', event.color);
        document.documentElement.style.setProperty('--theme-demo-color', event.color);
        this.color = event.color;
      });
    }
  }
  async onSubmit() {
    try {
      let finalJsonData: any = null;
      const url = this.urlInput;
      const presentationId = this.validateUrl(url);
      if (!presentationId) {
        this.showError('Invalid Google Slides URL');
        return;
      }

      await this.googleSlidesService.signIn();
      this.isLoading = true;
      this.uploading = true;
      this.progress = 0;
      const presentation = await this.googleSlidesService.listSlides(presentationId);

      if (!presentation) {
        this.showError('Error loading presentation data');
        return;
      } else {
        this.snackBar.open('Google presentation data received done, please wait to upload local setup', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
      // --- ADD THEME COLOR TO PRESENTATION OBJECT ---
      if (isPlatformBrowser(this.platformId)) {
        presentation.themeColor = this.color;
        console.log('Presentation Final Json:', presentation);
      } 
      try {
        await this.s3UploadService.uploadAndReplaceImageUrls(
          presentation,
          presentationId,
          (current, total) => {
            this.uploading = true;
            this.progress = Math.round((current / total) * 100);
          }
        );

        // Upload the JSON file to S3 after images are processed
        const jsonUrl = await this.s3UploadService.uploadJsonToS3(presentation, presentationId);
        console.log('JSON uploaded to:', jsonUrl);
      } catch (error) {
        console.error('Upload failed:', error);
        this.showError('Failed to upload to S3');
        return;
      }
      // if (finalJsonData !== null && finalJsonData !== undefined) {
      //   this.sliderAllJsonData = finalJsonData;
      //   localStorage.setItem('sliderJsonData', JSON.stringify(presentation));
      // localStorage.setItem('localPresentationID', presentationId);

      this.snackBar.open('Presentation processed and uploaded successfully', 'Close', {
        duration: 3000,
        panelClass: ['success-snackbar'],
        horizontalPosition: 'center',
        verticalPosition: 'bottom'
      });

      this.urlInput = '';
      // this.router.navigate(['/slide'], {
      //   queryParams: {
      //     fileKey: presentationId + '/presentation.json',
      //   }
      // });
      this.router.navigate(['/slide'], {
        queryParams: {
          presentationId: presentationId,
          // fileKey: `${presentationId}/presentation.json`
        },
        queryParamsHandling: 'merge' // Preserve other query params if needed
      });
      // }
      // this.router.navigate(['slide']);
    } catch (error) {
      console.error('Error processing presentation:', error);
      this.showError(error instanceof Error ? error.message : 'Error processing presentation');
    } finally {
      this.isLoading = false;
      this.uploading = false;
      this.progress = 0;
    }
  }
  // async onSubmit() {
  //   try {
  //     const url = this.urlInput;
  //     const presentationId = this.validateUrl(url);
  //     if (!presentationId) {
  //       this.showError('Invalid Google Slides URL');
  //       return;
  //     }

  //     await this.googleSlidesService.signIn();
  //     this.isLoading = true;
  //     this.uploading = true;
  //     this.progress = 0;
  //     const presentation = await this.googleSlidesService.listSlides(presentationId);

  //     if (!presentation) {
  //       this.showError('Error loading presentation data');
  //       return;
  //     }

  //     try {
  //       await this.s3UploadService.uploadAndReplaceImageUrls(
  //         presentation,
  //         presentationId,
  //         (current, total) => {
  //           this.uploading = true;
  //           this.progress = Math.round((current / total) * 100);
  //         }
  //       );
  //     } catch (error) {
  //       console.error('Upload failed:', error);
  //       this.showError('Failed to upload images to S3');
  //       return;
  //     }

  //     this.sliderAllJsonData = presentation;
  //     localStorage.setItem('sliderJsonData', JSON.stringify(presentation));

  //     this.snackBar.open('Presentation processed successfully', 'Close', {
  //       duration: 3000,
  //       panelClass: ['success-snackbar'],
  //       horizontalPosition: 'center',
  //       verticalPosition: 'bottom'
  //     });

  //     this.urlInput = '';
  //     this.router.navigate(['slide']);
  //   } catch (error) {
  //     console.error('Error processing presentation:', error);
  //     this.showError(error instanceof Error ? error.message : 'Error processing presentation');
  //   } finally {
  //     this.isLoading = false;
  //     this.uploading = false;
  //     this.progress = 0;
  //   }
  // }

  private showError(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  validateUrl(url: string): string | null {
    if (!url.trim()) return null;
    const regex = /\/d\/([a-zA-Z0-9_-]+)/;
    const match = url.match(regex);
    if (match && match[1]) return match[1];
    this.showError('Please enter a valid Google Slides URL');
    return null;
  }
}