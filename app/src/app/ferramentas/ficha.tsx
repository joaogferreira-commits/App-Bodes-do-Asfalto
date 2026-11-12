import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Campo, TelaFerramenta } from '@/componentes/TelaFerramenta';
import { useGuardado } from '@/estado/guardado';
import { espaco, useCores } from '@/theme';
import { Cartao, Chip, Icone, Texto } from '@/ui';

const tipos = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

/** Ficha de emergência: fica só no aparelho; vai junto do SOS para o socorrista. */
export default function Ficha() {
  const { t } = useTranslation();
  const cores = useCores();
  const [f, setF] = useGuardado('fichaMedica', {
    sangue: '',
    alergias: '',
    remedios: '',
    plano: '',
    contato: '',
  });
  const muda = (k: keyof typeof f) => (v: string) => setF((a) => ({ ...a, [k]: v }));
  return (
    <TelaFerramenta
      titulo={t('ferramentas.itens.ficha.titulo')}
      explicacao={t('ferramentas.itens.ficha.explicacao')}
    >
      <Cartao style={{ flexDirection: 'row', gap: espaco.sm, alignItems: 'center' }}>
        <Icone nome="cadeado" cor={cores.verdePosto} />
        <Texto variante="secundario" style={{ flex: 1 }}>
          {t('ferramentas.ficha.privacidade')}
        </Texto>
      </Cartao>
      <Texto variante="pequeno">{t('ferramentas.ficha.sangue')}</Texto>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: espaco.xs }}>
        {tipos.map((s) => (
          <Chip
            key={s}
            rotulo={s}
            ativo={f.sangue === s}
            onPress={() => muda('sangue')(f.sangue === s ? '' : s)}
          />
        ))}
      </View>
      <Campo
        rotulo={t('ferramentas.ficha.alergias')}
        valor={f.alergias}
        aoMudar={muda('alergias')}
        linhas={2}
      />
      <Campo
        rotulo={t('ferramentas.ficha.remedios')}
        valor={f.remedios}
        aoMudar={muda('remedios')}
        linhas={2}
      />
      <Campo rotulo={t('ferramentas.ficha.plano')} valor={f.plano} aoMudar={muda('plano')} />
      <Campo
        rotulo={t('ferramentas.ficha.contato')}
        valor={f.contato}
        aoMudar={muda('contato')}
        teclado="phone-pad"
      />
      <Texto variante="pequeno">{t('ferramentas.ficha.salvo')}</Texto>
    </TelaFerramenta>
  );
}
