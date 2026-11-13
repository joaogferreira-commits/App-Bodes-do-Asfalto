import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share, View } from 'react-native';

import { useAcessoOpcional } from '@/acesso/acesso';
import { TelaFerramenta } from '@/componentes/TelaFerramenta';
import { tokenRegistrado } from '@/servidor/notificacoes';
import { enderecoCurto, testarConexao, type ResultadoPing } from '@/servidor/statusServidor';
import { pecasServidor, servidorConfigurado } from '@/servidor/supabase';
import { espaco, useCores } from '@/theme';
import { Botao, Cartao, Texto } from '@/ui';

function Linha({ titulo, ok, linhas }: { titulo: string; ok: boolean | null; linhas: string[] }) {
  const cores = useCores();
  // Verde = tudo certo; "alerta" (amarelo) = problema; neutro enquanto testa. Vermelho fica só para o SOS.
  const cor = ok === null ? cores.textoApagado : ok ? cores.verdePosto : cores.alerta;
  return (
    <Cartao style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
        <View accessible={false} style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: cor }} />
        <Texto variante="corpoForte" style={{ flex: 1 }}>
          {titulo}
        </Texto>
      </View>
      {linhas.map((l, i) => (
        <Texto key={i} variante="secundario">
          {l}
        </Texto>
      ))}
    </Cartao>
  );
}

/** Diagnóstico para o dono saber se o app instalado está mesmo falando com o servidor. Nunca mostra chaves nem e-mails. */
export default function StatusServidor() {
  const { t } = useTranslation();
  const acesso = useAcessoOpcional();
  const [ping, setPing] = useState<ResultadoPing | null>(null);
  const [pushLido, setPush] = useState<boolean | null>(null);
  const push = servidorConfigurado ? pushLido : false;

  const testar = useCallback(async () => {
    setPing(null);
    setPing(await testarConexao());
  }, []);

  useEffect(() => {
    let vivo = true;
    if (servidorConfigurado) {
      void testarConexao().then((r) => vivo && setPing(r));
      void tokenRegistrado().then((r) => vivo && setPush(r));
    }
    return () => {
      vivo = false;
    };
  }, []);

  const sim = (v: boolean) => t(v ? 'statusServidor.sim' : 'statusServidor.nao');
  const endereco = enderecoCurto();
  const pecas = `${t('statusServidor.pecaUrl')}: ${sim(pecasServidor.urlValida)} · ${t('statusServidor.pecaChave')}: ${sim(pecasServidor.chaveValida)}`;
  const modoServidor = acesso?.modo === 'supabase';
  const logado = !!acesso && acesso.estado !== 'deslogado' && acesso.estado !== 'carregando' && modoServidor;
  const ambiente = process.env.EXPO_PUBLIC_AMBIENTE || t('statusServidor.semAmbiente');
  const versao = Constants.expoConfig?.version ?? '';
  const situacao = acesso ? t(`statusServidor.situacoes.${acesso.estado}`) : '';
  const textoPing = !servidorConfigurado
    ? t('statusServidor.conexaoSemServidor')
    : !ping
      ? t('statusServidor.conexaoTestando')
      : ping.ok
        ? t('statusServidor.conexaoOk', { ms: ping.ms })
        : t('statusServidor.conexaoErro', { erro: ping.erro });

  const copiar = () => {
    const linhas = [
      t('statusServidor.diagnostico'),
      `${t('statusServidor.endereco')}: ${sim(servidorConfigurado)}${endereco ? ` (${endereco})` : ''}`,
      pecas,
      `${t('statusServidor.modo')}: ${t(modoServidor ? 'statusServidor.modoServidor' : 'statusServidor.modoLocal')}`,
      `${t('statusServidor.conexao')}: ${textoPing}`,
      `${t('statusServidor.sessao')}: ${sim(logado)}${logado ? `, ${t('statusServidor.papel', { papel: acesso?.papel ?? '-' })}, ${t('statusServidor.situacao', { situacao })}` : ''}`,
      `${t('statusServidor.notificacoes')}: ${sim(!!push)}`,
      `${t('statusServidor.versao')}: ${versao}, ${t('statusServidor.ambiente', { ambiente })}`,
    ];
    void Share.share({ message: linhas.join('\n') });
  };

  return (
    <TelaFerramenta titulo={t('statusServidor.titulo')} explicacao={t('statusServidor.explica')}>
      <Linha
        titulo={t('statusServidor.endereco')}
        ok={servidorConfigurado}
        linhas={[sim(servidorConfigurado), ...(endereco ? [endereco] : []), pecas]}
      />
      <Linha
        titulo={t('statusServidor.modo')}
        ok={modoServidor}
        linhas={[t(modoServidor ? 'statusServidor.modoServidor' : 'statusServidor.modoLocal')]}
      />
      <Linha
        titulo={t('statusServidor.conexao')}
        ok={!servidorConfigurado ? false : ping ? ping.ok : null}
        linhas={[textoPing]}
      />
      <Linha
        titulo={t('statusServidor.sessao')}
        ok={logado}
        linhas={
          logado
            ? [
                t('statusServidor.sessaoSim'),
                t('statusServidor.papel', { papel: acesso?.papel ?? '-' }),
                t('statusServidor.situacao', { situacao }),
              ]
            : [t('statusServidor.sessaoNao')]
        }
      />
      <Linha
        titulo={t('statusServidor.notificacoes')}
        ok={push}
        linhas={[
          push === null
            ? t('statusServidor.conexaoTestando')
            : t(push ? 'statusServidor.notifSim' : 'statusServidor.notifNao'),
        ]}
      />
      <Linha
        titulo={t('statusServidor.versao')}
        ok={true}
        linhas={[versao, t('statusServidor.ambiente', { ambiente })]}
      />
      <Botao titulo={t('statusServidor.testar')} icone="reagrupar" onPress={() => void testar()} />
      <Botao titulo={t('statusServidor.copiar')} variante="secundario" onPress={copiar} />
    </TelaFerramenta>
  );
}
