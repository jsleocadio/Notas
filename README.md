# Creating the Firebase Project

Before we dive into the Ionic app, we need to make sure we actually have a Firebase app configured. If you already got something in place you can of course skip this step.

Otherwise, make sure you are signed up (it’s free) and then hit **Add project** inside the [Firebase console](https://console.firebase.google.com/). Give your new app a name, select a region and then create your project!

Once you have created the project you need to find the web configuration which looks like this:

![image](https://user-images.githubusercontent.com/73944895/187245878-2cec7029-c923-48d7-b1ee-02c43ee38b9e.png)

If it’s a new project, click on the web icon below “**Get started by adding Firebase to your app**” to start a new web app and give it a name, you will see the configuration in the next step now.

Leave this config block open (or copy it already) until our app is ready so we can insert it in our environment!

Additionally we have to enable the database, so select **Firestore Database** from the menu and click **Create database**.

![image](https://user-images.githubusercontent.com/73944895/187247222-d3c33246-509f-4b9e-90eb-1bb2db27bb13.png)

Here we can set the default **security rules** for our database and because this is a simple tutorial we’ll roll with the **test mode** which allows everyone access.

Because we want to work with users we also need to go to the **Authentication** tab, click **Get started** again and activate the **Email/Password** provider. This allows us to create user with a standard email/ps combination.

![image](https://user-images.githubusercontent.com/73944895/187490868-8fa6d73e-e20d-4295-8e9c-96399567241b.png)

# Starting our Ionic App & Firebase Integration

Now we are ready to setup the Ionic app, so generate a new app with an additional page and service for our logic and then use the AngularFire schematic to add all required packages and changes to the project:

```
ionic start ProjectName blank --type=angular --capacitor
cd ./ProjectName
 
# Generate a page and service
ionic g page login
ionic g page modal
ionic g service services/auth
ionic g service services/data

# Install Firebase and AngularFire
ng add @angular/fire
```
The last command is the most important as it starts the AngularFire schematic, which has become a lot more powerful over the years! You should select the according functions that your app needs, in our case select Authentication and Firestore.

![image](https://user-images.githubusercontent.com/73944895/187491615-5b81d564-49c4-4619-938d-a1e051a2c9ad.png)

After that a browser will open to log in with Google, which hopefully reads your list of **Firebase apps so you can select the Firebase project and app your created in the beginning!**

As a result the schematic will automatically fill your **environments/environment.ts** file – if not make sure you manually add the Firebase configuration from the first step like this:

```
export const environment = {
  production: false,
  firebase: {
    apiKey: "",
    authDomain: "",
    projectId: "",
    storageBucket: "",
    messagingSenderId: "",
    appId: ""
  }
};
```

On top of that the schematic injected everything necessary into our **src/app/app.module.ts** using the new Firebase 9 modular approach:

```
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { initializeApp,provideFirebaseApp } from '@angular/fire/app';
import { environment } from '../environments/environment';
import { provideAuth,getAuth } from '@angular/fire/auth';
import { provideFirestore,getFirestore } from '@angular/fire/firestore';

@NgModule({
  declarations: [AppComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, 
    provideFirebaseApp(() => initializeApp(environment.firebase)), 
    provideAuth(() => getAuth()), 
    provideFirestore(() => getFirestore())],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }],
  bootstrap: [AppComponent],
})
export class AppModule {}
```
Again, if the schematic failed for some reason that’s how your module should look like before you continue!

Now we can also quickly touch the routing of our app to display the login page as the first page, and use the default home page for the inside area.

We don’t have authentication implemented yet, but we can already use the [AngularFire auth guards](https://github.com/angular/angularfire/blob/master/docs/auth/router-guards.md) in two cool ways:

* Protect access to “inside” pages by redirecting unauthorized users to the login
* Preventing access to the login page for previously authenticated users, so they are automatically forwarded to the “inside” area of the app

This is done with the helping pipes and services of AngularFire that you can now add inside the **src/app/app-routing.module.ts**:

```
import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { 
  redirectUnauthorizedTo,
  redirectLoggedInTo,
  canActivate,
} from '@angular/fire/auth-guard'

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['']);
const redirectLoggedInToHome = () => redirectLoggedInTo(['home']);
const routes: Routes = [
  {
    path: 'home',
    loadChildren: () => import('./home/home.module').then( m => m.HomePageModule),
    ...canActivate(redirectUnauthorizedToLogin),
  },
  {
    path: 'modal',
    loadChildren: () => import('./modal/modal.module').then( m => m.ModalPageModule),
    ...canActivate(redirectUnauthorizedToLogin),
  },
  {
    path: '',
    loadChildren: () => import('./login/login.module').then( m => m.LoginPageModule),
    ...canActivate(redirectLoggedInToHome),
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
```
Now we can begin with the actual authentication of users!

# Building the Authentication Logic

The whole logic will be in a separate service, and we need jsut three functions that simply call the according Firebase function to create a new user, sign in a user or end the current session.

For all these calls you need to add the **Auth** reference, which we injected inside the constructor.

Since these calls sometimes fail and I wasn’t very happy about the error handling, I wrapped them in try/catch blocks so we have an easier time when we get to our actual page.

Let’s begin with the **src/app/services/auth.service.ts** now and change it to:

```
import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, signOut, GoogleAuthProvider, getAuth } from '@angular/fire/auth';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private auth: Auth) { }

  async registro({ email, senha }) {
    try {
      const usuario = await createUserWithEmailAndPassword(
        this.auth,
        email,
        senha
      );
      return usuario;
    } catch (e) {
      return null;
    }
  }

  async login({ email, senha }) {
    try {
      const usuario = await signInWithEmailAndPassword(this.auth, email, senha);
      return usuario;
    } catch (e) {
      return null;
    }
  }
  
  async loginGoogle() {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
    try {
      const usuario = await signInWithPopup(auth, provider);
      return usuario;
    } catch (e) {
      return null;
    }
  }

  logout() {
    return signOut(this.auth);
  }
}
```

**Ps:** <code>loginGoogle()</code> was created to implements a login through Google credentials. The method <code>signInWithPopup()</code> requires an auth and a provider.

That’s already everything in terms of logic. Now we need to capture the user information for the registration, and therefore we import the <code>ReactiveFormsModule</code> in our **src/app/login/login.module.ts** now:

```
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
 
import { IonicModule } from '@ionic/angular';
 
import { LoginPageRoutingModule } from './login-routing.module';
 
import { LoginPage } from './login.page';
 
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LoginPageRoutingModule,
    ReactiveFormsModule,
  ],
  declarations: [LoginPage],
})
export class LoginPageModule {}
```

Since we want to make it easy, we’ll handle both registration and signup with the same form on one page.

But since we added the whole logic already to a service, there’s not much left for us to do besides showing a casual loading indicator or presenting an alert if the action failed.

If the registration or login is successful and we get back an **user** object, we immediately route the user forward to our inside area.

Go ahead by changing the **src/app/login/login.page.ts** to:

```
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
```
**Ps:** As explained before, we had create <code>loginGoogle()</code> to use Google credentials to log on our application. Using that, we build <code>GoogleLogin()</code> to make a user object to log in.

The last missing piece is now our view, which we connect with the <code>formGroup</code>  we defined in our page. On top of that we can show some small error messages using the new Ionic 6 **error** slot.

Just make sure that one button inside the form has the **submit** type and therefore triggers the <code>ngSubmit</code> action, while the other has the type **button** if it should just trigger it’s connected click event!

Bring up the **src/app/login/login.page.html** now and change it to:

```
<ion-header>
  <ion-toolbar color="primary">
    <ion-title>Suas Notas</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content>
  <form (ngSubmit)="login()" [formGroup]="credenciais">
    <ion-item fill="solid" class="ion-margin-bottom">
      <ion-input type="email" placeholder="E-mail" formControlName="email"></ion-input>
      <ion-note slot="error" *ngIf="(email.dirty || email.touched) && email.errors">E-mail inválido</ion-note>
    </ion-item>
    <ion-item fill="solid" class="ion-margin-bottom">
      <ion-input type="password" placeholder="Senha" formControlName="senha" (keyup.enter)="login()"></ion-input>
      <ion-note slot="error" *ngIf="(senha.dirty || senha.touched) && senha.errors">A senha precisa ter no mínimo 6 caracteres</ion-note>
    </ion-item>

    <ion-button type="submit" expand="block" [disabled]="!credenciais.valid">Acessar</ion-button>
    <ion-button type="button" expand="block" color="secondary" (click)="registrar()">Criar conta</ion-button>
    <ion-button type="button" expand="block" color="danger" (click)="GoogleLogin()">
      <ion-icon name="logo-google" slot="start"></ion-icon>
      Login com o Google
    </ion-button>
  </form>
</ion-content>
```
You can confirm this by checking the **Authentication** area of your Firebase console and hopefully a new user was created in there!

![image](https://user-images.githubusercontent.com/73944895/187500243-a252f675-e539-4999-9d4f-5d994c373db2.png)

# Working with Firestore Docs & Collections

As a first step we will create a service that interacts with Firebase and loads our data. It’s always a good idea to outsource your logic into a service!

To work with Firestore in the latest version we need to inject the **Firestore** instance into every call, so we import it within our constructor and later use it in our CRUD functions. On top of that we simply create a **reference** to the path in our Firestore database to either a **collection** or **document**.

Let’s go through each of them:

* <code>getNotes</code>: Access the **notes** collection and query the data using <code>collectionData()</code>
* <code>getNoteById</code>: Access one document in the notes collection and return the data with <code>docData()</code>
* <code>addNote</code>: With a reference to the notes collection we use <code>addDoc()</code> to simply push a new document to a collection where a unique ID is generated for it
* <code>deleteNote</code>: Delete a document at a specific path using <code>deleteDoc()</code>
* <code>updateNote</code>: Create a reference to one document and update it through <code>updateDoc()</code>

For our first functions we also pass in an options object that contains <code>idField</code>, which helps to easily include the ID of a document in the response!

Now let’s go ahead and change the **src/app/services/data.service.ts** to:

```
import { Injectable } from '@angular/core';
import { Auth } from '@angular/fire/auth';
import { addDoc, collection, collectionData, deleteDoc, doc, docData, Firestore, updateDoc } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Nota {
  id?: string;
  titulo: string;
  texto: string;
}
@Injectable({
  providedIn: 'root'
})
export class DadosService {

  constructor(
    private firestore: Firestore,
    private auth: Auth) { }

  getNotas(): Observable<Nota[]> {
    const usuario = this.auth.currentUser;
    const notasRef = collection(this.firestore, `usuario/${usuario.uid}/notas`);
    return collectionData(notasRef, { idField: 'id'}) as Observable<Nota[]>;
  }

  getNotaPorId(id): Observable<Nota> {
    const usuario = this.auth.currentUser;
    const notaDocRef = doc(this.firestore, `usuario/${usuario.uid}/notas/${id}`);
    return docData(notaDocRef, { idField: 'id'}) as Observable<Nota>;
  }

  addNota(nota: Nota) {
    const usuario = this.auth.currentUser;
    const notasRef = collection(this.firestore, `usuario/${usuario.uid}/notas`);
    return addDoc(notasRef, nota);
  }

  apagarNota(nota: Nota) {
    const usuario = this.auth.currentUser;
    const notaDocRef = doc(this.firestore, `usuario/${usuario.uid}/notas/${nota.id}`);
    return deleteDoc(notaDocRef);
  }

  atualizarNota(nota: Nota) {
    const usuario = this.auth.currentUser;
    const notaDocRef = doc(this.firestore, `usuario/${usuario.uid}/notas/${nota.id}`);
    return updateDoc(notaDocRef, { titulo: nota.titulo, texto: nota.texto });
  }
}
```

With all of that in place we are ready to build some functionality on top of our service.

# Load and add to Firestore Collections

First of all we want to display a list with the collection data, so let’s create a quick template first. We add a click event to every item, and additionally use a FAB button to create new notes for our collection.

Get started by changing the **src/app/home/home.page.html** to:

```
<ion-header>
  <ion-toolbar color="primary">
    <ion-buttons slot="start">
      <ion-button (click)="logout()">
        <ion-icon slot="icon-only" name="log-out"></ion-icon>
      </ion-button>
    </ion-buttons>
    <ion-title>
      Minhas notas
    </ion-title>
  </ion-toolbar>
</ion-header>

<ion-content [fullscreen]="true">
  <ion-list>
    <ion-item *ngFor="let nota of notas" (click)="abrirNota(nota)">
      <ion-label>
        {{ nota.titulo }}
      </ion-label>
    </ion-item>
  </ion-list>
  
  <ion-fab vertical="bottom" horizontal="end" slot="fixed">
    <ion-fab-button (click)="addNota()">
      <ion-icon name="add"></ion-icon>
    </ion-fab-button>
  </ion-fab>
  
</ion-content>
```

Since we have created the logic to load the data before, we now simply load the data from our service and assign it to our local <code>notes</code> array.

To add a new note we can use the [Ionic alert controller](https://ionicframework.com/docs/api/alert) and two simple inputs to capture a title and text for a new note.

With that information we can call <code>addNote()</code> from our service to create a new note in our Firestore collection.

We don’t need any additional logic to reload the collection data – since we are subscribed to an Observable that returns our collection data we will **automatically receive the new data!**

To show the details for a note (as a little exercise) we create a new modal using the Ionic 6 sheet version with breakpoints which looks pretty cool. We pass in the ID of the note we want to open, so we can later load its data through our service.

For now open the **src/app/home/home.page.ts** and change it to:

```
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
```

**Note:** Initially I had to use the Angular <code>ChangeDetectorRef</code>  and manually trigger a change detection to update the view, in later tests it worked without. See what works for you, most likely you don’t need that part.

Now we just need to implement the modal with some additional functionality.

# Update and Delete Firestore Documents

The last step is loading the detail data of a document, which you can do by using the ID that we define as <code>@Input()</code> and getting the document data from our service.

The other functions to delete and update a document work the same, simply by calling our service functionalities.

Therefore quickly open the **src/app/modal/modal.page.ts** and change it to:

```
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
```

The cool thing is that our **document is also updated in realtime**, just like the list based on the collection on our previous page.

So since we can now connect our <code> ngModel</code>  input fields with our note, you could directly update the data inside Firestore and see the change in your Ionic app.

For the other direction, we still need to press the update button first so let’s wrap up the tutorial by adding the last items to show the input fields and two buttons to trigger all actions inside the **src/app/modal/modal.page.html**:

```
<ion-header>
  <ion-toolbar color="secondary">
    <ion-title>Detalhes</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content>
  <div *ngIf="nota">
    <ion-item>
      <ion-label position="stacked">Título</ion-label>
      <ion-input [(ngModel)]="nota.titulo"></ion-input>
    </ion-item>

    <ion-item>
      <ion-label position="stacked">Nota</ion-label>
      <ion-textarea [(ngModel)]="nota.texto" rows="8"></ion-textarea>
    </ion-item>
  </div>

  <ion-button expand="block" color="success" (click)="atualizarNota()">
    <ion-icon name="save" slot="start"></ion-icon>
    Atualizar
  </ion-button>
  <ion-button expand="block" color="danger" (click)="apagarNota()">
    <ion-icon name="trash" slot="start"></ion-icon>
    Apagar
  </ion-button>
</ion-content>
```

And with that you have successfully finished the basic Firebase integration on which you could now add all further functionalities like user authentication or file upload.

# Push Notifications

Open the **capacitor.config.ts** file and add:

```
plugins: {
    PushNotifications: {
        presentationOptions: [‘badge’, ‘sound’, ‘alert’]
    }
}
```

Now build your app with:

```
ionic build
```

# Add Platforms

Add ios and android platforms in your app with:

```
npx cap add ios
npx cap add android
```

In this project, we only used <code>npx cap add android</code>

# Creating an Android App on Firebase Console

Create an android app in firebase by going in project settings page

![image](https://user-images.githubusercontent.com/73944895/188150617-8e343245-d418-4dea-aa03-ff98a0a37f14.png)

Click on android icon to start creating android app

Here write the exact app package id that you see in **capacitor.config.ts** in your project appId. In my case, i use **'com.notas.app'**.

![image](https://user-images.githubusercontent.com/73944895/188150922-a8ef5f98-46d1-4540-b050-d7b44a20bd0c.png)

Download the google-services.json file. We will place this file in our android folder in project

![image](https://user-images.githubusercontent.com/73944895/188151190-c830d7ab-4979-4c36-870c-434657e18caa.png)

Create the firebase project and add google-services.json file in

<code>/push-notifications-app/android/app/google-services.json</code>

![image](https://user-images.githubusercontent.com/73944895/188151363-138bac1e-1ea1-4882-a09f-dcaaf7bf03e0.png)

This is the file that we have downloaded from firebase.

Generate a service using

```
ionic g service servicos/notificacoes
```

Install push-notifications with below command

```
npm install @capacitor/push-notifications
```

Add this code to your **notificacoes.service.ts**

```
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
```

Add in your **app.component.ts** below lines:

```
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
```

Start your android app you will see push notification logs and events being registered in console

There you will find token value of your device. This is the value that you will use to send push notification to your device.

# Send notification via Postman

Send a push notification with postman

![image](https://user-images.githubusercontent.com/73944895/188152441-6267eb13-1e1a-4bea-8a8a-01c72ca26269.png)

```
Method: POST
Request: https://fcm.googleapis.com/fcm/send
Headers:
Content-Type: application/json
Authorization: key=serverKeyHere
(i.e key=AAAAu98LJFM:APA91bGNbjxQ95RELBLAfrdiC99W6dDbG1FGAhsv7p8uWcs9qtggdJYW8xM7Jq-JGAOE0igyu36H7xFw0i0pP6_UAsQCiTU4yA_GBVYiwTLuFifuVcn0jPRePOE-t1SCt2aVBsbP1UGr3XEjTZBDQ9DyIJq4GAT )
Request Payload:
{
    “to”:”fOa_XtyIRXKFGmNrS5JcXz:APA91bHJ41E-DX4NQ7ykS6Qlhrpo5ARHWbApxHPWNMM1i_olg3a2kjixjaAFH4hb44kkf65-WCpJeZo-1rdhJjjv0pMSUFZuWbHkZhbpBC1njnV7MTfpGS0vTjjGCep_KcUW3P8QewAQ”,
    “notification”**: {
        “title”: “Order #43”,
        “body”: “There’s a new pickup order in line!”,
        “sound”: “default” 
    }
}
```

**Note:** Replace token in **“to”** with token you received from firebase in your console.

Now send Request and you will receive background message.

**Note:** Background messages are messages that you receive when your app is opened in some tab which is not active. You can get server key from firebase console as shown here

# Receive Foreground Push notifications

To receive push notifications when your application is opened you need to create a custom component which will load whenever a new message is received via **pushNotificationReceived** event listener from firebase.

![image](https://user-images.githubusercontent.com/73944895/188153135-6ab849c4-e192-4816-99e0-e42781a0f86a.png)

Now you can see that a notification is received in the console.

**Note:** I highly recommend using the Firebase Console to send Push Notifications. It's simple and easy to do it.
