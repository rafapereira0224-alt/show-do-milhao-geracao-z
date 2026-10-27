import { useEffect, useState } from "react";
import { perguntasMilhao } from "./perguntasMilhao";
import { salvarPontuacao } from "./rankingService";
import Ranking from "./Ranking";
import "./ShowDoMilhao.css";

// ==========================================
// PREMIAÇÃO
// ==========================================

const PREMIOS = [
  1000, 2000, 3000, 4000, 5000, 15000, 25000, 35000, 45000, 55000, 155000,
  255000, 355000, 455000, 1000000,
];

const NIVEIS = [
  "facil",
  "facil",
  "facil",
  "facil",
  "facil",
  "medio",
  "medio",
  "medio",
  "medio",
  "medio",
  "dificil",
  "dificil",
  "dificil",
  "dificil",
  "impossivel",
];

const NOMES = {
  facil: "FÁCIL",
  medio: "MÉDIO",
  dificil: "DIFÍCIL",
  impossivel: "IMPOSSÍVEL",
};

const LETRAS = ["A", "B", "C", "D"];

const moeda = (valor) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(valor);

function embaralhar(array) {
  const novo = [...array];

  for (let i = novo.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [novo[i], novo[j]] = [novo[j], novo[i]];
  }

  return novo;
}

function novoBaralho() {
  return Object.fromEntries(
    ["facil", "medio", "dificil", "impossivel"].map((nivel) => [
      nivel,
      embaralhar(
        perguntasMilhao.filter((pergunta) => pergunta.nivel === nivel),
      ),
    ]),
  );
}

const AJUDAS_INICIAIS = {
  eliminar: false,
  revelar: false,
  plateia: false,
  pular: false,
};

export default function ShowDoMilhao({ onVoltar }) {
  // ==========================================
  // ESTADOS
  // ==========================================

  const [tela, setTela] = useState("menu");
  const [mostrarRegras, setMostrarRegras] = useState(false);

  const [baralho, setBaralho] = useState(novoBaralho);
  const [rodada, setRodada] = useState(0);

  const [pergunta, setPergunta] = useState(() => baralho.facil[0]);

  const [usadas, setUsadas] = useState(() => new Set([pergunta.id]));

  const [tempo, setTempo] = useState(30);
  const [estado, setEstado] = useState("jogando");
  const [escolha, setEscolha] = useState(null);
  const [ocultas, setOcultas] = useState([]);
  const [ajudas, setAjudas] = useState(AJUDAS_INICIAIS);
  const [votos, setVotos] = useState(null);
  const [mostrarResposta, setMostrarResposta] = useState(false);

  // Estados do ranking
  const [nomeJogador, setNomeJogador] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [pontuacaoSalva, setPontuacaoSalva] = useState(false);
  const [erroRanking, setErroRanking] = useState("");

  const premioAtual = PREMIOS[rodada];

  // Valor acumulado das perguntas acertadas
  const premioGarantido = rodada === 0 ? 0 : PREMIOS[rodada - 1];

  // Valor garantido ao errar ou acabar o tempo
  const premioAncora = rodada >= 10 ? PREMIOS[9] : rodada >= 5 ? PREMIOS[4] : 0;

  const terminou = ["perdeu", "parou", "ganhou"].includes(estado);

  const valorFinal =
    estado === "ganhou"
      ? 1000000
      : estado === "parou"
        ? premioGarantido
        : estado === "perdeu"
          ? premioAncora
          : 0;

  // Se perdeu, rodada representa os acertos anteriores.
  // Se ganhou, acertou as 15 perguntas.
  const totalAcertos = estado === "ganhou" ? 15 : rodada;

  // ==========================================
  // CRONÔMETRO
  // ==========================================

  useEffect(() => {
    if (tela !== "jogo" || estado !== "jogando") {
      return;
    }

    if (tempo <= 0) {
      setEstado("perdeu");
      return;
    }

    const timer = window.setTimeout(() => {
      setTempo((anterior) => anterior - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [tempo, estado, tela]);

  // ==========================================
  // INICIAR PARTIDA
  // ==========================================

  const iniciar = () => {
    const novo = novoBaralho();
    const primeira = novo.facil[0];

    setBaralho(novo);
    setPergunta(primeira);
    setUsadas(new Set([primeira.id]));

    setRodada(0);
    setTempo(30);
    setEstado("jogando");
    setEscolha(null);
    setOcultas([]);
    setAjudas({ ...AJUDAS_INICIAIS });
    setVotos(null);
    setMostrarResposta(false);

    setNomeJogador("");
    setSalvando(false);
    setPontuacaoSalva(false);
    setErroRanking("");

    setMostrarRegras(false);
    setTela("jogo");
  };

  const voltarMenu = () => {
    setTela("menu");
    setMostrarRegras(false);
  };

  // ==========================================
  // SISTEMA DE PERGUNTAS
  // ==========================================

  const escolherPergunta = (nivel, idsUsados) =>
    baralho[nivel].find((q) => !idsUsados.has(q.id));

  const responder = (indice) => {
    if (estado !== "jogando" || escolha !== null || ocultas.includes(indice)) {
      return;
    }

    setEscolha(indice);

    if (indice === pergunta.correta) {
      setEstado("acertou");
    } else {
      setEstado("perdeu");
    }
  };

  const proxima = () => {
    if (rodada === PREMIOS.length - 1) {
      setEstado("ganhou");
      return;
    }

    const seguinte = rodada + 1;

    const nova = escolherPergunta(NIVEIS[seguinte], usadas);

    if (!nova) return;

    setPergunta(nova);

    setUsadas((antigo) => new Set([...antigo, nova.id]));

    setRodada(seguinte);
    setTempo(30);
    setEscolha(null);
    setOcultas([]);
    setVotos(null);
    setMostrarResposta(false);
    setEstado("jogando");
  };

  // ==========================================
  // AJUDA 1: ELIMINAR DUAS
  // ==========================================

  const eliminar = () => {
    if (ajudas.eliminar || estado !== "jogando") {
      return;
    }

    const erradas = embaralhar(
      [0, 1, 2, 3].filter((i) => i !== pergunta.correta),
    );

    setOcultas(erradas.slice(0, 2));

    setAjudas((a) => ({
      ...a,
      eliminar: true,
    }));
  };

  // ==========================================
  // AJUDA 2: REVELAR RESPOSTA
  // ==========================================

  const revelar = () => {
    if (ajudas.revelar || estado !== "jogando") {
      return;
    }

    setMostrarResposta(true);

    setAjudas((a) => ({
      ...a,
      revelar: true,
    }));
  };

  // ==========================================
  // AJUDA 3: PLATEIA
  // ==========================================

  const consultarPlateia = () => {
    if (ajudas.plateia || estado !== "jogando") {
      return;
    }

    const resultados = [0, 0, 0, 0];

    const disponiveis = [0, 1, 2, 3].filter((i) => !ocultas.includes(i));

    const favorita =
      Math.random() < 0.72
        ? pergunta.correta
        : disponiveis[Math.floor(Math.random() * disponiveis.length)];

    resultados[favorita] = 45 + Math.floor(Math.random() * 31);

    let restante = 100 - resultados[favorita];

    const outras = embaralhar(disponiveis.filter((i) => i !== favorita));

    outras.forEach((i, pos) => {
      const valor =
        pos === outras.length - 1
          ? restante
          : Math.floor(Math.random() * (restante + 1));

      resultados[i] = valor;
      restante -= valor;
    });

    setVotos(resultados);

    setAjudas((a) => ({
      ...a,
      plateia: true,
    }));
  };

  // ==========================================
  // AJUDA 4: TROCAR PERGUNTA
  // ==========================================

  const pular = () => {
    if (ajudas.pular || estado !== "jogando") {
      return;
    }

    const nova = escolherPergunta(NIVEIS[rodada], usadas);

    if (!nova) return;

    setPergunta(nova);

    setUsadas((antigo) => new Set([...antigo, nova.id]));

    setOcultas([]);
    setVotos(null);
    setMostrarResposta(false);
    setTempo(30);
    setEscolha(null);

    setAjudas((a) => ({
      ...a,
      pular: true,
    }));
  };

  // ==========================================
  // SALVAR PONTUAÇÃO NO FIREBASE
  // ==========================================

  const registrarResultado = async (evento) => {
    evento.preventDefault();

    if (!terminou || pontuacaoSalva || salvando) {
      return;
    }

    const nome = nomeJogador.trim();

    if (nome.length < 2 || nome.length > 24) {
      setErroRanking("Digite um nome entre 2 e 24 caracteres.");
      return;
    }

    setSalvando(true);
    setErroRanking("");

    try {
      await salvarPontuacao(nome, valorFinal, totalAcertos);

      setPontuacaoSalva(true);
    } catch (erro) {
      console.error("Erro no ranking:", erro);

      setErroRanking(
        "Não foi possível salvar. Confira sua conexão e tente novamente.",
      );
    } finally {
      setSalvando(false);
    }
  };

  const mensagemFinal =
    estado === "ganhou"
      ? "🏆 VOCÊ É MILIONÁRIO!"
      : estado === "parou"
        ? "💰 VOCÊ PAROU!"
        : "FIM DE JOGO!";

  // ==========================================
  // RANKING
  // ==========================================

  if (tela === "ranking") {
    return <Ranking onVoltar={voltarMenu} />;
  }

  // ==========================================
  // MENU INICIAL
  // ==========================================

  if (tela === "menu") {
    return (
      <main className="milhao milhao--menu">
        <div className="milhao__particulas" aria-hidden="true" />

        <section className="milhao__menu">
          <div className="milhao__menu-topo">
            <span className="milhao__edicao">EDIÇÃO ESPECIAL</span>

            <div className="milhao__trofeu">🏆</div>

            <h1 className="milhao__titulo-inicial">
              SHOW DO
              <span>MILHÃO</span>
            </h1>

            <p className="milhao__subtitulo">GERAÇÃO Z</p>
          </div>

          <div className="milhao__menu-card">
            <p className="milhao__boas-vindas">
              Você conhece mesmo a Geração Z?
            </p>

            <p className="milhao__descricao">
              Teste seus conhecimentos sobre tecnologia, cultura, internet e
              comportamento em um desafio de 15 perguntas!
            </p>

            <div className="milhao__premio-inicial">
              <small>PRÊMIO MÁXIMO</small>
              <strong>R$ 1.000.000</strong>
              <span>Valor fictício do jogo</span>
            </div>

            <button className="milhao__jogar" onClick={iniciar}>
              ▶ JOGAR AGORA
            </button>

            <button
              className="milhao__ver-ranking"
              onClick={() => setTela("ranking")}
            >
              🏆 VER RANKING
            </button>

            <button
              className="milhao__regras-botao"
              onClick={() => setMostrarRegras(!mostrarRegras)}
            >
              {mostrarRegras ? "✕ FECHAR REGRAS" : "ⓘ COMO JOGAR"}
            </button>
          </div>

          {mostrarRegras && (
            <div className="milhao__regras">
              <h2>📜 Como jogar</h2>

              <p>
                Responda 15 perguntas sobre a Geração Z para conquistar o prêmio
                máximo de 1 milhão de reais fictícios.
              </p>

              <p>⏱️ Você tem 30 segundos para responder cada pergunta.</p>

              <p>📈 As perguntas ficam mais difíceis conforme você avança.</p>

              <h3>As quatro ajudas</h3>

              <p>
                <b>−2:</b> Elimina duas alternativas incorretas.
              </p>

              <p>
                <b>💡:</b> Revela a resposta correta.
              </p>

              <p>
                <b>▥:</b> Mostra uma votação simulada da plateia.
              </p>

              <p>
                <b>⇄:</b> Troca a pergunta atual.
              </p>

              <p>Cada ajuda pode ser usada uma vez por partida.</p>

              <p>
                💰 Ao parar, você leva o valor acumulado. Se errar ou o tempo
                acabar, recebe o prêmio garantido da última âncora conquistada:
                R$ 5.000 na pergunta 5 ou R$ 55.000 na pergunta 10.
              </p>
              <p>
                🏆 Ao terminar, digite seu nome para registrar a pontuação no
                ranking online.
              </p>
            </div>
          )}

          <div className="milhao__menu-rodape">
            <span>15 PERGUNTAS</span>
            <span>4 AJUDAS</span>
            <span>1 MILHÃO</span>
          </div>

          {onVoltar && (
            <button className="milhao__voltar-site" onClick={onVoltar}>
              ← VOLTAR AO SITE
            </button>
          )}
        </section>
      </main>
    );
  }

  // ==========================================
  // TELA DO JOGO
  // ==========================================

  return (
    <main className="milhao">
      <div className="milhao__particulas" aria-hidden="true" />

      <section className="milhao__painel">
        <header className="milhao__topo">
          <button
            className="milhao__icone"
            onClick={voltarMenu}
            title="Voltar ao menu"
          >
            ↩
          </button>

          <div className="milhao__marca">
            SHOW DO <strong>MILHÃO</strong>
            <small>EDIÇÃO GERAÇÃO Z</small>
          </div>

          <button
            className="milhao__icone"
            onClick={iniciar}
            title="Reiniciar partida"
          >
            ↻
          </button>
        </header>

        <div className="milhao__placar">
          <div
            className="milhao__relogio"
            aria-label={`Tempo restante: ${tempo} segundos`}
          >
            {tempo}
          </div>

          <div className="milhao__valor">
            {moeda(premioAtual)}
            <span>
              {rodada + 1} / {PREMIOS.length}
            </span>
          </div>

          <div className="milhao__etapa">{NOMES[NIVEIS[rodada]]}</div>
        </div>

        <div className="milhao__trilho">
          <span
            style={{
              width: `${((rodada + 1) / PREMIOS.length) * 100}%`,
            }}
          />
        </div>

        <div className="milhao__pergunta">
          <span>PERGUNTA {rodada + 1}</span>
          <h2>{pergunta.pergunta}</h2>
        </div>

        <div className="milhao__base">
          <div className="milhao__ajudas" aria-label="Ajudas disponíveis">
            <button
              onClick={eliminar}
              disabled={ajudas.eliminar || estado !== "jogando"}
              title="Eliminar duas alternativas"
            >
              −2
            </button>

            <button
              onClick={revelar}
              disabled={ajudas.revelar || estado !== "jogando"}
              title="Revelar a resposta correta"
            >
              💡
            </button>

            <button
              onClick={consultarPlateia}
              disabled={ajudas.plateia || estado !== "jogando"}
              title="Consultar plateia"
            >
              ▥
            </button>

            <button
              onClick={pular}
              disabled={ajudas.pular || estado !== "jogando"}
              title="Trocar pergunta"
            >
              ⇄
            </button>
          </div>

          {mostrarResposta && (
            <div className="milhao__dica">
              💡 Resposta: {LETRAS[pergunta.correta]}
              {" — "}
              {pergunta.opcoes[pergunta.correta]}
            </div>
          )}

          {votos && (
            <div className="milhao__votos">
              <strong>Votação simulada da plateia</strong>

              <div className="milhao__barras">
                {votos.map((n, i) => (
                  <div key={i}>
                    <span>{LETRAS[i]}</span>
                    <div>
                      <i style={{ height: `${n}%` }} />
                    </div>
                    <small>{n}%</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="milhao__opcoes">
            {pergunta.opcoes.map((opcao, i) => {
              const correta = estado !== "jogando" && i === pergunta.correta;

              const errada = escolha === i && i !== pergunta.correta;

              return (
                <button
                  key={i}
                  className={`milhao__opcao ${
                    correta ? "milhao__opcao--certa" : ""
                  } ${errada ? "milhao__opcao--errada" : ""}`}
                  onClick={() => responder(i)}
                  disabled={ocultas.includes(i) || estado !== "jogando"}
                >
                  {ocultas.includes(i) ? (
                    <span>—</span>
                  ) : (
                    <>
                      <b>{LETRAS[i]}:</b> {opcao}
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {estado === "acertou" && (
            <div className="milhao__feedback">
              <strong>✅ RESPOSTA CERTA!</strong>

              <p>Você conquistou {moeda(premioAtual)}!</p>

              <button onClick={proxima}>
                {rodada === 14 ? "🏆 RECEBER 1 MILHÃO" : "PRÓXIMA PERGUNTA →"}
              </button>
            </div>
          )}

          {terminou && (
            <div className="milhao__feedback">
              <strong>{mensagemFinal}</strong>

              {estado === "perdeu" && (
                <p>
                  Resposta correta: {LETRAS[pergunta.correta]}
                  {" — "}
                  {pergunta.opcoes[pergunta.correta]}
                </p>
              )}

              <p>
                Prêmio final: <b>{moeda(valorFinal)}</b>
              </p>

              <p>
                Perguntas acertadas: <b>{totalAcertos} de 15</b>
              </p>

              {!pontuacaoSalva ? (
                <form
                  className="milhao__salvar-form"
                  onSubmit={registrarResultado}
                >
                  <h3>🏆 ENTRE NO RANKING!</h3>

                  <p>Digite seu nome para registrar sua pontuação.</p>

                  <input
                    type="text"
                    placeholder="Seu nome"
                    value={nomeJogador}
                    maxLength={24}
                    onChange={(evento) => setNomeJogador(evento.target.value)}
                    disabled={salvando}
                    required
                    minLength={2}
                  />

                  {erroRanking && (
                    <p className="milhao__erro-ranking" role="alert">
                      {erroRanking}
                    </p>
                  )}

                  <button type="submit" disabled={salvando}>
                    {salvando ? "SALVANDO..." : "💾 SALVAR PONTUAÇÃO"}
                  </button>
                </form>
              ) : (
                <div className="milhao__salvo-sucesso" role="status">
                  ✅ Pontuação salva no ranking!
                </div>
              )}

              <button
                className="milhao__ir-ranking"
                onClick={() => setTela("ranking")}
              >
                🏆 VER RANKING
              </button>

              <button onClick={iniciar}>JOGAR NOVAMENTE</button>

              <button className="milhao__resultado-menu" onClick={voltarMenu}>
                VOLTAR AO MENU
              </button>
            </div>
          )}

          {estado === "jogando" && (
            <button
              className="milhao__parar"
              onClick={() => setEstado("parou")}
            >
              PARAR E LEVAR {moeda(premioGarantido)}
            </button>
          )}
        </div>
      </section>
    </main>
  );
}
