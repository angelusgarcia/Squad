// Moderação automática de conteúdo (filtro local + Claude Haiku)

const BAD_WORDS = [
  'porra', 'caralho', 'krl', 'merda', 'bosta', 'puta', 'puto', 'putaria', 'foda', 'foder', 'fodase',
  'fodasse', 'fudido', 'fodido', 'fudeu', 'fodeu', 'fdp', 'vsf', 'pqp', 'tnc', 'cu', 'cuzao', 'cuzão',
  'buceta', 'arrombado', 'arrombada', 'corno', 'desgracado', 'desgraçado', 'caralha',
  'otario', 'otário', 'babaca', 'viado', 'piranha', 'vagabundo', 'vagabunda',
];

const normalize = (w) => w.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const BAD_SET = new Set(BAD_WORDS.map(normalize));

// Censura de palavrões
export function censor(text, extraWords = []) {
  if (!text) return { text, censored: [] };
  const extra = new Set(extraWords.map(normalize));
  const censored = [];
  const out = text.replace(/[\p{L}\p{N}@$*]+/gu, (word) => {
    const n = normalize(word);
    if (BAD_SET.has(n) || extra.has(n)) {
      censored.push(word);
      return word[0] + '★'.repeat(Math.max(word.length - 1, 2));
    }
    return word;
  });
  return { text: out, censored };
}

const RULES = `Você é o moderador automático do Squad, uma comunidade brasileira de jogos.
Analise o texto enviado por um usuário e responda SOMENTE com JSON neste formato:
{"decisao": "aprovar" | "bloquear", "spoiler": true | false, "palavroes": ["..."], "motivo": "frase curta em português"}

REGRAS
1. "spoiler": true quando o texto revela algo importante da história ou surpresa de um jogo:
   final, morte ou traição de personagem, identidade secreta, reviravolta, chefe final, segredo do enredo.
   NÃO é spoiler: opinião geral, dificuldade, gráficos, dicas de build/estratégia, nomes de chefes do começo,
   mecânicas do jogo, trilha sonora, desempenho.
2. "palavroes": liste as palavras EXATAMENTE como aparecem no texto que forem palavrões ou xingamentos,
   inclusive disfarçados (p0rra, c@ralho, f0da, pqp...). Lista vazia se não houver.
   Palavrões NÃO bloqueiam: eles só são censurados.
3. "decisao": "bloquear" SOMENTE para: discurso de ódio ou preconceito (raça, gênero, orientação, religião,
   deficiência), ameaça, assédio ou ataque pessoal grave a outro usuário, conteúdo sexual explícito,
   dados pessoais (telefone, endereço, CPF), golpe/spam com links suspeitos. Todo o resto: "aprovar".
4. Linguagem de jogo NÃO é violência: "matei o boss", "vou te destruir na ranked", "esse chefe é um lixo",
   "o jogo é horrível" são aceitáveis. Criticar um JOGO é permitido; atacar uma PESSOA de forma grave não é.
5. "motivo": explique em poucas palavras (ex.: "revela o final do jogo", "sem problemas", "ofensa racista").

EXEMPLOS
Texto: "Esse jogo é muito bom, a trilha sonora é incrível"
{"decisao":"aprovar","spoiler":false,"palavroes":[],"motivo":"sem problemas"}

Texto: "Chorei quando o Arthur morre no final do RDR2"
{"decisao":"aprovar","spoiler":true,"palavroes":[],"motivo":"revela a morte do protagonista no final"}

Texto: "Margit é fácil, usa as cinzas do lobo"
{"decisao":"aprovar","spoiler":false,"palavroes":[],"motivo":"dica de estratégia, não é spoiler"}

Texto: "Que p0rra de matchmaking, perdi 5 seguidas"
{"decisao":"aprovar","spoiler":false,"palavroes":["p0rra"],"motivo":"palavrão censurado"}

Texto: "A Marika e o Radagon são a mesma pessoa, que plot twist!"
{"decisao":"aprovar","spoiler":true,"palavroes":[],"motivo":"revela reviravolta da história"}

Texto: "Vou descobrir onde você mora e te pegar, seu lixo"
{"decisao":"bloquear","spoiler":false,"palavroes":[],"motivo":"ameaça a outro usuário"}

Texto: "Quem joga isso é tudo [termo preconceituoso contra um grupo]"
{"decisao":"bloquear","spoiler":false,"palavroes":[],"motivo":"discurso de ódio"}

Texto: "Me chama no zap 85 99999-1234 pra jogar"
{"decisao":"bloquear","spoiler":false,"palavroes":[],"motivo":"compartilha dados pessoais"}`;

async function askClaude(text, context) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: ctrl.signal,
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: process.env.MODERATION_MODEL || 'claude-haiku-5-5',
        max_tokens: 300,
        system: RULES,
        messages: [
          {
            role: 'user',
            content: `${context ? `Contexto: ${context}\n` : ''}Texto: "${text.slice(0, 3000)}"`,
          },
        ],
      }),
    });
    if (!res.ok) throw new Error(`Claude respondeu ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const raw = data.content?.map((c) => c.text || '').join('') || '';
    return JSON.parse(raw.slice(raw.indexOf('{'), raw.lastIndexOf('}') + 1));
  } finally {
    clearTimeout(timer);
  }
}

export class ModerationBlocked extends Error {
  constructor(reason) {
    super(`Sua mensagem não foi publicada: ${reason}. Revise e tente de novo.`);
    this.status = 422;
  }
}

// Moderar texto antes de salvar
export async function moderate({ text, title, spoiler = false, context }) {
  let verdict = null;
  if (process.env.ANTHROPIC_API_KEY && text?.trim()) {
    try {
      verdict = await askClaude(title ? `${title}\n\n${text}` : text, context);
    } catch (err) {
      console.warn('[moderação] IA indisponível, usando só o filtro local:', err.message, err.cause || '');
    }
  }

  if (verdict?.decisao === 'bloquear') {
    console.log(`[moderação] BLOQUEADO (${verdict.motivo}): "${text.slice(0, 80)}"`);
    throw new ModerationBlocked(verdict.motivo || 'conteúdo não permitido');
  }

  const extra = Array.isArray(verdict?.palavroes) ? verdict.palavroes : [];
  const body = censor(text, extra);
  const head = censor(title, extra);
  const aiSpoiler = verdict?.spoiler === true;

  if (aiSpoiler && !spoiler) console.log(`[moderação] spoiler marcado automaticamente (${verdict.motivo})`);

  return {
    text: body.text,
    title: head.text,
    spoiler: Boolean(spoiler) || aiSpoiler,
    spoilerAuto: !spoiler && aiSpoiler,
    censored: [...body.censored, ...head.censored],
  };
}
