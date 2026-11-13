import { useTranslation } from 'react-i18next';

import { useMeusPosts } from '@/estado/meusPosts';
import type { AlvoDenuncia } from '@/servidor/feed';
import { avisar } from '@/ui/dialogo';

/** Denunciar e bloquear com confirmação (exigido pelas lojas), para posts e comentários de outros irmãos. */
export function useModeracao() {
  const { t } = useTranslation();
  const { denunciar, bloquear } = useMeusPosts();

  const confirmarDenuncia = (tipo: AlvoDenuncia, id: string) =>
    avisar(t('feed.denunciarPergunta'), t('feed.denunciarExplica'), [
      { text: t('comum.cancelar'), style: 'cancel' },
      {
        text: t('feed.denunciarConfirmar'),
        style: 'destructive',
        onPress: () => {
          denunciar(tipo, id, t('feed.motivoPadrao'))
            .then(() => avisar(t('feed.denunciar'), t('feed.denunciaRecebida')))
            .catch(() => avisar(t('feed.erroAcao')));
        },
      },
    ]);

  const confirmarBloqueio = (usuarioId: string, nome: string, depois?: () => void) =>
    avisar(t('feed.bloquearPergunta', { nome }), t('feed.bloquearExplica'), [
      { text: t('comum.cancelar'), style: 'cancel' },
      {
        text: t('feed.bloquearConfirmar'),
        style: 'destructive',
        onPress: () => {
          bloquear(usuarioId)
            .then(() => depois?.())
            .catch(() => avisar(t('feed.erroAcao')));
        },
      },
    ]);

  return { confirmarDenuncia, confirmarBloqueio };
}
