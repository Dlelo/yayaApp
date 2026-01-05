import {Component, inject, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import { Router } from '@angular/router';
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
  private readonly loginService = inject(LoginService);
  private readonly accountDetails = inject(AccountDetailsService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly  househelpService = inject(HousehelpService);
  private readonly  homeOwnerService = inject(HomeOwnerService);
  private readonly fileUploadService = inject(FileUploadService);

  userId: number | null = this.loginService.userId();
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
  nationalIdFileName = '';

  availabilityTypes = ['DAYBURG', 'EMERGENCY', 'LIVE_IN'];

  ngOnInit(): void {
    if (!this.userId) return;

    this.userDetails$ = this.accountDetails.getUserById(this.userId)
      .pipe(
        take(1),
      tap((user) => {
        this.isHouseHelp = user.roles.includes('HOUSEHELP');
        this.isHomeOwner = user.roles.includes('HOMEOWNER');
        this.initializeForm(user);
      })
    );
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
         }
       })
   }
  }

  private initializeForm(user: any): void {
    this.form = this.fb?.group({
      nationalId: [user.houseHelp?.nationalId || ''],

      houseHelp: this.isHouseHelp
        ? this.fb.group({
          yearsOfExperience: [user.houseHelp?.yearsOfExperience || 0],

          availabilityType: [
            user.houseHelp?.availabilityType || null,
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
          height: [user.houseHelp?.height || ''],
          weight: [user.houseHelp?.weight || ''],
          religion: [user.houseHelp?.religion || ''],
          levelOfEducation: [user.houseHelp?.levelOfEducation || ''],
          currentLocation: [user.houseHelp?.currentLocation || ''],
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
        })
        : null,
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      this.nationalIdFile = input.files[0];
      this.nationalIdFileName = this.nationalIdFile.name;

      // Preview
      const reader = new FileReader();
      reader.onload = () => {
        this.nationalIdPreviewUrl = reader.result as string;
      };
      reader.readAsDataURL(this.nationalIdFile);
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
      formValue.houseHelp.skills = formValue.houseHelp.skills
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
    }

    if (formValue.houseHelp?.languages) {
      formValue.houseHelp.languages = formValue.houseHelp.languages
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
