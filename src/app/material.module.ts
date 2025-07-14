import { NgModule } from '@angular/core';
// import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { ToastrModule } from 'ngx-toastr';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatTabsModule } from '@angular/material/tabs';

@NgModule({
  declarations: [
  ],
  imports: [
    // CommonModule,
    MatIconModule,
    MatCheckboxModule,
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatGridListModule,
    MatButtonModule,
    MatSnackBarModule,
    MatSelectModule,
    MatMenuModule,
    MatDialogModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatSortModule,
    MatPaginatorModule,
    // ToastrModule.forRoot({
    //   timeOut: 1000,
    //   positionClass: 'toast-top-right',
    //   preventDuplicates: true,
    // }),

  ],
  exports: [
    // CommonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatGridListModule,
    MatButtonModule,
    MatSnackBarModule,
    MatMenuModule,
    MatSelectModule,
    MatDialogModule,
    MatDatepickerModule,
    MatCheckboxModule,
    MatNativeDateModule,
    MatSortModule,
    MatPaginatorModule,
    MatTabsModule
  ],
})
export class MaterialModule { }
