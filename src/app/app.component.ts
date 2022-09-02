import { Component } from '@angular/core';
import { NotificacoesService } from './servicos/notificacoes.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent {
  constructor(public pushNotifications: NotificacoesService) {
    this.pushNotifications.initPush();
  }
}
