import { View } from 'react-native';

import { espaco, useCores } from '@/theme';

export function Divisoria() {
  const c = useCores();
  return (
    <View
      accessible={false}
      style={{ height: 1, backgroundColor: c.linhaSuave, marginVertical: espaco.sm }}
    />
  );
}
