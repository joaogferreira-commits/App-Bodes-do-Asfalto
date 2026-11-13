import type { IrmaoExemplo, LugarExemplo } from '@/dados/exemplos';
import type { IrmaoAoVivo } from '@/servidor/aoVivo';
import type { NomeIcone } from '@/ui';

/**
 * Ficha que abre ao tocar num ícone do mapa (pedido do dono em 12/11/2026: "todos devem abrir algo
 * para interagir"). Aqui só os dados e as ações; o desenho fica em componentes/FichaMapa.tsx.
 * Regras: irmão NUNCA tem "Rota até ele" (a posição dele pode ser aproximada — LGPD); o contato
 * começa por aceno. Dados de exemplo até o cadastro real no painel.
 */
export type AcaoFicha =
  | 'rota'
  | 'acenar'
  | 'perfil'
  | 'informarPreco'
  | 'vitrine'
  | 'salvar'
  | 'vou'
  | 'falarContato'
  | 'site'
  | 'telefone';

export type LinhaFicha = { icone: NomeIcone; chave: string; valores?: Record<string, string | number> };

export type Ficha = {
  id: string;
  tipo: LugarExemplo['tipo'] | 'irmao';
  titulo: string;
  /** chave de tradução do subtítulo (tipo do lugar ou status do irmão) */
  subtitulo: string;
  subtituloValores?: Record<string, string | number>;
  linhas: LinhaFicha[];
  acoes: AcaoFicha[];
  posicao: { lat: number; lng: number };
  /** para "Ver vitrine": id do negócio no Guia */
  negocio?: string;
  /** página oficial da fonte (Rota Biker, OpenStreetMap) */
  link?: string;
  /** telefone do ponto (OpenStreetMap), para a ação "Ligar" */
  telefone?: string;
};

/** Negócio do Guia ligado a cada tipo de pino de exemplo. */
const negocioDoTipo: Partial<Record<LugarExemplo['tipo'], string>> = {
  oficina: 'oficina-bode',
  restaurante: 'churrascaria',
};

export function fichaDoLugar(l: LugarExemplo, precoInformado?: { valor: string; dia: string }): Ficha {
  const base = { id: l.id, tipo: l.tipo, titulo: l.nome, posicao: { lat: l.lat, lng: l.lng } };
  switch (l.tipo) {
    case 'posto': {
      const preco = precoInformado?.valor ?? l.rotulo?.replace('R$', '').trim();
      return {
        ...base,
        subtitulo: 'ficha.tipos.posto',
        linhas: [
          preco
            ? {
                icone: 'posto',
                chave: precoInformado ? 'ficha.precoIrmao' : 'ficha.precoExemplo',
                valores: { preco, dia: precoInformado?.dia ?? '' },
              }
            : { icone: 'posto', chave: 'ficha.semPreco' },
          { icone: 'check', chave: 'ficha.anpSemDados' },
        ],
        acoes: ['rota', 'informarPreco'],
      };
    }
    case 'sede':
      return {
        ...base,
        subtitulo: 'ficha.tipos.sede',
        linhas: [
          { icone: 'sede', chave: 'ficha.sedeEncontro' },
          { icone: 'reagrupar', chave: 'ficha.sedeAberta' },
        ],
        acoes: ['rota', 'salvar'],
      };
    case 'loja':
      return {
        ...base,
        subtitulo: 'ficha.tipos.loja',
        linhas: [
          { icone: 'calendario', chave: 'ficha.lojaSessoes' },
          { icone: 'cadeado', chave: 'ficha.lojaVisita' },
        ],
        acoes: ['rota', 'falarContato'],
      };
    case 'oficina':
    case 'restaurante':
      return {
        ...base,
        subtitulo: `ficha.tipos.${l.tipo}`,
        linhas: [{ icone: 'trofeu', chave: 'ficha.beneficioIrmaos' }],
        acoes: ['rota', 'vitrine'],
        negocio: negocioDoTipo[l.tipo],
      };
    case 'rotaBiker':
      return {
        ...base,
        subtitulo: l.numero ? 'ficha.tipos.rotaBikerN' : 'ficha.tipos.rotaBiker',
        subtituloValores: l.numero ? { n: l.numero } : undefined,
        linhas: [
          { icone: 'trofeu', chave: 'ficha.rotaBikerCarimbo' },
          { icone: 'compartilhar', chave: 'ficha.fonteRotaBiker' },
        ],
        acoes: ['rota', 'site'],
        link: l.link,
      };
    case 'sos':
    case 'socorro':
    case 'alerta':
    case 'agape':
      return { ...base, subtitulo: 'ficha.tipos.outro', linhas: [], acoes: ['rota'] };
    default: {
      // Pontos do OpenStreetMap (bundle ou banco): monumento, atração, cachoeira, hospital...
      const site = l.site;
      return {
        ...base,
        subtitulo: `ficha.tipos.${l.tipo}`,
        linhas: [{ icone: 'mapa', chave: 'ficha.fonteOsm' }],
        acoes: [
          'rota',
          ...(l.telefone ? (['telefone'] as const) : []),
          ...(site ? (['site'] as const) : []),
          'salvar',
        ],
        link: site ?? l.link,
        telefone: l.telefone,
      };
    }
  }
}

export function fichaDoIrmao(i: IrmaoExemplo): Ficha {
  const podeAcenar = i.status !== 'naoPerturbe';
  return {
    id: i.id,
    tipo: 'irmao',
    titulo: i.nome,
    subtitulo: `ficha.status.${i.status}`,
    linhas: [{ icone: 'localizacao', chave: 'ficha.posicaoAproximada' }],
    acoes: podeAcenar ? ['acenar', 'perfil'] : ['perfil'],
    posicao: { lat: i.lat, lng: i.lng },
  };
}

/** Ficha de um irmão real do mapa ao vivo: nome, apelido, capítulo e status; contato só por aceno. */
export function fichaDoIrmaoAoVivo(i: IrmaoAoVivo): Ficha {
  const podeAcenar = i.status !== 'naoPerturbe';
  const titulo = i.apelido || i.nome;
  const linhas: LinhaFicha[] = [];
  if (i.apelido) linhas.push({ icone: 'perfil', chave: 'ficha.nomeDe', valores: { nome: i.nome } });
  if (i.capitulo) linhas.push({ icone: 'sede', chave: 'ficha.capituloDe', valores: { nome: i.capitulo } });
  linhas.push({
    icone: 'localizacao',
    chave:
      i.precisao === 'exata'
        ? 'ficha.posicaoExata'
        : i.precisao === 'cidade'
          ? 'ficha.posicaoCidade'
          : 'ficha.posicaoAproximada',
  });
  return {
    id: i.id,
    tipo: 'irmao',
    titulo,
    subtitulo: `ficha.status.${i.status}`,
    linhas,
    acoes: podeAcenar ? ['acenar'] : [],
    posicao: { lat: i.lat, lng: i.lng },
  };
}

/** Limite de acenos por dia (antispam, regra do CLAUDE.md). */
export const ACENOS_POR_DIA = 10;

export type RegistroAcenos = { dia: string; para: string[] };

/** Devolve o novo registro, ou null se já acenou para ele hoje ou passou do limite. */
export function acenar(registro: RegistroAcenos, para: string, hoje: string): RegistroAcenos | null {
  const doDia = registro.dia === hoje ? registro.para : [];
  if (doDia.includes(para) || doDia.length >= ACENOS_POR_DIA) return null;
  return { dia: hoje, para: [...doDia, para] };
}

/** Preço digitado pelo irmão ("6,29", "6.29", "R$ 6,29") → "6,29"; inválido → null. */
export function lerPrecoCombustivel(texto: string): string | null {
  const n = Number(texto.replace(/[^\d,.]/g, '').replace(',', '.'));
  if (!Number.isFinite(n) || n < 2 || n > 20) return null;
  return n.toFixed(2).replace('.', ',');
}

export function fichaDoAgape(ag: {
  id: string;
  local: string;
  lat: number;
  lng: number;
  horario: string;
  organizador: string;
  vao: string[];
  texto: string;
}): Ficha {
  return {
    id: ag.id,
    tipo: 'agape',
    titulo: ag.local,
    subtitulo: 'ficha.tipos.agape',
    linhas: [
      { icone: 'comentario', chave: 'ficha.texto', valores: { texto: ag.texto } },
      { icone: 'calendario', chave: 'ficha.agapeHora', valores: { hora: ag.horario, quem: ag.organizador } },
      { icone: 'reagrupar', chave: 'ficha.agapeVao', valores: { n: ag.vao.length } },
    ],
    acoes: ['vou', 'rota'],
    posicao: { lat: ag.lat, lng: ag.lng },
  };
}
