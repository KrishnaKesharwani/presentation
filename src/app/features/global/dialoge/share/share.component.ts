import { Component, Inject, viewChild, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../../material.module';
import { GlobalModule } from "../../global.module";
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';


@Component({
  selector: 'app-share',
  standalone: true,
  templateUrl: './share.component.html',
  styleUrl: './share.component.scss',
  imports: [
    MaterialModule,
    CommonModule,
    MatIconModule,
    GlobalModule,
    MatProgressSpinnerModule
  ]
})
export class ShareComponent {
  loading: boolean = false;
  copydemourlForm!: FormGroup;
  selectControl = new FormControl('');
  shareForm!: FormGroup;
  presentation_url: string = "";
  @ViewChild('presentationInput') presentationInput!: ElementRef<HTMLInputElement>;

  constructor(public snackBar: MatSnackBar, public dialogRef: MatDialogRef<ShareComponent>, public fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public dataa: { title: string, subTitle: string, url: any; }
  ) { }

  ngOnInit() {
    this.presentation_url = this.dataa.url;
    this.shareForm = this.fb.group({
      presentation_url: [this.dataa.url || '', Validators.required],
    });
  }


  copyDemoUrl() {
    this.loading = true;
    const demoUrl = this.dataa.url;
    if (demoUrl) {
      navigator.clipboard.writeText(demoUrl).then(() => {
        // Select the input text after copying
        setTimeout(() => {
          if (this.presentationInput && this.presentationInput.nativeElement) {
            this.presentationInput.nativeElement.select();
          }
        });

        this.loading = false;
        this.snackBar.open('Presentation copied...', 'Close', {
          duration: 3000,
          panelClass: ['success-snackbar'],
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
        setTimeout(() => {
          this.snackBar.dismiss();
          this.dialogRef.close();
        }, 3000);
      }).catch(err => {
        this.loading = false;
        console.error('Failed to copy demo URL:', err);
      });
    } else {
      this.loading = false;
      console.warn('No demo URL available to copy.');
    }
  }

  onClose() {
    this.dialogRef.close();
  }

}
