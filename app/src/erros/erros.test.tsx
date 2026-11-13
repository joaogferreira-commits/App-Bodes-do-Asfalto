import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

import { ProvedorTema } from '@/theme';

import { limparEvento, limparMigalha, limparValor } from './limpeza';
import { guardarErro, lerErros, MAX_ERROS } from './registro';
import { iniciarErros } from './sentry';
import { LimiteDeErro } from './TelaDeErro';

const mockInit = jest.fn();
jest.mock('@sentry/react-native', () => ({
  init: (...a: unknown[]) => mockInit(...a),
  captureException: jest.fn(() => 'id-1'),
  captureFeedback: jest.fn(),
  captureMessage: jest.fn(),
}));
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ router: { replace: (...a: unknown[]) => mockReplace(...a) } }));

describe('limpeza de dados sensíveis', () => {
  it('remove chaves sensíveis em qualquer nível', () => {
    const r = limparValor({
      ok: 1,
      loja: 'X',
      perfil: { oriente: 'Y', potencia: 'Z', telefone: '1', aninhado: [{ latitude: 1, lng: 2, bom: 'sim' }] },
      email: 'a@b.c',
      accessToken: 't',
    }) as Record<string, any>;
    expect(JSON.stringify(r)).not.toMatch(/"X"|"Y"|"Z"|a@b|"t"/);
    expect(r.ok).toBe(1);
    expect(r.perfil.aninhado[0].bom).toBe('sim');
    expect(r.perfil.aninhado[0].latitude).toBe('[removido]');
  });

  it('evento: tira corpo da requisição e usuário', () => {
    const e = limparEvento({
      user: { email: 'a@b.c' },
      request: { url: 'u', data: { loja: 'x' }, headers: { a: 1 } },
      extra: { contato: '119' },
    }) as Record<string, any>;
    expect(e.user).toBeUndefined();
    expect(e.request.data).toBeUndefined();
    expect(e.request.headers).toBeUndefined();
    expect(e.extra.contato).toBe('[removido]');
  });

  it('migalha de fetch fica sem corpo nem resposta', () => {
    const m = limparMigalha({
      category: 'fetch',
      data: { url: 'https://x.supabase.co/rest?lat=1', method: 'POST', status_code: 200, body: '{"loja":1}' },
    }) as Record<string, any>;
    expect(m.data).toEqual({ method: 'POST', status_code: 200 });
  });
});

describe('inicialização', () => {
  it('não liga sem DSN', () => {
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
    expect(iniciarErros()).toBe(false);
    expect(mockInit).not.toHaveBeenCalled();
  });

  it('liga com DSN, sem PII, sem captura de tela e sem tracing', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://k@o.ingest.sentry.io/1';
    expect(iniciarErros()).toBe(true);
    const o = mockInit.mock.calls[0][0];
    expect(o).toMatchObject({
      sendDefaultPii: false,
      attachScreenshot: false,
      tracesSampleRate: 0,
      enableNative: true,
    });
    delete process.env.EXPO_PUBLIC_SENTRY_DSN;
  });
});

describe('registro local', () => {
  it('guarda só os últimos 20', async () => {
    for (let i = 0; i < MAX_ERROS + 5; i++) await guardarErro(new Error(`e${i}`));
    const l = await lerErros();
    expect(l).toHaveLength(MAX_ERROS);
    expect(l[l.length - 1]?.mensagem).toBe(`e${MAX_ERROS + 4}`);
  });
});

describe('limite de erro', () => {
  it('mostra a tela de erro e "Voltar ao início" volta', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const Quebra = () => {
      throw new Error('boom');
    };
    await render(
      <ProvedorTema>
        <LimiteDeErro>
          <Quebra />
        </LimiteDeErro>
      </ProvedorTema>,
    );
    expect(screen.getByText('Algo deu errado')).toBeTruthy();
    expect(screen.getByText('Enviar detalhes')).toBeTruthy();
    await fireEvent.press(screen.getByText('Voltar ao início'));
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('renderiza os filhos quando não há erro', async () => {
    await render(
      <ProvedorTema>
        <LimiteDeErro>
          <Text>tudo certo</Text>
        </LimiteDeErro>
      </ProvedorTema>,
    );
    expect(screen.getByText('tudo certo')).toBeTruthy();
  });
});
