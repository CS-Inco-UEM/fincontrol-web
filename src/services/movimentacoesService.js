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
  writeBatch,
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

// Movimentação recorrente: duracaoMeses > 1 já gera, de uma vez, um
// lançamento por mês (mesmo dia, meses seguintes), todos marcados com o
// mesmo grupoRecorrenciaId. Não existe ação separada de "duplicar".
export function adicionarMovimentacao(uid, dados) {
  const duracao = dados.duracaoMeses && dados.duracaoMeses > 1 ? dados.duracaoMeses : 1;

  if (duracao === 1) {
    return addDoc(colecao(uid), {
      ...dados,
      data: Timestamp.fromDate(dados.data),
      duracaoMeses: 1,
      criadoEm: serverTimestamp(),
    });
  }

  const batch = writeBatch(db);
  const grupoRecorrenciaId = crypto.randomUUID();
  for (let i = 0; i < duracao; i++) {
    const dataOcorrencia = new Date(dados.data);
    dataOcorrencia.setMonth(dataOcorrencia.getMonth() + i);
    const ref = doc(colecao(uid));
    batch.set(ref, {
      ...dados,
      data: Timestamp.fromDate(dataOcorrencia),
      duracaoMeses: duracao,
      grupoRecorrenciaId,
      criadoEm: serverTimestamp(),
    });
  }
  return batch.commit();
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
