import { useQuery } from '@tanstack/react-query';

import { useAcessoOpcional } from '@/acesso/acesso';
import { passeiosExemplo, type Passeio } from '@/dados/passeios';

import { clienteConsultas } from './consulta';
import { CHAVE_PASSEIOS, listarPasseios, podeCriarPasseio } from './passeios';
import { servidorConfigurado } from './supabase';

const VAZIO: Passeio[] = [];

/**
 * Passeios da aba e do feed: do servidor quando o irmão é membro aprovado; só no modo local entram os de exemplo.
 * `podeCriar`: diretoria (capítulo ou geral) e admin no servidor; no modo local o botão continua como aviso.
 */
export function usePasseios(): { passeios: Passeio[]; servidor: boolean; podeCriar: boolean } {
  const acesso = useAcessoOpcional();
  const servidor = servidorConfigurado && acesso?.modo === 'supabase' && acesso.estado === 'membro';
  const consulta = useQuery(
    { queryKey: CHAVE_PASSEIOS, queryFn: () => listarPasseios(), enabled: servidor, staleTime: 30_000 },
    clienteConsultas,
  );
  if (!servidor)
    return {
      passeios: servidorConfigurado ? VAZIO : passeiosExemplo,
      servidor: false,
      podeCriar: !servidorConfigurado,
    };
  return { passeios: consulta.data ?? VAZIO, servidor: true, podeCriar: podeCriarPasseio(acesso?.papel) };
}
