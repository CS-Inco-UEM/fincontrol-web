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
} from "firebase/firestore";
import { db } from "../firebase";

const colecao = (uid) => collection(db, "usuarios", uid, "financiamentos");

export function ouvirFinanciamentos(uid, callback, onError) {
  const q = query(colecao(uid), orderBy("criadoEm", "desc"));
  return onSnapshot(
    q,
    (snapshot) => callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

export function adicionarFinanciamento(uid, dados) {
  return addDoc(colecao(uid), {
    descricao: dados.descricao,
    valorFinanciado: dados.valorFinanciado,
    taxaJurosMensal: dados.taxaJurosMensal,
    numParcelas: dados.numParcelas,
    sistema: dados.sistema,
    dataInicio: Timestamp.fromDate(dados.dataInicio),
    criadoEm: serverTimestamp(),
  });
}

export function excluirFinanciamento(uid, id) {
  return deleteDoc(doc(db, "usuarios", uid, "financiamentos", id));
}
