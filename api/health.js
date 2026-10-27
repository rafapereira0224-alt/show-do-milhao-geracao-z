
export function GET() {
  return Response.json({
    sucesso: true,
    mensagem: "Servidor do Show do Milhão funcionando!",
    projeto: "Show do Milhão - Geração Z",
    status: "online"
  });
}
