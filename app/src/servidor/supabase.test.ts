import { servidorConfigurado, supabase } from './supabase';

it('sem as variáveis do EAS o app fica no modo local (sem cliente)', () => {
  expect(servidorConfigurado).toBe(false);
  expect(supabase).toBeNull();
});
