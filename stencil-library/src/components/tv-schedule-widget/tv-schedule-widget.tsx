import { Component, Host, h, Prop, State, Watch } from '@stencil/core';

@Component({
  tag: 'tv-schedule-widget',
  styleUrl: 'tv-schedule-widget.css',
  shadow: true,
})
export class TvScheduleWidget {
  @Prop() schedule: string = '[]';
  @Prop() widgetTitle: string = 'Partidos de los próximos días';

  @State() groupedEvents: { [date: string]: { [logo: string]: any[] } } = {};
  @State() dates: string[] = [];
  @State() selectedDateIndex: number = 0;

  componentWillLoad() {
    this.processData(this.schedule);
  }

  @Watch('schedule')
  handleScheduleChange(newValue: string) {
    this.processData(newValue);
  }

  processData(dataString: string) {
    try {
      const events = JSON.parse(dataString || '[]');
      const groups: { [date: string]: { [logo: string]: any[] } } = {};
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = now.toTimeString().split(' ')[0];

      // Filtramos para no mostrar días pasados
      const filteredEvents = events.filter(event => event.dateEvent >= todayStr);

      filteredEvents.forEach(event => {
        const date = event.dateEvent;
        const logo = event.strLogo || 'default-logo'; // Fallback if no logo
        
        if (!groups[date]) groups[date] = {};
        if (!groups[date][logo]) groups[date][logo] = [];
        
        // Determinar si ya se jugó
        const isPlayed = date < todayStr || (date === todayStr && (event.strTime || '00:00:00') < currentTimeStr);
        
        // Evitar duplicados exactos en el mismo canal
        const eventKey = `${event.strEvent}_${event.strTime}`;
        const exists = groups[date][logo].some(e => `${e.strEvent}_${e.strTime}` === eventKey);

        if (!exists) {
          groups[date][logo].push({ 
            ...event, 
            isPlayed
          });
        }
      });

      // Ordenar partidos por hora dentro de cada canal
      Object.keys(groups).forEach(date => {
        Object.keys(groups[date]).forEach(logo => {
          groups[date][logo].sort((a, b) => (a.strTime || '').localeCompare(b.strTime || ''));
        });
      });

      this.dates = Object.keys(groups).sort();
      this.groupedEvents = groups;
      this.selectedDateIndex = 0;
    } catch (e) {
      console.error('Error parsing schedule in tv-schedule-widget', e);
    }
  }

  renderEventName(name: string) {
    if (!name) return '';
    const parts = name.split(/\s+vs\s+/i);
    if (parts.length === 2) {
      return (
        <div class="event-title-split">
          <span class="team-name">{parts[0]}</span>
          <span class="vs-text">vs</span>
          <span class="team-name">{parts[1]}</span>
        </div>
      );
    }
    return <span class="event-title">{name}</span>;
  }

  nextDate() {
    if (this.selectedDateIndex < this.dates.length - 1) {
      this.selectedDateIndex++;
    }
  }

  prevDate() {
    if (this.selectedDateIndex > 0) {
      this.selectedDateIndex--;
    }
  }

  formatDate(dateStr: string) {
    const options: any = { weekday: 'long', day: 'numeric', month: 'long' };
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', options);
  }

  render() {
    const currentDate = this.dates[this.selectedDateIndex];
    const channels = this.groupedEvents[currentDate] || {};
    const channelLogos = Object.keys(channels);

    return (
      <Host>
        <div class="widget-container">
          <div class="widget-header">
            <div class="title-row">
              <h3>{this.widgetTitle}</h3>
              <span class="stencil-tag">Stencil</span>
            </div>
            
            {this.dates.length > 0 && (
              <div class="date-navigator">
                <button 
                  class="nav-btn" 
                  disabled={this.selectedDateIndex === 0} 
                  onClick={() => this.prevDate()}
                >
                  <span class="icon">❮</span>
                </button>
                <div class="date-display">
                  <span class="date-text">{this.formatDate(currentDate)}</span>
                </div>
                <button 
                  class="nav-btn" 
                  disabled={this.selectedDateIndex === this.dates.length - 1} 
                  onClick={() => this.nextDate()}
                >
                  <span class="icon">❯</span>
                </button>
              </div>
            )}
          </div>

          <div class="channels-compact-list">
            {channelLogos.length > 0 ? (
              channelLogos.map(logo => (
                <div class="channel-group-v2 animate-in">
                  <div class="channel-header-mini">
                    <div class="logo-dark-bg">
                      {logo !== 'default-logo' ? (
                        <img src={logo} class="channel-logo-corner" alt="Canal" />
                      ) : (
                        <ion-icon name="tv-outline" class="fallback-icon-mini"></ion-icon>
                      )}
                    </div>
                    <span class="channel-label">{channels[logo][0].strChannel || 'Televisión'}</span>
                  </div>
                  
                  <div class="matches-stack">
                    {channels[logo].map(event => (
                      <div class={`match-entry-v2 ${event.isPlayed ? 'is-played' : ''}`}>
                        <span class="entry-time">{event.strTime?.substring(0, 5) || '00:00'}</span>
                        <div class="entry-details">
                          {this.renderEventName(event.strEvent)}
                        </div>
                        <span class="entry-league">{event.strLeague}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div class="no-events-container">
                <div class="no-events-icon">📅</div>
                <p>No hay partidos programados</p>
              </div>
            )}
          </div>
        </div>
      </Host>
    );
  }
}
