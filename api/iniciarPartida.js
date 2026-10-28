
import { randomUUID } from "node:crypto";

import {
  obterFirestoreAdmin,
  verificarTokenJogador,
} from "./firebaseAdmin.js";

const DURACAO_PARTIDA_MS = 30 * 60 * 1000;

const ORIGENS_PERMITIDAS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://show-do-milhao-geracao-z.vercel.app",
  "https://rafapereira0224-alt.github.io",
];

function criarHeadersCORS(request) {
  const origem = request.headers.get("origin");

  const headers = new Headers({
    "Content-Type": "application/json",
    Vary: "Origin",
  });

  if (ORIGENS_PERMITIDAS.includes(origem)) {
    headers.set("Access-Control-Allow-Origin", origem);
    headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Authorization, Content-Type");
  }

  return headers;
}

export function OPTIONS(request) {
  return new Response(null, {
    status: 204,
    headers: criarHeadersCORS(request),
  });
}

export async function POST(request) {
  const headers = criarHeadersCORS(request);

  let usuarioId;

  try {
    usuarioId = await verificarTokenJogador(request);
  } catch {
    return Response.json(
      {
        sucesso: false,
        mensagem: "Você precisa estar autenticado para jogar.",
      },
      { status: 401, headers }
    );
  }

  try {
    const db = obterFirestoreAdmin();

    const partidaId = randomUUID();
    const agora = Date.now();

    await db.collection("partidas").doc(partidaId).set({
      usuarioId,
      status: "iniciada",
      rodada: 1,
      acertos: 0,
      pontuacao: 0,
      criadaEm: new Date(agora),
      expiraEm: new Date(agora + DURACAO_PARTIDA_MS),
    });

    return Response.json(
      {
        sucesso: true,
        partidaId,
        rodada: 1,
        mensagem: "Partida iniciada com sucesso!",
      },
      { headers }
    );
  } catch (erro) {
    console.error("Erro ao iniciar partida:", erro);

    return Response.json(
      {
        sucesso: false,
        mensagem: "Não foi possível iniciar a partida.",
      },
      { status: 500, headers }
    );
  }
}
