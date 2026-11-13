import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch, View } from 'react-native';

import { lerPosicaoAtual } from '@/componentes/posicaoAtual';
import { Campo, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { useRascunho } from '@/estado/rascunho';
import { arredondar, criarLoja, editarLoja, type DadosLoja } from '@/servidor/lojas';
import { recarregarClube, useLojas } from '@/servidor/useClube';
import { espaco, useCores } from '@/theme';
import { Botao, Cartao, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

type Form = DadosLoja & { declaro: boolean };
const VAZIO: Form = {
  nome: '',
  oriente: '',
  potencia: '',
  diasSessao: '',
  endereco: '',
  cidade: '',
  lat: null,
  lng: null,
  declaro: false,
};

/**
 * Cadastro (ou edição) de Loja por um irmão da própria Loja. Nasce em revisão; só a moderação aprova.
 * O irmão declara que é da Loja e aceita ser o contato (por aceno). Rascunho guardado no aparelho.
 */
export default function NovaLoja() {
  const { t } = useTranslation();
  const cores = useCores();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { lojas } = useLojas();
  const [f, setF, limpar] = useRascunho<Form>(`loja.${id ?? 'nova'}`, VAZIO);
  const [enviando, setEnviando] = useState(false);
  const preenchido = useRef(false);

  // Edição: carrega os dados da Loja uma vez, se não houver rascunho em andamento.
  useEffect(() => {
    if (!id || preenchido.current) return;
    const l = lojas.find((x) => x.id === id);
    if (!l) return;
    preenchido.current = true;
    setF((a) =>
      a.nome
        ? a
        : {
            nome: l.nome,
            oriente: l.oriente,
            potencia: l.potencia,
            diasSessao: l.diasSessao,
            endereco: l.endereco,
            cidade: l.cidade,
            lat: l.lat,
            lng: l.lng,
            declaro: true,
          },
    );
  }, [id, lojas, setF]);

  const muda = (k: keyof DadosLoja) => (v: string) => setF((a) => ({ ...a, [k]: v }));

  const marcar = async () => {
    const p = await lerPosicaoAtual();
    if (p === 'semPermissao') return avisar(t('lojas.semPermissao'));
    if (p === 'semGps') return avisar(t('lojas.semGps'));
    setF((a) => ({ ...a, lat: arredondar(p.lat), lng: arredondar(p.lng) }));
  };

  const enviar = async () => {
    const falta = [
      f.nome.trim().length < 2 && t('lojas.nome'),
      f.cidade.trim().length < 2 && t('lojas.cidade'),
    ].filter(Boolean);
    if (falta.length) return avisar(t('acesso.form.falta'), falta.join('\n'));
    if (!f.declaro) return avisar(t('lojas.declaroFalta'));
    setEnviando(true);
    try {
      if (id) await editarLoja(id, f);
      else await criarLoja(f);
      limpar();
      recarregarClube();
      avisar(t(id ? 'lojas.salvo' : 'lojas.enviado'));
      router.back();
    } catch (e) {
      const limite = (e as { message?: string } | null)?.message?.includes('limite_diario');
      avisar(t(limite ? 'lojas.limite' : 'lojas.erroEnviar'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <TelaFerramenta titulo={t(id ? 'lojas.editar' : 'lojas.nova')} explicacao={t('lojas.explicaForm')}>
      <Campo rotulo={t('lojas.nome')} valor={f.nome} aoMudar={muda('nome')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm }}>
        <Campo rotulo={t('lojas.oriente')} valor={f.oriente} aoMudar={muda('oriente')} />
        <Campo rotulo={t('lojas.potencia')} valor={f.potencia} aoMudar={muda('potencia')} />
      </View>
      <Campo rotulo={t('lojas.dias')} valor={f.diasSessao} aoMudar={muda('diasSessao')} />
      <Campo rotulo={t('lojas.endereco')} valor={f.endereco} aoMudar={muda('endereco')} />
      <Campo rotulo={t('lojas.cidade')} valor={f.cidade} aoMudar={muda('cidade')} />
      {f.lat != null && f.lng != null ? (
        <Cartao style={{ gap: espaco.sm }}>
          <Texto>{t('lojas.posicaoMarcada')}</Texto>
          <Botao
            titulo={t('lojas.tirarPosicao')}
            variante="contorno"
            onPress={() => setF((a) => ({ ...a, lat: null, lng: null }))}
          />
        </Cartao>
      ) : (
        <Botao
          titulo={t('lojas.posicao')}
          icone="localizacao"
          variante="secundario"
          onPress={() => void marcar()}
        />
      )}
      <Cartao style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
        <Texto variante="corpoForte" style={{ flex: 1 }}>
          {t('lojas.declaro')}
        </Texto>
        <Switch
          accessibilityLabel={t('lojas.declaro')}
          value={f.declaro}
          onValueChange={(v) => setF((a) => ({ ...a, declaro: v }))}
          trackColor={{ false: cores.linhaForte, true: cores.acao }}
        />
      </Cartao>
      <Botao
        titulo={t(id ? 'lojas.salvar' : 'lojas.enviar')}
        grande
        desativado={enviando}
        onPress={() => void enviar()}
      />
    </TelaFerramenta>
  );
}
