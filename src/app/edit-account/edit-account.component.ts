import { Component, inject, OnInit, ChangeDetectorRef, NgZone, AfterViewInit, PLATFORM_ID } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressBar } from '@angular/material/progress-bar';
import { MatChipGrid, MatChipRow, MatChipInput } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { Observable, take, tap } from 'rxjs';
import * as L from 'leaflet';

import { LoginService } from '../login/login.service';
import { AccountDetailsService } from '../account-details/account-details.service';
import { HousehelpService } from '../dashboard/house-helps/house-helps.service';
import { HomeOwnerService } from '../dashboard/home-owners/home-owners.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import { HttpEvent } from '@angular/common/http';
import {MatCheckbox} from '@angular/material/checkbox';

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
    MatChipGrid,
    MatChipRow,
    MatChipInput,
    MatCheckbox
  ],
  providers: [HousehelpService, HomeOwnerService],
})
export class EditAccountDetailsComponent implements OnInit, AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly activatesRoute = inject(ActivatedRoute);
  private readonly loginService = inject(LoginService);
  private readonly accountDetails = inject(AccountDetailsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly househelpService = inject(HousehelpService);
  private readonly homeOwnerService = inject(HomeOwnerService);
  private readonly fileUploadService = inject(FileUploadService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly platformId = inject(PLATFORM_ID);

    userId = this.activatesRoute.snapshot.paramMap.get('id');
  userDetails$!: Observable<any>;

  readonly separatorKeysCodes = [ENTER, COMMA] as const;

  skills: string[] = [];
  languages: string[] = [];

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

  profilePictureFile: File | null = null;
  profilePicturePreviewUrl: string | null = null;
  profileUploadProgress = 0;

  availabilityTypes = ['DAYBURG', 'EMERGENCY', 'LIVE_IN'];

  map!: L.Map;
  marker!: L.Marker;
  mapCenter = { lat: -1.286389, lng: 36.817223 }; // Nairobi default
  zoomLevel = 6;

  ngOnInit(): void {
    if (!this.userId) return;

    this.userDetails$ = this.accountDetails.getUserById(Number(this.userId))
      .pipe(
        take(1),
        tap(user => {
          this.isHouseHelp = user.roles.includes('HOUSEHELP');
          this.isHomeOwner = user.roles.includes('HOMEOWNER');
          this.initializeForm(user);
          this.loadExistingProfilePicture(user);
        })
      );
  }

  async ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;
    await this.initializeMap();
  }

  private async initializeMap() {
    const L = (await import('leaflet')).default;

    const pin = this.isHouseHelp
      ? this.form.get('houseHelp.pinLocation')?.value
      : this.form.get('homeOwner.pinLocation')?.value;

    const initialLatLng: L.LatLngExpression = pin
      ? [pin.latitude, pin.longitude]
      : [this.mapCenter.lat, this.mapCenter.lng];

    this.map = L.map('map').setView(initialLatLng, this.zoomLevel);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    this.marker = L.marker(initialLatLng, { draggable: true }).addTo(this.map);

    this.marker.on('dragend', () => {
      const pos = this.marker.getLatLng();
      this.updateFormPin(pos.lat, pos.lng);
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.marker.setLatLng(e.latlng);
      this.updateFormPin(e.latlng.lat, e.latlng.lng);
    });
  }

  private updateFormPin(lat: number, lng: number) {
    const pinObj = { latitude: lat, longitude: lng };
    if (this.isHouseHelp) {
      this.form.get('houseHelp.pinLocation')?.setValue(pinObj);
    } else if (this.isHomeOwner) {
      this.form.get('homeOwner.pinLocation')?.setValue(pinObj);
    }
  }

  private getPinFromForm(): L.LatLngExpression {
    const pin = this.isHouseHelp
      ? this.form.get('houseHelp.pinLocation')?.value
      : this.form.get('homeOwner.pinLocation')?.value;

    return pin ? [pin.latitude, pin.longitude] : [this.mapCenter.lat, this.mapCenter.lng];
  }

  private normalizeList(value: string[] | string | null | undefined): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value.map(v => v.trim()).filter(Boolean);
    return value.split(',').map(v => v.trim()).filter(Boolean);
  }

  // addChip(event: any, target: 'skills' | 'languages'): void {
  //   const value = (event.value || '').trim();
  //   if (!value) return;
  //   this[target].push(value);
  //   this.form.get(`houseHelp.${target}`)?.setValue(this[target]);
  //   event.chipInput!.clear();
  // }
  //
  // removeChip(value: string, target: 'skills' | 'languages'): void {
  //   this[target] = this[target].filter(v => v !== value);
  //   this.form.get(`houseHelp.${target}`)?.setValue(this[target]);
  // }

  addChip(event: any, target: 'skills' | 'languages' | 'preferredSkills' | 'preferredLanguages', group: 'houseHelp' | 'homeOwner' = 'houseHelp'): void {
    const value = (event.value || '').trim();
    if (!value) return;

    const control = this.form.get(`${group}.preferences.${target}`) || this.form.get(`${group}.${target}`);
    const currentValues: string[] = control?.value || [];
    control?.setValue([...currentValues, value]);

    if (target === 'skills' || target === 'languages') {
      this[target] = [...currentValues, value]; // Update component-level array for display
    }

    event.chipInput!.clear();
  }

  removeChip(value: string, target: 'skills' | 'languages' | 'preferredSkills' | 'preferredLanguages', group: 'houseHelp' | 'homeOwner' = 'houseHelp'): void {
    const control = this.form.get(`${group}.preferences.${target}`) || this.form.get(`${group}.${target}`);
    const updated = (control?.value || []).filter((v: string) => v !== value);
    control?.setValue(updated);

    if (target === 'skills' || target === 'languages') {
      this[target] = updated;
    }
  }


  private initializeForm(user: any): void {

    this.form = this.fb?.group({
      houseHelp: this.isHouseHelp
        ? this.fb.group({
          yearsOfExperience: [user.houseHelp?.yearsOfExperience || 0],
          nationalId: [user.houseHelp?.nationalId || ''],
          pinLocation: [user.houseHelp?.pinLocation || null],
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
          availability: [user.houseHelp?.availability || ''],
          experienceSummary: [user.houseHelp?.experienceSummary || ''],
          contactPersonsPhoneNumber: [
            user.houseHelp?.contactPersonsPhoneNumber || ''
          ],
          preferences: this.fb.group({
            houseHelpType: [user.houseHelp?.preferences?.houseHelpType || null],
            minExperience: [user.houseHelp?.preferences?.minExperience || 0],
            preferredLocation: [user.houseHelp?.preferences?.preferredLocation || ''],
            preferredSkills: [this.normalizeList(user.houseHelp?.preferences?.preferredSkills)],
            preferredLanguages: [this.normalizeList(user.houseHelp?.preferences?.preferredLanguages)],
            preferredChildAgeRanges: [user.houseHelp?.preferences?.preferredChildAgeRanges || []],
            preferredMaxChildren: [user.houseHelp?.preferences?.preferredMaxChildren || null],
            preferredServices: [user.houseHelp?.preferences?.preferredServices || []],
            preferredReligion: [user.houseHelp?.preferences?.preferredReligion || ''],
            okayWithPets: [user.houseHelp?.preferences?.okayWithPets || false],
            minSalary: [user.houseHelp?.preferences?.minSalary || null],
            maxSalary: [user.houseHelp?.preferences?.maxSalary || null],
          }),
        })
        : null,


      homeOwner: this.isHomeOwner
        ? this.fb.group({
          numberOfDependents: [user.homeOwner?.numberOfDependents || ''],
          houseType: [user.homeOwner?.houseType || ''],
          pinLocation: [user.homeOwner?.pinLocation || null],
          numberOfRooms: [user.homeOwner?.numberOfRooms || ''],
          homeLocation: [user.homeOwner?.homeLocation || ''],
          nationalIdDocument:[user.homeOwner?.nationalIdDocument || ''],
          nationalId: [user.homeOwner?.nationalId || ''],
          profilePicture: [user.homeOwner?.profilePicture || ''],
          preferences: this.fb.group({
            preferredLocation: [user.homeOwner?.preferences?.preferredLocation || ''],
            preferredSkills: [this.normalizeList(user.homeOwner?.preferences?.preferredSkills)],
            preferredLanguages: [this.normalizeList(user.homeOwner?.preferences?.preferredLanguages)],
            preferredChildAgeRanges: [user.homeOwner?.preferences?.preferredChildAgeRanges || []],
            preferredMaxChildren: [user.homeOwner?.preferences?.preferredMaxChildren || null],
            preferredServices: [user.homeOwner?.preferences?.preferredServices || []],
            preferredReligion: [user.homeOwner?.preferences?.preferredReligion || ''],
            okayWithPets: [user.homeOwner?.preferences?.okayWithPets || false],
            minSalary: [user.homeOwner?.preferences?.minSalary || null],
            maxSalary: [user.homeOwner?.preferences?.maxSalary || null],
          }),
        })
        : null,
    });

    const pin = this.isHouseHelp
      ? user.houseHelp?.pinLocation
      : user.homeOwner?.pinLocation;

    if (this.isHouseHelp && user.houseHelp) {
      this.skills = this.normalizeList(user.houseHelp.skills);
      this.languages = this.normalizeList(user.houseHelp.languages);

      this.form.get('houseHelp.skills')?.setValue(this.skills);
      this.form.get('houseHelp.languages')?.setValue(this.languages);
    }
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

  save(id:number): void {
    if (this.form.invalid || !this.userId) return;

     const formValue = this.form.value;

    // Normalize chips arrays
    ['skills', 'languages'].forEach(field => {
      if (formValue.houseHelp?.[field]) {
        formValue.houseHelp[field] = (Array.isArray(formValue.houseHelp[field])
            ? formValue.houseHelp[field]
            : formValue.houseHelp[field].split(',')
        ).map((s: string) => s.trim()).filter((s: string) => s.length > 0);
      }
    });

    // if (formValue.houseHelp?.skills) {
    //    const skills = Array.isArray(formValue.houseHelp.skills)
    //      ? formValue.houseHelp.skills
    //      : typeof formValue.houseHelp.skills === 'string'
    //        ? formValue.houseHelp.skills.split(',')
    //        : [];
    //
    //   formValue.houseHelp.skills = skills
    //      .map((s: string) => s.trim())
    //      .filter((s: string) => s.length > 0);
    //  }

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

  private extractFilename(url: string): string {
    try {
      const parts = url.split('/');
      return parts[parts.length - 1];
    } catch {
      return 'document.pdf';
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

         if (event.type === 4) {
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




  }


