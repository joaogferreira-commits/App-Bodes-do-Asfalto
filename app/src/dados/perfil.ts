/**
 * Perfil de EXEMPLO até o cadastro real (Etapa 1). Dados maçônicos são opcionais, cada um com
 * a visibilidade escolhida pelo irmão (LGPD: dado sensível; nunca grau, ritual ou sinais).
 */
export type Visibilidade = 'ninguem' | 'amigos' | 'membros';

export const perfilExemplo = {
  nome: 'Irmão Teste',
  apelido: 'Bode Teste',
  capitulo: 'Cuiabá',
  cargo: 'membro' as const,
  desde: '2019',
  moto: {
    modelo: 'Harley-Davidson Fat Boy 114',
    ano: 2021,
    apelido: 'Velha Guerreira',
    imagem: require('../../assets/gerados/motos/moto-custom.webp'),
    kmNoApp: 3240,
  },
  numeros: { kmAno: 3240, viagens: 18, passeios: 7, selos: 2 },
  macom: [
    { chave: 'loja', valor: 'Loja Exemplo nº 00', visibilidade: 'amigos' as Visibilidade },
    { chave: 'oriente', valor: 'Cuiabá', visibilidade: 'membros' as Visibilidade },
    { chave: 'potencia', valor: '', visibilidade: 'ninguem' as Visibilidade },
  ],
  capituloInfo: { irmaos: 42, sede: 'Sede Cuiabá', diretor: 'Zé Ferreira', fundado: '2009' },
  visibilidadeMapa: 'aproximado' as const,
  contatos: 2,
};
