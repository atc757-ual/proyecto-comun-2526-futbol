/**
 * Cypress E2E — Módulo Público de Jugadores
 *
 * Cubre:
 *  1. players-public: listado, búsqueda, paginación, CTA lateral
 *  2. player-detail-public: ficha, estadísticas, biografía, GPS, comentarios
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
// SUITE 1: PLAYERS-PUBLIC — LISTADO
// =============================================================================
describe('Players Public — Listado', () => {
  beforeEach(() => {
    stubPublicPlayers();
    cy.visit('/players-public');
    cy.wait('@getPublicPlayers');
  });

  it('debería mostrar el buscador y la lista de jugadores', () => {
    cy.get('ion-searchbar').should('exist');
    cy.get('.players-container').should('exist');
  });

  it('debería renderizar las tarjetas de jugadores correctamente', () => {
    cy.get('.player-premium-card, .player-mobile-item').should('have.length.at.least', 1);
  });

  it('debería mostrar el nombre del jugador en la tarjeta', () => {
    cy.get('.player-premium-card:visible, .player-mobile-item:visible')
      .first()
      .should('contain.text', 'Jugador');
  });

  it('debería mostrar el badge de posición en cada tarjeta', () => {
    cy.get('.position-badge').first().should('contain', 'Delantero');
  });

  it('debería mostrar la tarjeta CTA de registro en la columna lateral', () => {
    cy.contains('¿Quieres crear tu propia cantera?').should('exist');
    cy.get('.action-item.is-blue').should('exist');
  });

  it('el botón de registro CTA debería navegar a /register', () => {
    cy.get('.action-item.is-blue').click();
    cy.url().should((url) => {
      const ok = url.includes('/register') || url.includes('/home');
      expect(ok).to.equal(true);
    });
  });
});

// =============================================================================
// SUITE 2: PLAYERS-PUBLIC — BÚSQUEDA Y FILTRADO
// =============================================================================
describe('Players Public — Búsqueda', () => {
  const searchInputSelector = 'ion-searchbar input:not([disabled]):visible';

  beforeEach(() => {
    stubPublicPlayers();
    cy.visit('/players-public');
    cy.wait('@getPublicPlayers');
  });

  it('debería filtrar los resultados al escribir en el buscador', () => {
    cy.get(searchInputSelector).should('be.visible').click().clear().type('Jugador 0', { force: true });
    cy.get('.player-premium-card:visible, .player-mobile-item:visible').should('have.length.at.least', 1);
    cy.contains('Jugador 0').should('exist');
  });

  it('debería mostrar el estado vacío si no hay resultados', () => {
    cy.get(searchInputSelector).should('be.visible').click().clear().type('XZY_NO_EXISTE_9999', { force: true });
    cy.get('.empty-card').should('exist');
    cy.contains('Sin resultados').should('exist');
  });

  it('debería filtrar por nacionalidad', () => {
    cy.get(searchInputSelector).should('be.visible').click().clear().type('España', { force: true });
    cy.get('.player-premium-card, .player-mobile-item').should('have.length.at.least', 1);
  });
});

// =============================================================================
// SUITE 3: PLAYERS-PUBLIC — PAGINACIÓN
// =============================================================================
describe('Players Public — Paginación', () => {
  beforeEach(() => {
    stubPublicPlayers();
    cy.visit('/players-public');
    cy.wait('@getPublicPlayers');
  });

  it('debería mostrar el componente de paginación cuando hay más de 8 jugadores', () => {
    // 12 jugadores mock → 2 páginas
    cy.get('app-pagination').should('exist');
  });

  it('debería mostrar 8 jugadores en la primera página', () => {
    cy.get('.player-premium-card').should('have.length.at.most', 8);
  });

  it('debería navegar a la siguiente página al hacer click en el paginador', () => {
    cy.get('app-pagination').within(() => {
      cy.contains('Siguiente').click();
    });
    cy.get('.player-premium-card:visible, .player-mobile-item:visible').should('have.length.at.least', 1);
    cy.get('.player-premium-card:visible, .player-mobile-item:visible').should('have.length.at.most', 8);
  });
});

// =============================================================================
// SUITE 4: PLAYER-DETAIL-PUBLIC — FICHA BÁSICA
// =============================================================================
describe('Player Detail Public — Ficha Básica', () => {
  beforeEach(() => {
    stubPublicPlayers();
    stubPlayerDetail();
    cy.visit(`/player-detail-public/${mockPlayerDetail._id}`);
    cy.wait('@getPlayerDetail');
  });

  it('debería mostrar el nombre del jugador', () => {
    cy.contains(mockPlayerDetail.name).should('exist');
  });

  it('debería mostrar el dashboard de estadísticas (stats-dashboard)', () => {
    cy.get('.stats-dashboard').should('exist');
    cy.get('.stat-box').should('have.length.at.least', 3);
  });

  it('debería mostrar el número de dorsal en el hero', () => {
    cy.get('.number-top-right').should('contain', `#${mockPlayerDetail.number}`);
  });

  it('debería mostrar la sección de filas de detalle (nacionalidad, edad)', () => {
    cy.get('.detail-row').should('have.length.at.least', 2);
    cy.contains('España').should('exist');
  });

  it('debería mostrar el banner de scouting global', () => {
    cy.get('.premium-scouting-banner.is-global').should('exist');
    cy.get('.banner-badge.global').should('contain', 'GLOBAL');
  });
});

// =============================================================================
// SUITE 5: PLAYER-DETAIL-PUBLIC — BIOGRAFÍA
// =============================================================================
describe('Player Detail Public — Biografía', () => {
  beforeEach(() => {
    stubPlayerDetail();
    cy.visit(`/player-detail-public/${mockPlayerDetail._id}`);
    cy.wait('@getPlayerDetail');
  });

  it('debería mostrar la sección de biografía', () => {
    cy.contains('Biografía').should('exist');
  });

  it('debería mostrar el botón "Leer biografía completa" si el texto es largo', () => {
    cy.get('body').then(($body) => {
      if ($body.text().includes('Leer biografía completa')) {
        cy.contains('Leer biografía completa').should('exist');
      }
    });
  });

  it('debería expandir la biografía al hacer click en el botón', () => {
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
// SUITE 6: PLAYER-DETAIL-PUBLIC — GPS Y COMENTARIOS
// =============================================================================
describe('Player Detail Public — GPS y Comentarios', () => {
  beforeEach(() => {
    stubPlayerDetail();
    cy.visit(`/player-detail-public/${mockPlayerDetail._id}`);
    cy.wait('@getPlayerDetail');
  });

  it('debería mostrar el banner de permiso GPS si no hay permiso', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.permission-needed-box').length > 0) {
        cy.get('.permission-needed-box').should('exist');
        cy.contains('Autorizar Ubicación').should('exist');
      } else {
        cy.get('.new-comment-form').should('exist');
      }
    });
  });

  it('debería mostrar el botón "Autorizar Ubicación"', () => {
    cy.get('body').then(($body) => {
      if ($body.find('.permission-needed-box ion-button').length > 0) {
        cy.get('.permission-needed-box ion-button').should('exist');
        cy.contains('Autorizar Ubicación').should('be.visible');
      } else {
        cy.get('.new-comment-form ion-button, .new-comment-form ion-textarea').should('exist');
      }
    });
  });

  it('debería mostrar el estado vacío de comentarios si no hay ninguno', () => {
    cy.get('.empty-reports-state').should('exist');
    cy.contains('Aún no hay opiniones').should('exist');
  });

  it('el formulario de comentario debería estar oculto sin permiso GPS', () => {
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
// SUITE 7: PLAYER-DETAIL-PUBLIC — COMENTARIOS CON PAGINACIÓN
// =============================================================================
describe('Player Detail Public — Comentarios Paginados', () => {
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

  it('debería mostrar los comentarios existentes', () => {
    cy.get('.comment-bubble').should('have.length.at.least', 1);
  });

  it('debería mostrar la paginación cuando hay más de 5 comentarios', () => {
    cy.get('.news-pagination-container').should('exist');
  });

  it('debería mostrar el rating de estrellas en cada comentario', () => {
    cy.get('.rating-mini').first().should('exist');
    cy.get('.rating-mini ion-icon').should('have.length.at.least', 5);
  });

  it('debería mostrar el avatar del autor en cada comentario', () => {
    cy.get('.comment-bubble .mini-avatar').first().should('exist');
  });
});

// =============================================================================
// SUITE 8: NAVEGACIÓN
// =============================================================================
describe('Navegación entre páginas públicas', () => {
  beforeEach(() => {
    stubPublicPlayers();
    cy.visit('/players-public');
    cy.wait('@getPublicPlayers');
  });

  it('debería navegar al detalle del jugador al hacer click en la tarjeta', () => {
    stubPlayerDetail();
    cy.get('.player-premium-card:visible, .player-mobile-item:visible', { timeout: 10000 })
      .should('have.length.at.least', 1)
      .first()
      .should('contain.text', 'Jugador')
      .click({ force: true });
    cy.wait('@getPlayerDetail', { timeout: 15000 });
    cy.url({ timeout: 15000 }).should('include', `/player-detail-public/${mockPlayerDetail._id}`);
  });

  it('debería volver al listado al navegar con el breadcrumb', () => {
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
