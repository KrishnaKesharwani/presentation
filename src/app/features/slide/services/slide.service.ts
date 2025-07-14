import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { GoogleSlidesResponse } from '../models/slide.interface';
// import { Backup } from '../backup.json';

@Injectable({
  providedIn: 'root'
})
export class SlideService {
  constructor(private http: HttpClient) {}
  public jsonUrl = '../backup.json';
  getSlides(): Observable<GoogleSlidesResponse> {
    debugger;
    return this.http.get<GoogleSlidesResponse>('src/assets/json/google_slides_response.json');
  }
  getgoogleJsonData(): Observable<any> {
    debugger;
    return this.http.get<any>(this.jsonUrl);
  }
}