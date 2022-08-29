import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController } from '@ionic/angular';
import { AuthService } from '../servicos/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage implements OnInit {
  credenciais: FormGroup;

  constructor(
    private fb: FormBuilder,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private auth: AuthService,
    private roteador: Router
  ) { }

  get email() {
    return this.credenciais.get('email');
  }

  get senha() {
    return this.credenciais.get('senha');
  }

  ngOnInit() {
    this.credenciais = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      senha: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  async registrar() {
    const loading = await this.loadingCtrl.create();
    await loading.present()

    const usuario = await this.auth.registro(this.credenciais.value);
    await loading.dismiss();

    if (usuario) {
      this.roteador.navigateByUrl('/home', { replaceUrl: true });
    } else {
      this.showAlert('Falha no login', 'Tente novamente!');
    }
  }

  async login() {
    const loading = await this.loadingCtrl.create();
    await loading.present();

    const usuario = await this.auth.login(this.credenciais.value);
    await loading.dismiss();

    if (usuario) {
      this.roteador.navigateByUrl('/home', { replaceUrl: true });
    } else {
      this.showAlert('Falha no login', 'Tente novamente!');
    }
  }

  async GoogleLogin() {
    const loading = await this.loadingCtrl.create();
    await loading.present();
    const usuario = await this.auth.loginGoogle();
    await loading.dismiss();

    if (usuario) {
      this.roteador.navigateByUrl('/home', { replaceUrl: true });
    } else {
      this.showAlert('Falha no login', 'Tente novamente!');
    }
  }
  async showAlert(cabecalho, mensagem) {
    const alert = await this.alertCtrl.create({
      header: cabecalho,
      message: mensagem,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
