import { QueryClient } from '@tanstack/react-query';

/**
 * Cliente único do TanStack Query. Usado direto (sem provedor na árvore) para não mexer nas telas que ainda
 * guardam o estado à mão; novas consultas ao servidor passam por aqui.
 */
export const clienteConsultas = new QueryClient({
  defaultOptions: { queries: { retry: false, refetchOnWindowFocus: false } },
});
