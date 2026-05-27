import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';

const FALLBACK_AVATAR = 'data:image/svg+xml;base64,' + btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
  '<rect width="100" height="100" fill="#e2e8f0"/>' +
  '<circle cx="50" cy="34" r="20" fill="#94a3b8"/>' +
  '<path d="M8 95 Q8 62 50 62 Q92 62 92 95Z" fill="#94a3b8"/>' +
  '</svg>'
);

@Component({
  tag: 'player-list',
  styleUrl: 'player-list.css',
  shadow: true,
})
export class PlayerList {
  /**
   * List of players as a JSON string
   */
  @Prop() players: string = '[]';

  /**
   * Title of the widget
   */
  @Prop() widgetTitle: string = 'Mis Jugadores';

  /**
   * Event emitted when a player is clicked
   */
  @Event() playerClicked: EventEmitter<any>;

  /**
   * Event emitted when "Ver más" is clicked
   */
  @Event() viewMoreClicked: EventEmitter<void>;

  private parsePlayers() {
    try {
      return JSON.parse(this.players);
    } catch (e) {
      return [];
    }
  }

  render() {
    const allPlayers = this.parsePlayers();
    const displayPlayers = allPlayers.slice(0, 4);
    const hasMore = allPlayers.length > 4;

    return (
      <div class="player-list-widget">
        <div class="widget-header">
          <div class="header-main">
            <h3>{this.widgetTitle}</h3>
            <span class="stencil-tag">Stencil</span>
          </div>
          <span class="count-badge">{allPlayers.length}</span>
        </div>

        <div class="players-container">
          {displayPlayers.map((player) => (
            <div class="player-row clickable" onClick={() => this.playerClicked.emit(player)}>
              <div class="player-avatar">
                <img src={player.image_url || FALLBACK_AVATAR} alt={player.name} onError={(e: any) => { e.target.onerror = null; e.target.src = FALLBACK_AVATAR; }} />
              </div>
              <div class="player-info">
                <span class="player-name">{player.name}</span>
                <span class="player-team">{player.team}</span>
              </div>
              <div class="player-position">
                {player.position}
              </div>
            </div>
          ))}
        </div>

        {hasMore && (
          <div class="widget-footer">
            <button class="view-more-btn" onClick={() => this.viewMoreClicked.emit()}>
              Ver todos mis jugadores
            </button>
          </div>
        )}
      </div>
    );
  }
}
