import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Campo, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { MAX_CONTATOS, usePerfil } from '@/estado/perfil';
import { espaco, useCores } from '@/theme';
import { Botao, Cartao, Icone, Texto } from '@/ui';
import { avisar } from '@/ui/dialogo';

/** Contatos de emergência: até 3, recebem o SOS. Só você vê (nem a diretoria nem a moderação). */
export default function Contatos() {
  const { t } = useTranslation();
  const cores = useCores();
  const { contatos, salvarContato, apagarContato } = usePerfil();
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const cheio = contatos.length >= MAX_CONTATOS;

  const adicionar = () => {
    if (!nome.trim() || telefone.replace(/\D/g, '').length < 10) return avisar(t('contatos.falta'));
    if (salvarContato({ nome: nome.trim(), telefone: telefone.trim() })) {
      setNome('');
      setTelefone('');
    }
  };

  return (
    <TelaFerramenta titulo={t('contatos.titulo')} explicacao={t('contatos.explica')}>
      <Cartao style={{ flexDirection: 'row', gap: espaco.sm, alignItems: 'center' }}>
        <Icone nome="cadeado" cor={cores.verdePosto} />
        <Texto variante="secundario" style={{ flex: 1 }}>
          {t('contatos.privado')}
        </Texto>
      </Cartao>
      {contatos.map((c) => (
        <Cartao key={c.id} style={{ flexDirection: 'row', alignItems: 'center', gap: espaco.sm }}>
          <Icone nome="socorro" cor={cores.sos} />
          <View style={{ flex: 1 }}>
            <Texto variante="corpoForte">{c.nome}</Texto>
            <Texto variante="secundario">{c.telefone}</Texto>
          </View>
          <Botao
            titulo={t('comentarios.apagar')}
            variante="contorno"
            onPress={() =>
              avisar(t('contatos.apagarPergunta', { nome: c.nome }), undefined, [
                { text: t('comum.cancelar'), style: 'cancel' },
                { text: t('comentarios.apagar'), style: 'destructive', onPress: () => apagarContato(c.id) },
              ])
            }
          />
        </Cartao>
      ))}
      {cheio ? (
        <Texto variante="secundario">{t('contatos.limite', { n: MAX_CONTATOS })}</Texto>
      ) : (
        <Cartao style={{ gap: espaco.sm }}>
          <Campo rotulo={t('contatos.nome')} valor={nome} aoMudar={setNome} />
          <Campo rotulo={t('contatos.telefone')} valor={telefone} aoMudar={setTelefone} teclado="phone-pad" />
          <Botao titulo={t('contatos.adicionar')} icone="mais" onPress={adicionar} />
        </Cartao>
      )}
      <Texto variante="pequeno">{t('contatos.sosAviso')}</Texto>
    </TelaFerramenta>
  );
}
