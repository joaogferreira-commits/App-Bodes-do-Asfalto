import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Share } from 'react-native';

import { useAcesso } from '@/acesso/acesso';
import { TelaFerramenta } from '@/componentes/TelaFerramenta';
import { Botao, Texto } from '@/ui';

import { ListaConsentimentos } from './consentimentos';
import { avisar } from '@/ui/dialogo';

/** "Meus dados" (LGPD): rever e revogar consentimentos, baixar uma cópia dos dados e excluir a conta. */
export default function MeusDados() {
  const { t } = useTranslation();
  const acesso = useAcesso();

  const baixar = async () => {
    const chaves = (await AsyncStorage.getAllKeys().catch(() => [] as string[])).filter((k) =>
      k.startsWith('bodes.'),
    );
    const pares = await AsyncStorage.multiGet(chaves).catch(() => []);
    const ler = (v: string | null): unknown => {
      if (v == null) return null;
      try {
        return JSON.parse(v);
      } catch {
        return v; // valores gravados como texto simples (ex.: tema)
      }
    };
    const dados = Object.fromEntries(pares.map(([k, v]) => [k, ler(v)]));
    await Share.share({
      message: JSON.stringify({ geradoEm: new Date().toISOString(), dados }, null, 2),
    }).catch(() => avisar(t('acesso.meusDados.erroBaixar')));
  };

  const excluir = () =>
    avisar(t('acesso.meusDados.excluirTitulo'), t('acesso.meusDados.excluirTexto'), [
      { text: t('comum.cancelar'), style: 'cancel' },
      {
        text: t('acesso.meusDados.excluirConfirmar'),
        style: 'destructive',
        onPress: () =>
          void acesso.excluirConta().then(() => {
            avisar(t('acesso.meusDados.excluida'));
            router.replace('/acesso/entrada');
          }),
      },
    ]);

  return (
    <TelaFerramenta titulo={t('acesso.meusDados.titulo')} explicacao={t('acesso.meusDados.explica')}>
      <Texto variante="rotulo">{t('acesso.meusDados.consentimentos')}</Texto>
      <ListaConsentimentos termosTravados />
      <Texto variante="pequeno">{t('acesso.meusDados.revogarAviso')}</Texto>
      <Botao
        titulo={t('acesso.meusDados.baixar')}
        icone="compartilhar"
        variante="secundario"
        grande
        onPress={() => void baixar()}
      />
      <Botao
        titulo={t('perfil.sair')}
        variante="contorno"
        onPress={() => {
          void acesso.sair().then(() => router.replace('/acesso/entrada'));
        }}
      />
      <Botao titulo={t('acesso.meusDados.excluir')} variante="sos" onPress={excluir} />
      <Texto variante="pequeno">{t('acesso.meusDados.encarregado')}</Texto>
    </TelaFerramenta>
  );
}
