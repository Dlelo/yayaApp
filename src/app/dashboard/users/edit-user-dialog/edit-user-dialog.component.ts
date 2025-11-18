import { Component, Inject } from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialogActions, MatDialogContent, MatDialogRef} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import {MatButton} from '@angular/material/button';
import {MatSelectModule} from '@angular/material/select';

export interface EditUserData {
  userId: number;
  name: string;
  currentRoles: string[];
  allRoles: string[];
}

@Component({
  selector: 'app-edit-user-dialog',
  imports: [
    MatDialogContent,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDialogActions,
    MatButton
  ],
  templateUrl: './edit-user-dialog.component.html'
})
export class EditUserDialogComponent {

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<EditUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: EditUserData
  ) {
    this.form = this.fb.group({
      roles: [data.currentRoles || []]
    });
  }

  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value.roles);
    }
  }

  close() {
    this.dialogRef.close();
  }
}
