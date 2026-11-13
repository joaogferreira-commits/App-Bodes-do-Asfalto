/**
 * Ambiente da versão (definido por perfil em app/eas.json): development, preview ou production.
 * Avisos de "versão de teste" só aparecem fora de produção. Lido na hora (não no carregamento) para os testes.
 */
export const ehProducao = (): boolean => process.env.EXPO_PUBLIC_AMBIENTE === 'production';
