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
