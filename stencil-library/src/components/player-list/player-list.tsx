import { Component, Prop, Event, EventEmitter, h } from '@stencil/core';

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
                <img src={player.image_url || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iODAwIiB2aWV3Qm94PSIwIDAgODAwIDgwMCI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI4MDAiIGZpbGw9IiNlMmU4ZjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSwgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZvbnQtc2l6ZT0iODAiIGZpbGw9IiM0NzU1NjkiPjQwNDwvdGV4dD48L3N2Zz4='} alt={player.name} onError={(e: any) => { e.target.onerror = null; e.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4MDAiIGhlaWdodD0iODAwIiB2aWV3Qm94PSIwIDAgODAwIDgwMCI+PHJlY3Qgd2lkdGg9IjgwMCIgaGVpZ2h0PSI4MDAiIGZpbGw9IiNlMmU4ZjAiLz48dGV4dCB4PSI1MCUiIHk9IjUwJSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZm9udC1mYW1pbHk9InN5c3RlbS11aSwgc2Fucy1zZXJpZiIgZm9udC13ZWlnaHQ9ImJvbGQiIGZvbnQtc2l6ZT0iODAiIGZpbGw9IiM0NzU1NjkiPjQwNDwvdGV4dD48L3N2Zz4='; }} />
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
