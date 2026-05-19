import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonButton, IonLabel, IonSpinner } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  navigateCircleOutline, navigateOutline, checkmarkCircleOutline
} from 'ionicons/icons';

/**
 * Tarjeta de estado de permiso GPS reutilizable.
 * Muestra el estado actual (verde/rojo) y un botón "Permitir" si no hay permisos.
 * El componente padre sigue siendo propietario del estado; este componente solo lo visualiza.
 */
@Component({
  selector: 'app-gps-permission-card',
  standalone: true,
  imports: [CommonModule, IonIcon, IonButton, IonLabel, IonSpinner],
  template: `
    <div *ngIf="!isChecking"
         class="permission-item-row mb-base animate-fade-in"
         [class.bg-permission-active]="hasPermission"
         [class.bg-permission-denied]="!hasPermission">

      <!-- Icono de estado -->
      <ion-icon *ngIf="hasPermission"
        name="navigate-circle-outline"
        class="fs-30 text-success pulse-animation">
      </ion-icon>
      <ion-icon *ngIf="!hasPermission"
        name="navigate-outline"
        class="fs-30 text-error">
      </ion-icon>

      <!-- Textos -->
      <ion-label class="text-neutral-8">
        <h3 class="f-bold" [class]="titleClass">
          {{ hasPermission ? 'Ubicación compartida' : 'Ubicación no compartida' }}
        </h3>
        <p [class]="subtitleClass">
          {{ hasPermission ? 'Se adjuntará a los fichajes.' : 'Permisos necesarios.' }}
        </p>
      </ion-label>

      <!-- Acción -->
      <div class="d-flex ai-center jc-end ml-auto">
        <ion-button *ngIf="!hasPermission"
          mode="ios" size="small" fill="solid" shape="round"
          class="btn-white-error"
          [disabled]="isCapturing"
          (click)="requestPermission.emit()">
          <ion-spinner *ngIf="isCapturing" name="crescent" slot="start"></ion-spinner>
          <span *ngIf="!isCapturing">Permitir</span>
        </ion-button>
        <ion-icon *ngIf="hasPermission"
          name="checkmark-circle-outline"
          class="fs-28 text-success">
        </ion-icon>
      </div>
    </div>
  `,
  styles: [`
    .permission-item-row {
      background: var(--color-neutral-1);
      border-radius: var(--border-radius-soft);
      border: 1px solid var(--color-neutral-2);
      transition: all 0.3s ease;
      padding: var(--space-s);
      display: flex;
      align-items: center;
      gap: 12px;

      &.bg-permission-active {
        background: var(--color-success-010);
        border-color: var(--color-success-100);
      }

      &.bg-permission-denied {
        background: var(--red-010);
        border-color: var(--red-050);
      }

      &.bg-permission-info {
        background: var(--blue-primary-010);
        border-color: var(--color-primary);
      }

      ion-label { flex: 1; min-width: 0; }
    }

    .pulse-animation {
      animation: pulse-ring 2s infinite ease-in-out;
    }

    @keyframes pulse-ring {
      0%   { transform: scale(0.9); filter: drop-shadow(0 0 0 rgba(56,128,255,0.7)); }
      70%  { transform: scale(1.1); filter: drop-shadow(0 0 12px rgba(56,128,255,0)); }
      100% { transform: scale(0.9); filter: drop-shadow(0 0 0 rgba(56,128,255,0)); }
    }
  `]
})
export class GpsPermissionCardComponent {
  /** true cuando aún se está consultando el estado del permiso (oculta la tarjeta) */
  @Input() isChecking: boolean = true;
  /** true si el permiso de geolocalización está concedido */
  @Input() hasPermission: boolean = false;
  /** true mientras se está capturando la ubicación (muestra spinner) */
  @Input() isCapturing: boolean = false;
  /** Clases CSS para el título (permite adaptar tamaño de fuente por contexto) */
  @Input() titleClass: string = 'fs-14';
  /** Clases CSS para el subtítulo */
  @Input() subtitleClass: string = 'fs-12';

  /** Emite cuando el usuario pulsa el botón "Permitir" */
  @Output() requestPermission = new EventEmitter<void>();

  constructor() {
    addIcons({ navigateCircleOutline, navigateOutline, checkmarkCircleOutline });
  }
}
