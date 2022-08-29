import { Component, Input, OnInit } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { DadosService, Nota } from '../servicos/dados.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.page.html',
  styleUrls: ['./modal.page.scss'],
})
export class ModalPage implements OnInit {
  @Input() id: string;
  nota: Nota = null;

  constructor(
    private dados: DadosService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
  ) { }

  ngOnInit() {
    this.dados.getNotaPorId(this.id).subscribe(res => {
      this.nota = res;
    });
  }

  async apagarNota() {
    await this.dados.apagarNota(this.nota);
    this.modalCtrl.dismiss();
  }

  async atualizarNota() {
    await this.dados.atualizarNota(this.nota);
    const toast = await this.toastCtrl.create({
      message: 'Nota atualizada!.',
      duration: 2000
    });
    toast.present();
  }

}
