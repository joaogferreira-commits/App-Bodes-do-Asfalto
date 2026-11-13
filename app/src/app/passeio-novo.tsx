import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useAcessoOpcional } from '@/acesso/acesso';
import { Campo, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { useRascunho } from '@/estado/rascunho';
import { clienteConsultas } from '@/servidor/consulta';
import { CHAVE_PASSEIOS, criarPasseio, montarData, podeCriarPasseio } from '@/servidor/passeios';
import { espaco } from '@/theme';
import { Botao, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

/** Criar passeio (diretoria do capítulo, diretoria geral e admin). Quem confirma "Vou" entra no grupo do passeio. */
export default function NovoPasseio() {
  const { t } = useTranslation();
  const papel = useAcessoOpcional()?.papel;
  const [titulo, setTitulo, limpaTitulo] = useRascunho('passeio.titulo', '');
  const [dia, setDia, limpaDia] = useRascunho('passeio.dia', '');
  const [hora, setHora, limpaHora] = useRascunho('passeio.hora', '');
  const [saida, setSaida, limpaSaida] = useRascunho('passeio.saida', '');
  const [destino, setDestino, limpaDestino] = useRascunho('passeio.destino', '');
  const [descricao, setDescricao, limpaDescricao] = useRascunho('passeio.descricao', '');
  const [salvando, setSalvando] = useState(false);

  if (!podeCriarPasseio(papel)) {
    return (
      <TelaFerramenta titulo={t('passeios.novo.titulo')}>
        <Texto>{t('passeios.novo.semPermissao')}</Texto>
      </TelaFerramenta>
    );
  }

  const publicar = async () => {
    if (titulo.trim().length < 3) return avisar(t('passeios.novo.faltaTitulo'));
    const data = montarData(dia, hora);
    if (!data) return avisar(t('passeios.novo.dataInvalida'));
    setSalvando(true);
    const ok = await criarPasseio({
      titulo,
      descricao,
      data,
      pontoEncontro: saida,
      destino,
    });
    setSalvando(false);
    if (!ok) return avisar(t('passeios.novo.erro'));
    [limpaTitulo, limpaDia, limpaHora, limpaSaida, limpaDestino, limpaDescricao].forEach((l) => l());
    void clienteConsultas.invalidateQueries({ queryKey: CHAVE_PASSEIOS });
    avisar(t('passeios.novo.criado'), t('passeios.novo.criadoTexto'));
    router.back();
  };

  return (
    <TelaFerramenta titulo={t('passeios.novo.titulo')} explicacao={t('passeios.novo.explicacao')}>
      <Campo rotulo={t('passeios.novo.nome')} valor={titulo} aoMudar={setTitulo} />
      <View style={{ flexDirection: 'row', gap: espaco.sm }}>
        <Campo
          rotulo={t('passeios.novo.dia')}
          valor={dia}
          aoMudar={setDia}
          teclado="numbers-and-punctuation"
        />
        <Campo
          rotulo={t('passeios.novo.hora')}
          valor={hora}
          aoMudar={setHora}
          teclado="numbers-and-punctuation"
        />
      </View>
      <Campo rotulo={t('passeios.novo.saida')} valor={saida} aoMudar={setSaida} />
      <Campo rotulo={t('passeios.novo.destino')} valor={destino} aoMudar={setDestino} />
      <Campo rotulo={t('passeios.novo.descricao')} valor={descricao} aoMudar={setDescricao} linhas={3} />
      <Texto variante="secundario">{t('passeios.novo.aviso')}</Texto>
      <Botao
        titulo={t('passeios.novo.publicar')}
        icone="mais"
        grande
        desativado={salvando}
        onPress={() => void publicar()}
      />
    </TelaFerramenta>
  );
}
