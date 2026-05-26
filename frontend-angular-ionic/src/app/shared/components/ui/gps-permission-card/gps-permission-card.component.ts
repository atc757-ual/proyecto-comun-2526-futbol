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
  templateUrl: './gps-permission-card.component.html',
  styleUrls: ['./gps-permission-card.component.scss']
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
