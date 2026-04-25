import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { LoginService } from '../login/login.service';
import { AccountDetailsService } from '../account-details/account-details.service';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Guards detail screens (e.g. /profile/:id) so a freshly registered user must
 * complete their own account first. "Complete" means their HOMEOWNER /
 * HOUSEHELP record has nationalId AND homeLocation populated.
 *
 * Admins / agents / sales / security pass through without the check.
 */
export const profileCompleteGuard: CanActivateFn = () => {
  const login = inject(LoginService);
  const accounts = inject(AccountDetailsService);
  const router = inject(Router);
  const snack = inject(MatSnackBar);

  const myId = login.userId();
  const roles = login.userRoles();

  if (!myId) return router.createUrlTree(['/login']);

  const privileged = ['ROLE_ADMIN', 'ROLE_AGENT', 'ROLE_SALES', 'ROLE_SECURITY'];
  if (roles.some((r) => privileged.includes(r))) return true;

  const isHomeOwner = roles.includes('ROLE_HOMEOWNER');
  const isHouseHelp = roles.includes('ROLE_HOUSEHELP');
  if (!isHomeOwner && !isHouseHelp) return true;

  return accounts.getUserById(myId).pipe(
    map((user: any) => {
      const record = isHomeOwner ? user?.homeOwner : user?.houseHelp;
      const complete = !!record && !!record.nationalId && !!record.homeLocation;
      if (complete) return true;
      snack.open(
        'Please complete your account before viewing other profiles.',
        'OK',
        { duration: 4000 }
      );
      return router.createUrlTree(['/edit-account', myId]);
    }),
    catchError(() => of(true))
  );
};
