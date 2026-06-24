import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Firefox restores scroll position on new windows/tabs unless we take control.
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    window.scrollTo(0, 0);
  }
});

bootstrapApplication(App, appConfig)
  .then(() => {
    window.scrollTo(0, 0);
  })
  .catch((err) => console.error(err));
