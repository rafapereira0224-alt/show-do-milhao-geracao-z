
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

function obterAppAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const credenciais = process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!credenciais) {
    throw new Error(
      "Credenciais administrativas não configuradas."
    );
  }

  const contaServico = JSON.parse(credenciais);

  return initializeApp({
    credential: cert(contaServico),
  });
}

export function obterFirestoreAdmin() {
  return getFirestore(obterAppAdmin());
}

export function obterAuthAdmin() {
  return getAuth(obterAppAdmin());
}


export async function verificarTokenJogador(request) {
  const autorizacao = request.headers.get("authorization");

  if (!autorizacao?.startsWith("Bearer ")) {
    throw new Error("Token de autenticação não informado.");
  }

  const token = autorizacao.slice(7).trim();

  if (!token) {
    throw new Error("Token de autenticação vazio.");
  }

  const auth = obterAuthAdmin();

  const usuario = await auth.verifyIdToken(token);

  return usuario.uid;
}
