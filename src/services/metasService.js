import {
  addDoc,
  arrayUnion,
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
import { chaveMes } from "../utils/planejamento";

const colecao = (uid) => collection(db, "usuarios", uid, "metas");

export function ouvirMetas(uid, callback, onError) {
  const q = query(colecao(uid), orderBy("dataLimite", "asc"));
  return onSnapshot(
    q,
    (snapshot) => callback(snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

export function adicionarMeta(uid, dados) {
  return addDoc(colecao(uid), {
    nome: dados.nome,
    valorAlvo: dados.valorAlvo,
    dataLimite: Timestamp.fromDate(dados.dataLimite),
    dataInicio: dados.dataInicio ? Timestamp.fromDate(dados.dataInicio) : null,
    criadoEm: serverTimestamp(),
  });
}

export function atualizarMeta(uid, id, dados) {
  return updateDoc(doc(db, "usuarios", uid, "metas", id), {
    nome: dados.nome,
    valorAlvo: dados.valorAlvo,
    dataLimite: Timestamp.fromDate(dados.dataLimite),
    dataInicio: dados.dataInicio ? Timestamp.fromDate(dados.dataInicio) : null,
  });
}

export function excluirMeta(uid, id) {
  return deleteDoc(doc(db, "usuarios", uid, "metas", id));
}

// Fechamento manual de mês: trava o mês (ano/mês) na lista mesesFechados da
// meta. O valor recomendado desse mês passa a ser o que foi de fato
// transferido, e o que falta é redistribuído entre os meses ainda abertos.
export function fecharMes(uid, metaId, ano, mes) {
  return updateDoc(doc(db, "usuarios", uid, "metas", metaId), {
    mesesFechados: arrayUnion(chaveMes(ano, mes)),
  });
}

// Transferência/resgate são sempre registrados como movimentação (nunca um
// número ajustado direto na meta), então esse módulo só cria o doc da meta;
// quem grava a movimentação vinculada é adicionarMovimentacao, com metaId.
