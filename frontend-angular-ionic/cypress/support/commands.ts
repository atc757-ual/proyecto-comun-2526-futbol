// Custom commands go here

declare global {
	namespace Cypress {
		interface Chainable {
			dismissUiBlockers(): Chainable<void>;
			typeIntoIonInput(name: string, value: string): Chainable<void>;
		}
	}
}

const getActiveIonInput = (name: string) =>
	cy.get(`ion-input[name="${name}"]`, { timeout: 10000 })
		.should('exist')
		.find('input', { timeout: 10000 })
		.should(($inputs) => {
			const target = [...$inputs].find((input) => {
				const element = input as HTMLInputElement;
				const style = window.getComputedStyle(element);
				return !element.disabled && style.display !== 'none' && style.visibility !== 'hidden';
			});

			expect(target, `active ion-input for ${name}`).to.exist;
		})
		.then(($inputs) => {
			const target = [...$inputs].find((input) => {
				const element = input as HTMLInputElement;
				const style = window.getComputedStyle(element);
				return !element.disabled && style.display !== 'none' && style.visibility !== 'hidden';
			});

			return cy.wrap(target as HTMLInputElement);
		});

Cypress.Commands.add('dismissUiBlockers', () => {
	cy.get('body').then(($body) => {
		if ($body.find('ion-backdrop').length > 0) {
			cy.get('ion-backdrop').click({ force: true, multiple: true });
		}

		const closeCandidates = [
			'.permission-footer ion-button',
			'.permission-header ion-button',
			'app-permission-modal ion-button',
			'ion-modal ion-button',
			'.close-btn'
		];

		closeCandidates.forEach((selector) => {
			if ($body.find(selector).length > 0) {
				cy.get(selector).first().click({ force: true });
			}
		});
	});
});

Cypress.Commands.add('typeIntoIonInput', (name: string, value: string) => {
	getActiveIonInput(name).click({ force: true });
	getActiveIonInput(name).clear({ force: true });
	getActiveIonInput(name).type(value, { force: true });
});

export {};
