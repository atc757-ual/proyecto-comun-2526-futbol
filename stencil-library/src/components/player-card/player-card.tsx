import { Component, Prop, h } from '@stencil/core';

const FALLBACK_AVATAR = 'data:image/svg+xml;base64,' + btoa(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
  '<rect width="100" height="100" fill="#e2e8f0"/>' +
  '<circle cx="50" cy="34" r="20" fill="#94a3b8"/>' +
  '<path d="M8 95 Q8 62 50 62 Q92 62 92 95Z" fill="#94a3b8"/>' +
  '</svg>'
);

@Component({
  tag: 'player-card',
  styleUrl: 'player-card.css',
  shadow: true,
})
export class PlayerCard {
  @Prop() firstname: string;
  @Prop() lastname: string;
  @Prop() photo: string;
  @Prop() age: number;
  @Prop() nationality: string;
  @Prop() height: string;
  @Prop() weight: string;
  @Prop() number: number;
  @Prop() position: string;
  @Prop() birthPlace: string;

  render() {
    return (
      <div class="player-card-container">
        <div class="header-accent">
          {this.number && <div class="player-number">#{this.number}</div>}
        </div>
        
        <div class="card-body">
          <div class="photo-wrapper">
            <img src={this.photo || FALLBACK_AVATAR} alt={this.firstname} onError={(e: any) => { e.target.onerror = null; e.target.src = FALLBACK_AVATAR; }} />
          </div>
          
          <div class="player-info">
            <h2 class="player-name">{this.firstname}</h2>
            <p class="player-lastname">{this.lastname}</p>
            
            <div class="player-meta">
              <span class="position-badge">{this.position}</span>
              <span class="nationality-text">{this.nationality}</span>
            </div>

            <div class="stats-grid">
              <div class="stat-item">
                <span class="stat-label">Edad</span>
                <span class="stat-value">{this.age}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Altura</span>
                <span class="stat-value">{this.height}cm</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Peso</span>
                <span class="stat-value">{this.weight}kg</span>
              </div>
            </div>
            
            <div class="extra-info">
              <div class="info-row">
                <span class="label">Lugar de Nacimiento:</span>
                <span class="value">{this.birthPlace}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
