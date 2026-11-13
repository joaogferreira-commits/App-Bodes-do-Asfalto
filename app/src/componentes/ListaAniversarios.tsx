import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Switch, View } from 'react-native';

import { Campo, TelaFerramenta } from '@/componentes/TelaFerramenta';
import {
  aniversariantes,
  aniversarioValido,
  removerAniversario,
  salvarAniversario,
} from '@/servidor/membros';
import { CHAVE_MEMBROS, CHAVE_MEU_ANIVERSARIO, useMembros, useMeuAniversario } from '@/servidor/useClube';
import { clienteConsultas } from '@/servidor/consulta';
import { espaco, useCores } from '@/theme';
import { Avatar, Botao, Cartao, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

const dd = (n: number) => String(n).padStart(2, '0');

/**
 * Aniversários do servidor. O irmão escolhe se mostra o próprio (só dia e mês; escondido por padrão);
 * a lista traz só quem escolheu mostrar.
 */
export function ListaAniversarios() {
  const { t } = useTranslation();
  const cores = useCores();
  const { membros, carregando } = useMembros();
  const { aniversario } = useMeuAniversario();
  // O que o irmão está digitando; até mexer, vale o que já está salvo no servidor.
  const [edicao, setEdicao] = useState<{ dia?: string; mes?: string; visivel?: boolean }>({});
  const dia = edicao.dia ?? (aniversario ? String(aniversario.dia) : '');
  const mes = edicao.mes ?? (aniversario ? String(aniversario.mes) : '');
  const visivel = edicao.visivel ?? aniversario?.visivel ?? false;
  const setDia = (v: string) => setEdicao((e) => ({ ...e, dia: v }));
  const setMes = (v: string) => setEdicao((e) => ({ ...e, mes: v }));
  const setVisivel = (v: boolean) => setEdicao((e) => ({ ...e, visivel: v }));
  const [salvando, setSalvando] = useState(false);

  const atualizar = () => {
    void clienteConsultas.invalidateQueries({ queryKey: CHAVE_MEU_ANIVERSARIO });
    void clienteConsultas.invalidateQueries({ queryKey: CHAVE_MEMBROS });
  };

  const salvar = async () => {
    const d = Number(dia);
    const m = Number(mes);
    if (!aniversarioValido(d, m)) return avisar(t('membros.aniv.invalido'));
    setSalvando(true);
    try {
      await salvarAniversario({ dia: d, mes: m, visivel });
      atualizar();
      avisar(t('membros.aniv.salvo'));
    } catch {
      avisar(t('membros.aniv.erro'));
    } finally {
      setSalvando(false);
    }
  };

  const remover = async () => {
    try {
      await removerAniversario();
      setEdicao({ dia: '', mes: '', visivel: false });
      atualizar();
      avisar(t('membros.aniv.removido'));
    } catch {
      avisar(t('membros.aniv.erro'));
    }
  };

  const lista = aniversariantes(membros);

  return (
    <TelaFerramenta
      titulo={t('ferramentas.itens.aniversarios.titulo')}
      explicacao={t('ferramentas.itens.aniversarios.explicacao')}
    >
      <Cartao style={{ gap: espaco.sm }}>
        <Texto variante="destaque">{t('membros.aniv.titulo')}</Texto>
        <Texto variante="secundario">{t('membros.aniv.explica')}</Texto>
        <View style={{ flexDirection: 'row', gap: espaco.sm }}>
          <Campo
            rotulo={t('membros.aniv.dia')}
            valor={dia}
            aoMudar={(v) => setDia(v.replace(/\D/g, '').slice(0, 2))}
            teclado="number-pad"
          />
          <Campo
            rotulo={t('membros.aniv.mes')}
            valor={mes}
            aoMudar={(v) => setMes(v.replace(/\D/g, '').slice(0, 2))}
            teclado="number-pad"
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm, minHeight: 56 }}>
          <Texto variante="corpoForte" style={{ flex: 1 }}>
            {t('membros.aniv.mostrar')}
          </Texto>
          <Switch
            accessibilityLabel={t('membros.aniv.mostrar')}
            value={visivel}
            onValueChange={setVisivel}
            trackColor={{ false: cores.linhaForte, true: cores.acao }}
          />
        </View>
        <Texto variante="pequeno">{t(visivel ? 'membros.aniv.visivel' : 'membros.aniv.escondido')}</Texto>
        <Botao titulo={t('membros.aniv.salvar')} desativado={salvando} onPress={() => void salvar()} />
        {!!aniversario && (
          <Botao titulo={t('membros.aniv.remover')} variante="contorno" onPress={() => void remover()} />
        )}
      </Cartao>

      <Texto variante="rotulo">{t('membros.aniv.lista')}</Texto>
      {carregando && <Texto variante="secundario">{t('membros.carregando')}</Texto>}
      {!carregando && lista.length === 0 && (
        <Texto variante="secundario">{t('membros.aniv.vazioLista')}</Texto>
      )}
      {lista.map(({ membro, dias }) => (
        <Cartao key={membro.id} style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
          <Avatar nome={membro.nome} tamanho={48} />
          <View style={{ flex: 1 }}>
            <Texto variante="destaque">{membro.apelido || membro.nome}</Texto>
            <Texto variante="secundario">{membro.capitulo || t('membros.semCapitulo')}</Texto>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Texto variante="corpoForte">
              {dd(membro.aniversario!.dia)}/{dd(membro.aniversario!.mes)}
            </Texto>
            <Texto variante="pequeno" style={dias === 0 ? { color: cores.ouro } : undefined}>
              {dias === 0
                ? t('membros.aniv.hoje')
                : dias === 1
                  ? t('membros.aniv.amanha')
                  : t('membros.aniv.emDias', { n: dias })}
            </Texto>
          </View>
        </Cartao>
      ))}
    </TelaFerramenta>
  );
}
