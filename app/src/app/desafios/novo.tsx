import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Campo, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { perfilExemplo } from '@/dados/perfil';
import { tiposDesafio, validarDesafio, xpDoDesafio, type TipoDesafio } from '@/dados/desafios';
import { useDesafios } from '@/estado/useDesafios';
import { espaco, fontes, useCores } from '@/theme';
import { Botao, Cartao, Chip, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

const prazos = [7, 30, 60, 90] as const;

/** Criar desafio de irmão: vai para aprovação da diretoria do capítulo ou de um moderador. */
export default function NovoDesafio() {
  const { t } = useTranslation();
  const cores = useCores();
  const ds = useDesafios();
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<TipoDesafio>('km');
  const [meta, setMeta] = useState('');
  const [dias, setDias] = useState<(typeof prazos)[number]>(30);
  const metaN = Number(meta.replace(/\D/g, '')) || 0;

  const enviar = () => {
    const inicio = new Date().toISOString().slice(0, 10);
    const fim = new Date(Date.now() + dias * 86400000).toISOString().slice(0, 10);
    const novo = {
      id: `des-${Date.now()}`,
      titulo: titulo.trim(),
      tipo,
      meta: metaN,
      origem: 'irmao' as const,
      criador: 'eu',
      capitulos: [perfilExemplo.capitulo],
      inicio,
      fim,
      situacao: 'aguardando' as const,
      participantes: 0,
    };
    const erro = validarDesafio(novo, ds.todos);
    if (erro) return avisar(t(`desafios.erros.${erro}`));
    ds.criar(novo);
    avisar(t('desafios.enviado'), t('desafios.aguardandoExplica'));
    router.back();
  };

  return (
    <TelaFerramenta titulo={t('desafios.criar')} explicacao={t('desafios.criarExplica')}>
      <Campo rotulo={t('desafios.campoTitulo')} valor={titulo} aoMudar={setTitulo} />
      <Texto variante="rotulo">{t('desafios.campoTipo')}</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
        {tiposDesafio.map((k) => (
          <Chip key={k} rotulo={t(`desafios.tipos.${k}`)} ativo={tipo === k} onPress={() => setTipo(k)} />
        ))}
      </View>
      <Campo
        rotulo={tipo === 'km' ? t('desafios.campoMetaKm') : t('desafios.campoMetaQtd')}
        valor={meta}
        aoMudar={setMeta}
        teclado="numeric"
        sufixo={tipo === 'km' ? 'km' : undefined}
      />
      <Texto variante="rotulo">{t('desafios.campoPrazo')}</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
        {prazos.map((p) => (
          <Chip key={p} rotulo={t('desafios.dias', { n: p })} ativo={dias === p} onPress={() => setDias(p)} />
        ))}
      </View>
      {metaN > 0 && (
        <Cartao style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
          <Texto style={{ flex: 1 }}>{t('desafios.valeXp')}</Texto>
          <Texto style={{ fontFamily: fontes.titulo, fontSize: 28, color: cores.ouro }}>
            +{xpDoDesafio({ tipo, meta: metaN, origem: 'irmao' })} XP
          </Texto>
        </Cartao>
      )}
      <Texto variante="pequeno">{t('desafios.regras')}</Texto>
      <Botao titulo={t('desafios.enviarAprovacao')} icone="check" grande onPress={enviar} />
    </TelaFerramenta>
  );
}
