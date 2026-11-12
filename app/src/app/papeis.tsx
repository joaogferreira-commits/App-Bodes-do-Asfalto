import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Pressable, View } from 'react-native';

import { Campo, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { definirPapel, irmaosComPapel, type IrmaoComPapel } from '@/servidor/auth';
import { espaco, useCores } from '@/theme';
import { Avatar, Cartao, Icone, Texto } from '@/ui';

const papeis = ['membro', 'diretoria_capitulo', 'diretoria_geral', 'moderador', 'admin'] as const;

/** Só o administrador (dono): escolhe quem é moderador, diretoria do capítulo ou diretoria geral. */
export default function Papeis() {
  const { t } = useTranslation();
  const cores = useCores();
  const [lista, setLista] = useState<IrmaoComPapel[] | null>(null);
  const [busca, setBusca] = useState('');

  const recarregar = () =>
    irmaosComPapel()
      .then(setLista)
      .catch(() => {
        setLista([]);
        Alert.alert(t('papeis.erroCarregar'));
      });

  useEffect(() => {
    let vivo = true;
    void irmaosComPapel()
      .then((l) => vivo && setLista(l))
      .catch(() => vivo && setLista([]));
    return () => {
      vivo = false;
    };
  }, []);

  const escolher = (i: IrmaoComPapel) =>
    Alert.alert(t('papeis.escolher', { nome: i.nome }), t('papeis.explicaPapeis'), [
      ...papeis
        .filter((p) => p !== 'admin' && p !== i.papel)
        .map((p) => ({
          text: t(`papeis.nomes.${p}`),
          onPress: () =>
            void definirPapel(i.id, p)
              .then(recarregar)
              .catch(() => Alert.alert(t('papeis.erroMudar'))),
        })),
      { text: t('comum.cancelar'), style: 'cancel' as const },
    ]);

  const filtrada = (lista ?? []).filter((i) =>
    `${i.nome} ${i.apelido ?? ''} ${i.capitulo}`.toLowerCase().includes(busca.trim().toLowerCase()),
  );

  return (
    <TelaFerramenta titulo={t('papeis.titulo')} explicacao={t('papeis.explica')}>
      <Campo rotulo={t('papeis.buscar')} valor={busca} aoMudar={setBusca} />
      {lista === null && <Texto variante="secundario">{t('aprovacoes.carregando')}</Texto>}
      {filtrada.map((i) => (
        <Pressable
          key={i.id}
          accessibilityRole="button"
          accessibilityLabel={`${i.nome}, ${t(`papeis.nomes.${i.papel}`)}`}
          disabled={i.papel === 'admin'}
          onPress={() => escolher(i)}
        >
          <Cartao style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.md }}>
            <Avatar nome={i.nome} tamanho={44} />
            <View style={{ flex: 1 }}>
              <Texto variante="destaque">{i.nome}</Texto>
              <Texto variante="secundario">
                {[i.capitulo, t(`papeis.nomes.${i.papel}`)].filter(Boolean).join(' · ')}
              </Texto>
            </View>
            {i.papel !== 'admin' && <Icone nome="direita" tamanho={22} cor={cores.textoSec} />}
          </Cartao>
        </Pressable>
      ))}
    </TelaFerramenta>
  );
}
