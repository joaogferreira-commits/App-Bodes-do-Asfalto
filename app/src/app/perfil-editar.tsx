import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useAcesso } from '@/acesso/acesso';
import { Campo, TelaFerramenta } from '@/componentes/TelaFerramenta';
import type { Visibilidade } from '@/dados/perfil';
import { usePerfil, type MeuPerfil } from '@/estado/perfil';
import { escolherFoto } from '@/feed/foto';
import { espaco, useCores } from '@/theme';
import { Botao, Cartao, Chip, Texto } from '@/ui';

const visibilidades: Visibilidade[] = ['ninguem', 'amigos', 'membros'];
const camposMacom = ['loja', 'oriente', 'potencia'] as const;

/** Editar perfil: nome, apelido, cidade, foto e (opcional, com consentimento) Loja/Oriente/Potência com visibilidade. */
export default function EditarPerfil() {
  const { t } = useTranslation();
  const cores = useCores();
  const { perfil, salvarPerfil } = usePerfil();
  const acesso = useAcesso();
  const [p, setP] = useState<MeuPerfil>(perfil);
  const podeMacom = acesso.temConsentimento('dados_macons');

  return (
    <TelaFerramenta titulo={t('perfil.editar')}>
      <View style={{ alignItems: 'center', gap: espaco.sm }}>
        {p.foto && (
          <Image
            source={{ uri: p.foto }}
            style={{ width: 120, height: 120, borderRadius: 60 }}
            contentFit="cover"
            accessibilityLabel={t('perfilEditar.foto')}
          />
        )}
        <View style={{ flexDirection: 'row', gap: espaco.xs }}>
          <Botao
            titulo={t('publicar.camera')}
            icone="camera"
            variante="secundario"
            onPress={() => void escolherFoto('camera').then((u) => u && setP((a) => ({ ...a, foto: u })))}
          />
          <Botao
            titulo={t('publicar.galeria')}
            icone="camadas"
            variante="secundario"
            onPress={() => void escolherFoto('galeria').then((u) => u && setP((a) => ({ ...a, foto: u })))}
          />
        </View>
        {p.foto && (
          <Botao
            titulo={t('perfilEditar.usarAvatar')}
            variante="contorno"
            onPress={() => setP((a) => ({ ...a, foto: undefined }))}
          />
        )}
      </View>
      <Campo
        rotulo={t('acesso.form.nome')}
        valor={p.nome}
        aoMudar={(v) => setP((a) => ({ ...a, nome: v }))}
      />
      <Campo
        rotulo={t('acesso.form.apelido')}
        valor={p.apelido}
        aoMudar={(v) => setP((a) => ({ ...a, apelido: v }))}
      />
      <Campo
        rotulo={t('acesso.form.cidade')}
        valor={p.cidade}
        aoMudar={(v) => setP((a) => ({ ...a, cidade: v }))}
      />

      <Texto variante="rotulo">{t('perfil.maconaria')}</Texto>
      {podeMacom ? (
        camposMacom.map((k) => (
          <Cartao key={k} style={{ gap: espaco.xs }}>
            <Campo
              rotulo={t(`perfil.macom.${k}`)}
              valor={p.macom[k].valor}
              aoMudar={(v) =>
                setP((a) => ({ ...a, macom: { ...a.macom, [k]: { ...a.macom[k], valor: v } } }))
              }
            />
            <Texto variante="pequeno">{t('perfilEditar.quemVe')}</Texto>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
              {visibilidades.map((v) => (
                <Chip
                  key={v}
                  rotulo={t(`perfil.visibilidade.${v}`)}
                  ativo={p.macom[k].visibilidade === v}
                  onPress={() =>
                    setP((a) => ({ ...a, macom: { ...a.macom, [k]: { ...a.macom[k], visibilidade: v } } }))
                  }
                />
              ))}
            </View>
          </Cartao>
        ))
      ) : (
        <Cartao style={{ gap: espaco.sm, borderColor: cores.ouro }}>
          <Texto variante="secundario">{t('perfilEditar.precisaConsentimento')}</Texto>
          <Botao
            titulo={t('perfilEditar.autorizar')}
            variante="secundario"
            onPress={() => router.push('/acesso/meus-dados')}
          />
        </Cartao>
      )}
      <Texto variante="pequeno">{t('perfil.maconariaAviso')}</Texto>
      <Botao
        titulo={t('publicar.salvar')}
        grande
        icone="check"
        onPress={() => {
          salvarPerfil({ ...p, nome: p.nome.trim(), apelido: p.apelido.trim(), cidade: p.cidade.trim() });
          router.back();
        }}
      />
    </TelaFerramenta>
  );
}
