import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-ai-team',
  templateUrl: './ai-team.page.html',
  styleUrls: ['./ai-team.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class AiTeamPage implements OnInit {
  isGenerating: boolean = false;
  idealTeam: any[] | null = null;
  aiReasoning: string = '';

  constructor(private loadingCtrl: LoadingController) { }

  ngOnInit() { }

  async generateTeam() {
    this.isGenerating = true;
    const loading = await this.loadingCtrl.create({
      message: 'Analizando estadísticas con Google AI Studio...',
      spinner: 'dots',
      mode: 'ios',
      cssClass: 'ai-loading'
    });
    await loading.present();

    // Simulación de respuesta de LLM
    setTimeout(() => {
      this.idealTeam = [
        { pos: 'POR', name: 'Courtois', score: 90 },
        { pos: 'DEF', name: 'Militao', score: 88 },
        { pos: 'DEF', name: 'Rüdiger', score: 87 },
        { pos: 'MED', name: 'Bellingham', score: 92 },
        { pos: 'MED', name: 'Valverde', score: 89 },
        { pos: 'DEL', name: 'Mbappé', score: 94 },
        { pos: 'DEL', name: 'Vinícius', score: 93 }
      ];
      this.aiReasoning = 'He seleccionado esta alineación basándome en la sinergia táctica entre Mbappé y Vinícius en el frente de ataque, apoyados por un centro del campo con gran despliegue físico.';
      this.isGenerating = false;
      loading.dismiss();
    }, 3000);
  }
}
