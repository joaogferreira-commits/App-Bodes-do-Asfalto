import type { NomeIcone } from '@/ui';

/** As ferramentas do app, por grupo. "rota" é a tela que abre. */
export type Ferramenta = {
  chave: string;
  icone: NomeIcone;
  rota: string;
  cor: 'acao' | 'ouro' | 'verdePosto' | 'azulRio' | 'sos' | 'terra' | 'estrada';
};

export const gruposFerramentas: { grupo: string; itens: Ferramenta[] }[] = [
  {
    grupo: 'estrada',
    itens: [
      { chave: 'tempo', icone: 'sol', rota: '/ferramentas/tempo', cor: 'azulRio' },
      { chave: 'combustivel', icone: 'posto', rota: '/ferramentas/combustivel', cor: 'verdePosto' },
      { chave: 'bateVolta', icone: 'navegar', rota: '/rota', cor: 'acao' },
      { chave: 'viagem', icone: 'rota', rota: '/ferramentas/viagem', cor: 'acao' },
      { chave: 'checklist', icone: 'check', rota: '/ferramentas/checklist', cor: 'acao' },
      { chave: 'comboio', icone: 'reagrupar', rota: '/ferramentas/comboio', cor: 'estrada' },
    ],
  },
  {
    grupo: 'seguranca',
    itens: [
      { chave: 'telefones', icone: 'socorro', rota: '/ferramentas/lista/telefones', cor: 'sos' },
      { chave: 'ficha', icone: 'socorro', rota: '/ferramentas/ficha', cor: 'sos' },
      { chave: 'bodeAmigo', icone: 'sede', rota: '/ferramentas/lista/bodeAmigo', cor: 'ouro' },
    ],
  },
  {
    grupo: 'irmaos',
    itens: [
      { chave: 'agape', icone: 'agape', rota: '/ferramentas/agape', cor: 'ouro' },
      { chave: 'irmaosPerto', icone: 'aceno', rota: '/ferramentas/lista/irmaosPerto', cor: 'acao' },
      { chave: 'membros', icone: 'reagrupar', rota: '/ferramentas/lista/membros', cor: 'acao' },
      { chave: 'aniversarios', icone: 'calendario', rota: '/ferramentas/lista/aniversarios', cor: 'ouro' },
      { chave: 'negocios', icone: 'oficina', rota: '/negocios', cor: 'verdePosto' },
      { chave: 'classificados', icone: 'salvar', rota: '/classificados', cor: 'terra' },
    ],
  },
  {
    grupo: 'clube',
    itens: [
      { chave: 'lojas', icone: 'loja', rota: '/ferramentas/lista/lojas', cor: 'azulRio' },
      { chave: 'eventos', icone: 'calendario', rota: '/ferramentas/lista/eventos', cor: 'azulRio' },
      { chave: 'sobre', icone: 'sede', rota: '/ferramentas/sobre', cor: 'ouro' },
    ],
  },
  {
    grupo: 'moto',
    itens: [
      { chave: 'manutencao', icone: 'oficina', rota: '/ferramentas/manutencao', cor: 'terra' },
      { chave: 'meta', icone: 'trofeu', rota: '/ferramentas/meta', cor: 'ouro' },
    ],
  },
];

/** Ferramentas que hoje só têm dados de exemplo (sem tabela no servidor): ficam escondidas na versão com servidor. */
export const soExemplo = ['bodeAmigo', 'irmaosPerto', 'classificados', 'eventos', 'meta'];

/** Catálogo que o irmão vê: com o servidor ligado, sem as ferramentas só de exemplo e sem grupos vazios. */
export function ferramentasVisiveis(servidor: boolean) {
  if (!servidor) return gruposFerramentas;
  return gruposFerramentas
    .map((g) => ({ ...g, itens: g.itens.filter((i) => !soExemplo.includes(i.chave)) }))
    .filter((g) => g.itens.length > 0);
}
