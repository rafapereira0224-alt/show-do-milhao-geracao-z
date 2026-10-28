
import { obterFirestoreAdmin } from "./firebaseAdmin.js";

export async function GET() {
  try {
    const db = obterFirestoreAdmin();

    // Confirma a conexão com o Firestore.
    // Não modifica nem retorna dados dos jogadores.
    await db.listCollections();

    return Response.json({
      sucesso: true,
      mensagem: "Firebase Admin conectado com sucesso!"
    });
  } catch (erro) {
    console.error("Falha ao conectar Firebase Admin:", erro);

    return Response.json(
      {
        sucesso: false,
        mensagem: "Não foi possível conectar ao Firebase."
      },
      { status: 500 }
    );
  }
}
