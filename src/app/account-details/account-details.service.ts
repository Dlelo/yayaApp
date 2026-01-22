import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, of } from 'rxjs';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { environment } from '../../environments/environments';

@Injectable({
  providedIn: 'root'
})
export class AccountDetailsService {
  private apiUrl = environment.apiUrl; // e.g., 'http://localhost:8080/api'

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  getUserById(userId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${userId}`);
  }

  getHouseHelpDetails(houseHelpId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/househelp/${houseHelpId}`);
  }

  getHomeOwnerDetails(homeOwnerId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/homeowner/${homeOwnerId}`);
  }

  /**
   * Fetch image from URL and convert to blob URL
   * This works for both public and private (auth-protected) images
   * 
   * @param imageUrl - The URL of the image to fetch
   * @returns Observable of blob URL or null if fetch fails
   */
  fetchPrivateImage(imageUrl: string): Observable<string | null> {
    // If it's already a blob or data URL, return as-is
    if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
      return of(imageUrl);
    }

    // Fetch the image as a blob with credentials (for auth-protected resources)
    return this.http.get(imageUrl, {
      responseType: 'blob',
      withCredentials: true // Include credentials for private buckets
    }).pipe(
      map(blob => {
        // Create a blob URL from the response
        const objectUrl = URL.createObjectURL(blob);
        return objectUrl;
      }),
      catchError(error => {
        console.error('Failed to fetch image:', imageUrl, error);
        // Return null on error (will show placeholder)
        return of(null);
      })
    );
  }

  /**
   * Fetch image and return as SafeUrl (alternative approach)
   * Use this if you need Angular's DomSanitizer
   */
  fetchPrivateImageSafe(imageUrl: string): Observable<SafeUrl | null> {
    if (imageUrl.startsWith('blob:') || imageUrl.startsWith('data:')) {
      return of(this.sanitizer.bypassSecurityTrustUrl(imageUrl));
    }

    return this.http.get(imageUrl, {
      responseType: 'blob',
      withCredentials: true
    }).pipe(
      map(blob => {
        const objectUrl = URL.createObjectURL(blob);
        return this.sanitizer.bypassSecurityTrustUrl(objectUrl);
      }),
      catchError(error => {
        console.error('Failed to fetch image:', imageUrl, error);
        return of(null);
      })
    );
  }

  /**
   * Revoke blob URL to free memory
   * Call this in ngOnDestroy to prevent memory leaks
   */
  revokeBlobUrl(blobUrl: string): void {
    if (blobUrl && blobUrl.startsWith('blob:')) {
      URL.revokeObjectURL(blobUrl);
    }
  }
}
