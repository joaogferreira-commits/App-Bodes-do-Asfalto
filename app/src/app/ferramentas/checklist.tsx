import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { TelaFerramenta } from '@/componentes/TelaFerramenta';
import { useGuardado } from '@/estado/guardado';
import { espaco, fontes, raios, useCores } from '@/theme';
import { Botao, Icone, Texto } from '@/ui';

const itens = [
  'pneus',
  'oleo',
  'freios',
  'corrente',
  'luzes',
  'documentos',
  'chuva',
  'ferramentas',
  'agua',
  'celular',
  'rota',
  'avisar',
];

/** Checklist antes de sair: marcar com toques grandes; fica guardado até zerar. */
export default function Checklist() {
  const { t } = useTranslation();
  const cores = useCores();
  const [feitos, setFeitos] = useGuardado<string[]>('checklist', []);
  const alternar = (k: string) => setFeitos((f) => (f.includes(k) ? f.filter((x) => x !== k) : [...f, k]));
  return (
    <TelaFerramenta
      titulo={t('ferramentas.itens.checklist.titulo')}
      explicacao={t('ferramentas.itens.checklist.explicacao')}
    >
      <Texto
        variante="destaque"
        style={{ color: feitos.length === itens.length ? cores.verdePosto : cores.texto }}
      >
        {feitos.length === itens.length
          ? t('ferramentas.checklist.pronto')
          : t('ferramentas.checklist.contagem', { n: feitos.length, total: itens.length })}
      </Texto>
      {itens.map((k) => {
        const ok = feitos.includes(k);
        return (
          <Pressable
            key={k}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: ok }}
            accessibilityLabel={t(`ferramentas.checklist.itens.${k}`)}
            onPress={() => alternar(k)}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: espaco.sm,
              minHeight: 60,
              paddingHorizontal: espaco.md,
              borderRadius: raios.botao,
              borderWidth: ok ? 2 : 1,
              borderColor: ok ? cores.verdePosto : cores.linha,
              backgroundColor: cores.superficie2,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                borderWidth: 2,
                borderColor: ok ? cores.verdePosto : cores.linhaForte,
                backgroundColor: ok ? cores.verdePosto : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {ok && <Icone nome="check" tamanho={22} cor={cores.fundo} espessura={3} />}
            </View>
            <Texto style={{ flex: 1, fontFamily: ok ? fontes.textoSemi : fontes.textoMedio }}>
              {t(`ferramentas.checklist.itens.${k}`)}
            </Texto>
          </Pressable>
        );
      })}
      <Botao titulo={t('ferramentas.checklist.zerar')} variante="contorno" onPress={() => setFeitos([])} />
    </TelaFerramenta>
  );
}
