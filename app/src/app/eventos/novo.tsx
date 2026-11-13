import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { lerPosicaoAtual } from '@/componentes/posicaoAtual';
import { Campo, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { useRascunho } from '@/estado/rascunho';
import {
  TIPOS_EVENTO,
  arredondarPosicao,
  criarEvento,
  editarEvento,
  montarPeriodo,
  type TipoEvento,
} from '@/servidor/eventos';
import { recarregarClube, useEventos } from '@/servidor/useClube';
import { espaco } from '@/theme';
import { Botao, Cartao, Chip, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

type Form = {
  titulo: string;
  tipo: TipoEvento;
  dia: string;
  hora: string;
  horaFim: string;
  local: string;
  cidade: string;
  descricao: string;
  lat: number | null;
  lng: number | null;
};
const VAZIO: Form = {
  titulo: '',
  tipo: 'motoclube',
  dia: '',
  hora: '',
  horaFim: '',
  local: '',
  cidade: '',
  descricao: '',
  lat: null,
  lng: null,
};
const p2 = (n: number) => String(n).padStart(2, '0');

/** Cadastro (ou edição) de evento por qualquer irmão. Nasce em revisão; só a moderação aprova. Rascunho no aparelho. */
export default function NovoEvento() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { eventos } = useEventos();
  const [f, setF, limpar] = useRascunho<Form>(`evento.${id ?? 'novo'}`, VAZIO);
  const [enviando, setEnviando] = useState(false);
  const preenchido = useRef(false);

  // Edição: carrega os dados uma vez, se não houver rascunho em andamento.
  useEffect(() => {
    if (!id || preenchido.current) return;
    const e = eventos.find((x) => x.id === id);
    if (!e) return;
    preenchido.current = true;
    const ini = new Date(e.inicio);
    const fim = e.fim ? new Date(e.fim) : null;
    setF((a) =>
      a.titulo
        ? a
        : {
            titulo: e.titulo,
            tipo: e.tipo,
            dia: `${p2(ini.getDate())}/${p2(ini.getMonth() + 1)}/${ini.getFullYear()}`,
            hora: `${p2(ini.getHours())}:${p2(ini.getMinutes())}`,
            horaFim: fim ? `${p2(fim.getHours())}:${p2(fim.getMinutes())}` : '',
            local: e.local,
            cidade: e.cidade,
            descricao: e.descricao,
            lat: e.lat,
            lng: e.lng,
          },
    );
  }, [id, eventos, setF]);

  const muda = (k: keyof Form) => (v: string) => setF((a) => ({ ...a, [k]: v }));

  const marcar = async () => {
    const p = await lerPosicaoAtual();
    if (p === 'semPermissao') return avisar(t('eventos.semPermissao'));
    if (p === 'semGps') return avisar(t('eventos.semGps'));
    setF((a) => ({ ...a, lat: arredondarPosicao(p.lat), lng: arredondarPosicao(p.lng) }));
  };

  const enviar = async () => {
    const falta = [
      f.titulo.trim().length < 3 && t('eventos.nome'),
      f.cidade.trim().length < 2 && t('eventos.cidade'),
    ].filter(Boolean);
    if (falta.length) return avisar(t('acesso.form.falta'), falta.join('\n'));
    const periodo = montarPeriodo(f.dia, f.hora, f.horaFim);
    if (periodo === 'inicio') return avisar(t('eventos.dataInvalida'));
    if (periodo === 'fim') return avisar(t('eventos.fimInvalido'));
    setEnviando(true);
    try {
      const dados = { ...f, inicio: periodo.inicio, fim: periodo.fim };
      if (id) await editarEvento(id, dados);
      else await criarEvento(dados);
      limpar();
      recarregarClube();
      avisar(t(id ? 'eventos.salvo' : 'eventos.enviado'));
      router.back();
    } catch (e) {
      const limite = (e as { message?: string } | null)?.message?.includes('limite_diario');
      avisar(t(limite ? 'eventos.limite' : 'eventos.erroEnviar'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <TelaFerramenta titulo={t(id ? 'eventos.editar' : 'eventos.novo')} explicacao={t('eventos.explicaForm')}>
      <Campo rotulo={t('eventos.nome')} valor={f.titulo} aoMudar={(v) => muda('titulo')(v.slice(0, 120))} />
      <Texto variante="rotulo">{t('eventos.tipo')}</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
        {TIPOS_EVENTO.map((k) => (
          <Chip
            key={k}
            rotulo={t(`eventos.tipos.${k}`)}
            ativo={f.tipo === k}
            onPress={() => setF((a) => ({ ...a, tipo: k }))}
          />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm }}>
        <Campo
          rotulo={t('eventos.dia')}
          valor={f.dia}
          aoMudar={muda('dia')}
          teclado="numbers-and-punctuation"
        />
        <Campo
          rotulo={t('eventos.hora')}
          valor={f.hora}
          aoMudar={muda('hora')}
          teclado="numbers-and-punctuation"
        />
        <Campo
          rotulo={t('eventos.horaFim')}
          valor={f.horaFim}
          aoMudar={muda('horaFim')}
          teclado="numbers-and-punctuation"
        />
      </View>
      <Campo rotulo={t('eventos.local')} valor={f.local} aoMudar={(v) => muda('local')(v.slice(0, 160))} />
      <Campo rotulo={t('eventos.cidade')} valor={f.cidade} aoMudar={muda('cidade')} />
      <Campo
        rotulo={t('eventos.descricao')}
        valor={f.descricao}
        aoMudar={(v) => muda('descricao')(v.slice(0, 1000))}
        linhas={4}
      />
      {f.lat != null && f.lng != null ? (
        <Cartao style={{ gap: espaco.sm }}>
          <Texto>{t('eventos.posicaoMarcada')}</Texto>
          <Botao
            titulo={t('eventos.tirarPosicao')}
            variante="contorno"
            onPress={() => setF((a) => ({ ...a, lat: null, lng: null }))}
          />
        </Cartao>
      ) : (
        <Botao
          titulo={t('eventos.posicao')}
          icone="localizacao"
          variante="secundario"
          onPress={() => void marcar()}
        />
      )}
      <Texto variante="pequeno">{t('eventos.semPagamento')}</Texto>
      <Botao
        titulo={t(id ? 'eventos.salvar' : 'eventos.enviar')}
        grande
        desativado={enviando}
        onPress={() => void enviar()}
      />
    </TelaFerramenta>
  );
}
