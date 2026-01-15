// services/payment.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../environments/environments';


export interface StkPushRequest {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
}

export interface StkPushResponse {
  merchantRequestId: string;
  CheckoutRequestID: string;
  responseCode: string;
  responseDescription: string;
  customerMessage: string;
}

export interface PaymentStatus {
  id: number;
  CheckoutRequestID: string;
  status: string;
  amount: number;
  mpesaReceiptNumber?: string;
  failureReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  initiateStkPush(request: StkPushRequest): Observable<StkPushResponse> {
    return this.http.post<StkPushResponse>(`${this.apiUrl}/initiate`, request);
  }

  checkPaymentStatus(checkoutRequestId: string): Observable<PaymentStatus> {
    return this.http.get<PaymentStatus>(`${this.apiUrl}/status/${checkoutRequestId}`);
  }
}