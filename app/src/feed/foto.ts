import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

/**
 * Foto para o feed: reduz para no máximo 1600 px e regrava em JPEG. Regravar descarta os
 * metadados EXIF, inclusive a localização GPS da foto (CLAUDE.md: remover EXIF ao publicar).
 */
export async function prepararFoto(uri: string): Promise<string> {
  const ctx = ImageManipulator.manipulate(uri);
  ctx.resize({ width: 1600 });
  const img = await ctx.renderAsync();
  const salvo = await img.saveAsync({ compress: 0.75, format: SaveFormat.JPEG });
  return salvo.uri;
}

/** Escolhe da galeria ou tira com a câmera. Devolve a foto já preparada, ou null se cancelou/negou. */
export async function escolherFoto(origem: 'galeria' | 'camera'): Promise<string | null> {
  const permissao =
    origem === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissao.granted) return null;
  const opcoes: ImagePicker.ImagePickerOptions = {
    mediaTypes: ['images'],
    quality: 1,
    exif: false,
    allowsEditing: true,
  };
  const r =
    origem === 'camera'
      ? await ImagePicker.launchCameraAsync(opcoes)
      : await ImagePicker.launchImageLibraryAsync(opcoes);
  const uri = r.canceled ? null : r.assets?.[0]?.uri;
  return uri ? prepararFoto(uri) : null;
}
