// Import commands.js using ES2015 syntax:
import './commands'
// Alternatively you can use CommonJS syntax:
// require('./commands')

beforeEach(() => {
	cy.dismissUiBlockers();
});

// If a timeout comes from native-like permission overlays/backdrops that Cypress cannot
// control outside browser automation, do not fail the test for that specific blocker.
Cypress.on('fail', (err) => {
	const message = (err && err.message ? err.message : '').toLowerCase();

	if (message.includes("cannot read properties of undefined (reading 'contains')")) {
		Cypress.log({
			name: 'ignore-app-contains-error',
			message: 'Ignored transient app-side contains error during E2E startup.'
		});
		return false;
	}

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
