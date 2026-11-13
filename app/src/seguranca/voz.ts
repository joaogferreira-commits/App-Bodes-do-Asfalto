import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import i18n from 'i18next';

/** Aviso por voz do modo pilotando (sai pelo áudio do celular ou do intercomunicador Bluetooth) + vibração. */
export function falar(texto: string) {
  void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => undefined);
  try {
    Speech.stop();
    Speech.speak(texto, { language: i18n.language || 'pt-BR', rate: 1.0 });
  } catch {
    // sem síntese de voz: só a vibração e a faixa
  }
}
