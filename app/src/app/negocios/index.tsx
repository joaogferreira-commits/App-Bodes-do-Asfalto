import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { registrarEvento } from '@/comercial/contadores';
import { TelaFerramenta } from '@/componentes/TelaFerramenta';
import {
  categoriasNegocio,
  negociosExemplo,
  ordenarGuia,
  planoVigente,
  type CategoriaNegocio,
} from '@/dados/negocios';
import { useClubeNoServidor, useNegociosServidor } from '@/servidor/useClube';
import { espaco, fontes, raios, useCores } from '@/theme';
import { Botao, Chip, Icone, Texto } from '@/ui';

/** Guia de Negócios de irmãos: benefício para irmãos em destaque; parceiros identificados com selo dourado. */
export default function Guia() {
  const { t } = useTranslation();
  const cores = useCores();
  const [cat, setCat] = useState<CategoriaNegocio | 'todos'>('todos');
  const servidor = useClubeNoServidor();
  const real = useNegociosServidor();
  const fonte = servidor ? real.guia : negociosExemplo;
  const lista = ordenarGuia(fonte).filter((n) => cat === 'todos' || n.categoria === cat);

  return (
    <TelaFerramenta titulo={t('negocios.titulo')} explicacao={t('negocios.explica')}>
      <Botao
        titulo={t('negocios.souMembro')}
        icone="perfil"
        variante="secundario"
        onPress={() => router.push('/sou-membro')}
      />
      {servidor && (
        <Botao titulo={t('negocios.cadastrar')} icone="mais" onPress={() => router.push('/negocios/novo')} />
      )}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
        {(['todos', ...categoriasNegocio] as const).map((k) => (
          <Chip key={k} rotulo={t(`negocios.categorias.${k}`)} ativo={cat === k} onPress={() => setCat(k)} />
        ))}
      </View>
      {servidor && real.carregando && <Texto variante="secundario">{t('negocios.carregando')}</Texto>}
      {servidor && real.erro && <Texto variante="secundario">{t('negocios.erro')}</Texto>}
      {servidor && !real.carregando && !real.erro && fonte.length === 0 && (
        <Texto variante="secundario">{t('negocios.vazio')}</Texto>
      )}
      {lista.map((n) => {
        const parceiro = planoVigente(n) !== 'gratis';
        if (parceiro && !servidor) registrarEvento(n.id, 'visto');
        const rotuloDestaque = t(servidor ? 'negocios.destaque' : 'negocios.parceiro');
        return (
          <Pressable
            key={n.id}
            accessibilityRole="button"
            accessibilityLabel={`${n.nome}${parceiro ? `, ${rotuloDestaque}` : ''}. ${n.beneficio}`}
            onPress={() => router.push(`/negocios/${n.id}`)}
            style={({ pressed }) => ({
              borderRadius: raios.cartao,
              borderWidth: parceiro ? 2 : 1,
              borderColor: parceiro ? cores.ouro : cores.linha,
              backgroundColor: cores.superficie2,
              overflow: 'hidden',
              opacity: pressed ? 0.85 : 1,
            })}
          >
            {n.fotos[0] != null && (
              <Image
                source={n.fotos[0]}
                style={{ width: '100%', aspectRatio: 2.4 }}
                contentFit="cover"
                accessible={false}
              />
            )}
            {parceiro && (
              <View
                style={{
                  position: 'absolute',
                  top: espaco.xs,
                  left: espaco.xs,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 4,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: raios.pilula,
                  backgroundColor: cores.ouro,
                }}
              >
                <Icone nome="check" tamanho={14} cor={cores.textoSobreOuro} espessura={3} />
                <Texto style={{ color: cores.textoSobreOuro, fontFamily: fontes.textoForte, fontSize: 15 }}>
                  {rotuloDestaque}
                </Texto>
              </View>
            )}
            <View style={{ padding: espaco.md, gap: 4 }}>
              <Texto variante="destaque">{n.nome}</Texto>
              <Texto variante="secundario">
                {t(`negocios.categorias.${n.categoria}`)} · {n.cidade}
                {n.status && n.status !== 'aprovado' ? ` · ${t(`negocios.status.${n.status}`)}` : ''}
              </Texto>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Icone nome="trofeu" tamanho={18} cor={cores.verdePosto} />
                <Texto style={{ flex: 1, fontFamily: fontes.textoSemi, color: cores.texto }}>
                  {n.beneficio}
                </Texto>
              </View>
            </View>
          </Pressable>
        );
      })}
      <Texto variante="pequeno">{t('negocios.rodape')}</Texto>
    </TelaFerramenta>
  );
}
