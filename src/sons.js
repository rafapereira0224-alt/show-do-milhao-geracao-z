
let contexto = null;
let somAtivado = true;

function obterContexto() {
  if (typeof window === "undefined") return null;

  const AudioContext =
    window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) return null;

  if (!contexto) {
    contexto = new AudioContext();
  }

  if (contexto.state === "suspended") {
    contexto.resume().catch(() => {});
  }

  return contexto;
}

function nota(
  frequencia,
  duracao = 0.15,
  atraso = 0,
  tipo = "sine",
  volume = 0.08
) {
  if (!somAtivado) return;

  const ctx = obterContexto();
  if (!ctx) return;

  const inicio = ctx.currentTime + atraso;

  const oscilador = ctx.createOscillator();
  const ganho = ctx.createGain();

  oscilador.type = tipo;
  oscilador.frequency.setValueAtTime(
    frequencia,
    inicio
  );

  ganho.gain.setValueAtTime(0.0001, inicio);

  ganho.gain.exponentialRampToValueAtTime(
    Math.max(volume, 0.0002),
    inicio + 0.015
  );

  ganho.gain.exponentialRampToValueAtTime(
    0.0001,
    inicio + duracao
  );

  oscilador.connect(ganho);
  ganho.connect(ctx.destination);

  oscilador.start(inicio);
  oscilador.stop(inicio + duracao + 0.02);
}

// ==========================================
// EFEITOS SONOROS
// ==========================================

export const sons = {
  iniciar() {
    nota(392, 0.16, 0, "triangle");
    nota(523.25, 0.16, 0.15, "triangle");
    nota(659.25, 0.18, 0.3, "triangle");
    nota(783.99, 0.4, 0.47, "triangle");
  },

  acertou() {
    nota(523.25, 0.13, 0, "sine");
    nota(659.25, 0.13, 0.12, "sine");
    nota(783.99, 0.32, 0.24, "triangle");
  },

  errou() {
    nota(392, 0.23, 0, "sawtooth", 0.035);
    nota(311.13, 0.24, 0.19, "sawtooth", 0.035);
    nota(196, 0.55, 0.38, "triangle");
  },

  relogio() {
    nota(880, 0.055, 0, "square", 0.025);
  },

  ajuda() {
    nota(650, 0.09, 0, "sine");
    nota(950, 0.15, 0.09, "sine");
  },

  clique() {
    nota(500, 0.045, 0, "triangle", 0.025);
  },

  premio() {
    nota(523.25, 0.12, 0, "triangle");
    nota(659.25, 0.12, 0.12, "triangle");
    nota(783.99, 0.2, 0.24, "triangle");
  },

  parar() {
    nota(440, 0.15, 0, "triangle");
    nota(523.25, 0.3, 0.15, "triangle");
  },

  // ========================================
  // NOVO — BATIDA DE CORAÇÃO
  // ========================================

  coracao() {
    // Duas batidas rápidas: TUM-TUM
    nota(75, 0.18, 0, "sine", 0.18);
    nota(105, 0.10, 0.04, "triangle", 0.045);

    nota(68, 0.22, 0.24, "sine", 0.16);
    nota(95, 0.10, 0.28, "triangle", 0.04);
  },

  // ========================================
  // NOVO — SUSPENSE
  // ========================================

  suspense() {
    nota(130.81, 0.7, 0, "triangle", 0.035);
    nota(138.59, 0.7, 0.4, "triangle", 0.035);
    nota(146.83, 0.7, 0.8, "triangle", 0.04);
  },

  // ========================================
  // NOVO — REVELAÇÃO DA RESPOSTA
  // ========================================

  revelacao() {
    nota(440, 0.12, 0, "triangle", 0.05);
    nota(659.25, 0.2, 0.12, "triangle", 0.06);
  },

  // ========================================
  // NOVO — DERROTA DRAMÁTICA
  // ========================================

  derrotaDramatica() {
    nota(392, 0.28, 0, "sawtooth", 0.035);
    nota(329.63, 0.3, 0.23, "sawtooth", 0.035);
    nota(261.63, 0.35, 0.48, "triangle", 0.065);
    nota(130.81, 0.85, 0.8, "sine", 0.09);
  },

  // ========================================
  // NOVO — COMEMORAÇÃO DE 1 MILHÃO
  // ========================================

  milhao() {
    const melodia = [
      [392, 0],
      [523.25, 0.16],
      [659.25, 0.32],
      [783.99, 0.48],
      [1046.5, 0.7],
      [783.99, 1],
      [1046.5, 1.2],
      [1318.51, 1.5],
      [1567.98, 1.8],
    ];

    melodia.forEach(([frequencia, atraso]) => {
      nota(
        frequencia,
        0.27,
        atraso,
        "triangle",
        0.09
      );
    });

    // Acorde final
    nota(523.25, 1.1, 2.1, "sine", 0.07);
    nota(659.25, 1.1, 2.1, "sine", 0.07);
    nota(783.99, 1.1, 2.1, "sine", 0.07);
    nota(1046.5, 1.1, 2.1, "triangle", 0.08);
  },

  // ========================================
  // NOVO — DINHEIRO / JACKPOT
  // ========================================

  dinheiro() {
    for (let i = 0; i < 7; i++) {
      const frequencia = 800 + i * 120;

      nota(
        frequencia,
        0.09,
        i * 0.11,
        "sine",
        0.045
      );
    }
  },
};

// ==========================================
// ATIVAR / DESATIVAR ÁUDIO
// ==========================================

export function alternarSom() {
  somAtivado = !somAtivado;
  return somAtivado;
}

export function somEstaAtivado() {
  return somAtivado;
}
