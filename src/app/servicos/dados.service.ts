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
