import { Component, inject, OnInit, ChangeDetectorRef, NgZone, PLATFORM_ID } from '@angular/core';
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
import { Observable, take, tap, shareReplay } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LoginService } from '../login/login.service';
import { AccountDetailsService } from '../account-details/account-details.service';
import { HousehelpService } from '../dashboard/house-helps/house-helps.service';
import { HomeOwnerService } from '../dashboard/home-owners/home-owners.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import { HttpEvent } from '@angular/common/http';
import {MatCheckbox} from '@angular/material/checkbox';
import {CHILD_AGE_RANGE_OPTIONS, ChildAgeRange} from './child-age-range.enum';

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
    MatCheckbox,
    MatTooltipModule,
  ],
  providers: [HousehelpService, HomeOwnerService],
})
export class EditAccountDetailsComponent implements OnInit {
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

  form!: FormGroup;
  isHouseHelp = false;
  isHomeOwner = false;

  childAgeRangeOptions = CHILD_AGE_RANGE_OPTIONS;

  readonly availabilityTypeOptions = [
    { value: 'DAYBURG',           label: 'Day Burg (Day Worker)' },
    { value: 'LIVE_IN',           label: 'Live In' },
    { value: 'EMERGENCY',         label: 'Emergency' },
    { value: 'EMERGENCY_LIVE_IN', label: 'Emergency Live In' },
    { value: 'EMERGENCY_DAYBURG', label: 'Emergency Day Burg' },
  ];

  readonly skillsOptions = [
    { value: 'COOKING',                    label: 'Cooking' },
    { value: 'COOK_CHAPATI',               label: 'Cook Chapati' },
    { value: 'COOK_MANDAZI',               label: 'Cook Mandazi' },
    { value: 'BAKE_CAKE',                  label: 'Bake Cake' },
    { value: 'BAKE_BREAD',                 label: 'Bake Bread' },
    { value: 'COOK_FRIES',                 label: 'Cook Fries' },
    { value: 'COOK_BHAGIA',                label: 'Cook Bhagia' },
    { value: 'COOK_NYAMA_CHOMA',           label: 'Cook Nyama Choma' },
    { value: 'COOKING_KENYAN_DISHES',      label: 'Kenyan Dishes' },
    { value: 'BABYSITTING',                label: 'Babysitting' },
    { value: 'ELDERS_CARE',                label: 'Elders Care' },
    { value: 'SPECIAL_NEEDS_CARE',         label: 'Special Needs Care' },
    { value: 'MOTHER_HELP_AFTER_DELIVERY', label: 'Post-Delivery Help' },
    { value: 'DRIVE',                      label: 'Driving' },
    { value: 'SHOPPING_RUNS',              label: 'Shopping Runs' },
    { value: 'CLEANING',                   label: 'Cleaning' },
    { value: 'LAUNDRY',                    label: 'Laundry' },
    { value: 'HOUSEKEEPING',               label: 'Housekeeping' },
    { value: 'IRONING',                    label: 'Ironing' },
    { value: 'DISH_WASHING',               label: 'Dish Washing' },
  ];

  readonly languagesOptions = [
    { value: 'ENGLISH', label: 'English' },
    { value: 'SWAHILI',  label: 'Swahili' },
    { value: 'LUHYA',    label: 'Luhya' },
    { value: 'LUO',      label: 'Luo' },
    { value: 'KIKUYU',   label: 'Kikuyu' },
    { value: 'KAMBA',    label: 'Kamba' },
    { value: 'KISII',    label: 'Kisii' },
  ];

  readonly careServicesOptions = [
    { value: 'HOMEWORK_HELP',              label: 'Homework Help' },
    { value: 'EVENTS',                     label: 'Events' },
    { value: 'SHOPPING_RUNS',              label: 'Shopping Runs' },
    { value: 'TRACKING_CHILD_DEVELOPMENT', label: 'Track Child Development' },
    { value: 'TOILET_TRAINING',            label: 'Toilet Training' },
    { value: 'PET_CARE',                   label: 'Pet Care' },
    { value: 'PRAY_WITH_CHILD',            label: 'Pray with Child' },
    { value: 'PRAY_WITH_FAMILY',           label: 'Pray with Family' },
    { value: 'FEEDING_CHILD',              label: 'Feeding Child' },
    { value: 'FAMILY_PRAYER',              label: 'Family Prayer' },
    { value: 'READING_BIBLE_STORIES',      label: 'Read Bible Stories' },
    { value: 'READ_BEDTIME_STORIES',       label: 'Bedtime Stories' },
    { value: 'POTTY_TRAINING',             label: 'Potty Training' },
    { value: 'TRAVEL_WITH_FAMILY',         label: 'Travel with Family' },
    { value: 'TAKE_CHILDREN_TO_SCHOOL',    label: 'Take to School' },
    { value: 'PICK_CHILDREN_FROM_SCHOOL',  label: 'Pick from School' },
    { value: 'TAKE_CHILDREN_FOR_EVENTS',   label: 'Take to Events' },
    { value: 'TAKE_CHILDREN_TO_PARK',      label: 'Take to Park' },
    { value: 'EDUCATIONAL_PLAY',           label: 'Educational Play' },
    { value: 'TAKE_CHILDREN_TO_CLINICS',   label: 'Take to Clinics' },
  ];

  readonly countyOptions = [
    'NAIROBI','KIAMBU','MACHAKOS','KAJIADO','MURANG_A','NYERI','KIRINYAGA','NYANDARUA',
    'EMBU','THARAKA_NITHI','MERU','ISIOLO','MARSABIT','GARISSA','WAJIR','MANDERA',
    'MOMBASA','KWALE','KILIFI','TANA_RIVER','LAMU','TAITA_TAVETA','NAKURU','NAROK',
    'KERICHO','BOMET','KAKAMEGA','VIHIGA','BUNGOMA','BUSIA','SIAYA','KISUMU',
    'HOMA_BAY','MIGORI','KISII','NYAMIRA','NAIVASHA','BARINGO','LAIKIPIA','SAMBURU',
    'TRANS_NZOIA','UASIN_GISHU','ELGEYO_MARAKWET','NANDI','WEST_POKOT','TURKANA','MAKUENI',
  ];

  countyLabel(v: string): string {
    return v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

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

  additionalDocUrls: string[] = [];
  additionalDocUploading = false;

  map!: any;
  marker!: any;
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
        }),
        shareReplay(1)
      );

    // Subscribe so tap runs and then schedule map init after DOM updates
    this.userDetails$.subscribe(() => {
      if (isPlatformBrowser(this.platformId)) {
        setTimeout(() => this.initializeMap(), 50);
      }
    });
  }

  private async initializeMap() {
    // Guard: form may not be ready yet (HTTP response hasn't arrived) or map element may not exist
    if (!this.form) return;
    const mapEl = document.getElementById('map');
    if (!mapEl) return;

    const L = (await import('leaflet')).default;

    const pin = this.isHouseHelp
      ? this.form.get('houseHelp.pinLocation')?.value
      : this.form.get('homeOwner.pinLocation')?.value;

    const initialLatLng: [number, number] = pin
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

    this.map.on('click', (e: any) => {
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

  private getPinFromForm(): [number, number] {
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

  addChip(event: any, target: 'skills' | 'languages' | 'preferredSkills' | 'preferredLanguages', group: 'houseHelp' | 'homeOwner' = 'houseHelp'): void {
    const value = (event.value || '').trim();
    if (!value) return;

    const control = this.form.get(`${group}.preferences.${target}`) || this.form.get(`${group}.${target}`);
    const currentValues: string[] = control?.value || [];
    control?.setValue([...currentValues, value]);

    event.chipInput!.clear();
  }

  removeChip(value: string, target: 'skills' | 'languages' | 'preferredSkills' | 'preferredLanguages', group: 'houseHelp' | 'homeOwner' = 'houseHelp'): void {
    const control = this.form.get(`${group}.preferences.${target}`) || this.form.get(`${group}.${target}`);
    const updated = (control?.value || []).filter((v: string) => v !== value);
    control?.setValue(updated);

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

          skills: [Array.isArray(user.houseHelp?.skills) ? user.houseHelp.skills : []],
          languages: [Array.isArray(user.houseHelp?.languages) ? user.houseHelp.languages : []],

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
          additionalDocuments: [user.houseHelp?.additionalDocuments || []],
          preferences: this.fb.group({
            // Field names match HouseHelpPreferenceUpdateDTO exactly
            houseHelpType:           [user.houseHelp?.preferences?.houseHelpType || null],
            minExperience:           [user.houseHelp?.preferences?.minExperience || null],
            preferredLocation:       [user.houseHelp?.preferences?.preferredLocation || ''],
            preferredSkills:         [user.houseHelp?.preferences?.preferredSkills || []],
            preferredLanguages:      [user.houseHelp?.preferences?.preferredLanguages || []],
            preferredChildAgeRanges: [user.houseHelp?.preferences?.preferredChildAgeRanges || []],
            preferredMaxChildren:    [user.houseHelp?.preferences?.preferredMaxChildren || null],
            preferredServices:       [user.houseHelp?.preferences?.preferredServices || []],
            preferredReligion:       [user.houseHelp?.preferences?.preferredReligion || ''],
            okayWithPets:            [user.houseHelp?.preferences?.okayWithPets ?? false],
            minSalary:               [user.houseHelp?.preferences?.minSalary || null],
            maxSalary:               [user.houseHelp?.preferences?.maxSalary || null],
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
          additionalDocuments: [user.homeOwner?.additionalDocuments || []],
          preferences: this.fb.group({
            // Field names match HomeOwnerPreferenceUpdateDTO exactly
            houseHelpType:         [user.homeOwner?.preferences?.houseHelpType || null],
            minExperience:         [user.homeOwner?.preferences?.minExperience || null],
            location:              [user.homeOwner?.preferences?.location || ''],
            preferredSkills:       [user.homeOwner?.preferences?.preferredSkills || []],
            preferredLanguages:    [user.homeOwner?.preferences?.preferredLanguages || []],
            minMatchScore:         [user.homeOwner?.preferences?.minMatchScore || 50],
            childrenAgeRanges:     [user.homeOwner?.preferences?.childrenAgeRanges || []],
            numberOfChildren:      [user.homeOwner?.preferences?.numberOfChildren || null],
            requiredServices:      [user.homeOwner?.preferences?.requiredServices || []],
            hasPets:               [user.homeOwner?.preferences?.hasPets ?? false],
            religionPreference:    [user.homeOwner?.preferences?.religionPreference || ''],
            requiresSecurityCleared: [user.homeOwner?.preferences?.requiresSecurityCleared ?? false],
            preferredMaxAge:       [user.homeOwner?.preferences?.preferredMaxAge || null],
            preferredMinAge:       [user.homeOwner?.preferences?.preferredMinAge || null],
            minSalary:             [user.homeOwner?.preferences?.minSalary || null],
            maxSalary:             [user.homeOwner?.preferences?.maxSalary || null],
          }),
        })
        : null,
    });

    const pin = this.isHouseHelp
      ? user.houseHelp?.pinLocation
      : user.homeOwner?.pinLocation;

    if (this.isHouseHelp && user.houseHelp) {
      this.additionalDocUrls = user.houseHelp?.additionalDocuments || [];
    }

    if (this.isHomeOwner && user.homeOwner) {
      this.additionalDocUrls = user.homeOwner?.additionalDocuments || [];
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

  viewDocument(url: string): void {
    window.open(url, '_blank');
  }

  onAdditionalDocSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    if (!files.length) return;

    this.additionalDocUploading = true;
    const uploads = files.map(file => this.fileUploadService.uploadDocument(file).toPromise());

    Promise.allSettled(uploads).then(results => {
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          this.additionalDocUrls = [...this.additionalDocUrls, result.value];
        }
      });
      const ctrl = this.form.get('houseHelp.additionalDocuments') || this.form.get('homeOwner.additionalDocuments');
      ctrl?.setValue(this.additionalDocUrls);
      this.additionalDocUploading = false;
      this.snackBar.open(`✅ ${results.filter(r => r.status === 'fulfilled').length} document(s) uploaded`, 'Close', { duration: 3000 });
    });

    input.value = '';
  }

  removeAdditionalDoc(url: string): void {
    this.additionalDocUrls = this.additionalDocUrls.filter(u => u !== url);
    const ctrl = this.form.get('houseHelp.additionalDocuments') || this.form.get('homeOwner.additionalDocuments');
    ctrl?.setValue(this.additionalDocUrls);
  }

}


