import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { useAcesso, type Finalidade } from '@/acesso/acesso';
import { TelaFerramenta } from '@/componentes/TelaFerramenta';
import { usePerfilOpcional } from '@/estado/perfil';
import { espaco, fontes, raios, useCores } from '@/theme';
import { Botao, Icone, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

const itens: { f: Finalidade; obrigatorio: boolean }[] = [
  { f: 'termos', obrigatorio: true },
  { f: 'localizacao', obrigatorio: false },
  { f: 'dados_macons', obrigatorio: false },
];

/**
 * Consentimentos LGPD separados (R50): cada um com o porquê, base legal e se é obrigatório.
 * Dados maçônicos são dado sensível (art. 5º, II): consentimento específico e destacado, revogável.
 */
export function ListaConsentimentos({ termosTravados }: { termosTravados?: boolean }) {
  const { t } = useTranslation();
  const cores = useCores();
  const acesso = useAcesso();
  const perfil = usePerfilOpcional();
  return (
    <View style={{ gap: espaco.sm }}>
      {itens.map(({ f, obrigatorio }) => {
        const ok = acesso.temConsentimento(f);
        return (
          <Pressable
            key={f}
            accessibilityRole="switch"
            accessibilityState={{ checked: ok }}
            accessibilityLabel={t(`acesso.consentimentos.${f}.titulo`)}
            disabled={termosTravados && f === 'termos'}
            onPress={() => {
              if (!ok) return acesso.consentir(f);
              if (f === 'dados_macons') {
                // Revogar apaga Loja, Oriente e Potência (igual ao banco): pede confirmação.
                return avisar(t('acesso.revogarMacomTitulo'), t('acesso.revogarMacomTexto'), [
                  { text: t('comum.cancelar'), style: 'cancel' },
                  {
                    text: t('acesso.revogarConfirmar'),
                    style: 'destructive',
                    onPress: () => {
                      acesso.revogar(f);
                      perfil?.apagarMacom();
                    },
                  },
                ]);
              }
              acesso.revogar(f);
            }}
            style={{
              gap: 6,
              padding: espaco.md,
              borderRadius: raios.cartao,
              borderWidth: ok ? 2 : 1,
              borderColor: ok ? cores.verdePosto : f === 'dados_macons' ? cores.ouro : cores.linha,
              backgroundColor: cores.superficie2,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  borderWidth: 2,
                  borderColor: ok ? cores.verdePosto : cores.linhaForte,
                  backgroundColor: ok ? cores.verdePosto : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {ok && <Icone nome="check" tamanho={20} cor={cores.fundo} espessura={3} />}
              </View>
              <Texto style={{ flex: 1, fontFamily: fontes.textoForte }}>
                {t(`acesso.consentimentos.${f}.titulo`)}
              </Texto>
              <Texto variante="pequeno" style={{ color: obrigatorio ? cores.acao : cores.textoSec }}>
                {obrigatorio ? t('acesso.obrigatorio') : t('acesso.opcional')}
              </Texto>
            </View>
            <Texto variante="secundario">{t(`acesso.consentimentos.${f}.texto`)}</Texto>
            <Texto variante="pequeno">{t(`acesso.consentimentos.${f}.base`)}</Texto>
            {termosTravados && f === 'termos' && (
              <Texto variante="pequeno">{t('acesso.termosTravados')}</Texto>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

/** Depois do login: aceitar os termos (obrigatório) e decidir sobre localização e dados maçônicos. */
export default function Consentimentos() {
  const { t } = useTranslation();
  const acesso = useAcesso();
  const seguir = () => {
    if (acesso.estado === 'membro') router.replace('/');
    else if (acesso.estado === 'pendente') router.replace('/acesso/espera');
    else router.replace('/acesso/solicitacao');
  };
  return (
    <TelaFerramenta titulo={t('acesso.consentimentosTitulo')} explicacao={t('acesso.consentimentosExplica')}>
      <ListaConsentimentos />
      <Botao
        titulo={t('acesso.continuar')}
        grande
        desativado={!acesso.temConsentimento('termos')}
        onPress={seguir}
      />
    </TelaFerramenta>
  );
}
