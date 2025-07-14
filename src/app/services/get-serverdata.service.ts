import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class GetServerdataService {
  constructor(private http: HttpClient) { }



  getData(): Observable<any> {
    return this.http.get('https://jsonplaceholder.typicode.com/posts');
  }

  postData(formData: { email: string; password: string }): Observable<any> {
    return this.http.post('https://jsonplaceholder.typicode.com/posts', formData);
  }
}

// export class GetServerdataService {
//   postData(formData: { email: any; phoneno: any; }) {
//     throw new Error('Method not implemented.');
//   }
//   http: any;

//   constructor() { }

//   getData() {
//     // This method should return an Observable that fetches data from the server
//     // For example, you can use HttpClient to make a GET request to your server API
//     // return this.http.get('https://jsonplaceholder.typicode.com/posts');

//     // Placeholder for demonstration purposes
//     // return new Observable(observer => {
//     //   observer.next({ message: 'Data fetched successfully' });
//     //   observer.complete();
//     // });
//   }
// }
