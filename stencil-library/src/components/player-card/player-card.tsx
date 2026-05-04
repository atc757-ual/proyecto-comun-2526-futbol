import { Component, Prop, h } from '@stencil/core';

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
            <img src={this.photo} alt={this.firstname} />
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
