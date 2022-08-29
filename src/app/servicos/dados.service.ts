import { Injectable } from '@angular/core';
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

  constructor(private firestore: Firestore) { }

  getNotas(): Observable<Nota[]> {
    const notasRef = collection(this.firestore, 'notas');
    return collectionData(notasRef, { idField: 'id'}) as Observable<Nota[]>;
  }

  getNotaPorId(id): Observable<Nota> {
    const notaDocRef = doc(this.firestore, `notas/${id}`);
    return docData(notaDocRef, { idField: 'id'}) as Observable<Nota>;
  }

  addNota(nota: Nota) {
    const notasRef = collection(this.firestore, 'notas');
    return addDoc(notasRef, nota);
  }

  apagarNota(nota: Nota) {
    const notaDocRef = doc(this.firestore, `notas/${nota.id}`);
    return deleteDoc(notaDocRef);
  }

  atualizarNota(nota: Nota) {
    const notaDocRef = doc(this.firestore, `notas/${nota.id}`);
    return updateDoc(notaDocRef, { titulo: nota.titulo, texto: nota.texto });
  }
}
