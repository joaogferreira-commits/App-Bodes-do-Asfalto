import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useAcesso } from '@/acesso/acesso';
import { nomesCapitulos } from '@/dados/capitulos';
import { Campo, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { escolherFoto } from '@/feed/foto';
import { espaco, raios } from '@/theme';
import { Botao, Chip, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

function FotoObrigatoria({
  rotulo,
  uri,
  aoEscolher,
}: {
  rotulo: string;
  uri?: string;
  aoEscolher: (u: string) => void;
}) {
  const { t } = useTranslation();
  return (
    <View style={{ gap: espaco.xs }}>
      <Texto variante="pequeno">{rotulo}</Texto>
      {uri && (
        <Image
          source={{ uri }}
          style={{ width: '100%', aspectRatio: 4 / 3, borderRadius: raios.cartao }}
          contentFit="cover"
          accessibilityLabel={rotulo}
        />
      )}
      <View style={{ flexDirection: 'row', gap: espaco.xs }}>
        <View style={{ flex: 1 }}>
          <Botao
            titulo={t('publicar.camera')}
            icone="camera"
            variante="secundario"
            onPress={() => void escolherFoto('camera').then((u) => u && aoEscolher(u))}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Botao
            titulo={t('publicar.galeria')}
            icone="camadas"
            variante="secundario"
            onPress={() => void escolherFoto('galeria').then((u) => u && aoEscolher(u))}
          />
        </View>
      </View>
    </View>
  );
}

/** Pedido de entrada (capítulo sem diretoria no app): foto com colete, carteirinha e quem indica. */
export default function Solicitacao() {
  const { t } = useTranslation();
  const acesso = useAcesso();
  const [f, setF] = useState({
    nome: '',
    apelido: '',
    capitulo: '',
    cidade: '',
    telefone: '',
    indicadoPor: '',
  });
  const [fotoColete, setFotoColete] = useState<string>();
  const [fotoCarteirinha, setFotoCarteirinha] = useState<string>();
  const muda = (k: keyof typeof f) => (v: string) => setF((a) => ({ ...a, [k]: v }));
  const faltando = [
    !f.nome.trim() && t('acesso.form.nome'),
    !f.capitulo && t('acesso.form.capitulo'),
    !f.cidade.trim() && t('acesso.form.cidade'),
    f.telefone.replace(/\D/g, '').length < 10 && t('acesso.form.telefone'),
    !fotoColete && t('acesso.form.fotoColete'),
    !fotoCarteirinha && t('acesso.form.fotoCarteirinha'),
    !f.indicadoPor.trim() && t('acesso.form.indicadoPor'),
  ].filter(Boolean) as string[];

  const enviar = () => {
    if (faltando.length) return avisar(t('acesso.form.falta'), faltando.join('\n'));
    void acesso
      .enviarSolicitacao({ ...f, fotoColete, fotoCarteirinha })
      .then(() => router.replace('/acesso/espera'))
      .catch(() => avisar(t('acesso.form.erroEnvio')));
  };

  return (
    <TelaFerramenta titulo={t('acesso.form.titulo')} explicacao={t('acesso.form.explica')}>
      <Campo rotulo={t('acesso.form.nome')} valor={f.nome} aoMudar={muda('nome')} />
      <Campo rotulo={t('acesso.form.apelido')} valor={f.apelido} aoMudar={muda('apelido')} />
      <Texto variante="pequeno">{t('acesso.form.capitulo')}</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
        {nomesCapitulos.map((c) => (
          <Chip key={c} rotulo={c} ativo={f.capitulo === c} onPress={() => muda('capitulo')(c)} />
        ))}
      </View>
      <Campo rotulo={t('acesso.form.cidade')} valor={f.cidade} aoMudar={muda('cidade')} />
      <Campo
        rotulo={t('acesso.form.telefone')}
        valor={f.telefone}
        aoMudar={muda('telefone')}
        teclado="phone-pad"
      />
      <FotoObrigatoria rotulo={t('acesso.form.fotoColete')} uri={fotoColete} aoEscolher={setFotoColete} />
      <FotoObrigatoria
        rotulo={t('acesso.form.fotoCarteirinha')}
        uri={fotoCarteirinha}
        aoEscolher={setFotoCarteirinha}
      />
      <Campo rotulo={t('acesso.form.indicadoPor')} valor={f.indicadoPor} aoMudar={muda('indicadoPor')} />
      <Texto variante="pequeno">{t('acesso.form.quemAprova')}</Texto>
      <Botao titulo={t('acesso.form.enviar')} grande icone="check" onPress={enviar} />
    </TelaFerramenta>
  );
}
