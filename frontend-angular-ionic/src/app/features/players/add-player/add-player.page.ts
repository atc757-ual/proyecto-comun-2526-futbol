import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController, NavController } from '@ionic/angular';


@Component({
  selector: 'app-add-player',
  templateUrl: './add-player.page.html',
  styleUrls: ['./add-player.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AddPlayerPage implements OnInit {
  playerData = {
    name: '',
    position: 'Delantero',
    team: '',
    rating: 80,
    image: ''
  };

  previewImage: string | null = null;

  constructor(
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private navCtrl: NavController
  ) { }

  ngOnInit() { }

  takePhoto() {
    // Simulación de acceso a cámara
    this.previewImage = 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=200&h=200&auto=format&fit=crop';
    this.playerData.image = this.previewImage;
  }

  async onSave() {
    if (!this.playerData.name || !this.playerData.team) {
      const toast = await this.toastCtrl.create({
        message: 'Por favor, completa todos los campos obligatorios',
        duration: 2000,
        color: 'warning',
        mode: 'ios'
      });
      toast.present();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Guardando jugador...',
      mode: 'ios'
    });
    await loading.present();

    setTimeout(async () => {
      loading.dismiss();
      const toast = await this.toastCtrl.create({
        message: 'Jugador guardado correctamente',
        duration: 2000,
        color: 'success',
        mode: 'ios'
      });
      toast.present();
      this.navCtrl.back();
    }, 1500);
  }
}
