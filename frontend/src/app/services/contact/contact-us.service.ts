import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ContactMessage } from '../../models/contact';

@Injectable({
  providedIn: 'root'
})
export class ContactUsService {
  private apiUrl = `${environment.apiUrl}/contact`;   

  constructor(private http: HttpClient) {}

  getMessages(search: string = '', page: number = 1, pageSize: number = 10): Observable<ContactMessage[]> {
    let params = new HttpParams()
      .set('skip', ((page - 1) * pageSize).toString())
      .set('limit', pageSize.toString());
    if (search) params = params.set('search', search);
    return this.http.get<ContactMessage[]>(this.apiUrl, { params });
  }

  sendMessage(messageData: any) {
    return this.http.post(`${this.apiUrl}/`, messageData);
  }
}
