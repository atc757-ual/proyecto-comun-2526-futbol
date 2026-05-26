describe('Leagues Page (from /busqueda)', () => {
  const loginUser = () => {
    cy.visit('/auth/login');
    cy.dismissUiBlockers();
    cy.typeIntoIonInput('email', 'atc757@inlumine.ual.es');
    cy.typeIntoIonInput('password', '1q2w3e4r');
    cy.contains('ion-button', 'Iniciar Sesión').click({ force: true });
    cy.url({ timeout: 15000 }).should('include', '/home');
  };

  const stubLeagueSearch = () => {
    cy.intercept('GET', '**/search-leagues**', {
      statusCode: 200,
      body: {
        data: [
          { idLeague: '4328', strLeague: 'English Premier League', strCountry: 'England' },
          { idLeague: '4335', strLeague: 'Spanish La Liga', strCountry: 'Spain' }
        ]
      }
    }).as('searchLeagues');

    cy.intercept('GET', '**/searchleagues**', {
      statusCode: 200,
      body: {
        leagues: [
          { idLeague: '4328', strLeague: 'English Premier League', strCountry: 'England' },
          { idLeague: '4335', strLeague: 'Spanish La Liga', strCountry: 'Spain' }
        ]
      }
    }).as('searchLeaguesLegacy');
  };

  const stubTeamsByLeague = () => {
    cy.intercept('GET', '**/lookup_all_teams**', {
      statusCode: 200,
      body: {
        teams: [
          { idTeam: '133604', strTeam: 'Arsenal', strLeague: 'English Premier League' },
          { idTeam: '133612', strTeam: 'Chelsea', strLeague: 'English Premier League' }
        ]
      }
    }).as('teamsByLeague');
  };

  beforeEach(() => {
    loginUser();
    stubLeagueSearch();
    stubTeamsByLeague();
    cy.visit('/busqueda');
    cy.dismissUiBlockers();
  });

  it('should display the search bar and mode selector', () => {
    cy.get('ion-searchbar').should('exist');
    cy.get('ion-segment').should('exist');
  });

  it('should allow searching for a league', () => {
    cy.get('ion-segment-button[value="league"]').click({ force: true });
    cy.get('ion-searchbar input').type('Premier');
    cy.get('.minimal-result-item', { timeout: 10000 }).should('exist');
  });

  it('should allow selecting a league and seeing teams', () => {
    cy.get('ion-segment-button[value="league"]').click({ force: true });
    cy.get('ion-searchbar input').type('Premier');
    cy.get('.minimal-result-item', { timeout: 10000 }).first().click();
    cy.get('.minimal-result-item', { timeout: 10000 }).should('exist');
    cy.contains('Arsenal').should('exist');
  });

  it('should show selection basket and counter', () => {
    cy.get('.selection-basket-card').should('exist');
    cy.get('.basket-counter').should('contain', '/11');
  });

  it('should keep import button disabled without selected players', () => {
    cy.contains('ion-button', 'Importar').should('exist');
  });
});