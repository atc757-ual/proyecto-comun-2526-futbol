import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import Shepherd, { Tour } from 'shepherd.js';
import { PlatformService } from '../system/platform.service';

const TOUR_KEY = 'fc_tour_v1_done';

interface TourStepDef {
  tabId: string;
  title: string;
  text: string;
}

const TOUR_STEPS: TourStepDef[] = [
  {
    tabId: 'home',
    title: 'Inicio',
    text: 'Tu punto de partida. Aquí verás marcadores en directo, las últimas noticias y el estado de tu plantilla de un vistazo.'
  },
  {
    tabId: 'players',
    title: 'Mi Plantilla',
    text: 'Gestiona tus jugadores. Añade nuevos talentos manualmente o impórtalos desde la base de datos global de fútbol.'
  },
  {
    tabId: 'ai-team',
    title: '✨ Fútbol AI',
    text: 'Potencia tu scouting con inteligencia artificial. Genera informes, analiza tu plantilla y toma decisiones con datos reales.'
  },
  {
    tabId: 'busqueda',
    title: 'Búsqueda Global',
    text: 'Explora millones de jugadores de todo el mundo. Filtra por posición, liga, país y más para encontrar tu próximo fichaje.'
  },
  {
    tabId: 'news',
    title: 'Noticias',
    text: 'Las últimas noticias del fútbol mundial, actualizadas en tiempo real para que no te pierdas nada relevante.'
  }
];

@Injectable({ providedIn: 'root' })
export class TourService {
  private tour: Tour | null = null;
  private readonly platformService = inject(PlatformService);
  readonly tourDone$ = new Subject<void>();

  isTourDone(): boolean {
    return !!localStorage.getItem(TOUR_KEY);
  }

  startIfFirstTime(): void {
    if (!this.platformService.isMobileApp) return;
    if (localStorage.getItem(TOUR_KEY)) return;
    setTimeout(() => this.start(), 700);
  }

  /** Elimina la marca de "ya visto" y lanza el tour inmediatamente */
  forceStart(): void {
    if (!this.platformService.isMobileApp) return;
    localStorage.removeItem(TOUR_KEY);
    setTimeout(() => this.start(), 700);
  }

  resetTour(): void {
    localStorage.removeItem(TOUR_KEY);
  }

  private start(): void {
    this.tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'fc-shepherd-step',
        cancelIcon: { enabled: true },
        scrollTo: false,
        modalOverlayOpeningRadius: 8,
        modalOverlayOpeningPadding: 2
      }
    });

    const total = TOUR_STEPS.length;

    TOUR_STEPS.forEach((step, i) => {
      const isLast = i === total - 1;
      const el = document.getElementById(`tab-${step.tabId}`);

      const isFirst = i === 0;

      this.tour!.addStep({
        id: step.tabId,
        title: step.title,
        text: `<p class="tour-step-text">${step.text}</p>`,
        ...(el ? { attachTo: { element: `#tab-${step.tabId}`, on: 'top' } } : {}),
        buttons: [
          {
            text: 'Anterior',
            action: () => this.tour!.back(),
            classes: `shepherd-btn-back${isFirst ? ' is-hidden' : ''}`
          },
          {
            text: `${i + 1} / ${total}`,
            action: () => {},
            classes: 'shepherd-btn-count'
          },
          {
            text: isLast ? '¡Listo! 🎉' : 'Siguiente',
            action: () => isLast ? this.tour!.complete() : this.tour!.next(),
            classes: 'shepherd-btn-next'
          }
        ]
      });
    });

    const CARD_WIDTH = 300;
    const MARGIN = 10;

    this.tour.on('show', (event: any) => {
      const stepId: string = event?.step?.id ?? '';
      const stepIndex = TOUR_STEPS.findIndex(s => s.tabId === stepId);
      if (stepIndex === -1) return;
      requestAnimationFrame(() => {
        const screenWidth = window.innerWidth;
        const cardW = Math.min(CARD_WIDTH, screenWidth - MARGIN * 2);
        const range = screenWidth - cardW - MARGIN * 2;
        const left = MARGIN + Math.round((range / (total - 1)) * stepIndex);

        // Triángulo apunta al centro del tab real
        const TRIANGLE_HALF = 10;
        let triangleLeft = Math.round(cardW / 2) - TRIANGLE_HALF; // fallback: centro
        const tabEl = document.getElementById(`tab-${TOUR_STEPS[stepIndex].tabId}`);
        if (tabEl) {
          const rect = tabEl.getBoundingClientRect();
          const tabCenter = rect.left + rect.width / 2;
          const raw = Math.round(tabCenter - left - TRIANGLE_HALF);
          triangleLeft = Math.max(12, Math.min(cardW - TRIANGLE_HALF * 2 - 12, raw));
        }

        this.setTourLeft(left, triangleLeft);
        this.disableCurrentTab();
      });
    });

    this.tour.on('complete', () => { this.cleanTourStyle(); this.enableAllTabs(); this.markDone(); });
    this.tour.on('cancel',   () => { this.cleanTourStyle(); this.enableAllTabs(); this.markDone(); });
    this.tour.start();
  }

  private disableCurrentTab(): void {
    TOUR_STEPS.forEach(s => {
      const el = document.getElementById(`tab-${s.tabId}`);
      if (el) el.style.pointerEvents = 'none';
    });
  }

  private enableAllTabs(): void {
    TOUR_STEPS.forEach(s => {
      const el = document.getElementById(`tab-${s.tabId}`);
      if (el) el.style.pointerEvents = '';
    });
  }

  private setTourLeft(left: number, triangleLeft: number): void {
    let el = document.getElementById('fc-tour-pos') as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement('style');
      el.id = 'fc-tour-pos';
      document.head.appendChild(el);
    }
    el.textContent = `
      .shepherd-element.fc-shepherd-step { left: ${left}px !important; right: auto !important; }
      .shepherd-element.fc-shepherd-step::after { left: ${triangleLeft}px !important; transform: none !important; }
    `;
  }

  private cleanTourStyle(): void {
    document.getElementById('fc-tour-pos')?.remove();
  }

  private markDone(): void {
    localStorage.setItem(TOUR_KEY, '1');
    this.tour = null;
    this.tourDone$.next();
  }
}
