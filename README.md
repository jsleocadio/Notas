# Criando o Projeto no Firebase

Antes de iniciarmos no App Ionic, precisamos ter certeza que o Firebase App está configurado. Se você já tem uma configuração salva e desejar utilizá-la, pode pular esta etapa.

Caso contrário, tenha certeza de se registrar (é grátis) e então clique em **Adicionar projeto** dentro do [console do Firebase](https://console.firebase.google.com/). Dê um nome ao seu novo aplicativo, selecione uma região e então crie seu projeto!

Uma vez que você criou o projeto, você precisa encontrar a configuração web, que parece um pouco com isto:

![image](https://user-images.githubusercontent.com/73944895/187245878-2cec7029-c923-48d7-b1ee-02c43ee38b9e.png)

Se é um novo projeto, clique no icone web abaixo "**Adicionar o Firebase ao seu app da Web**" para iniciar um novo web app e dá-lo um nome, você verá as configurações no próximo passo.

Deixe este bloco de configuração aberto (ou o copie) até que o nosso aplicativo esteja pronto e assim adicionarmos em nosso *ambiente* (environment)!

Adicionalmente nós podemos habilitar o banco de dados, então selecione **Firestore Database** do menu e clique em **Criar database**.

![image](https://user-images.githubusercontent.com/73944895/187247222-d3c33246-509f-4b9e-90eb-1bb2db27bb13.png)

Aqui podemos definir as **regras de segurança** padrão para nosso banco de dados, como estamos apenas testando, rodaremos em **modo de teste** que permite o acesso de todos.

Por causa que queremos trabalhar com usuários, também precisaremos ir a guia **Authentication**, clique em **Começar experimento** novamente e ative o provedor **Email/Senha**. Com isto, poderemos criar usuários com a combinação padrão de e-mail/senha.

![image](https://user-images.githubusercontent.com/73944895/187490868-8fa6d73e-e20d-4295-8e9c-96399567241b.png)

# Iniciando nosso App Ionic & Integração com Firebase

Agora estamos prontos para iniciar o App Ionic, então geraremos um novo app com duas páginas adicionais e dois serviços para nosso lógica e então usaremos a esquemática do AngularFire para adicionarmos todos os pacotes requeridos e mudanças ao projeto: 

```
ionic start ProjectName blank --type=angular --capacitor
cd ./ProjectName
 
# Gerar páginas e serviços
ionic g page login
ionic g page modal
ionic g service services/auth
ionic g service services/data

# Instalar o Firebase e o AngularFire
ng add @angular/fire
```
O último comando é o mais importante pois iniciar a esquemática do AngularFire. Você deve selecionar de acordo com as funções que seu app precisa, no nosso caso Authentication e Firestore.

![image](https://user-images.githubusercontent.com/73944895/187491615-5b81d564-49c4-4619-938d-a1e051a2c9ad.png)

Depois que o navegador abrir para logar com sua conta do Google, cujo, lerá sua lista de **Firebase apps so you can select the Firebase project and app your created in the beginning!**

Como resultado da esquemática irá automaticamente preencher seu arquivo **environments/environment.ts** - se não, preenchar manualmente as configurações do Firebase da primeira etapa da seguinte forma:
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
O melhor de tudo é que a esquemática injetou todo o necessário em nosso **src/app/app.module.ts** usando a abordagem do Firebase 9:
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
De novo, se a esquemática falhar por algum motivo, é assim que seu modulo deve ficar antes de continuar!

Agora, iremos rapidamente alterar o roteamento de nosso aplicativo para mostrar a página de login como a primeira página, e usar a página *home* padrão para a área logada.

Nós não implementamos a autenticação ainda, porém, nós já podemos utilizar o [AngularFire auth guards](https://github.com/angular/angularfire/blob/master/docs/auth/router-guards.md) de duas formas:

* Proteger o acesso de páginas "internas" redirecionando usuários não autorizados para a página de login
* Prevenir o acesso à página de login de usuários anteriormente autenticados, assim, eles são automaticamente direcionados para a área "logada" do app

Isto é feito com a ajuda de serviços do AngularFire que você pode adicionar dentro do seu **src/app/app-routing.module.ts**:

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
Agora nós podemos iniciar a autenticação de usuários!

# Construindo a Lógica de Autenticação

A lógica inteira ficará em um serviço separado, e precisaremos apenas de três funções que simplesmente chamará a função Firebase correspondente a criar novo usário, o acesso de um usuário ou o fim de uma sessão atual.

Para todas estas chamadas precisaremos adicionar a referência **Auth**, que será injetada no construtor.

Afim de minimizar as falhas nas chamadas das funções, usaremos blocos try/catch para facilitar quando formos para nossa página atual.

Vamos começar com o **src/app/services/auth.service.ts** e modificá-lo para:
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

**Obs:** <code>loginGoogle()</code> foi criado para implementar o login atráves da credencial do Google. O método <code>signInWithPopup()</code> além do **Auth**, solicitará um provedor, neste caso o **GoogleAuthProvider**.

Isto é tudo em termos de lógica. Agora, precisamos capturar as informações do usuário para registro, e, portanto, importaremos o <code>ReactiveFormsModule</code> em nosso **src/app/login/login.module.ts**:
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
Como queremos algo simples, lidaremos com o registro e signup com o mesmo formulário numa única página.

Como já adicionamos toda a lógica a um serviço, não há muito o que além de mostrar um indicador de carregamento casual ou apresentar um alerta se uma ação falhar.

Se o registro ou login foi um sucesso e tivermos como retorno um objeto **usuario**, imediatamente guiaremos o usuário para nossa área logada.

Siga mudando o **src/app/login/login.page.ts** para:
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
**Obs:** Como explicado anteriormente, criamos <code>loginGoogle()</code> para usarmos as credenciais do Google para entrar em nossa aplicação. Usando-o, construímos <code>GoogleLogin()</code> para criar um objeto **usuario** para acessar a área logada.

A última peça faltando em nossa vista, cujo conectamos com o <code>formGroup</code> definida em nossa página. Com isto, podemos mostrar pequenas mensagem de erros usando o novo slot de **error** do Ionic 6.

Tenha certeza que um dos botões dentro do formulário tenha o tipo **submit** e portanto inicie a ação do <code>ngSubmit</code>, enquanto os outros tenha o tipo **button** que só deve ser ativado ao evento conectado ao <code>(click)=""</code>!

Vamos para o **src/app/login/login.page.html** e modificá-lo para:
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
Você pode confirmar checando a área **Authentication** do seu console do Firebase e um novo usuário foi criado lá!

![image](https://user-images.githubusercontent.com/73944895/187500243-a252f675-e539-4999-9d4f-5d994c373db2.png)

# Trabalhando com o Firestore Docs e Collections

Como primeiro passo, criaremos um serviço que interagirá com o Firebase e carregará nossos dados. É sempre uma boa ideia 'externar' sua lógica num serviço!

Para trabalhar com o Firestore na última versão precisaremos injetar a instância do **Firestore** em cada chamada, então importaremos em nosso construtor e, depois, usaremos em nossas funções CRUD (**C**reate, **R**ead, **U**pdate, **D**elete). Além disso, criaremos uma referência para o caminho em nosso banco de dados Firestore para, seja uma **collection** ou um **document**.

Vamos passar um a um:

* <code>getNotas</code>: Acessa a collection de **notas** e consulta os dados usando <code>collectionData()</code>
* <code>getNotaPorId</code>: Acessa um documento na collection de notas e retorna o dado com <code>docData()</code>
* <code>addNota</code>: Com a referência para a collection de notas, utilizamos <code>addDoc()</code> para colocar um novo documento em uma collection onde um ID único é gerado para ele
* <code>apagarNota</code>: Apaga um documento num caminho específico utilizando <code>deleteDoc()</code>
* <code>atualizarNota</code>: Cria uma referência a um documento e o atualiza atráves do <code>updateDoc()</code>

Para nossas primeiras funções passaremos em um objeto opções que contém <code>idField</code>, que auxiliará a incluir o ID de um documento na resposta!

Agora vamos alterar o **src/app/services/data.service.ts** para:
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
Com tudo isto no lugar, estamos prontos para construir algumas funcionalidades graças ao nosso serviço.

**Obs:** Foi feita a inclusão do **Auth** no construtor afim de que a página seja única para cada usuário. Com a inclusão o ID de usuário no caminho apenas aquele usuário terá acesso as suas notas.

# Carregar e adicionar Collections do Firebase

Primeiro de tudo, nós queremos mostrar uma lista com os dados da collection, então, primeiramente criaremos um template rápido. Adicionaremos um evento de clique para cada item, e adicionalmente usaremos um botão FAB para criar novas notas para nossa collection.

Começaremos mudando o **src/app/home/home.page.html** para:
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
Como já tinhamos criado a lógica por trás do carregamento de dados, simplesmente iremos executá-la de nosso serviço e alocá-lo para nosso vetor de <code>notas</code>.

Para adicionar uma nova nota usaremos o [Controlador de alertas do Ionic](https://ionicframework.com/docs/api/alert) e dois inputs simples para capturar o título e texto para uma nova nota.

Com estas informações nós podemos chamar <code>addNota()</code> do nosso serviço para criar uma nova nota em nossa collection do Firestore.

Não precisaremos de nenhuma lógica adicional para recarregar nossa collection - visto que nós atribuímos a um Observable que a retorna, com isto, **automaticamente, receberemos novos dados!**

Para mostrar os detalhes de uma nota criaremos um modal utilizando a nova versão do Sheet Modal do Ionic 6 com breakpoints. Nós passaremos o ID da nota que desejamos abrir, então depois carregaremos os dados atráves do nosso serviço. 

Por hora, abra o **src/app/home/home.page.ts** e mude-o para:
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
**Nota:** Inicialmente tive que usar o <code>ChangeDetectorRef</code> do Angular e manualmente ativar a detecção de mudança para atualizar a view, em teste posteriores funcionou sem ele. Veja se funciona para você, pois é bem provável que não precise desta parte.

Agora, precisamos implementar o modal com algumas funcionalidades.

# Atualizar e Apagar Documentos do Firestore

O último passo é carregar os dados de detalhamento de um documento, o qual você o faŕa usando o ID que definimos como <code>@Input()</code> e pegaremos os dados do nosso serviço.

As outras funções para apagar e atualizar um documento funcionaŕa da mesma forma, simplesmente por chamar as funcionalidades de nosso serviço.

De antemaão, abra o **src/app/modal/modal.page.ts**  e mude-o para:
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
O legal é que nosso **documento é atualizado em tempo real**, como a lista baseada em nossa collection em nossa página anterior.

Desde que conectemos nosso campos de inputs <code>ngModel</code> com nossa nota,poderemos diretamente atualizar os dados dentro do Firestore e ver as mudanças em nosso app.  

Por outro lado, nós precisamos apertar o botão atualizar primeiro. Então, vamos adicionar os últimos itens para mostrar os campos de input e os dois botões que ativará todas as ações dentro do **src/app/modal/modal.page.html**:
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
