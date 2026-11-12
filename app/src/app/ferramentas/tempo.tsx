import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { TelaFerramenta } from '@/componentes/TelaFerramenta';
import { buscarTempo, type Tempo } from '@/ferramentas/tempo';
import { espaco, useCores } from '@/theme';
import { Botao, Cartao, Icone, Texto } from '@/ui';

/** Tempo nas próximas horas (chuva, vento, temperatura) e nascer/pôr do sol, pelo Open-Meteo (grátis). */
export default function TelaTempo() {
  const { t } = useTranslation();
  const cores = useCores();
  const [tempo, setTempo] = useState<Tempo | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = async () => {
    setErro(null);
    const { granted } = await Location.requestForegroundPermissionsAsync().catch(() => ({ granted: false }));
    const p = granted ? await Location.getCurrentPositionAsync({}).catch(() => null) : null;
    if (!p) return setErro(t('rota.erros.semLocalizacao'));
    const r = await buscarTempo(p.coords.latitude, p.coords.longitude).catch(() => null);
    if (!r) return setErro(t('ferramentas.tempo.semRede'));
    setTempo(r);
  };

  useEffect(() => {
    void Promise.resolve().then(carregar);
    // carrega uma vez ao abrir
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <TelaFerramenta
      titulo={t('ferramentas.itens.tempo.titulo')}
      explicacao={t('ferramentas.itens.tempo.explicacao')}
    >
      {erro && (
        <>
          <Texto style={{ color: cores.alerta }}>{erro}</Texto>
          <Botao titulo={t('rota.tentarDeNovo')} variante="secundario" onPress={() => void carregar()} />
        </>
      )}
      {!tempo && !erro && <Texto variante="secundario">{t('ferramentas.tempo.carregando')}</Texto>}
      {tempo && (
        <>
          <Cartao destaque style={{ gap: espaco.sm }}>
            <Texto variante="rotulo">{t('ferramentas.tempo.agora')}</Texto>
            <Texto variante="numero">{tempo.horas[0]?.temperatura}°</Texto>
            {tempo.chuvaMaxima >= 50 && (
              <View style={{ flexDirection: 'row', gap: espaco.xs, alignItems: 'center' }}>
                <Icone nome="alerta" cor={cores.alerta} />
                <Texto style={{ color: cores.alerta, flex: 1 }}>
                  {t('ferramentas.tempo.chuvaAviso', { pct: tempo.chuvaMaxima })}
                </Texto>
              </View>
            )}
          </Cartao>
          <Cartao style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <View style={{ alignItems: 'center' }}>
              <Icone nome="sol" tamanho={28} cor={cores.ouro} />
              <Texto variante="subtitulo">{tempo.nascer}</Texto>
              <Texto variante="pequeno">{t('ferramentas.tempo.nascer')}</Texto>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Icone nome="lua" tamanho={28} cor={cores.estrada} />
              <Texto variante="subtitulo">{tempo.por}</Texto>
              <Texto variante="pequeno">{t('ferramentas.tempo.por')}</Texto>
            </View>
          </Cartao>
          <Texto variante="secundario">{t('ferramentas.tempo.chegarAntes', { hora: tempo.por })}</Texto>
          <Texto variante="rotulo">{t('ferramentas.tempo.proximas')}</Texto>
          {tempo.horas.map((h) => (
            <View
              key={h.hora}
              style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm, minHeight: 44 }}
            >
              <Texto variante="corpoForte" style={{ width: 60 }}>
                {h.hora}
              </Texto>
              <Texto style={{ width: 56 }}>{h.temperatura}°</Texto>
              <Icone nome="alerta" tamanho={18} cor={h.chuva >= 50 ? cores.alerta : cores.textoApagado} />
              <Texto style={{ width: 56 }}>{h.chuva}%</Texto>
              <Texto variante="secundario">{t('ferramentas.tempo.vento', { kmh: h.vento })}</Texto>
            </View>
          ))}
          <Texto variante="pequeno">{t('ferramentas.tempo.fonte')}</Texto>
        </>
      )}
    </TelaFerramenta>
  );
}
