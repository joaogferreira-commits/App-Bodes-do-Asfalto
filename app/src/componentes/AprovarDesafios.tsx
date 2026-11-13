import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';

import { xpDoDesafio, type Desafio } from '@/dados/desafios';
import {
  CHAVE_DESAFIOS,
  carregarMeuProgresso,
  decidirDesafioServidor,
  desafiosParaAprovar,
} from '@/servidor/desafios';
import { clienteConsultas } from '@/servidor/consulta';
import { espaco, fontes, raios, useCores } from '@/theme';
import { Botao, Cartao, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

/**
 * Fila de desafios para a diretoria do capítulo, moderadores e admin (a RLS do banco só devolve o que
 * cada um pode decidir). Entre capítulos: cada diretoria aceita a sua parte.
 */
export function AprovarDesafios() {
  const { t } = useTranslation();
  const cores = useCores();
  const [lista, setLista] = useState<Desafio[] | null>(null);
  const [motivo, setMotivo] = useState<Record<string, string>>({});
  const [ocupado, setOcupado] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    const eu = await carregarMeuProgresso();
    setLista(await desafiosParaAprovar(eu.id));
  }, []);

  useEffect(() => {
    let vivo = true;
    void carregarMeuProgresso()
      .then((eu) => desafiosParaAprovar(eu.id))
      .then((l) => vivo && setLista(l))
      .catch(() => vivo && setLista([]));
    return () => {
      vivo = false;
    };
  }, []);

  const decidir = async (d: Desafio, aprovar: boolean) => {
    const m = (motivo[d.id] ?? '').trim();
    if (!aprovar && !m) return avisar(t('aprovacoes.motivoFalta'));
    setOcupado(d.id);
    const r = await decidirDesafioServidor(d.id, aprovar, aprovar ? undefined : m);
    setOcupado(null);
    if (!r.ok) return avisar(t('aprovacoes.erroDecidir'));
    await clienteConsultas.invalidateQueries({ queryKey: CHAVE_DESAFIOS });
    await carregar();
  };

  return (
    <View style={{ gap: espaco.sm }}>
      {lista === null && <Texto variante="secundario">{t('aprovacoes.carregando')}</Texto>}
      {lista?.length === 0 && (
        <Cartao>
          <Texto>{t('aprovacoes.desafiosVazio')}</Texto>
        </Cartao>
      )}
      {lista?.map((d) => (
        <Cartao key={d.id} style={{ gap: espaco.sm }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.xs }}>
            <Texto variante="rotulo" style={{ flex: 1, color: cores.acao }}>
              {t(`desafios.origem.${d.origem}`)}
            </Texto>
            <Texto style={{ fontFamily: fontes.titulo, fontSize: 22, color: cores.ouro }}>
              +{d.xpServidor ?? xpDoDesafio(d)} XP
            </Texto>
          </View>
          <Texto variante="destaque">{d.titulo}</Texto>
          <Texto variante="secundario">
            {t('aprovacoes.desafioPor', { nome: d.criador })} · {t(`desafios.meta.${d.tipo}`, { n: d.meta })}
          </Texto>
          {d.capitulos.length > 0 && <Texto variante="secundario">{d.capitulos.join(' × ')}</Texto>}
          <TextInput
            value={motivo[d.id] ?? ''}
            onChangeText={(v) => setMotivo((m) => ({ ...m, [d.id]: v.slice(0, 200) }))}
            placeholder={t('aprovacoes.motivoDesafio')}
            placeholderTextColor={cores.textoSec}
            accessibilityLabel={t('aprovacoes.motivoDesafio')}
            style={{
              minHeight: 52,
              borderWidth: 1,
              borderColor: cores.linha,
              borderRadius: raios.botao,
              paddingHorizontal: espaco.md,
              color: cores.texto,
              fontFamily: fontes.texto,
              fontSize: 17,
            }}
          />
          <View style={{ flexDirection: 'row', gap: espaco.xs }}>
            <View style={{ flex: 1 }}>
              <Botao
                titulo={t('aprovacoes.aprovarDesafio')}
                icone="check"
                desativado={ocupado === d.id}
                onPress={() => void decidir(d, true)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Botao
                titulo={t('aprovacoes.recusarDesafio')}
                variante="contorno"
                desativado={ocupado === d.id}
                onPress={() => void decidir(d, false)}
              />
            </View>
          </View>
        </Cartao>
      ))}
    </View>
  );
}
