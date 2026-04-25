import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { PlatformService } from './platform.service';
import { LoginService } from '../login/login.service';

/**
 * Mobile users skip the marketing home page — it has no value inside the app.
 * Native: redirect `/` to `/listing` (logged in) or `/login` (logged out).
 * Web: pass through to the home page as before.
 */
export const homeRedirectGuard: CanActivateFn = () => {
  const platform = inject(PlatformService);
  if (!platform.isNative()) return true;

  const login = inject(LoginService);
  const router = inject(Router);
  return router.createUrlTree([login.isLoggedIn() ? '/listing' : '/login']);
};
