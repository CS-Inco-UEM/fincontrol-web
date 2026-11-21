import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

const colecao = (uid) => collection(db, "usuarios", uid, "movimentacoes");


export function ouvirMovimentacoes(uid, callback, onError) {
  const q = query(colecao(uid), orderBy("data", "desc"));
  return onSnapshot(
    q,
    (snapshot) => {
      callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    },
    onError
  );
}

export function adicionarMovimentacao(uid, dados) {
  return addDoc(colecao(uid), {
    ...dados,
    data: Timestamp.fromDate(dados.data),
    duracaoMeses: 1,
    criadoEm: serverTimestamp(),
  });
}

export function atualizarMovimentacao(uid, id, dados) {
  return updateDoc(doc(db, "usuarios", uid, "movimentacoes", id), {
    ...dados,
    data: Timestamp.fromDate(dados.data),
  });
}

export function excluirMovimentacao(uid, id) {
  return deleteDoc(doc(db, "usuarios", uid, "movimentacoes", id));
}