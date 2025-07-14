import { Component, EventEmitter, forwardRef, Inject, Input, Output, ViewChild } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDatepicker, MatDatepickerInputEvent } from '@angular/material/datepicker';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: false,
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss',
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => InputComponent),
    multi: true
  }]
})
export class InputComponent {

  @Input() key!: string;
  @Input() field!: string;
  date: any;
  // @Input() formControlName!: string;
  // @Input() name!: string;

  constructor() { }

  @Input() label: string = '';
  @Input() isRequired: boolean = false;
  @Input() disabled: boolean = false;
  @Input() value: Date | string | null = null;;
  @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();

  @Input() form!: FormGroup;
  @Input() formType: any = true;
  // @Input() control: any;
  @Input() displayMsg!: string;
  @Input() patternMsg!: string;
  @Input() maxLength: any;
  @Input() customErrorPatternMsg!: string;
  @Input() customErrorDisplayMsg!: string;
  @Input() customType!: string;
  @Input() readonly: boolean = false;
  @Input() isDateField: boolean = false;
  @Input() upComing: boolean = false;
  @Input() matDatepicker: boolean = false;
  @Input() className: string = 'bottom_error_msg';
  @ViewChild('picker') picker!: MatDatepicker<any>; // Declare the datepicker reference

  @Input() keyValidation!: string
  formattedDate: string = '';
  // @Output() dateChange = new EventEmitter<any>();
  minLength: any;

  onInputChange(event: Event): void {

    const inputValue = (event.target as HTMLInputElement).value;
    this.valueChange.emit(inputValue);
  }
  get displayValue(): string | undefined {
    if (this.value instanceof Date) {
      return this.formatDate(this.value);  // Format date if it's a Date object
    }
    return this.value as string;  // Otherwise return the string value
  }
  formattedDate2: string = '';

  maxDate: Date | null = null;
  ngOnInit() {
    this.setMaxDate();
  }
  ngOnChanges() {
    this.setMaxDate();
  }
  setMaxDate() {
    // debugger;
    if (this.upComing) {
      this.maxDate = new Date();  // Restrict to today and future dates
    } else {
      this.maxDate = null;  // Allow all dates
    }
  }
  // maxDate: Date = new Date();
  // onDateChange2(event: MatDatepickerInputEvent<Date>): void {
  //   const selectedDate = event.value;

  //   // let date=new date(dateGIven)
  //   if (selectedDate) {
  //     this.formattedDate = selectedDate.toLocaleDateString('en-US');
  //   }
  // }
  onDateChange(event?: MatDatepickerInputEvent<Date>) {

    // const selectedDate = new Date(event?.value);
    // this.formattedDate = selectedDate.toLocaleDateString('en-US');

    this.date = event?.value;
    if (this.date) {
      // debugger;
      const newDate = new Date(this.date);
      const selectedDate = new Date(this.date);
      // this.formattedDate = selectedDate.toLocaleDateString("en-US", { timeZone: "Asia/Kolkata" });
      this.formattedDate = selectedDate.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
      const m = newDate.getMonth() + 1;
      let year = this.date.getFullYear();
      let day = this.date.getDate();
      this.formattedDate = day + '/' + m + '/' + year;
      this.valueChange.emit(this.formattedDate);
    } else {
      this.valueChange.emit('');  // Emit null if the date is cleared
    }
  }

  getApidateFormatSet(date: any) {
    const newDate = new Date(this.date);

    let month = date.getMonth();
    let year = date.getFullYear();
    let day = date.getDate();
    return (day + '/' + month + '/' + year);
  }
  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = ('0' + (date.getMonth() + 1)).slice(-2); // Ensure two-digit month
    const day = ('0' + date.getDate()).slice(-2); // Ensure two-digit day
    return `${year}-${month}-${day}`;
  }

  get control() {
    return this.form.get(this.key) as FormControl;;
  }

  writeValue(value: string): void {
    this.value = value;
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.onChange(this.value);
    this.onTouched();
  }

  onChange: (value: string) => void = () => { };
  onTouched: () => void = () => { };

}
