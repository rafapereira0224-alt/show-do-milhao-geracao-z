
export function GET() {
  const perguntasPublicas = [
    {
      id: 1,
      nivel: "teste",
      pergunta: "Qual é o nome deste jogo?",
      opcoes: [
        "Show do Milhão - Geração Z",
        "Jogo da Velha",
        "Pac-Man",
        "Minecraft"
      ]
    }
  ];

  return Response.json({
    sucesso: true,
    total: perguntasPublicas.length,
    perguntas: perguntasPublicas,
    mensagem: "API de perguntas funcionando!"
  });
}
