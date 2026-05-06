import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController, LoadingController, NavController } from '@ionic/angular';

@Component({
  selector: 'app-news-management',
  templateUrl: './news-management.page.html',
  styleUrls: ['./news-management.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class NewsManagementPage implements OnInit {
  newsData = {
    title: '',
    category: 'Fútbol',
    author: 'Admin Alex',
    content: '',
    image: ''
  };

  constructor(
    private toastCtrl: ToastController,
    private loadingCtrl: LoadingController,
    private navCtrl: NavController
  ) { }

  ngOnInit() { }

  async onPublish() {
    if (!this.newsData.title || !this.newsData.content) {
      const toast = await this.toastCtrl.create({
        message: 'Por favor, completa el título y el contenido',
        duration: 2000,
        color: 'warning',
        mode: 'ios'
      });
      toast.present();
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Publicando en servidor CORBA...',
      mode: 'ios'
    });
    await loading.present();

    setTimeout(async () => {
      loading.dismiss();
      const toast = await this.toastCtrl.create({
        message: 'Noticia publicada con éxito',
        duration: 2000,
        color: 'success',
        mode: 'ios'
      });
      toast.present();
      this.navCtrl.back();
    }, 2000);
  }
}
