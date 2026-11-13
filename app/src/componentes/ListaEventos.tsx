import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { TelaFerramenta } from '@/componentes/TelaFerramenta';
import { normalizar } from '@/busca/buscar';
import { avisarResultadoAceno, enviarAceno } from '@/estado/avisoAceno';
import { useViagem } from '@/estado/viagem';
import { apagarEvento, type Evento } from '@/servidor/eventos';
import { recarregarClube, useEventos } from '@/servidor/useClube';
import { espaco, fontes, raios, toque, useCores } from '@/theme';
import { Botao, Cartao, Chip, Icone, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

/** "sáb., 29 nov., 19:00" no idioma do app; com hora de fim, "19:00 – 22:00". */
export function textoPeriodo(e: Pick<Evento, 'inicio' | 'fim'>, idioma: string) {
  const ini = new Date(e.inicio);
  const dia = ini.toLocaleDateString(idioma, { weekday: 'short', day: 'numeric', month: 'short' });
  const hora = (d: Date) => d.toLocaleTimeString(idioma, { hour: '2-digit', minute: '2-digit' });
  return `${dia}, ${hora(ini)}${e.fim ? ` – ${hora(new Date(e.fim))}` : ''}`;
}

const FILTROS = ['todos', 'loja', 'potencia', 'maconico', 'motoclube', 'outro'] as const;

/** Eventos com dados do servidor: aprovados que ainda não terminaram (e os meus, em revisão ou recusados). */
export function ListaEventos() {
  const { t, i18n } = useTranslation();
  const cores = useCores();
  const viagem = useViagem();
  const { carregando, erro, eventos } = useEventos();
  const [filtro, setFiltro] = useState('');
  const [tipo, setTipo] = useState<(typeof FILTROS)[number]>('todos');
  const itens = eventos
    .filter((e) => tipo === 'todos' || e.tipo === tipo)
    .filter(
      (e) =>
        !filtro ||
        normalizar(`${e.titulo} ${e.local} ${e.cidade} ${e.descricao}`).includes(normalizar(filtro)),
    );

  const rota = (e: Evento) => {
    if (e.lat == null || e.lng == null) return;
    viagem.definirBateVolta(null);
    viagem.definirDestino({ chave: 'busca', nome: e.titulo, posicao: { lat: e.lat, lng: e.lng } });
    router.push('/rota');
  };

  const apagar = (e: Evento) =>
    avisar(t('eventos.apagarTitulo'), t('eventos.apagarTexto'), [
      { text: t('comum.cancelar'), style: 'cancel' },
      {
        text: t('eventos.apagar'),
        style: 'destructive',
        onPress: () => void apagarEvento(e.id).then(recarregarClube, () => avisar(t('eventos.erroApagar'))),
      },
    ]);

  return (
    <TelaFerramenta
      titulo={t('ferramentas.itens.eventos.titulo')}
      explicacao={t('ferramentas.itens.eventos.explicacao')}
    >
      <Botao titulo={t('eventos.cadastrar')} icone="mais" onPress={() => router.push('/eventos/novo')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
        {FILTROS.map((k) => (
          <Chip key={k} rotulo={t(`eventos.tipos.${k}`)} ativo={tipo === k} onPress={() => setTipo(k)} />
        ))}
      </View>
      {eventos.length > 4 && (
        <View style={[estilos.busca, { borderColor: cores.linhaForte, backgroundColor: cores.superficie }]}>
          <Icone nome="busca" tamanho={20} cor={cores.textoSec} />
          <TextInput
            value={filtro}
            onChangeText={setFiltro}
            placeholder={t('ferramentas.filtrar')}
            placeholderTextColor={cores.textoApagado}
            accessibilityLabel={t('ferramentas.filtrar')}
            style={[estilos.entrada, { color: cores.texto }]}
          />
        </View>
      )}
      {carregando && <Texto variante="secundario">{t('eventos.carregando')}</Texto>}
      {erro && <Texto variante="secundario">{t('eventos.erro')}</Texto>}
      {!carregando && !erro && eventos.length === 0 && (
        <Texto variante="secundario">{t('eventos.vazio')}</Texto>
      )}
      {!carregando && eventos.length > 0 && itens.length === 0 && (
        <Texto variante="secundario">{t('busca.nada')}</Texto>
      )}
      {itens.map((e) => (
        <Cartao key={e.id} style={{ gap: espaco.sm }}>
          <View style={estilos.linha}>
            <Icone nome="calendario" tamanho={30} cor={cores.acao} />
            <View style={{ flex: 1 }}>
              <Texto variante="destaque">{e.titulo}</Texto>
              <Texto variante="secundario">{textoPeriodo(e, i18n.language)}</Texto>
            </View>
            <View style={[estilos.etiqueta, { backgroundColor: cores.superficie3, borderColor: cores.ouro }]}>
              <Texto variante="pequeno" style={{ color: cores.ouro }}>
                {e.status === 'aprovado' ? t(`eventos.tipos.${e.tipo}`) : t(`eventos.status.${e.status}`)}
              </Texto>
            </View>
          </View>
          <Texto variante="secundario">{[e.local, e.cidade].filter(Boolean).join(' · ')}</Texto>
          {!!e.descricao && <Texto>{e.descricao}</Texto>}
          {e.status === 'recusado' && !!e.motivoRecusa && (
            <Texto>{t('eventos.motivoRecusa', { motivo: e.motivoRecusa })}</Texto>
          )}
          <View style={estilos.acoes}>
            {!e.meu && e.status === 'aprovado' && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('eventos.acenar')}
                onPress={() =>
                  void enviarAceno(e.autorId).then((r) => avisarResultadoAceno(r, e.autorNome || e.titulo, t))
                }
                style={[estilos.acao, { borderColor: cores.linha }]}
              >
                <Icone nome="aceno" tamanho={20} cor={cores.acao} />
                <Texto style={estilos.textoAcao}>{t('eventos.acenar')}</Texto>
              </Pressable>
            )}
            {e.lat != null && e.lng != null && e.status === 'aprovado' && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('ferramentas.rotaAte', { lugar: e.titulo })}
                onPress={() => rota(e)}
                style={[estilos.acao, { borderColor: cores.acao }]}
              >
                <Icone nome="navegar" tamanho={18} cor={cores.acao} />
                <Texto style={[estilos.textoAcao, { color: cores.acao }]}>{t('eventos.rota')}</Texto>
              </Pressable>
            )}
            {e.meu && (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('eventos.editarBotao')}
                  onPress={() => router.push({ pathname: '/eventos/novo', params: { id: e.id } })}
                  style={[estilos.acao, { borderColor: cores.linha }]}
                >
                  <Icone nome="editar" tamanho={18} cor={cores.texto} />
                  <Texto style={estilos.textoAcao}>{t('eventos.editarBotao')}</Texto>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('eventos.apagar')}
                  onPress={() => apagar(e)}
                  style={[estilos.acao, { borderColor: cores.linha }]}
                >
                  <Icone nome="lixeira" tamanho={18} cor={cores.texto} />
                  <Texto style={estilos.textoAcao}>{t('eventos.apagar')}</Texto>
                </Pressable>
              </>
            )}
          </View>
        </Cartao>
      ))}
      <Texto variante="pequeno">{t('eventos.rodape')}</Texto>
    </TelaFerramenta>
  );
}

const estilos = StyleSheet.create({
  linha: { flexDirection: 'row', alignItems: 'center', gap: espaco.sm },
  busca: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espaco.xs,
    minHeight: toque.botao,
    paddingHorizontal: espaco.md,
    borderRadius: raios.botao,
    borderWidth: 1,
  },
  entrada: { flex: 1, fontSize: 17, fontFamily: fontes.textoMedio },
  etiqueta: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: raios.pilula, borderWidth: 1 },
  acoes: { flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs },
  acao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: raios.pilula,
    borderWidth: 1,
  },
  textoAcao: { fontFamily: fontes.textoSemi, fontSize: 15 },
});
