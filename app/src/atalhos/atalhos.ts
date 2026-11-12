import { Platform } from 'react-native';
import { requireOptionalNativeModule } from 'expo';

type Nativo = {
  definirAtalhoDoIcone(titulo: string): Promise<boolean>;
  podeFixarAtalho(): Promise<boolean>;
  fixarAtalhoSOS(titulo: string): Promise<boolean>;
  podeFixarWidget(): Promise<boolean>;
  fixarWidgetSOS(): Promise<boolean>;
};

/** Módulo nativo só existe no Android (no iPhone o atalho é "segurar o ícone do app"). */
const nativo = Platform.OS === 'android' ? requireOptionalNativeModule<Nativo>('Atalhos') : null;

export const atalhos = {
  definirAtalhoDoIcone: async (titulo: string) =>
    nativo ? nativo.definirAtalhoDoIcone(titulo).catch(() => false) : false,
  podeFixarAtalho: async () => (nativo ? nativo.podeFixarAtalho().catch(() => false) : false),
  fixarAtalhoSOS: async (titulo: string) =>
    nativo ? nativo.fixarAtalhoSOS(titulo).catch(() => false) : false,
  podeFixarWidget: async () => (nativo ? nativo.podeFixarWidget().catch(() => false) : false),
  fixarWidgetSOS: async () => (nativo ? nativo.fixarWidgetSOS().catch(() => false) : false),
};
