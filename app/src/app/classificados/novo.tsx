import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { Campo, TelaFerramenta } from '@/componentes/TelaFerramenta';
import {
  categorias,
  formatarPreco,
  lerPreco,
  type CategoriaClassificado,
  type EstadoItem,
} from '@/dados/classificados';
import { useClassificados } from '@/estado/classificados';
import { usePerfilOpcional } from '@/estado/perfil';
import { escolherFoto } from '@/feed/foto';
import { espaco, raios, useCores } from '@/theme';
import { Botao, Chip, Icone, Texto } from '@/ui';
import { abrirMenu, avisar } from '@/ui/dialogo';

const MAX_FOTOS = 6;
const estados: EstadoItem[] = ['novo', 'seminovo', 'usado'];

/** Anunciar: até 6 fotos (sem localização), categoria, preço, estado, troca, ano/km para motos. */
export default function NovoAnuncio() {
  const { t } = useTranslation();
  const cores = useCores();
  const { anunciar } = useClassificados();
  const perfil = usePerfilOpcional();
  const [fotos, setFotos] = useState<string[]>([]);
  const [categoria, setCategoria] = useState<CategoriaClassificado>('motos');
  const [estado, setEstado] = useState<EstadoItem>('usado');
  const [aceitaTroca, setAceitaTroca] = useState(false);
  const [f, setF] = useState({
    titulo: '',
    preco: '',
    cidade: perfil?.perfil.cidade ?? '',
    descricao: '',
    ano: '',
    km: '',
    whatsapp: '',
  });
  const muda = (k: keyof typeof f) => (v: string) => setF((a) => ({ ...a, [k]: v }));

  const publicar = () => {
    const falta = [
      !fotos.length && t('classificados.form.fotos'),
      !f.titulo.trim() && t('classificados.form.titulo'),
      !lerPreco(f.preco) && t('classificados.form.preco'),
      !f.cidade.trim() && t('acesso.form.cidade'),
      f.whatsapp.replace(/\D/g, '').length < 10 && t('classificados.form.whatsapp'),
    ].filter(Boolean);
    if (falta.length) return avisar(t('acesso.form.falta'), falta.join('\n'));
    anunciar({
      categoria,
      estado,
      aceitaTroca,
      titulo: f.titulo.trim(),
      preco: lerPreco(f.preco),
      cidade: f.cidade.trim(),
      descricao: f.descricao.trim(),
      ano: categoria === 'motos' ? f.ano.trim() || undefined : undefined,
      km: categoria === 'motos' ? f.km.trim() || undefined : undefined,
      fotos: fotos.map((uri) => ({ uri })),
      vendedor: perfil?.perfil.nome || t('perfil.voce'),
      capitulo: perfil?.perfil.cidade || 'Cuiabá',
      whatsapp: f.whatsapp,
    });
    router.back();
  };

  return (
    <TelaFerramenta titulo={t('classificados.anunciar')} explicacao={t('classificados.form.explica')}>
      <Texto variante="rotulo">{t('classificados.form.fotosTitulo', { max: MAX_FOTOS })}</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
        {fotos.map((u) => (
          <Pressable
            key={u}
            accessibilityRole="button"
            accessibilityLabel={t('classificados.form.tirarFoto')}
            onPress={() =>
              avisar(t('classificados.form.tirarFoto'), undefined, [
                { text: t('comum.cancelar'), style: 'cancel' },
                {
                  text: t('comentarios.apagar'),
                  style: 'destructive',
                  onPress: () => setFotos((l) => l.filter((x) => x !== u)),
                },
              ])
            }
          >
            <Image
              source={{ uri: u }}
              style={{ width: 96, height: 96, borderRadius: raios.botao }}
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
        {fotos.length < MAX_FOTOS && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('classificados.form.adicionarFoto')}
            onPress={() =>
              abrirMenu({
                titulo: t('classificados.form.adicionarFoto'),
                opcoes: [
                  {
                    rotulo: t('publicar.camera'),
                    icone: 'camera',
                    onPress: () => void escolherFoto('camera').then((u) => u && setFotos((l) => [...l, u])),
                  },
                  {
                    rotulo: t('publicar.galeria'),
                    icone: 'feed',
                    onPress: () => void escolherFoto('galeria').then((u) => u && setFotos((l) => [...l, u])),
                  },
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
              {t('classificados.form.adicionarFoto')}
            </Texto>
          </Pressable>
        )}
      </View>
      <Texto variante="pequeno">{t('publicar.semLocal')}</Texto>
      <Texto variante="rotulo">{t('classificados.form.categoria')}</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
        {categorias.map((k) => (
          <Chip
            key={k}
            rotulo={t(`classificados.categorias.${k}`)}
            ativo={categoria === k}
            onPress={() => setCategoria(k)}
          />
        ))}
      </View>
      <Campo rotulo={t('classificados.form.titulo')} valor={f.titulo} aoMudar={muda('titulo')} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm }}>
        <Campo
          rotulo={t('classificados.form.preco')}
          valor={f.preco}
          aoMudar={muda('preco')}
          teclado="numeric"
          sufixo="R$"
        />
        <Campo rotulo={t('acesso.form.cidade')} valor={f.cidade} aoMudar={muda('cidade')} />
      </View>
      {categoria === 'motos' && (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.sm }}>
          <Campo rotulo={t('garagem.ano')} valor={f.ano} aoMudar={muda('ano')} teclado="numeric" />
          <Campo rotulo={t('garagem.km')} valor={f.km} aoMudar={muda('km')} teclado="numeric" sufixo="km" />
        </View>
      )}
      <Texto variante="rotulo">{t('classificados.form.estado')}</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
        {estados.map((e) => (
          <Chip
            key={e}
            rotulo={t(`classificados.estados.${e}`)}
            ativo={estado === e}
            onPress={() => setEstado(e)}
          />
        ))}
        <Chip
          rotulo={t('classificados.aceitaTroca')}
          ativo={aceitaTroca}
          onPress={() => setAceitaTroca((v) => !v)}
        />
      </View>
      <Campo
        rotulo={t('classificados.form.descricao')}
        valor={f.descricao}
        aoMudar={muda('descricao')}
        linhas={4}
      />
      <Campo
        rotulo={t('classificados.form.whatsapp')}
        valor={f.whatsapp}
        aoMudar={muda('whatsapp')}
        teclado="phone-pad"
      />
      <Texto variante="pequeno">{t('classificados.form.whatsappVisivel')}</Texto>
      {lerPreco(f.preco) > 0 && (
        <Texto variante="destaque">
          {t('classificados.form.vaiAparecer', { preco: formatarPreco(lerPreco(f.preco)) })}
        </Texto>
      )}
      <Texto variante="pequeno">{t('classificados.form.semPagamento')}</Texto>
      <Botao titulo={t('classificados.form.publicar')} grande icone="check" onPress={publicar} />
    </TelaFerramenta>
  );
}
