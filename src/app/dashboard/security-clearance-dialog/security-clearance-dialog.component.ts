import { Component, Inject } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatButton} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';
import {MatInput} from '@angular/material/input';
import {MatSlideToggle} from '@angular/material/slide-toggle';
import {MatCheckbox} from '@angular/material/checkbox';

export interface EditUserData {
  userId: number;
  name: string;
  currentRoles: string[];
  allRoles: string[];
}

@Component({
  selector: 'app-security-verify-dialog',
  imports: [
    MatDialogContent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogActions,
    MatButton,
    MatDialogTitle,
    MatInput,
    MatSlideToggle,
    MatCheckbox
  ],
  templateUrl: './security-clearance-dialog.component.html'
})
export class SecurityVerifyDialogComponent {

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<SecurityVerifyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditUserData
  ) {
    this.form = this.fb.group({
      cleared: [false],
      comment: ['']
    });

    this.setupConditionalValidation();
  }

  private setupConditionalValidation() {
    this.form.get('cleared')?.valueChanges.subscribe(cleared => {
      const commentCtrl = this.form.get('comment');

      if (!cleared) {
        commentCtrl?.setValidators([Validators.required]);
      } else {
        commentCtrl?.clearValidators();
      }

      commentCtrl?.updateValueAndValidity();
    });
  }

  save() {
    if (this.form.valid) {
      this.dialogRef.close({
        cleared: this.form.value.cleared,
        comments: this.form.value.comment
      });
    }
  }

  close() {
    this.dialogRef.close();
  }
}
