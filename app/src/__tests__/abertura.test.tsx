import { act, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';

import { AberturaAnimada, DURACAO_ABERTURA_MS } from '@/componentes/AberturaAnimada';

it('abertura dura no máximo 1,5 s e some sozinha', async () => {
  expect(DURACAO_ABERTURA_MS).toBeLessThanOrEqual(1500);
  jest.useFakeTimers();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  await render(<AberturaAnimada />);
  expect(screen.toJSON()).not.toBeNull();
  await act(async () => {
    await jest.advanceTimersByTimeAsync(DURACAO_ABERTURA_MS + 200);
  });
  expect(screen.toJSON()).toBeNull();
  jest.useRealTimers();
});
