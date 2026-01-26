import {Component, inject, OnInit, ChangeDetectorRef, NgZone} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {ActivatedRoute, Router} from '@angular/router';
import {MatCard, MatCardModule} from '@angular/material/card';
import {MatButton, MatButtonModule} from '@angular/material/button';
import {MatDivider} from '@angular/material/divider';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {CommonModule} from '@angular/common';
import {MatSelectModule} from '@angular/material/select';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {LoginService} from '../login/login.service';
import {AccountDetailsService} from '../account-details/account-details.service';
import {Observable, take, tap} from 'rxjs';
import {HousehelpService} from '../dashboard/house-helps/house-helps.service';
import {HomeOwnerService} from '../dashboard/home-owners/home-owners.service';
import {FileUploadService} from '../file-upload/file-upload.service';
import {HttpEvent} from '@angular/common/http';
import {MatProgressBar} from '@angular/material/progress-bar';

@Component({
  selector: 'app-edit-profile',
  templateUrl: './edit-account.component.html',
  styleUrls: ['./edit-account.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressBar,
  ],
  providers: [HousehelpService,HomeOwnerService],
})
export class EditAccountDetailsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatesRoute = inject(ActivatedRoute);
  private readonly loginService = inject(LoginService);
  private readonly accountDetails = inject(AccountDetailsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly  househelpService = inject(HousehelpService);
  private readonly  homeOwnerService = inject(HomeOwnerService);
  private readonly fileUploadService = inject(FileUploadService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);

  userId = this.activatesRoute.snapshot.paramMap.get('id');
  userDetails$!: Observable<any>;

  form!: FormGroup;
  isHouseHelp = false;
  isHomeOwner = false;

  goodConductFileName: string | null = null;
  goodConductPreviewUrl: string | null = null;

  medicalReportFileName: string | null = null;
  medicalReportPreviewUrl: string | null = null;

  uploadProgress = 0;
  nationalIdPreviewUrl: string | null = null;
  nationalIdFile: File | null = null;
  nationalIdFileName: string | null = '';

  // Profile Picture properties
  profilePictureFile: File | null = null;
  profilePicturePreviewUrl: string | null = null;
  profileUploadProgress = 0;

  availabilityTypes = ['DAYBURG', 'EMERGENCY', 'LIVE_IN'];

  ngOnInit(): void {
    if (!this.userId) return;

    this.userDetails$ = this.accountDetails.getUserById(Number(this.userId))
      .pipe(
        take(1),
      tap((user) => {
        this.isHouseHelp = user.roles.includes('HOUSEHELP');
        this.isHomeOwner = user.roles.includes('HOMEOWNER');
        this.initializeForm(user);
        
        // Load existing profile picture
        this.loadExistingProfilePicture(user);
      })
    );
  }

  private loadExistingProfilePicture(user: any): void {
    let existingProfilePicture = null;
    let existingNationalId = null;
    
    // Get existing profile picture and national ID URLs
    console.log(user)
    if (this.isHouseHelp && user.houseHelp) {
      existingProfilePicture = user.houseHelp.profilePictureDocument;
      existingNationalId = user.houseHelp.nationalIdDocument;
    } else if (this.isHomeOwner && user.homeOwner) {
      existingProfilePicture = user.homeOwner.profilePictureDocument;
      existingNationalId = user.homeOwner.nationalIdDocument;
    }
    
    // Set preview URLs if they exist
    this.ngZone.run(() => {
      if (existingProfilePicture) {
        this.profilePicturePreviewUrl = existingProfilePicture;
      }
      
      if (existingNationalId) {
        // For PDFs, just show the filename
        this.nationalIdFileName = this.extractFilename(existingNationalId);
        // Don't set nationalIdPreviewUrl for PDFs
      }
      
      this.cdr.markForCheck();
    });
  }

  private extractFilename(url: string): string {
    try {
      const parts = url.split('/');
      return parts[parts.length - 1];
    } catch {
      return 'document.pdf';
    }
  }

  // Profile Picture handler
  onProfilePictureSelected(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type - ONLY JPEG
      if (file.type !== 'image/jpeg' && file.type !== 'image/jpg') {
        this.snackBar.open('Please select a JPEG image only', 'Close', { duration: 3000 });
        input.value = ''; // Clear the input
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        this.snackBar.open('File size must be less than 5MB', 'Close', { duration: 3000 });
        input.value = ''; // Clear the input
        return;
      }

      this.profilePictureFile = file;

      // Create preview immediately with NgZone
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.ngZone.run(() => {
          this.profilePicturePreviewUrl = e.target?.result as string;
          this.cdr.markForCheck();
        });
      };
      reader.readAsDataURL(file);
    }
  }

  // Upload Profile Picture
  uploadProfilePicture(userId: number): void {
    if (!this.profilePictureFile || !userId) return;

    if (this.isHouseHelp) {
      this.fileUploadService.uploadHouseHelpProfilePicture(userId, this.profilePictureFile)
        .subscribe({
          next: (event: HttpEvent<any>) => {
            if (event.type === 1 && event.total) {
              this.profileUploadProgress = Math.round((event.loaded / event.total) * 100);
            }

            if (event.type === 4) { // response
              const url = event.body;

              // Save URL into the form
              this.form.get('houseHelp')?.patchValue({
                profilePicture: url
              });

              this.profileUploadProgress = 0;
              this.snackBar.open('✅ Profile picture uploaded successfully!', 'Close', { duration: 3000 });
            }
          },
          error: (err) => {
            console.error(err);
            this.profileUploadProgress = 0;
            this.snackBar.open('❌ Failed to upload profile picture', 'Close', { duration: 3000 });
          }
        });
    }

    if (this.isHomeOwner) {
      this.fileUploadService.uploadHomeOwnerProfilePicture(userId, this.profilePictureFile)
        .subscribe({
          next: (event: HttpEvent<any>) => {
            if (event.type === 1 && event.total) {
              this.profileUploadProgress = Math.round((event.loaded / event.total) * 100);
            }

            if (event.type === 4) { // response
              const url = event.body;

              // Save URL into the form
              this.form.get('homeOwner')?.patchValue({
                profilePicture: url
              });

              this.profileUploadProgress = 0;
              this.snackBar.open('✅ Profile picture uploaded successfully!', 'Close', { duration: 3000 });
            }
          },
          error: (err) => {
            console.error(err);
            this.profileUploadProgress = 0;
            this.snackBar.open('❌ Failed to upload profile picture', 'Close', { duration: 3000 });
          }
        });
    }
    if (this.isHouseHelp) {
      this.fileUploadService.uploadHouseHelpProfilePicture(userId, this.profilePictureFile)
        .subscribe({
          next: (event: HttpEvent<any>) => {
            if (event.type === 1 && event.total) {
              this.profileUploadProgress = Math.round((event.loaded / event.total) * 100);
            }

            if (event.type === 4) { // response
              const url = event.body;

              // Save URL into the form
              this.form.get('houseHelp')?.patchValue({
                profilePicture: url
              });

              this.profileUploadProgress = 0;
              this.snackBar.open('✅ Profile picture uploaded successfully!', 'Close', { duration: 3000 });
            }
          },
          error: (err) => {
            console.error(err);
            this.profileUploadProgress = 0;
            this.snackBar.open('❌ Failed to upload profile picture', 'Close', { duration: 3000 });
          }
        });
    }
  }

  uploadNationalId(houseHelpId: number) {
    if (!this.nationalIdFile) return;

   if(this.isHouseHelp) {
      this.fileUploadService.uploadHouseHelpNationalId(houseHelpId, this.nationalIdFile)
      .subscribe((event:HttpEvent<any>) => {
        if (event.type === 1 && event.total) {
          this.uploadProgress = Math.round((event.loaded / event.total) * 100);
        }

        if (event.type === 4) { // response
          const url = event.body;

          // Save URL into the form
          this.form.get('houseHelp')?.patchValue({
            nationalIdDocument: url
          });

          this.uploadProgress = 0;
          this.snackBar.open('✅ National ID uploaded successfully!', 'Close', { duration: 3000 });
        }
      }) }

   if(this.isHomeOwner) {
     this.fileUploadService.uploadHomeOwnerNationalId(houseHelpId, this.nationalIdFile)
       .subscribe((event:HttpEvent<any>) => {
         if (event.type === 1 && event.total) {
           this.uploadProgress = Math.round((event.loaded / event.total) * 100);
         }

         if (event.type === 4) { // response
           const url = event.body;

           // Save URL into the form
           this.form.get('homeOwner')?.patchValue({
             nationalIdDocument: url
           });

           this.uploadProgress = 0;
           this.snackBar.open('✅ National ID uploaded successfully!', 'Close', { duration: 3000 });
         }
       })
   }
  }

  private initializeForm(user: any): void {
    this.form = this.fb?.group({
      houseHelp: this.isHouseHelp
        ? this.fb.group({
          yearsOfExperience: [user.houseHelp?.yearsOfExperience || 0],
          nationalId: [user.houseHelp?.nationalId || ''],
          houseHelpType: [
            user.houseHelp?.houseHelpType || null,
            Validators.required
          ],

          skills: [
            Array.isArray(user.houseHelp?.skills)
              ? user.houseHelp.skills
              : user.houseHelp?.skills
                ? user.houseHelp.skills.split(',')
                : []
          ],

          languages: [
            Array.isArray(user.houseHelp?.languages)
              ? user.houseHelp.languages
              : user.houseHelp?.languages
                ? user.houseHelp.languages.split(',')
                : []
          ],

          goodConduct: [user.houseHelp?.goodConduct || ''],
          medicalReport: [user.houseHelp?.medicalReport || ''],
          numberOfChildren: [user.houseHelp?.numberOfChildren || 0],
          nationalIdDocument: [user.houseHelp?.nationalIdDocument || ''],
          profilePicture: [user.houseHelp?.profilePicture || ''],
          height: [user.houseHelp?.height || ''],
          age: [user.houseHelp?.age || ''],
          weight: [user.houseHelp?.weight || ''],
          religion: [user.houseHelp?.religion || ''],
          levelOfEducation: [user.houseHelp?.levelOfEducation || ''],
          currentCounty: [user.houseHelp?.currentCounty || ''],
          homeCounty: [user.houseHelp?.homeCounty || ''],
          currentLocation: [user.houseHelp?.currentLocation || ''],
          homeLocation: [user.houseHelp?.homeLocation || ''],
          contactPersons: [user.houseHelp?.contactPersons || ''],
          contactPersonsPhoneNumber: [
            user.houseHelp?.contactPersonsPhoneNumber || ''
          ],
        })
        : null,


      homeOwner: this.isHomeOwner
        ? this.fb.group({
          numberOfDependents: [user.homeOwner?.numberOfDependents || ''],
          houseType: [user.homeOwner?.houseType || ''],
          numberOfRooms: [user.homeOwner?.numberOfRooms || ''],
          homeLocation: [user.homeOwner?.homeLocation || ''],
          nationalIdDocument:[user.homeOwner?.nationalIdDocument || ''],
          nationalId: [user.homeOwner?.nationalId || ''],
          profilePicture: [user.homeOwner?.profilePicture || ''],
        })
        : null,
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file type - ONLY PDF
      if (file.type !== 'application/pdf') {
        this.snackBar.open('Please select a PDF file only', 'Close', { duration: 3000 });
        input.value = ''; // Clear the input
        return;
      }

      // Validate file size (max 10MB for PDFs)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        this.snackBar.open('File size must be less than 10MB', 'Close', { duration: 3000 });
        input.value = ''; // Clear the input
        return;
      }

      this.nationalIdFile = file;
      this.nationalIdFileName = this.nationalIdFile.name;

      // For PDFs, we'll show the filename instead of preview
      this.ngZone.run(() => {
        this.nationalIdPreviewUrl = null; // No image preview for PDF
        this.cdr.markForCheck();
      });
    }
  }


  onFilesSelected(event: Event, controlName: string): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.form.get(controlName)?.setValue(file);

    const isImage = file.type.startsWith('image/');
    const previewUrl = isImage ? URL.createObjectURL(file) : null;

    if (controlName === 'goodConduct') {
      this.goodConductFileName = file.name;
      this.goodConductPreviewUrl = previewUrl;
    } else if (controlName === 'medicalReport') {
      this.medicalReportFileName = file.name;
      this.medicalReportPreviewUrl = previewUrl;
    }
  }

  removeFile(controlName: string): void {
    this.form.get(controlName)?.reset();

    if (controlName === 'goodConduct') {
      if (this.goodConductPreviewUrl) {
        URL.revokeObjectURL(this.goodConductPreviewUrl);
      }
      this.goodConductFileName = null;
      this.goodConductPreviewUrl = null;
    } else if (controlName === 'medicalReport') {
      if (this.medicalReportPreviewUrl) {
        URL.revokeObjectURL(this.medicalReportPreviewUrl);
      }
      this.medicalReportFileName = null;
      this.medicalReportPreviewUrl = null;
    }
  }

  save(id:number): void {
    if (this.form.invalid || !this.userId) return;

    const formValue = this.form.value;

    if (formValue.houseHelp?.skills) {
      const skills = Array.isArray(formValue.houseHelp.skills)
        ? formValue.houseHelp.skills
        : typeof formValue.houseHelp.skills === 'string'
          ? formValue.houseHelp.skills.split(',')
          : [];

      formValue.houseHelp.skills = skills
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
    }

    if (formValue.houseHelp?.languages) {
      const languages = Array.isArray(formValue.houseHelp.languages)
        ? formValue.houseHelp.languages
        : typeof formValue.houseHelp.languages === 'string'
          ? formValue.houseHelp.languages.split(',')
          : [];

      formValue.houseHelp.languages = languages
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
    }

    if(this.isHouseHelp){

      this.househelpService.updateHouseHelpDetails(id, formValue.houseHelp).subscribe({
        next: () => {
          this.snackBar.open('✅ Account details updated successfully!', 'Close', {
            duration: 3000,
          });
          this.router.navigate([`/account/${this.userId}`]);
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('❌ Failed to update account. Please try again.', 'Close', {
            duration: 3000,
          });
        },
      })
    }

    if(this.isHomeOwner){
      this.homeOwnerService.updateHomeOwnerDetails(id, formValue.homeOwner).subscribe({
        next: () => {
          this.snackBar.open('✅ Account details updated successfully!', 'Close', {
            duration: 3000,
          });
          this.router.navigate([`/account/${this.userId}`]);
        },
        error: (err) => {
          console.error(err);
          this.snackBar.open('❌ Failed to update account. Please try again.', 'Close', {
            duration: 3000,
          });
        },
      })
    }
  }

  cancel(): void {
    this.router.navigate(['/account']);
  }
}
