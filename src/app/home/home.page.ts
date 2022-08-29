import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular';
import { ModalPage } from '../modal/modal.page';
import { AuthService } from '../servicos/auth.service';
import { DadosService, Nota } from '../servicos/dados.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage {
  notas: Nota[] = [];

  constructor(
    private dados: DadosService,
    private cd: ChangeDetectorRef,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    private auth: AuthService,
    private roteador: Router,
  ) {
    this.dados.getNotas().subscribe(res => {
      this.notas = res;
      this.cd.detectChanges();
    });
  }

  async logout() {
    await this.auth.logout();
    this.roteador.navigateByUrl('/', { replaceUrl: true });
  }
  async addNota() {
    const alert = await this.alertCtrl.create({
      header: 'Nova nota',
      inputs: [
        {
          name: 'titulo',
          placeholder: 'Minha nota',
          type: 'text'
        },
        {
          name: 'texto',
          placeholder: 'Digite aqui sua nota',
          type: 'textarea'
        }
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        }, {
          text: 'Adicionar',
          handler: res => {
            this.dados.addNota({ texto: res.texto, titulo: res.titulo });
          }
        }
      ]
    });

    await alert.present();
  }

  async abrirNota(nota: Nota) {
    const modal = await this.modalCtrl.create({
      component: ModalPage,
      componentProps: { id: nota.id },
      breakpoints: [0, 0.5, 0.8],
      initialBreakpoint: 0.8
    });

    await modal.present();
  }

}
