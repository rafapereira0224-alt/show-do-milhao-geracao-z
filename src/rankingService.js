
import { auth, db } from "./firebaseConfig";

import {
  signInAnonymously,
  onAuthStateChanged,
} from "firebase/auth";

import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";

// Valores permitidos no jogo
const PREMIOS_VALIDOS = [
  0, 1000, 2000, 3000, 4000, 5000,
  15000, 25000, 35000, 45000, 55000,
  155000, 255000, 355000, 455000,
  1000000,
];

// Aguarda ou realiza o login anônimo
export async function autenticarJogador() {
  if (auth.currentUser) {
    return auth.currentUser;
  }

  return new Promise((resolve, reject) => {
    let unsubscribe = () => {};

    unsubscribe = onAuthStateChanged(
      auth,
      async (usuario) => {
        if (usuario) {
          unsubscribe();
          resolve(usuario);
          return;
        }

        try {
          const resultado = await signInAnonymously(auth);
          unsubscribe();
          resolve(resultado.user);
        } catch (erro) {
          unsubscribe();
          reject(erro);
        }
      },
      reject
    );
  });
}

// Salva o resultado no Firestore
export async function salvarPontuacao(
  nome,
  pontuacao,
  acertos
) {
  await autenticarJogador();

  const nomeLimpo = nome.trim();

  if (
    nomeLimpo.length < 2 ||
    nomeLimpo.length > 24
  ) {
    throw new Error(
      "Digite um nome entre 2 e 24 caracteres."
    );
  }

  if (!PREMIOS_VALIDOS.includes(pontuacao)) {
    throw new Error("Pontuação inválida.");
  }

  if (
    !Number.isInteger(acertos) ||
    acertos < 0 ||
    acertos > 15
  ) {
    throw new Error("Quantidade de acertos inválida.");
  }

  await addDoc(collection(db, "ranking"), {
    nome: nomeLimpo,
    pontuacao,
    acertos,
    criadoEm: serverTimestamp(),
  });
}

// Busca os 50 melhores resultados
export async function buscarRanking() {
  const consulta = query(
    collection(db, "ranking"),
    orderBy("pontuacao", "desc"),
    limit(50)
  );

  const resultado = await getDocs(consulta);

  const jogadores = resultado.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  // Desempate por quantidade de acertos
  jogadores.sort((a, b) => {
    if (b.pontuacao !== a.pontuacao) {
      return b.pontuacao - a.pontuacao;
    }

    return b.acertos - a.acertos;
  });

  return jogadores;
}

