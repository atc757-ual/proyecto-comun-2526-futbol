import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalController, IonIcon, IonButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  closeOutline, alertCircleOutline, logOutOutline, trashOutline, checkmarkCircleOutline,
  warningOutline, informationCircleOutline, closeCircleOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
  standalone: true,
  imports: [CommonModule, IonIcon, IonButton]
})
export class ConfirmModalComponent {
  private modalCtrl = inject(ModalController);

  @Input() title: string = 'Confirmar Acción';
  @Input() message: string = '¿Estás seguro de que deseas realizar esta acción?';
  @Input() confirmText: string = 'Confirmar';
  @Input() cancelText: string = '';
  @Input() type: 'alert' | 'logout' | 'error' | 'success' | 'warning' | 'delete' | 'info' = 'info';

  constructor() {

    addIcons({
      checkmarkCircleOutline,
      alertCircleOutline,
      logOutOutline,
      trashOutline,
      closeOutline,
      warningOutline,
      informationCircleOutline,
      closeCircleOutline
    });
  }

  dismiss(confirmed: boolean) {
    this.modalCtrl.dismiss(confirmed);
  }
}
