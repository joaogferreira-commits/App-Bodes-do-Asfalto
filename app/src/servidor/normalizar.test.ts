import { normalizarChave, normalizarUrl } from './supabase';

describe('endereço e chave do servidor colados pelo dono', () => {
  it('aceita o endereço com espaço, quebra de linha, barra, caminho e maiúsculas', () => {
    expect(normalizarUrl(' https://ItwzNmAbc.supabase.co/ \n')).toBe('https://itwznmabc.supabase.co');
    expect(normalizarUrl('https://abc123.supabase.co/rest/v1/')).toBe('https://abc123.supabase.co');
    expect(normalizarUrl('abc123.supabase.co')).toBe('https://abc123.supabase.co');
    expect(normalizarUrl('"https://abc123.supabase.co"')).toBe('https://abc123.supabase.co');
  });
  it('recusa o que não é endereço do Supabase', () => {
    expect(normalizarUrl('')).toBe('');
    expect(normalizarUrl('https://exemplo.com')).toBe('');
  });
  it('limpa a chave colada com espaços ou aspas', () => {
    expect(normalizarChave('  "sb_publishable_abcdefghijklmnopqrstuvwxyz"\n')).toBe(
      'sb_publishable_abcdefghijklmnopqrstuvwxyz',
    );
  });
});
