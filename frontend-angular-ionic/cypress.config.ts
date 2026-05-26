import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
      baseUrl: 'http://127.0.0.1:4200',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
  },
  component: {
    devServer: {
      framework: "angular",
      bundler: "webpack",
      options: {
        projectConfig: {
          root: "",
          sourceRoot: "src",
          buildOptions: {
            tsConfig: "tsconfig.cy.json"
          }
        }
      }
    },
    specPattern: 'src/**/*.cy.ts',
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
});

