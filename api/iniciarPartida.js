
import { randomUUID } from "node:crypto";

import {
  obterFirestoreAdmin,
  verificarTokenJogador,
} from "./firebaseAdmin.js";

const DURACAO_PARTIDA_MS = 30 * 60 * 1000;

export async function POST(request) {
  // 1. Verifica se o jogador está autenticado
  let usuarioId;

  try {
    usuarioId = await verificarTokenJogador(request);
  } catch (erro) {
    return Response.json(
      {
        sucesso: false,
        mensagem: "Você precisa estar autenticado para jogar.",
      },
      { status: 401 }
    );
  }

  try {
    // 2. Prepara o Firestore
    const db = obterFirestoreAdmin();

    // 3. Cria o identificador da partida
    const partidaId = randomUUID();
    const agora = Date.now();

    // 4. Salva a partida vinculada ao jogador
    await db.collection("partidas").doc(partidaId).set({
      usuarioId,
      status: "iniciada",
      rodada: 1,
      acertos: 0,
      pontuacao: 0,
      criadaEm: new Date(agora),
      expiraEm: new Date(agora + DURACAO_PARTIDA_MS),
    });

    // 5. Retorna somente as informações necessárias
    return Response.json({
      sucesso: true,
      partidaId,
      rodada: 1,
      mensagem: "Partida iniciada com sucesso!",
    });
  } catch (erro) {
    console.error("Erro ao iniciar partida:", erro);

    return Response.json(
      {
        sucesso: false,
        mensagem: "Não foi possível iniciar a partida.",
      },
      { status: 500 }
    );
  }
}
