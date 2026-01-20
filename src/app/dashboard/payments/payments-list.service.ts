import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {environment} from '../../../environments/environments';

// Interfaces matching your backend models
export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface Payment {
  id: number;
  transactionId: string;
  user: User;
  amount: number;
  provider: string;
  status: PaymentStatus;
  createdAt: string; // Will be converted to Date if needed
}

export enum PaymentStatus {
  COMPLETED = 'COMPLETED',
  PENDING = 'PENDING',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED'
}

// Paginated response interface
export interface PaymentPage {
  content: Payment[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number; // Current page number
  first: boolean;
  last: boolean;
  empty: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  /**
   * Get paginated payments
   * @param page Page number (0-indexed)
   * @param size Page size
   * @returns Observable of PaymentPage
   */
  getPayments(page: number = 0, size: number = 10): Observable<PaymentPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc'); // Sort by newest first

    return this.http.get<PaymentPage>(this.apiUrl, { params });
  }

  verifyPayment(payment: Payment): Observable<any> {
    const baseUri = environment.apiUrl.replace(/\/api$/, '');
    return this.http.post(`${baseUri}/mpesa/manual-callback`, payment);
  }

  /**
   * Get payments by status
   * @param status Payment status
   * @param page Page number
   * @param size Page size
   * @returns Observable of PaymentPage
   */
  getPaymentsByStatus(
    status: PaymentStatus,
    page: number = 0,
    size: number = 10
  ): Observable<PaymentPage> {
    const params = new HttpParams()
      .set('status', status)
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');

    return this.http.get<PaymentPage>(`${this.apiUrl}/by-status`, { params });
  }

  /**
   * Get payment by ID
   * @param id Payment ID
   * @returns Observable of Payment
   */
  getPaymentById(id: number): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get payments by user
   * @param userId User ID
   * @param page Page number
   * @param size Page size
   * @returns Observable of PaymentPage
   */
  getPaymentsByUser(
    userId: number,
    page: number = 0,
    size: number = 10
  ): Observable<PaymentPage> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');

    return this.http.get<PaymentPage>(`${this.apiUrl}/user/${userId}`, { params });
  }

  /**
   * Get payment by transaction ID
   * @param transactionId Transaction ID
   * @returns Observable of Payment
   */
  getPaymentByTransactionId(transactionId: string): Observable<Payment> {
    return this.http.get<Payment>(`${this.apiUrl}/transaction/${transactionId}`);
  }

  /**
   * Download payment receipt
   * @param paymentId Payment ID
   * @returns Observable of Blob
   */
  downloadReceipt(paymentId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${paymentId}/receipt`, {
      responseType: 'blob'
    });
  }

  /**
   * Search payments by transaction ID or user
   * @param query Search query
   * @param page Page number
   * @param size Page size
   * @returns Observable of PaymentPage
   */
  searchPayments(
    query: string,
    page: number = 0,
    size: number = 10
  ): Observable<PaymentPage> {
    const params = new HttpParams()
      .set('query', query)
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaymentPage>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Get payment statistics (optional)
   * @returns Observable with stats
   */
  getPaymentStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats`);
  }
}
