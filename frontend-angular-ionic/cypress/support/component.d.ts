import { mount } from 'cypress/angular';

declare global {
  namespace Cypress {
    interface Chainable {
      mount: typeof mount;
    }
  }
}

declare namespace sinon {
  interface SinonStub<TArgs extends readonly any[] = any[], TReturnValue = any> {
    as(alias: string): SinonStub<TArgs, TReturnValue>;
  }
}

export {};