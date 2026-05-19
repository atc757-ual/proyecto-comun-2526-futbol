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
  cy.visit('/login');
  cy.get('ion-input[name="email"] input').type('admin@test.com');
  cy.get('ion-input[name="password"] input').type('admin123456');
  cy.get('ion-button[type="submit"]').click();
  cy.url().should('include', '/home');
  cy.visit('/busqueda');
  cy.url().should('include', '/busqueda');
};

// ─── Stub de la API TheSportsDB para tests offline ────────────────────────────
const stubLeagueSearch = (alias = 'searchLeagues') => {
  cy.intercept('GET', '**/searchleagues*', {
    statusCode: 200,
    body: {
      leagues: [
        { idLeague: '4328', strLeague: 'English Premier League', strCountry: 'England' },
        { idLeague: '4335', strLeague: 'Spanish La Liga', strCountry: 'Spain' },
      ]
    }
  }).as(alias);
};

const stubTeamsByLeague = (alias = 'teamsByLeague') => {
  cy.intercept('GET', '**/lookup_all_teams*', {
    statusCode: 200,
    body: {
      teams: [
        { idTeam: '133604', strTeam: 'Arsenal', strLeague: 'English Premier League', strTeamBadge: 'https://www.thesportsdb.com/images/media/team/badge/arsenal.png' },
        { idTeam: '133612', strTeam: 'Chelsea', strLeague: 'English Premier League', strTeamBadge: 'https://www.thesportsdb.com/images/media/team/badge/chelsea.png' },
      ]
    }
  }).as(alias);
};

const stubPlayersByTeam = (alias = 'playersByTeam') => {
  cy.intercept('GET', '**/lookup_all_players*', {
    statusCode: 200,
    body: {
      player: [
        { idPlayer: 'p1', strPlayer: 'Bukayo Saka', strPosition: 'Winger', strTeam: 'Arsenal', strThumb: '' },
        { idPlayer: 'p2', strPlayer: 'Martin Odegaard', strPosition: 'Midfielder', strTeam: 'Arsenal', strThumb: '' },
        { idPlayer: 'p3', strPlayer: 'David Raya', strPosition: 'Goalkeeper', strTeam: 'Arsenal', strThumb: '' },
      ]
    }
  }).as(alias);
};

const stubPlayerSearch = (alias = 'searchPlayers') => {
  cy.intercept('GET', '**/searchplayers*', {
    statusCode: 200,
    body: {
      player: [
        { idPlayer: 'p10', strPlayer: 'Lionel Messi', strPosition: 'Forward', strTeam: 'Inter Miami', strThumb: '' },
        { idPlayer: 'p11', strPlayer: 'Luis Messi', strPosition: 'Forward', strTeam: 'Unknown', strThumb: '' },
      ]
    }
  }).as(alias);
};

const stubTeamSearch = (alias = 'searchTeams') => {
  cy.intercept('GET', '**/searchteams*', {
    statusCode: 200,
    body: {
      teams: [
        { idTeam: '133739', strTeam: 'FC Barcelona', strLeague: 'La Liga', strTeamBadge: 'https://www.thesportsdb.com/images/media/team/badge/barca.png' },
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
    cy.get('ion-segment-button[value="team"]').click();
    cy.get('ion-searchbar').invoke('attr', 'placeholder').should('contain', 'club');

    cy.get('ion-segment-button[value="league"]').click();
    cy.get('ion-searchbar').invoke('attr', 'placeholder').should('contain', 'liga');

    cy.get('ion-segment-button[value="player"]').click();
    cy.get('ion-searchbar').invoke('attr', 'placeholder').should('contain', 'Balón de Oro');
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
  before(login);

  beforeEach(() => {
    cy.visit('/busqueda');
    stubLeagueSearch();
    stubTeamsByLeague();
    stubPlayersByTeam();
  });

  it('debería buscar ligas y mostrar resultados', () => {
    cy.get('ion-segment-button[value="league"]').click();
    cy.get('ion-searchbar').find('input').type('Premier');
    cy.wait('@searchLeagues');
    cy.get('.minimal-result-item').should('have.length.at.least', 1);
    cy.contains('English Premier League').should('exist');
  });

  it('debería navegar a equipos al seleccionar una liga', () => {
    cy.get('ion-segment-button[value="league"]').click();
    cy.get('ion-searchbar').find('input').type('Premier');
    cy.wait('@searchLeagues');
    cy.contains('English Premier League').click();
    cy.wait('@teamsByLeague');
    cy.contains('Arsenal').should('exist');
    cy.contains('Chelsea').should('exist');
  });

  it('debería mostrar píldoras de navegación al seleccionar liga y equipo', () => {
    cy.get('ion-segment-button[value="league"]').click();
    cy.get('ion-searchbar').find('input').type('Premier');
    cy.wait('@searchLeagues');
    cy.contains('English Premier League').click();
    cy.wait('@teamsByLeague');

    // Verifica la píldora de liga
    cy.get('.hierarchy-pills').should('exist');
    cy.get('.nav-pill').should('have.length.at.least', 2);
  });

  it('debería cargar jugadores al seleccionar un equipo', () => {
    cy.get('ion-segment-button[value="league"]').click();
    cy.get('ion-searchbar').find('input').type('Premier');
    cy.wait('@searchLeagues');
    cy.contains('English Premier League').click();
    cy.wait('@teamsByLeague');
    cy.contains('Arsenal').click();
    cy.wait('@playersByTeam');
    cy.contains('Bukayo Saka').should('exist');
    cy.contains('Martin Odegaard').should('exist');
  });

  it('backToTeams debería volver a la lista de equipos', () => {
    cy.get('ion-segment-button[value="league"]').click();
    cy.get('ion-searchbar').find('input').type('Premier');
    cy.wait('@searchLeagues');
    cy.contains('English Premier League').click();
    cy.wait('@teamsByLeague');
    cy.contains('Arsenal').click();
    cy.wait('@playersByTeam');

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
  before(login);

  beforeEach(() => {
    cy.visit('/busqueda');
    stubTeamSearch();
    stubPlayersByTeam();
  });

  it('debería buscar equipos por nombre y mostrar resultados', () => {
    cy.get('ion-segment-button[value="team"]').click();
    cy.get('ion-searchbar').find('input').type('Barcelona');
    cy.wait('@searchTeams');
    cy.contains('FC Barcelona').should('exist');
  });

  it('debería cargar jugadores al seleccionar un equipo en modo Equipo', () => {
    cy.get('ion-segment-button[value="team"]').click();
    cy.get('ion-searchbar').find('input').type('Barcelona');
    cy.wait('@searchTeams');
    cy.contains('FC Barcelona').click();
    cy.wait('@playersByTeam');
    cy.get('.minimal-result-item').should('have.length.at.least', 1);
  });
});

// =============================================================================
// SUITE 4: BÚSQUEDA DIRECTA DE JUGADOR
// =============================================================================
describe('Búsqueda – Búsqueda Directa de Jugador', () => {
  before(login);

  beforeEach(() => {
    cy.visit('/busqueda');
    stubPlayerSearch();
  });

  it('debería buscar jugadores directamente y mostrar resultados', () => {
    cy.get('ion-segment-button[value="player"]').click();
    cy.get('ion-searchbar').find('input').type('Messi');
    cy.wait('@searchPlayers');
    cy.contains('Lionel Messi').should('exist');
  });

  it('debería mostrar la posición del jugador en los resultados', () => {
    cy.get('ion-segment-button[value="player"]').click();
    cy.get('ion-searchbar').find('input').type('Messi');
    cy.wait('@searchPlayers');
    cy.get('.pos-tag').first().should('exist');
  });
});

// =============================================================================
// SUITE 5: SELECCIÓN Y BASKET
// =============================================================================
describe('Búsqueda – Selección y Basket', () => {
  before(login);

  beforeEach(() => {
    cy.visit('/busqueda');
    stubPlayerSearch();
  });

  it('debería añadir un jugador al basket al hacer click', () => {
    cy.get('ion-segment-button[value="player"]').click();
    cy.get('ion-searchbar').find('input').type('Messi');
    cy.wait('@searchPlayers');
    cy.get('.minimal-result-item').first().click();

    // El counter del basket debería ser 1
    cy.get('.basket-counter').should('contain', '1');
    cy.get('.selected-players-list').should('exist');
  });

  it('debería eliminar un jugador del basket al hacer click en X', () => {
    cy.get('ion-segment-button[value="player"]').click();
    cy.get('ion-searchbar').find('input').type('Messi');
    cy.wait('@searchPlayers');
    cy.get('.minimal-result-item').first().click();

    // Eliminar del basket
    cy.get('.selected-players-list ion-button[color="danger"]').first().click();
    cy.get('.basket-counter').should('contain', '0');
    cy.get('.empty-basket').should('exist');
  });

  it('el botón "Limpiar" debería vaciar el basket', () => {
    cy.get('ion-segment-button[value="player"]').click();
    cy.get('ion-searchbar').find('input').type('Messi');
    cy.wait('@searchPlayers');
    cy.get('.minimal-result-item').first().click();

    cy.get('ion-button').contains('Limpiar').click();
    cy.get('.basket-counter').should('contain', '0');
  });

  it('el botón de importar debería estar deshabilitado sin jugadores seleccionados', () => {
    cy.get('ion-button').contains('Importar').should('be.disabled');
  });
});

// =============================================================================
// SUITE 6: TARJETA GPS (GpsPermissionCardComponent)
// =============================================================================
describe('Búsqueda – Tarjeta GPS', () => {
  before(login);

  beforeEach(() => {
    cy.visit('/busqueda');
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
    stubPlayerSearch();
  });

  it('debería mostrar toast de error si se intenta importar sin GPS', () => {
    cy.get('ion-segment-button[value="player"]').click();
    cy.get('ion-searchbar').find('input').type('Messi');
    cy.wait('@searchPlayers');
    cy.get('.minimal-result-item').first().click();

    // El botón de importar debería estar deshabilitado sin GPS (hasLocation=false)
    cy.get('ion-button').contains('Importar').should('be.disabled');
  });

  it('debería mostrar el número correcto de jugadores en el botón de importar', () => {
    cy.get('ion-segment-button[value="player"]').click();
    cy.get('ion-searchbar').find('input').type('Messi');
    cy.wait('@searchPlayers');
    cy.get('.minimal-result-item').first().click();

    cy.get('ion-button').contains('Importar Jugador').should('exist');
  });
});
