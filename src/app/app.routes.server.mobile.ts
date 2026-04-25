import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Mobile/Capacitor build: every route renders on the client inside the
 * webview. No server-side rendering — the bundle ships as a static SPA.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Client,
  },
];
