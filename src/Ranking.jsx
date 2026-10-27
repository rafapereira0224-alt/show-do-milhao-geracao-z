
import { useEffect, useState } from "react";
import { buscarRanking } from "./rankingService";

const formatarMoeda = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(valor);

export default function Ranking({ onVoltar }) {
  const [jogadores, setJogadores] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregarRanking = async () => {
    setCarregando(true);
    setErro("");

    try {
      const resultados = await buscarRanking();
      setJogadores(resultados);
    } catch (error) {
      console.error("Erro ao buscar ranking:", error);
      setErro("Não foi possível carregar o ranking.");
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarRanking();
  }, []);

  const medalha = (posicao) => {
    if (posicao === 0) return "🥇";
    if (posicao === 1) return "🥈";
    if (posicao === 2) return "🥉";
    return `#${posicao + 1}`;
  };

  return (
    <main className="milhao">
      <div
        className="milhao__particulas"
        aria-hidden="true"
      />

      <section className="milhao__painel">
        <header className="milhao__topo">
          <button
            className="milhao__icone"
            onClick={onVoltar}
            title="Voltar ao menu"
          >
            ←
          </button>

          <div className="milhao__marca">
            SHOW DO <strong>MILHÃO</strong>
            <small>EDIÇÃO GERAÇÃO Z</small>
          </div>

          <div style={{ width: 52 }} />
        </header>

        <div className="milhao__ranking">
          <div className="milhao__ranking-cabecalho">
            <div className="milhao__ranking-trofeu">
              🏆
            </div>

            <h1>HALL DA FAMA</h1>

            <p>
              Os melhores jogadores da Geração Z!
            </p>
          </div>

          {carregando ? (
            <p className="milhao__ranking-aviso">
              Carregando ranking...
            </p>
          ) : erro ? (
            <div className="milhao__ranking-vazio">
              <p>{erro}</p>
              <button onClick={carregarRanking}>
                TENTAR NOVAMENTE
              </button>
            </div>
          ) : jogadores.length === 0 ? (
            <div className="milhao__ranking-vazio">
              <p>🎮 Nenhum jogador registrado ainda!</p>
              <p>Seja o primeiro a entrar no ranking!</p>
            </div>
          ) : (
            <div className="milhao__ranking-lista">
              {jogadores.map((jogador, index) => (
                <div
                  className={`milhao__ranking-item ${
                    index < 3
                      ? "milhao__ranking-destaque"
                      : ""
                  }`}
                  key={jogador.id}
                >
                  <div className="milhao__ranking-posicao">
                    {medalha(index)}
                  </div>

                  <div className="milhao__ranking-dados">
                    <strong>{jogador.nome}</strong>
                    <span>
                      {jogador.acertos} acertos
                    </span>
                  </div>

                  <div className="milhao__ranking-valor">
                    {formatarMoeda(jogador.pontuacao)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            className="milhao__ranking-atualizar"
            onClick={carregarRanking}
            disabled={carregando}
          >
            ↻ ATUALIZAR RANKING
          </button>

          <button
            className="milhao__ranking-voltar"
            onClick={onVoltar}
          >
            ← VOLTAR AO MENU
          </button>
        </div>
      </section>
    </main>
  );
}
