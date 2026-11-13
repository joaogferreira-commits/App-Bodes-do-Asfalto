import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { lerPosicaoAtual } from '@/componentes/posicaoAtual';
import { Campo, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { categoriasNegocio, type CategoriaNegocio } from '@/dados/negocios';
import { useRascunho } from '@/estado/rascunho';
import { escolherFoto } from '@/feed/foto';
import {
  MAX_FOTOS_NEGOCIO,
  criarNegocio,
  editarNegocio,
  normalizarSite,
  subirFotoNegocio,
  urlsDasFotos,
} from '@/servidor/negocios';
import { recarregarClube, useNegociosServidor } from '@/servidor/useClube';
import { espaco, raios, useCores } from '@/theme';
import { Botao, Cartao, Chip, Icone, Texto } from '@/ui';
import { abrirMenu, avisar } from '@/ui/dialogo';

type Form = {
  nome: string;
  categoria: CategoriaNegocio;
  descricao: string;
  cidade: string;
  beneficio: string;
  telefone: string;
  whatsapp: string;
  site: string;
  lat: number | null;
  lng: number | null;
  /** caminhos já no servidor ou fotos novas do aparelho (file:/content:) ainda por enviar */
  fotos: string[];
};
const VAZIO: Form = {
  nome: '',
  categoria: 'oficina',
  descricao: '',
  cidade: '',
  beneficio: '',
  telefone: '',
  whatsapp: '',
  site: '',
  lat: null,
  lng: null,
  fotos: [],
};
const local = (u: string) => /^(file|content):/i.test(u);

/** Cadastro (ou edição) de negócio de irmão. Nasce em revisão; benefício para irmãos é obrigatório. Rascunho no aparelho. */
export default function NovoNegocio() {
  const { t } = useTranslation();
  const cores = useCores();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { brutos } = useNegociosServidor();
  const [f, setF, limpar] = useRascunho<Form>(`negocio.${id ?? 'novo'}`, VAZIO);
  const [enviando, setEnviando] = useState(false);
  const [previas, setPrevias] = useState<Record<string, string>>({});
  const preenchido = useRef(false);

  useEffect(() => {
    if (!id || preenchido.current) return;
    const n = brutos.find((x) => x.id === id);
    if (!n) return;
    preenchido.current = true;
    setF((a) =>
      a.nome
        ? a
        : {
            nome: n.nome,
            categoria: n.categoria,
            descricao: n.descricao,
            cidade: n.cidade,
            beneficio: n.beneficio,
            telefone: n.telefone,
            whatsapp: n.whatsapp,
            site: n.site,
            lat: n.lat ?? null,
            lng: n.lng ?? null,
            fotos: n.fotos,
          },
    );
  }, [id, brutos, setF]);

  // Miniaturas das fotos que já estão no servidor.
  const noServidor = f.fotos.filter((u) => !local(u)).join('|');
  useEffect(() => {
    const caminhos = noServidor ? noServidor.split('|') : [];
    if (!caminhos.length) return;
    let vivo = true;
    void urlsDasFotos(caminhos)
      .then((m) => vivo && setPrevias(m))
      .catch(() => undefined);
    return () => {
      vivo = false;
    };
  }, [noServidor]);

  const muda = (k: keyof Form) => (v: string) => setF((a) => ({ ...a, [k]: v }));
  const addFoto = (origem: 'camera' | 'galeria') =>
    void escolherFoto(origem).then((u) => u && setF((a) => ({ ...a, fotos: [...a.fotos, u] })));

  const marcar = async () => {
    const p = await lerPosicaoAtual();
    if (p === 'semPermissao') return avisar(t('negocios.semPermissao'));
    if (p === 'semGps') return avisar(t('negocios.semGps'));
    setF((a) => ({ ...a, lat: p.lat, lng: p.lng }));
  };

  const enviar = async () => {
    const falta = [
      f.nome.trim().length < 2 && t('negocios.nome'),
      f.cidade.trim().length < 2 && t('negocios.cidade'),
      f.beneficio.trim().length < 2 && t('negocios.beneficioCampo'),
    ].filter(Boolean);
    if (falta.length) return avisar(t('acesso.form.falta'), falta.join('\n'));
    const site = normalizarSite(f.site);
    if (site === null) return avisar(t('negocios.siteInvalido'));
    setEnviando(true);
    try {
      const caminhos: string[] = [];
      for (const u of f.fotos) caminhos.push(local(u) ? await subirFotoNegocio(u) : u);
      const dados = { ...f, site, fotos: caminhos };
      if (id) await editarNegocio(id, dados);
      else await criarNegocio(dados);
      limpar();
      recarregarClube();
      avisar(t(id ? 'negocios.salvo' : 'negocios.enviado'));
      router.back();
    } catch (e) {
      const limite = (e as { message?: string } | null)?.message?.includes('limite_negocios');
      avisar(t(limite ? 'negocios.limite' : 'negocios.erroEnviar'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <TelaFerramenta
      titulo={t(id ? 'negocios.editar' : 'negocios.novo')}
      explicacao={t('negocios.explicaForm')}
    >
      <Campo rotulo={t('negocios.nome')} valor={f.nome} aoMudar={muda('nome')} />
      <Texto variante="rotulo">{t('negocios.categoria')}</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
        {categoriasNegocio.map((c) => (
          <Chip
            key={c}
            rotulo={t(`negocios.categorias.${c}`)}
            ativo={f.categoria === c}
            onPress={() => setF((a) => ({ ...a, categoria: c }))}
          />
        ))}
      </View>
      <Campo
        rotulo={t('negocios.beneficioCampo')}
        valor={f.beneficio}
        aoMudar={(v) => muda('beneficio')(v.slice(0, 200))}
      />
      <Campo
        rotulo={t('negocios.descricao')}
        valor={f.descricao}
        aoMudar={(v) => muda('descricao')(v.slice(0, 600))}
        linhas={4}
      />
      <Campo rotulo={t('negocios.cidade')} valor={f.cidade} aoMudar={muda('cidade')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm }}>
        <Campo
          rotulo={t('negocios.whatsapp')}
          valor={f.whatsapp}
          aoMudar={muda('whatsapp')}
          teclado="phone-pad"
        />
        <Campo
          rotulo={t('negocios.telefone')}
          valor={f.telefone}
          aoMudar={muda('telefone')}
          teclado="phone-pad"
        />
      </View>
      <Campo rotulo={t('negocios.site')} valor={f.site} aoMudar={muda('site')} teclado="url" />

      <Texto variante="rotulo">{t('negocios.fotosTitulo', { max: MAX_FOTOS_NEGOCIO })}</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
        {f.fotos.map((u) => (
          <Pressable
            key={u}
            accessibilityRole="button"
            accessibilityLabel={t('negocios.tirarFoto')}
            onPress={() => setF((a) => ({ ...a, fotos: a.fotos.filter((x) => x !== u) }))}
          >
            <Image
              source={{ uri: local(u) ? u : previas[u] }}
              style={{ width: 96, height: 96, borderRadius: raios.botao, backgroundColor: cores.superficie3 }}
              contentFit="cover"
              accessible={false}
            />
            <View
              style={{
                position: 'absolute',
                top: 4,
                right: 4,
                backgroundColor: cores.superficie,
                borderRadius: 12,
              }}
            >
              <Icone nome="fechar" tamanho={20} />
            </View>
          </Pressable>
        ))}
        {f.fotos.length < MAX_FOTOS_NEGOCIO && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('negocios.adicionarFoto')}
            onPress={() =>
              abrirMenu({
                titulo: t('negocios.adicionarFoto'),
                opcoes: [
                  { rotulo: t('publicar.camera'), icone: 'camera', onPress: () => addFoto('camera') },
                  { rotulo: t('publicar.galeria'), icone: 'feed', onPress: () => addFoto('galeria') },
                ],
              })
            }
            style={{
              width: 96,
              height: 96,
              borderRadius: raios.botao,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: cores.linhaForte,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icone nome="camera" tamanho={30} cor={cores.acao} />
            <Texto variante="pequeno" style={{ textAlign: 'center' }}>
              {t('negocios.adicionarFoto')}
            </Texto>
          </Pressable>
        )}
      </View>

      {f.lat != null && f.lng != null ? (
        <Cartao style={{ gap: espaco.sm }}>
          <Texto>{t('negocios.posicaoMarcada')}</Texto>
          <Botao
            titulo={t('negocios.tirarPosicao')}
            variante="contorno"
            onPress={() => setF((a) => ({ ...a, lat: null, lng: null }))}
          />
        </Cartao>
      ) : (
        <Botao
          titulo={t('negocios.posicao')}
          icone="localizacao"
          variante="secundario"
          onPress={() => void marcar()}
        />
      )}
      <Botao
        titulo={t(id ? 'negocios.salvar' : 'negocios.enviar')}
        grande
        desativado={enviando}
        onPress={() => void enviar()}
      />
    </TelaFerramenta>
  );
}
