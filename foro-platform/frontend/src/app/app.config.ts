import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';

const authInterceptor: HttpInterceptorFn = (request, next) => {
  const token = sessionStorage.getItem('foro_access_token');
  if (!token) return next(request);
  return next(request.clone({ setHeaders: { Authorization: `Bearer ${token}` } }));
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor]))
  ]
};
