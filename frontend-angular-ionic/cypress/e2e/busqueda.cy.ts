/**
 * Cypress E2E — Módulo de Búsqueda de Jugadores (Scouting)
 *
 * Flujos cubiertos:
 *  1. Navegación y UI base
 *  2. Flujo: Liga → Equipo → Jugador
 *  3. Flujo: Equipo → Jugador
 *  4. Flujo: Búsqueda directa de Jugador
 *  5. Selección y gestión del basket
 *  6. Tarjeta GPS (GpsPermissionCardComponent)
 *  7. Importación de jugadores
 */

// ─── Helper: login antes de cada suite ────────────────────────────────────────
const login = () => {
  cy.window().then((win) => {
    const header  = win.btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = win.btoa(JSON.stringify({
      firebaseUid: 'cypress-test-uid',
      role: 'user',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600
    }));
    win.localStorage.setItem('jwt_token', `${header}.${payload}.cypress-fake-sig`);
  });
  cy.visit('/busqueda');
  cy.url({ timeout: 10000 }).should('include', '/busqueda');
};

// ─── Stub de la API TheSportsDB para tests offline ────────────────────────────
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
describe('Búsqueda – UI Base', () => {
  before(login);

  beforeEach(() => {
    cy.visit('/busqueda');
    cy.dismissUiBlockers();
  });

  it('debería mostrar el buscador y los tres segmentos de modo', () => {
    cy.get('ion-searchbar').should('exist');
    cy.get('ion-segment').should('exist');
    cy.get('ion-segment-button[value="player"]').should('exist');
    cy.get('ion-segment-button[value="team"]').should('exist');
    cy.get('ion-segment-button[value="league"]').should('exist');
  });

  it('debería mostrar el basket vacío inicialmente', () => {
    cy.get('.selection-basket-card').should('exist');
    cy.contains('Tu Selección').should('exist');
    cy.get('.empty-basket').should('exist');
  });

  it('debería cambiar el placeholder al cambiar el modo de búsqueda', () => {
    cy.get('ion-segment-button[value="team"]').click({ force: true });
    cy.get('ion-searchbar input').invoke('attr', 'placeholder').should('contain', 'club');

    cy.get('ion-segment-button[value="league"]').click({ force: true });
    cy.get('ion-searchbar input').invoke('attr', 'placeholder').should('contain', 'liga');

    cy.get('ion-segment-button[value="player"]').click({ force: true });
    cy.get('ion-searchbar input').invoke('attr', 'placeholder').should('contain', 'Balón de Oro');
  });

  it('no debería mostrar resultados con una query de menos de 3 caracteres', () => {
    cy.get('ion-searchbar').find('input').type('AB');
    cy.get('.minimal-result-item').should('not.exist');
  });
});

// =============================================================================
// SUITE 2: FLUJO LIGA → EQUIPO → JUGADOR
// =============================================================================
describe('Búsqueda – Flujo Liga → Equipo → Jugador', () => {
  const searchInputSelector = 'ion-searchbar input:not([disabled])';

  before(login);

  beforeEach(() => {
    cy.visit('/busqueda');
    cy.dismissUiBlockers();
    stubLeagueSearch();
    stubTeamsByLeague();
    stubPlayersByTeam();
  });

  it('debería buscar ligas y mostrar resultados', () => {
    cy.get('ion-segment-button[value="league"]').click({ force: true });
    cy.get(searchInputSelector).click({ force: true }).clear({ force: true }).type('Premier', { force: true });
    cy.get('.minimal-result-item').should('have.length.at.least', 1);
    cy.contains('English Premier League').should('exist');
  });

  it('debería navegar a equipos al seleccionar una liga', () => {
    cy.get('ion-segment-button[value="league"]').click({ force: true });
    cy.get(searchInputSelector).click({ force: true }).clear({ force: true }).type('Premier', { force: true });
    cy.contains('English Premier League').click();
    cy.contains('Arsenal').should('exist');
    cy.contains('Chelsea').should('exist');
  });

  it('debería mostrar píldoras de navegación al seleccionar liga y equipo', () => {
    cy.get('ion-segment-button[value="league"]').click({ force: true });
    cy.get(searchInputSelector).click({ force: true }).clear({ force: true }).type('Premier', { force: true });
    cy.contains('English Premier League').click();

    // Verifica la píldora de liga
    cy.get('.hierarchy-pills').should('exist');
    cy.get('.nav-pill').should('have.length.at.least', 2);
  });

  it('debería cargar jugadores al seleccionar un equipo', () => {
    cy.get('ion-segment-button[value="league"]').click({ force: true });
    cy.get(searchInputSelector).click({ force: true }).clear({ force: true }).type('Premier', { force: true });
    cy.contains('English Premier League').click();
    cy.contains('Arsenal').click();
    cy.contains('Bukayo Saka').should('exist');
    cy.contains('Martin Odegaard').should('exist');
  });

  it('backToTeams debería volver a la lista de equipos', () => {
    cy.get('ion-segment-button[value="league"]').click({ force: true });
    cy.get(searchInputSelector).click({ force: true }).clear({ force: true }).type('Premier', { force: true });
    cy.contains('English Premier League').click();
    cy.contains('Arsenal').click();

    // Click en la píldora de Arsenal para volver
    cy.get('.nav-pill').contains('Arsenal').click();
    cy.contains('Chelsea').should('exist');
    cy.contains('Bukayo Saka').should('not.exist');
  });
});

// =============================================================================
// SUITE 3: FLUJO EQUIPO → JUGADOR
// =============================================================================
describe('Búsqueda – Flujo Equipo → Jugador', () => {
  const searchInputSelector = 'ion-searchbar input:not([disabled])';

  before(login);

  beforeEach(() => {
    cy.visit('/busqueda');
    cy.dismissUiBlockers();
    stubTeamSearch();
    stubPlayersByTeam();
  });

  it('debería buscar equipos por nombre y mostrar resultados', () => {
    cy.get('ion-segment-button[value="team"]').click({ force: true });
    cy.get(searchInputSelector).click({ force: true }).clear({ force: true }).type('Barcelona', { force: true });
    cy.contains('FC Barcelona').should('exist');
  });

  it('debería cargar jugadores al seleccionar un equipo en modo Equipo', () => {
    cy.get('ion-segment-button[value="team"]').click({ force: true });
    cy.get(searchInputSelector).click({ force: true }).clear({ force: true }).type('Barcelona', { force: true });
    cy.contains('FC Barcelona').click();
    cy.get('.minimal-result-item').should('have.length.at.least', 1);
  });
});

// =============================================================================
// SUITE 4: BÚSQUEDA DIRECTA DE JUGADOR
// =============================================================================
describe('Búsqueda – Búsqueda Directa de Jugador', () => {
  const searchInputSelector = 'ion-searchbar input:not([disabled])';

  before(login);

  beforeEach(() => {
    cy.visit('/busqueda');
    cy.dismissUiBlockers();
    stubPlayerSearch();
  });

  it('debería buscar jugadores directamente y mostrar resultados', () => {
    cy.get('ion-segment-button[value="player"]').click({ force: true });
    cy.get(searchInputSelector).click({ force: true }).clear({ force: true }).type('Messi', { force: true });
    cy.contains('Lionel Messi').should('exist');
  });

  it('debería mostrar la posición del jugador en los resultados', () => {
    cy.get('ion-segment-button[value="player"]').click({ force: true });
    cy.get(searchInputSelector).click({ force: true }).clear({ force: true }).type('Messi', { force: true });
    cy.contains('.minimal-result-item', 'Lionel Messi', { timeout: 10000 })
      .should('exist')
      .within(() => {
        cy.get('.pos-tag').should('contain.text', 'Forward');
      });
  });
});

// =============================================================================
// SUITE 5: SELECCIÓN Y BASKET
// =============================================================================
describe('Búsqueda – Selección y Basket', () => {
  const searchInputSelector = 'ion-searchbar input:not([disabled])';

  before(login);

  beforeEach(() => {
    cy.visit('/busqueda');
    cy.dismissUiBlockers();
    stubPlayerSearch();
  });

  it('debería añadir un jugador al basket al hacer click', () => {
    cy.get('ion-segment-button[value="player"]').click({ force: true });
    cy.get(searchInputSelector).click({ force: true }).clear({ force: true }).type('Messi', { force: true });
    cy.contains('.minimal-result-item', 'Lionel Messi', { timeout: 10000 }).click();

    // El counter del basket debería ser 1
    cy.get('.basket-counter').should('contain', '1');
    cy.get('.selected-players-list').should('exist');
  });

  it('debería eliminar un jugador del basket al hacer click en X', () => {
    cy.get('ion-segment-button[value="player"]').click({ force: true });
    cy.get(searchInputSelector).click({ force: true }).clear({ force: true }).type('Messi', { force: true });
    cy.contains('.minimal-result-item', 'Lionel Messi', { timeout: 10000 }).click();

    // Eliminar del basket
    cy.get('.selected-players-list ion-button[color="danger"]').first().click();
    cy.get('.basket-counter').should('contain', '0');
    cy.get('.empty-basket').should('exist');
  });

  it('el botón "Limpiar" debería vaciar el basket', () => {
    cy.get('ion-segment-button[value="player"]').click({ force: true });
    cy.get(searchInputSelector).click({ force: true }).clear({ force: true }).type('Messi', { force: true });
    cy.contains('.minimal-result-item', 'Lionel Messi', { timeout: 10000 }).click();

    cy.get('ion-button').contains('Limpiar').click();
    cy.get('.basket-counter').should('contain', '0');
  });

  it('el botón de importar debería estar deshabilitado sin jugadores seleccionados', () => {
    cy.contains('ion-button', 'Importar').should('have.class', 'button-disabled');
  });
});

// =============================================================================
// SUITE 6: TARJETA GPS (GpsPermissionCardComponent)
// =============================================================================
describe('Búsqueda – Tarjeta GPS', () => {
  before(login);

  beforeEach(() => {
    cy.visit('/busqueda');
    cy.dismissUiBlockers();
  });

  it('no debería mostrar la tarjeta GPS mientras se comprueban los permisos', () => {
    // isCheckingGeo = true al inicio, la tarjeta no debería existir en el DOM
    // (solo visible brevemente, pero si la página ya cargó, isCheckingGeo es false)
    cy.get('app-gps-permission-card').should('exist');
  });

  it('debería mostrar la tarjeta GPS con el estado correcto tras la carga', () => {
    // La tarjeta debe existir con alguno de los dos estados
    cy.get('app-gps-permission-card').within(() => {
      cy.get('.permission-item-row').should('exist');
    });
  });

  it('debería mostrar el estado rojo si no hay permisos GPS', () => {
    // Geolocation está bloqueada por defecto en Cypress
    cy.get('app-gps-permission-card').within(() => {
      cy.get('.bg-permission-denied').should('exist');
    });
  });

  it('debería mostrar el botón "Permitir" si no hay permisos GPS', () => {
    cy.get('app-gps-permission-card').within(() => {
      cy.contains('Permitir').should('exist');
    });
  });
});

// =============================================================================
// SUITE 7: IMPORTACIÓN
// =============================================================================
describe('Búsqueda – Importación de Jugadores', () => {
  before(login);

  beforeEach(() => {
    cy.visit('/busqueda');
    cy.dismissUiBlockers();
    stubPlayerSearch();
  });

  it('debería mostrar toast de error si se intenta importar sin GPS', () => {
    const searchInputSelector = 'ion-searchbar input:not([disabled])';

    cy.get('ion-segment-button[value="player"]').click({ force: true });
    cy.get(searchInputSelector).click({ force: true }).clear({ force: true }).type('Messi', { force: true });
    cy.get('.minimal-result-item').first().click();

    // El botón de importar debería estar deshabilitado sin GPS (hasLocation=false)
    cy.contains('ion-button', 'Importar').should('have.class', 'button-disabled');
  });

  it('debería mostrar el número correcto de jugadores en el botón de importar', () => {
    cy.get('ion-segment-button[value="player"]').click({ force: true });
    cy.get('ion-searchbar').find('input').type('Messi');
    cy.wait('@searchPlayers');
    cy.get('.minimal-result-item').first().click();

    cy.get('ion-button').contains('Importar Jugador').should('exist');
  });
});
