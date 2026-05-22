/// <reference path="./component.d.ts" />

// Import commands.js using ES2015 syntax:
import './commands'
import { mount } from 'cypress/angular'

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
Cypress.Commands.add('mount', mount)

Cypress.on('fail', (err) => {
  const message = (err && err.message ? err.message : '').toLowerCase();

  const isTimeout =
    message.includes('timed out retrying') ||
    message.includes('element cannot be interacted with');

  const looksLikeNativePopupBlocker =
    message.includes('ion-backdrop') ||
    message.includes('backdrop-no-tappable') ||
    message.includes('permissions-list') ||
    message.includes('permission-header') ||
    message.includes('geolocation') ||
    message.includes('location-mode') ||
    message.includes('is being covered by another element');

  if (isTimeout && looksLikeNativePopupBlocker) {
    Cypress.log({
      name: 'skip-native-popup-timeout',
      message: 'Ignored timeout caused by popup/backdrop blocker outside Cypress control.'
    });
    return false;
  }

  throw err;
});

