import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { TelaFerramenta } from '@/componentes/TelaFerramenta';
import { normalizar } from '@/busca/buscar';
import { avisarResultadoAceno, enviarAceno } from '@/estado/avisoAceno';
import { useViagem } from '@/estado/viagem';
import { apagarLoja, type Loja } from '@/servidor/lojas';
import { recarregarClube, useLojas } from '@/servidor/useClube';
import { espaco, fontes, raios, toque, useCores } from '@/theme';
import { Botao, Cartao, Icone, Pino, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

/** Visitação de Lojas com dados do servidor: Lojas aprovadas (e as minhas em revisão). Contato por aceno. */
export function ListaLojas() {
  const { t } = useTranslation();
  const cores = useCores();
  const viagem = useViagem();
  const { carregando, erro, lojas } = useLojas();
  const [filtro, setFiltro] = useState('');
  const itens = lojas.filter(
    (l) =>
      !filtro || normalizar(`${l.nome} ${l.oriente} ${l.potencia} ${l.cidade}`).includes(normalizar(filtro)),
  );

  const rota = (l: Loja) => {
    if (l.lat == null || l.lng == null) return;
    viagem.definirBateVolta(null);
    viagem.definirDestino({ chave: 'busca', nome: l.nome, posicao: { lat: l.lat, lng: l.lng } });
    router.push('/rota');
  };

  const apagar = (l: Loja) =>
    avisar(t('lojas.apagarTitulo'), t('lojas.apagarTexto'), [
      { text: t('comum.cancelar'), style: 'cancel' },
      {
        text: t('lojas.apagar'),
        style: 'destructive',
        onPress: () => void apagarLoja(l.id).then(recarregarClube, () => avisar(t('lojas.erroApagar'))),
      },
    ]);

  return (
    <TelaFerramenta
      titulo={t('ferramentas.itens.lojas.titulo')}
      explicacao={t('ferramentas.itens.lojas.explicacao')}
    >
      <Botao titulo={t('lojas.cadastrar')} icone="mais" onPress={() => router.push('/lojas/nova')} />
      {lojas.length > 4 && (
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
      {carregando && <Texto variante="secundario">{t('lojas.carregando')}</Texto>}
      {erro && <Texto variante="secundario">{t('lojas.erro')}</Texto>}
      {!carregando && !erro && lojas.length === 0 && <Texto variante="secundario">{t('lojas.vazio')}</Texto>}
      {!carregando && lojas.length > 0 && itens.length === 0 && (
        <Texto variante="secundario">{t('busca.nada')}</Texto>
      )}
      {itens.map((l) => (
        <Cartao key={l.id} style={{ gap: espaco.sm }}>
          <View style={estilos.linha}>
            <Pino tipo="loja" descricao={l.nome} tamanho={40} />
            <View style={{ flex: 1 }}>
              <Texto variante="destaque">{l.nome}</Texto>
              <Texto variante="secundario">
                {[l.oriente, l.potencia, l.cidade].filter(Boolean).join(' · ')}
              </Texto>
            </View>
            {l.status !== 'aprovada' && (
              <View
                style={[estilos.etiqueta, { backgroundColor: cores.superficie3, borderColor: cores.ouro }]}
              >
                <Texto variante="pequeno" style={{ color: cores.ouro }}>
                  {t(`lojas.status.${l.status}`)}
                </Texto>
              </View>
            )}
          </View>
          {!!l.diasSessao && <Texto>{t('lojas.sessao', { dias: l.diasSessao })}</Texto>}
          {!!l.endereco && <Texto variante="secundario">{l.endereco}</Texto>}
          {!!l.contatoNome && (
            <Texto variante="secundario">{t('lojas.contato', { nome: l.contatoNome })}</Texto>
          )}
          {l.status === 'recusada' && !!l.motivoRecusa && (
            <Texto>{t('lojas.motivoRecusa', { motivo: l.motivoRecusa })}</Texto>
          )}
          <View style={estilos.acoes}>
            {!l.meu && !!l.contatoId && l.status === 'aprovada' && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('lojas.acenar')}
                onPress={() =>
                  void enviarAceno(l.contatoId!).then((r) =>
                    avisarResultadoAceno(r, l.contatoNome ?? l.nome, t),
                  )
                }
                style={[estilos.acao, { borderColor: cores.linha }]}
              >
                <Icone nome="aceno" tamanho={20} cor={cores.acao} />
                <Texto style={estilos.textoAcao}>{t('lojas.acenar')}</Texto>
              </Pressable>
            )}
            {l.lat != null && l.lng != null && l.status === 'aprovada' && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('ferramentas.rotaAte', { lugar: l.nome })}
                onPress={() => rota(l)}
                style={[estilos.acao, { borderColor: cores.acao }]}
              >
                <Icone nome="navegar" tamanho={18} cor={cores.acao} />
                <Texto style={[estilos.textoAcao, { color: cores.acao }]}>{t('lojas.rota')}</Texto>
              </Pressable>
            )}
            {l.meu && (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('lojas.editarBotao')}
                  onPress={() => router.push({ pathname: '/lojas/nova', params: { id: l.id } })}
                  style={[estilos.acao, { borderColor: cores.linha }]}
                >
                  <Icone nome="editar" tamanho={18} cor={cores.texto} />
                  <Texto style={estilos.textoAcao}>{t('lojas.editarBotao')}</Texto>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('lojas.apagar')}
                  onPress={() => apagar(l)}
                  style={[estilos.acao, { borderColor: cores.linha }]}
                >
                  <Icone nome="lixeira" tamanho={18} cor={cores.texto} />
                  <Texto style={estilos.textoAcao}>{t('lojas.apagar')}</Texto>
                </Pressable>
              </>
            )}
          </View>
        </Cartao>
      ))}
      <Texto variante="pequeno">{t('lojas.rodape')}</Texto>
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
