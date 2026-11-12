import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Configuração dinâmica: as chaves vêm das variáveis de ambiente do EAS
 * (nunca do repositório). Ver .env.example.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const chaveGoogle = process.env.GOOGLE_MAPS_API_KEY ?? '';
  return {
    ...(config as ExpoConfig),
    extra: { ...config.extra, chaveGoogle: chaveGoogle },
    android: {
      ...config.android,
      // Arquivo do Firebase (notificações) vem como variável do tipo "arquivo" do EAS, nunca do repositório.
      ...(process.env.GOOGLE_SERVICES_JSON ? { googleServicesFile: process.env.GOOGLE_SERVICES_JSON } : {}),
      config: { ...config.android?.config, googleMaps: { apiKey: chaveGoogle } },
    },
    ios: {
      ...config.ios,
      config: { ...config.ios?.config, googleMapsApiKey: chaveGoogle },
      infoPlist: {
        ...config.ios?.infoPlist,
        NSMotionUsageDescription: 'Usado para melhorar a navegação.',
        UIBackgroundModes: ['location', 'audio'],
      },
    },
  };
};
