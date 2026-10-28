
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
