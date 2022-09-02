import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

@Injectable({
  providedIn: 'root'
})
export class NotificacoesService {

  constructor() { }

  initPush() {
    if (Capacitor.getPlatform() !== 'web') {
      this.registerPush();
    }
  }

  private registerPush() {
    PushNotifications.requestPermissions().then(permissao => {
      if (permissao.receive === 'granted') {
        PushNotifications.register();
      }
    });

    PushNotifications.addListener('registration', (token) => {
      console.log(token);
    });

    PushNotifications.addListener('registrationError', (err) => {
      console.error(err);
    });

    PushNotifications.addListener('pushNotificationReceived', (notifications) => {
      console.log(notifications);
    });
  }
}
