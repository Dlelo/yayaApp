import {
  ApplicationConfig,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
  inject,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './auth/auth-interceptor.service';
import { StorageService } from './core/storage.service';
import { LoginService } from './login/login.service';
import { MobileBootstrapService } from './core/mobile-bootstrap.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideAppInitializer(async () => {
      const storage = inject(StorageService);
      const login = inject(LoginService);
      const mobile = inject(MobileBootstrapService);
      await storage.init();
      login.refreshAuthState();
      await mobile.init();
    }),
  ],
};
