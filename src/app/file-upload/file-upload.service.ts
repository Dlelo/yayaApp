import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../environments/environments';

@Injectable({ providedIn: 'root' })
export class FileUploadService {

  constructor(private http: HttpClient) {}

  uploadHouseHelpNationalId(houseHelpId: number, file: File): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file);

    const req = new HttpRequest(
      'POST',
      `${environment.apiUrl}/househelp/${houseHelpId}/upload-national-id`,
      formData,
      {
        reportProgress: true,
        responseType: 'json',
      }
    );

    return this.http.request(req);
  }

  uploadHomeOwnerNationalId(homeOwnerId: number, file: File): Observable<HttpEvent<any>> {
    const formData = new FormData();
    formData.append('file', file);

    const req = new HttpRequest(
      'POST',
      `${environment.apiUrl}/${homeOwnerId}/upload-national-id`,
      formData,
      {
        reportProgress: true,
        responseType: 'json',
      }
    );

    return this.http.request(req);
  }
}
