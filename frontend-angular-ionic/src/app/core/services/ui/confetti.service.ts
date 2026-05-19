import { Injectable } from '@angular/core';
import confetti from 'canvas-confetti';

@Injectable({
  providedIn: 'root'
})
export class ConfettiService {

  constructor() { }

  /**
   * Dispara el efecto de confeti (La Chaya)
   */
  celebrate() {
    const duration = 3 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#004d99', '#ffffff', '#db0011'] // Colores futboleros (Azul, Blanco, Rojo)
      });
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#004d99', '#ffffff', '#db0011']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    
    frame();
  }

  /**
   * Celebración Dorada Premium
   */
  goldCelebrate() {
    const duration = 2 * 1000;
    const end = Date.now() + duration;
    const goldColors = ['#FFD700', '#FDB931', '#FFCC00', '#FFF700', '#D4AF37'];

    const frame = () => {
      confetti({
        particleCount: 15,
        angle: 60,
        spread: 80,
        origin: { x: 0, y: 0.6 },
        colors: goldColors,
        zIndex: 9999
      });
      confetti({
        particleCount: 15,
        angle: 120,
        spread: 80,
        origin: { x: 1, y: 0.6 },
        colors: goldColors,
        zIndex: 9999
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();
  }

  /**
   * Disparo único central
   */
  cannon() {
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#004d99', '#ffffff', '#db0011']
    });
  }

  /**
   * Cañonazo Dorado
   */
  goldCannon() {
    confetti({
      particleCount: 200,
      spread: 80,
      origin: { y: 0.7 },
      colors: ['#FFD700', '#FDB931', '#FFCC00', '#FFF700', '#D4AF37']
    });
  }
}
