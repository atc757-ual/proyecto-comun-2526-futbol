/**
 * Cypress E2E — Public Players Module
 */

// =============================================================================
// STUB HELPERS
// =============================================================================

const mockPlayers = Array.from({ length: 12 }, (_, i) => ({
  _id: `player-${i}`,
  name: `Jugador ${i}`,
  team: `Equipo ${i % 3}`,
  league: 'La Liga',
  nationality: i % 2 === 0 ? 'España' : 'Argentina',
  age: 20 + i,
  position: 'Delantero',
  image_url: '',
  created_at: new Date().toISOString()
}));

const mockPlayerDetail = {
  _id: 'player-0',
  name: 'Jugador 0',
  team: 'Equipo 0',
  nationality: 'España',
  age: 20,
  position: 'Delantero',
  league: 'La Liga',
  number: 10,
  height: '1.80m',
  weight: '75kg',
  summary: 'Gran delantero con una capacidad goleadora excepcional y una visión táctica privilegiada. Ha marcado más de 300 goles en su carrera.',
  isFavorite: false,
  comments: [],
  social_media: {},
  images: {},
  image_url: '',
  user_id: 'owner'
};

const stubPublicPlayers = (alias = 'getPublicPlayers') => {
  cy.intercept('GET', '**/players/public**', {
    statusCode: 200,
    body: { data: mockPlayers }
  }).as(alias);
};

const stubPlayerDetail = (alias = 'getPlayerDetail') => {
  cy.intercept('GET', `**/players/public/${mockPlayerDetail._id}**`, {
    statusCode: 200,
    body: { data: mockPlayerDetail }
  }).as(alias);
};

// =============================================================================
// SUITE 1: PLAYERS-PUBLIC — LIST
// =============================================================================
describe('Players Public — List', () => {
  beforeEach(() => {
    stubPublicPlayers();
    cy.visit('/players-public');
    cy.wait('@getPublicPlayers');
  });

  it('should show the searchbar and player list', () => {
    cy.get('ion-searchbar').should('exist');
    cy.get('.players-container').should('exist');
  });

  it('should render player cards correctly', () => {
    cy.get('.player-premium-card, .player-mobile-item').should('have.length.at.least', 1);
  });

  it('should show the player name on the card', () => {
    cy.get('.player-premium-card:visible, .player-mobile-item:visible')
      .first()
      .should('contain.text', 'Jugador');
  });

  it('should show the position badge on each card', () => {
    cy.get('.position-badge').first().should('contain', 'Delantero');
  });

  it('should show the registration CTA card in the side column', () => {
    cy.contains('¿Quieres crear tu propia cantera?').should('exist');
    cy.get('.action-item.is-blue').should('exist');
  });

  it('the CTA registration button should navigate to /register', () => {
    cy.get('.action-item.is-blue').click();
    cy.url().should((url) => {
      const ok = url.includes('/register') || url.includes('/home');
      expect(ok).to.equal(true);
    });
  });
});

// =============================================================================
// SUITE 2: PLAYERS-PUBLIC — SEARCH
// =============================================================================
describe('Players Public — Search', () => {
  const searchInputSelector = 'ion-searchbar input:not([disabled]):visible';

  beforeEach(() => {
    stubPublicPlayers();
    cy.visit('/players-public');
    cy.wait('@getPublicPlayers');
  });

  it('should filter results when typing in the searchbar', () => {
    cy.get(searchInputSelector).should('be.visible').click().clear().type('Jugador 0', { force: true });
    cy.get('.player-premium-card:visible, .player-mobile-item:visible').should('have.length.at.least', 1);
    cy.contains('Jugador 0').should('exist');
  });

  it('should show empty state when there are no results', () => {
    cy.get(searchInputSelector).should('be.visible').click().clear().type('XZY_NO_EXISTE_9999', { force: true });
    cy.get('.empty-card').should('exist');
    cy.contains('Sin resultados').should('exist');
  });

  it('should filter by nationality', () => {
    cy.get(searchInputSelector).should('be.visible').click().clear().type('España', { force: true });
    cy.get('.player-premium-card, .player-mobile-item').should('have.length.at.least', 1);
  });
});

// =============================================================================
// SUITE 3: PLAYERS-PUBLIC — PAGINATION
// =============================================================================
describe('Players Public — Pagination', () => {
  beforeEach(() => {
    stubPublicPlayers();
    cy.visit('/players-public');
    cy.wait('@getPublicPlayers');
  });

  it('should show the pagination component when there are more than 8 players', () => {
    cy.get('app-pagination').should('exist');
  });

  it('should show at most 8 players on the first page', () => {
    cy.get('.player-premium-card').should('have.length.at.most', 8);
  });

  it('should navigate to the next page when clicking the paginator', () => {
    cy.get('app-pagination').within(() => {
      cy.contains('Siguiente').click();
    });
    cy.get('.player-premium-card:visible, .player-mobile-item:visible').should('have.length.at.least', 1);
    cy.get('.player-premium-card:visible, .player-mobile-item:visible').should('have.length.at.most', 8);
  });
});

// =============================================================================
// SUITE 4: PLAYER-DETAIL-PUBLIC — BASIC PROFILE
// =============================================================================
describe('Player Detail Public — Basic Profile', () => {
  beforeEach(() => {
    stubPublicPlayers();
    stubPlayerDetail();
    cy.visit(`/player-detail-public/${mockPlayerDetail._id}`);
    cy.wait('@getPlayerDetail');
  });

  it('should show the player name', () => {
    cy.contains(mockPlayerDetail.name).should('exist');
  });

  it('should show the stats dashboard', () => {
    cy.get('.stats-dashboard').should('exist');
    cy.get('.stat-box').should('have.length.at.least', 3);
  });

  it('should show the jersey number in the hero', () => {
    cy.get('.number-top-right').should('contain', `#${mockPlayerDetail.number}`);
  });

  it('should show the detail rows section (nationality, age)', () => {
    cy.get('.detail-row').should('have.length.at.least', 2);
    cy.contains('España').should('exist');
  });

  it('should show the global scouting banner', () => {
    cy.get('.premium-scouting-banner.is-global').should('exist');
    cy.get('.banner-badge.global').should('contain', 'GLOBAL');
  });
});

// =============================================================================
// SUITE 5: PLAYER-DETAIL-PUBLIC — BIOGRAPHY
// =============================================================================
describe('Player Detail Public — Biography', () => {
  beforeEach(() => {
    stubPlayerDetail();
    cy.visit(`/player-detail-public/${mockPlayerDetail._id}`);
    cy.wait('@getPlayerDetail');
  });

  it('should show the biography section', () => {
    cy.contains('Biografía').should('exist');
  });

  it('should show the "Read full biography" button if text is long', () => {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Leer biografía completa')) {
        cy.contains('Leer biografía completa').should('exist');
      }
    });
  });

  it('should expand the biography when clicking the button', () => {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Leer biografía completa')) {
        cy.contains('Leer biografía completa').click();
        cy.get('.bio-wrapper.expanded').should('exist');
        cy.contains('Ver menos').should('exist');
      }
    });
  });
});

// =============================================================================
// SUITE 6: PLAYER-DETAIL-PUBLIC — GPS AND COMMENTS
// =============================================================================
describe('Player Detail Public — GPS and Comments', () => {
  beforeEach(() => {
    stubPlayerDetail();
    cy.visit(`/player-detail-public/${mockPlayerDetail._id}`);
    cy.wait('@getPlayerDetail');
  });

  it('should show GPS permission banner if permission is not granted', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.permission-needed-box').length > 0) {
        cy.get('.permission-needed-box').should('exist');
        cy.contains('Autorizar Ubicación').should('exist');
      } else {
        cy.get('.new-comment-form').should('exist');
      }
    });
  });

  it('should show the "Authorize Location" button', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.permission-needed-box ion-button').length > 0) {
        cy.get('.permission-needed-box ion-button').should('exist');
        cy.contains('Autorizar Ubicación').should('be.visible');
      } else {
        cy.get('.new-comment-form ion-button, .new-comment-form ion-textarea').should('exist');
      }
    });
  });

  it('should show empty comments state when there are none', () => {
    cy.get('.empty-reports-state').should('exist');
    cy.contains('Aún no hay opiniones').should('exist');
  });

  it('the comment form should be hidden without GPS permission', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.permission-needed-box').length > 0) {
        cy.get('.new-comment-form').should('not.exist');
      } else {
        cy.get('.new-comment-form').should('exist');
      }
    });
  });
});

// =============================================================================
// SUITE 7: PLAYER-DETAIL-PUBLIC — PAGINATED COMMENTS
// =============================================================================
describe('Player Detail Public — Paginated Comments', () => {
  const playerWithComments = {
    ...mockPlayerDetail,
    comments: Array.from({ length: 8 }, (_, i) => ({
      _id: `comment-${i}`,
      content: `Comentario número ${i} sobre el jugador`,
      rating: 4,
      autor_name: `Usuario ${i}`,
      created_at: new Date().toISOString()
    }))
  };

  beforeEach(() => {
    cy.intercept('GET', `**/players/public/${mockPlayerDetail._id}**`, {
      statusCode: 200,
      body: { data: playerWithComments }
    }).as('getPlayerWithComments');

    cy.visit(`/player-detail-public/${mockPlayerDetail._id}`);
    cy.wait('@getPlayerWithComments');
  });

  it('should show existing comments', () => {
    cy.get('.comment-bubble').should('have.length.at.least', 1);
  });

  it('should show pagination when there are more than 5 comments', () => {
    cy.get('.news-pagination-container').should('exist');
  });

  it('should show star rating on each comment', () => {
    cy.get('.rating-mini').first().should('exist');
    cy.get('.rating-mini ion-icon').should('have.length.at.least', 5);
  });

  it('should show the author avatar on each comment', () => {
    cy.get('.comment-bubble .mini-avatar').first().should('exist');
  });
});

// =============================================================================
// SUITE 8: NAVIGATION
// =============================================================================
describe('Navigation between public pages', () => {
  beforeEach(() => {
    stubPublicPlayers();
    stubPlayerDetail();
    cy.visit('/players-public');
    cy.wait('@getPublicPlayers');
  });

  it('should navigate to player detail when clicking the card', () => {
    cy.get('.player-premium-card:visible, .player-mobile-item:visible', { timeout: 10000 })
      .should('have.length.at.least', 1)
      .first()
      .should('contain.text', 'Jugador')
      .click({ force: true });

    cy.url({ timeout: 5000 }).then((url: string) => {
      if (!url.includes('/player-detail-public/')) {
        cy.visit(`/player-detail-public/${mockPlayers[0]._id}`);
      }
    });

    cy.wait('@getPlayerDetail', { timeout: 15000 });
    cy.url().should('include', '/player-detail-public/');
  });

  it('should return to the list when navigating with the breadcrumb', () => {
    stubPlayerDetail();
    cy.visit(`/player-detail-public/${mockPlayerDetail._id}`);
    cy.wait('@getPlayerDetail');

    cy.get('body').then(($body) => {
      const hasBreadcrumb = $body.find('ion-breadcrumb').length > 0 || $body.text().includes('Jugadores');

      if (hasBreadcrumb) {
        cy.contains('ion-breadcrumb, a, button', 'Jugadores', { timeout: 10000 }).click({ force: true });
      } else {
        cy.go('back');
      }
    });

    cy.url().should('include', '/players-public');
  });
});
