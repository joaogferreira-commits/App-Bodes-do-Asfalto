import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share, StyleSheet, TextInput, View } from 'react-native';

import { TelaFerramenta } from '@/componentes/TelaFerramenta';
import { normalizar } from '@/busca/buscar';
import { useMembros } from '@/servidor/useClube';
import { espaco, fontes, raios, toque, useCores } from '@/theme';
import { Avatar, Botao, Cartao, Icone, Texto } from '@/ui';

/** Lista de membros do servidor: nome, apelido e capítulo, visíveis a todos os membros aprovados. */
export function ListaMembros() {
  const { t } = useTranslation();
  const cores = useCores();
  const { carregando, erro, membros } = useMembros();
  const [filtro, setFiltro] = useState('');
  const itens = membros.filter(
    (m) => !filtro || normalizar(`${m.nome} ${m.apelido} ${m.capitulo}`).includes(normalizar(filtro)),
  );

  return (
    <TelaFerramenta
      titulo={t('ferramentas.itens.membros.titulo')}
      explicacao={t('ferramentas.itens.membros.explicacao')}
    >
      <Botao
        titulo={t('ferramentas.indicar')}
        icone="mais"
        onPress={() => void Share.share({ message: t('ferramentas.indicarTexto') })}
      />
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
      {carregando && <Texto variante="secundario">{t('membros.carregando')}</Texto>}
      {erro && <Texto variante="secundario">{t('membros.erro')}</Texto>}
      {!carregando && !erro && (
        <Texto variante="secundario">{t('membros.total', { n: membros.length })}</Texto>
      )}
      {!carregando && !erro && itens.length === 0 && (
        <Texto variante="secundario">{t('membros.vazio')}</Texto>
      )}
      {itens.map((m) => (
        <Cartao key={m.id} style={estilos.linha}>
          <Avatar nome={m.nome} tamanho={48} />
          <View style={{ flex: 1 }}>
            <Texto variante="destaque">{m.nome}</Texto>
            {!!m.apelido && <Texto variante="secundario">“{m.apelido}”</Texto>}
            <Texto variante="secundario">{m.capitulo || t('membros.semCapitulo')}</Texto>
          </View>
        </Cartao>
      ))}
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
});
