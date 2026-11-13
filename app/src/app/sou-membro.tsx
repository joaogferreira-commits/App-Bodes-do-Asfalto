import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { AvatarMontado } from '@/componentes/AvatarMontado';
import { TelaFerramenta } from '@/componentes/TelaFerramenta';
import { perfilExemplo } from '@/dados/perfil';
import { useAvatar } from '@/estado/avatar';
import { usePerfilOpcional } from '@/estado/perfil';
import { useQuery } from '@tanstack/react-query';

import { clienteConsultas } from '@/servidor/consulta';
import { meuCapitulo } from '@/servidor/membros';
import { useClubeNoServidor } from '@/servidor/useClube';
import { espaco, fontes, raios, tema, useCores } from '@/theme';
import { Avatar, Icone, Texto } from '@/ui';

/**
 * Carteirinha "Sou membro" para mostrar no balcão do parceiro. O relógio correndo prova que não é print.
 * Não mostra Loja, Oriente, Potência nem nada maçônico — só o motoclube.
 */
export default function SouMembro() {
  const { t } = useTranslation();
  const cores = useCores();
  const { avatar } = useAvatar();
  const meu = usePerfilOpcional();
  const servidor = useClubeNoServidor();
  const capServidor = useQuery(
    { queryKey: ['meuCapitulo'], queryFn: meuCapitulo, enabled: servidor, staleTime: 10 * 60 * 1000 },
    clienteConsultas,
  );
  // Com o servidor, só dados reais do irmão (nada de exemplo na carteirinha).
  const nome = meu?.perfil.nome || (servidor ? '' : perfilExemplo.nome);
  const capitulo = servidor ? capServidor.data : perfilExemplo.capitulo;
  const [agora, setAgora] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const hora = agora.toLocaleTimeString('pt-BR');

  return (
    <TelaFerramenta titulo={t('negocios.souMembro')}>
      <View
        style={{
          borderRadius: raios.folha,
          borderWidth: 3,
          borderColor: cores.acao,
          backgroundColor: cores.superficie2,
          padding: espaco.xl,
          gap: espaco.md,
          alignItems: 'center',
        }}
      >
        <Texto variante="rotulo" style={{ color: cores.acao }}>
          {tema.marca.nome}
        </Texto>
        {avatar ? <AvatarMontado opcoes={avatar} tamanho={120} /> : <Avatar nome={nome} tamanho={120} />}
        <Texto variante="titulo" style={{ textAlign: 'center' }}>
          {nome}
        </Texto>
        {!!capitulo && <Texto variante="destaque">{t('negocios.capitulo', { capitulo })}</Texto>}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icone nome="check" tamanho={22} cor={cores.verdePosto} espessura={3} />
          <Texto style={{ fontFamily: fontes.textoForte, color: cores.verdePosto, fontSize: 20 }}>
            {t('negocios.membroAtivo')}
          </Texto>
        </View>
        <Texto
          variante="numero"
          style={{ fontVariant: ['tabular-nums'] }}
          accessibilityLabel={t('negocios.horaAgora', { hora })}
        >
          {hora}
        </Texto>
        <Texto variante="pequeno" style={{ textAlign: 'center' }}>
          {t('negocios.relogioExplica')}
        </Texto>
      </View>
    </TelaFerramenta>
  );
}
