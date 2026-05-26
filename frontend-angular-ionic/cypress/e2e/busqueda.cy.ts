/**
 * Cypress E2E — Player Scouting Search Module
 */

// ─── Auth helper: real login cached per spec run ─────────────────────────────
// All other test files (home.cy.ts, leagues.cy.ts, players.cy.ts) use real
// credentials. The fake-JWT approach was unreliable: the auth interceptor calls
// logout() on any 401, which clears localStorage mid-test and causes the guard
// to redirect subsequent tests to /auth/login.
const loginUser = () => {
  cy.session('busqueda-user-session', () => {
    cy.visit('/auth/login');
    cy.dismissUiBlockers();
    cy.typeIntoIonInput('email', 'atc757@inlumine.ual.es');
    cy.typeIntoIonInput('password', '1q2w3e4r');
    cy.contains('ion-button', 'Iniciar Sesión').click({ force: true });
    cy.url({ timeout: 15000 }).should('include', '/home');
  });
};

const visitBusqueda = () => {
  cy.visit('/busqueda');
  cy.url({ timeout: 10000 }).should('include', '/busqueda');
  cy.get('app-busqueda-list', { timeout: 8000 }).should('exist');
};

// Shared selector — declared once to avoid CPD duplication across suites
const searchInputSelector = 'ion-searchbar input:not([disabled])';

// ─── Navigation helpers ───────────────────────────────────────────────────────
const switchToModeAndSearch = (mode: 'player' | 'team' | 'league', term: string) => {
  cy.get(`ion-segment-button[value="${mode}"]`).click({ force: true });
  cy.get(searchInputSelector).click({ force: true }).clear({ force: true }).type(term, { force: true });
};

const navigateToPremierLeague = () => {
  switchToModeAndSearch('league', 'Premier');
  cy.contains('English Premier League').click({ force: true });
};

const addMessiToBasket = () => {
  switchToModeAndSearch('player', 'Messi');
  cy.contains('.minimal-result-item', 'Lionel Messi', { timeout: 10000 }).click({ force: true });
};

// ─── TheSportsDB API stubs for offline testing ────────────────────────────────
const stubLeagueSearch = (alias = 'searchLeagues') => {
  cy.intercept('GET', /.*(searchleagues|search-leagues|leagues\/search).*/, {
    statusCode: 200,
    body: {
      data: [
        { idLeague: '4328', strLeague: 'English Premier League', strCountry: 'England' },
        { idLeague: '4335', strLeague: 'Spanish La Liga', strCountry: 'Spain' }
      ],
      leagues: [
        { idLeague: '4328', strLeague: 'English Premier League', strCountry: 'England' },
        { idLeague: '4335', strLeague: 'Spanish La Liga', strCountry: 'Spain' }
      ]
    }
  }).as(alias);
};

const stubTeamsByLeague = (alias = 'teamsByLeague') => {
  cy.intercept('GET', /.*(lookup_all_teams|teams-by-league|league\/.*\/teams).*/, {
    statusCode: 200,
    body: {
      data: [
        { idTeam: '133604', strTeam: 'Arsenal', strLeague: 'English Premier League', strTeamBadge: 'https://www.thesportsdb.com/images/media/team/badge/arsenal.png' },
        { idTeam: '133612', strTeam: 'Chelsea', strLeague: 'English Premier League', strTeamBadge: 'https://www.thesportsdb.com/images/media/team/badge/chelsea.png' }
      ],
      teams: [
        { idTeam: '133604', strTeam: 'Arsenal', strLeague: 'English Premier League', strTeamBadge: 'https://www.thesportsdb.com/images/media/team/badge/arsenal.png' },
        { idTeam: '133612', strTeam: 'Chelsea', strLeague: 'English Premier League', strTeamBadge: 'https://www.thesportsdb.com/images/media/team/badge/chelsea.png' }
      ]
    }
  }).as(alias);
};

const stubPlayersByTeam = (alias = 'playersByTeam') => {
  cy.intercept('GET', /.*(lookup_all_players|team-players|team\/.*\/players).*/, {
    statusCode: 200,
    body: {
      data: [
        { idPlayer: 'p1', strPlayer: 'Bukayo Saka', strPosition: 'Winger', strTeam: 'Arsenal', strThumb: '' },
        { idPlayer: 'p2', strPlayer: 'Martin Odegaard', strPosition: 'Midfielder', strTeam: 'Arsenal', strThumb: '' },
        { idPlayer: 'p3', strPlayer: 'David Raya', strPosition: 'Goalkeeper', strTeam: 'Arsenal', strThumb: '' }
      ],
      player: [
        { idPlayer: 'p1', strPlayer: 'Bukayo Saka', strPosition: 'Winger', strTeam: 'Arsenal', strThumb: '' },
        { idPlayer: 'p2', strPlayer: 'Martin Odegaard', strPosition: 'Midfielder', strTeam: 'Arsenal', strThumb: '' },
        { idPlayer: 'p3', strPlayer: 'David Raya', strPosition: 'Goalkeeper', strTeam: 'Arsenal', strThumb: '' }
      ]
    }
  }).as(alias);
};

const stubPlayerSearch = (alias = 'searchPlayers') => {
  cy.intercept('GET', /.*(searchplayers|search-players|\/players\?.*name=|players\/search).*/, {
    statusCode: 200,
    body: {
      data: [
        { idPlayer: 'p10', strPlayer: 'Lionel Messi', strPosition: 'Forward', strTeam: 'Inter Miami', strThumb: '' },
        { idPlayer: 'p11', strPlayer: 'Luis Messi', strPosition: 'Forward', strTeam: 'Unknown', strThumb: '' }
      ],
      player: [
        { idPlayer: 'p10', strPlayer: 'Lionel Messi', strPosition: 'Forward', strTeam: 'Inter Miami', strThumb: '' },
        { idPlayer: 'p11', strPlayer: 'Luis Messi', strPosition: 'Forward', strTeam: 'Unknown', strThumb: '' }
      ]
    }
  }).as(alias);
};

const stubTeamSearch = (alias = 'searchTeams') => {
  cy.intercept('GET', /.*(searchteams|search-teams|teams\/search).*/, {
    statusCode: 200,
    body: {
      data: [
        { idTeam: '133739', strTeam: 'FC Barcelona', strLeague: 'La Liga', strTeamBadge: 'https://www.thesportsdb.com/images/media/team/badge/barca.png' }
      ],
      teams: [
        { idTeam: '133739', strTeam: 'FC Barcelona', strLeague: 'La Liga', strTeamBadge: 'https://www.thesportsdb.com/images/media/team/badge/barca.png' }
      ]
    }
  }).as(alias);
};

// =============================================================================
// SUITE 1: UI BASE
// =============================================================================
describe('Search – UI Base', () => {
  beforeEach(() => {
    loginUser();
    stubLeagueSearch();
    stubTeamsByLeague();
    stubPlayersByTeam();
    stubPlayerSearch();
    stubTeamSearch();
    visitBusqueda();
    cy.dismissUiBlockers();
  });

  it('should display the searchbar and the three mode segments', () => {
    cy.get('ion-searchbar').should('exist');
    cy.get('ion-segment').should('exist');
    cy.get('ion-segment-button[value="player"]').should('exist');
    cy.get('ion-segment-button[value="team"]').should('exist');
    cy.get('ion-segment-button[value="league"]').should('exist');
  });

  it('should display the empty basket initially', () => {
    cy.get('.selection-basket-card').should('exist');
    cy.contains('Tu Selección').should('exist');
    cy.get('.empty-basket').should('exist');
  });

  it('should change the placeholder when switching search mode', () => {
    cy.get('ion-segment-button[value="team"]').click({ force: true });
    cy.get('ion-searchbar input', { timeout: 6000 }).invoke('attr', 'placeholder').should('contain', 'club');

    cy.get('ion-segment-button[value="league"]').click({ force: true });
    cy.get('ion-searchbar input', { timeout: 6000 }).invoke('attr', 'placeholder').should('contain', 'liga');

    cy.get('ion-segment-button[value="player"]').click({ force: true });
    cy.get('ion-searchbar input', { timeout: 6000 }).invoke('attr', 'placeholder').should('contain', 'Balón de Oro');
  });

  it('should not show results for a query shorter than 3 characters', () => {
    cy.get('ion-searchbar').find('input').type('AB', { force: true });
    cy.get('.minimal-result-item').should('not.exist');
  });
});

// =============================================================================
// SUITE 2: LEAGUE → TEAM → PLAYER FLOW
// =============================================================================
describe('Search – League → Team → Player flow', () => {
  beforeEach(() => {
    loginUser();
    stubLeagueSearch();
    stubTeamsByLeague();
    stubPlayersByTeam();
    visitBusqueda();
    cy.dismissUiBlockers();
  });

  it('should search leagues and show results', () => {
    switchToModeAndSearch('league', 'Premier');
    cy.get('.minimal-result-item').should('have.length.at.least', 1);
    cy.contains('English Premier League').should('exist');
  });

  it('should navigate to teams when selecting a league', () => {
    navigateToPremierLeague();
    cy.contains('Arsenal').should('exist');
    cy.contains('Chelsea').should('exist');
  });

  it('should show navigation breadcrumbs when selecting a league', () => {
    navigateToPremierLeague();
    cy.get('.hierarchy-pills').should('exist');
    cy.get('.nav-pill').should('have.length.at.least', 2);
  });

  it('should load players when selecting a team', () => {
    navigateToPremierLeague();
    cy.contains('Arsenal').click({ force: true });
    cy.contains('Bukayo Saka').should('exist');
    cy.contains('Martin Odegaard').should('exist');
  });

  it('backToTeams should return to the teams list', () => {
    navigateToPremierLeague();
    cy.contains('Arsenal').click({ force: true });
    cy.get('.nav-pill').contains('Arsenal').click({ force: true });
    cy.contains('Chelsea').should('exist');
    cy.contains('Bukayo Saka').should('not.exist');
  });
});

// =============================================================================
// SUITE 3: TEAM → PLAYER FLOW
// =============================================================================
describe('Search – Team → Player flow', () => {
  beforeEach(() => {
    loginUser();
    stubTeamSearch();
    stubPlayersByTeam();
    visitBusqueda();
    cy.dismissUiBlockers();
  });

  it('should search teams by name and show results', () => {
    switchToModeAndSearch('team', 'Barcelona');
    cy.contains('FC Barcelona').should('exist');
  });

  it('should load players when selecting a team in Team mode', () => {
    switchToModeAndSearch('team', 'Barcelona');
    cy.contains('FC Barcelona').click({ force: true });
    cy.get('.minimal-result-item').should('have.length.at.least', 1);
  });
});

// =============================================================================
// SUITE 4: PLAYER SEARCH, BASKET AND IMPORT
// =============================================================================
describe('Search – Player Search, Basket and Import', () => {
  beforeEach(() => {
    loginUser();
    stubPlayerSearch();
    visitBusqueda();
    cy.dismissUiBlockers();
  });

  // ── Direct Player Search ──────────────────────────────────────────────────
  it('should search players directly and show results', () => {
    switchToModeAndSearch('player', 'Messi');
    cy.contains('Lionel Messi').should('exist');
  });

  it('should show the player position in results', () => {
    switchToModeAndSearch('player', 'Messi');
    cy.contains('.minimal-result-item', 'Lionel Messi', { timeout: 10000 })
      .should('exist')
      .within(() => {
        cy.get('.pos-tag').should('contain.text', 'Forward');
      });
  });

  // ── Selection and Basket ──────────────────────────────────────────────────
  it('should add a player to the basket on click', () => {
    addMessiToBasket();
    cy.get('.basket-counter').should('contain', '1');
    cy.get('.selected-players-list').should('exist');
  });

  it('should remove a player from the basket when clicking X', () => {
    addMessiToBasket();
    cy.get('.selected-players-list ion-button[color="danger"]').first().click({ force: true });
    cy.get('.basket-counter').should('contain', '0');
    cy.get('.empty-basket').should('exist');
  });

  it('the "Clear" button should empty the basket', () => {
    addMessiToBasket();
    cy.get('ion-button').contains('Limpiar').click({ force: true });
    cy.get('.basket-counter').should('contain', '0');
  });

  it('the import button should be disabled with no players selected', () => {
    cy.contains('ion-button', 'Importar').should('have.class', 'button-disabled');
  });

  // ── Player Import ─────────────────────────────────────────────────────────
  it('should keep import button disabled without GPS when players are selected', () => {
    switchToModeAndSearch('player', 'Messi');
    cy.get('.minimal-result-item').first().click({ force: true });
    cy.contains('ion-button', 'Importar').should('have.class', 'button-disabled');
  });

  it('should show the correct player count on the import button', () => {
    switchToModeAndSearch('player', 'Messi');
    cy.wait('@searchPlayers');
    cy.get('.minimal-result-item').first().click({ force: true });
    cy.get('ion-button').contains('Importar Jugador').should('exist');
  });
});

// =============================================================================
// SUITE 5: GPS PERMISSION CARD (GpsPermissionCardComponent)
// =============================================================================
describe('Search – GPS Permission Card', () => {
  const mockGeoPermissionDenied = () => {
    cy.visit('/busqueda', {
      onBeforeLoad(win) {
        if (win.navigator?.permissions) {
          cy.stub(win.navigator.permissions, 'query').callsFake((params) => {
            if (params.name === 'geolocation') {
              return Promise.resolve({ state: 'denied' });
            }
            return Promise.resolve({ state: 'granted' });
          });
        }
      }
    });
  };

  beforeEach(() => {
    loginUser();
    stubLeagueSearch();
    stubTeamsByLeague();
    stubPlayersByTeam();
    stubPlayerSearch();
    stubTeamSearch();
    mockGeoPermissionDenied();
    cy.dismissUiBlockers();
  });

  it('should display the GPS card with correct state after load', () => {
    cy.get('app-gps-permission-card').should('exist');
    cy.get('app-gps-permission-card').within(() => {
      // isCheckingGeo turns false after checkGeoPermission() resolves
      cy.get('.permission-item-row', { timeout: 8000 }).should('exist');
    });
  });

  it('should show red state if GPS permission is denied', () => {
    cy.get('app-gps-permission-card').within(() => {
      cy.get('.bg-permission-denied', { timeout: 8000 }).should('exist');
    });
  });

  it('should show the "Allow" button if GPS permission is denied', () => {
    // Use the CSS class on ion-button (light DOM) rather than text inside a
    // Stencil-slotted span — cy.contains() can miss text projected into slots.
    cy.get('app-gps-permission-card .btn-white-error', { timeout: 8000 }).should('exist');
  });
});

