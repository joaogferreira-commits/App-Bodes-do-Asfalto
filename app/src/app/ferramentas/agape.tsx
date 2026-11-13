import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useRascunho } from '@/estado/rascunho';
import { Campo, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { useAgapes } from '@/estado/agapes';
import { espaco } from '@/theme';
import { Botao, Chip, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

const horarios = ['30 min', '1 h', '2 h', '19h', '20h'];

/** Criar Ágape Relâmpago: aparece na hora no mapa (flutuando) e no feed. */
export default function CriarAgape() {
  const { t } = useTranslation();
  const { criar } = useAgapes();
  const [local, setLocal, limpaLocal] = useRascunho('agape.local', '');
  const [texto, setTexto, limpaTexto] = useRascunho('agape.texto', '');
  const [horario, setHorario, limpaHorario] = useRascunho('agape.horario', horarios[1]!);
  const [salvando, setSalvando] = useState(false);

  const publicar = async () => {
    if (!local.trim()) return avisar(t('ferramentas.agape.faltaLocal'));
    setSalvando(true);
    const { granted } = await Location.requestForegroundPermissionsAsync().catch(() => ({ granted: false }));
    const p = granted ? await Location.getCurrentPositionAsync({}).catch(() => null) : null;
    setSalvando(false);
    if (!p) return avisar(t('rota.erros.semLocalizacao'));
    criar({
      local: local.trim(),
      texto: texto.trim() || t('ferramentas.agape.textoPadrao'),
      horario,
      organizador: t('perfil.voce'),
      lat: p.coords.latitude,
      lng: p.coords.longitude,
    });
    limpaLocal();
    limpaTexto();
    limpaHorario();
    avisar(t('ferramentas.agape.publicado'), t('ferramentas.agape.publicadoTexto'));
    router.navigate('/');
  };

  return (
    <TelaFerramenta
      titulo={t('ferramentas.itens.agape.titulo')}
      explicacao={t('ferramentas.itens.agape.explicacao')}
    >
      <Campo rotulo={t('ferramentas.agape.local')} valor={local} aoMudar={setLocal} />
      <Texto variante="pequeno">{t('ferramentas.agape.quando')}</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
        {horarios.map((h) => (
          <Chip key={h} rotulo={h} ativo={horario === h} onPress={() => setHorario(h)} />
        ))}
      </View>
      <Campo rotulo={t('ferramentas.agape.recado')} valor={texto} aoMudar={setTexto} linhas={3} />
      <Texto variante="secundario">{t('ferramentas.agape.aviso')}</Texto>
      <Botao
        titulo={t('ferramentas.agape.publicar')}
        icone="agape"
        grande
        desativado={salvando}
        onPress={() => void publicar()}
      />
    </TelaFerramenta>
  );
}
