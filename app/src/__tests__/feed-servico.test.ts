import { bloquear, denunciar, publicarPost, publicarStory } from '@/servidor/feed';

const upload = jest.fn(async () => ({ error: null }));
const remove = jest.fn(async () => ({ error: null }));
const insert = jest.fn();
const mockFrom = jest.fn();
const mockArmazenamento = jest.fn();

jest.mock('@/servidor/supabase', () => ({
  servidorConfigurado: true,
  supabase: {
    auth: { getUser: async () => ({ data: { user: { id: 'uid-1' } } }) },
    from: (t: string) => mockFrom(t),
    storage: { from: (b: string) => mockArmazenamento(b) },
  },
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockArmazenamento.mockReturnValue({ upload, remove });
  insert.mockReturnValue({ select: () => ({ single: async () => ({ data: { id: 'novo' }, error: null }) }) });
  mockFrom.mockReturnValue({ insert });
  global.fetch = jest.fn(async () => ({ arrayBuffer: async () => new ArrayBuffer(4) })) as never;
});

describe('serviço do feed', () => {
  it('post: foto sobe no bucket feed na pasta do usuário e o post guarda só o caminho', async () => {
    await publicarPost({ texto: 'oi', visibilidade: 'amigos', fotos: ['file:///a.jpg'] });
    expect(mockArmazenamento).toHaveBeenCalledWith('feed');
    const caminho = (upload.mock.calls[0] as unknown as [string])[0];
    expect(caminho.startsWith('uid-1/')).toBe(true);
    expect(insert).toHaveBeenCalledWith({
      texto: 'oi',
      visibilidade: 'amigos',
      midias: [{ path: caminho, tipo: 'foto' }],
      enquete: null,
    });
  });

  it('se o post falha, a foto enviada é removida', async () => {
    insert.mockReturnValue({
      select: () => ({ single: async () => ({ data: null, error: new Error('negado') }) }),
    });
    await expect(
      publicarPost({ texto: 'oi', visibilidade: 'todos', fotos: ['file:///a.jpg'] }),
    ).rejects.toThrow();
    expect(remove).toHaveBeenCalled();
  });

  it('story: mídia no bucket stories e conteúdo sem o caminho local', async () => {
    await publicarStory({ uri: 'file:///v.mp4', tipo: 'video', filtro: 'noite', textos: [], selos: {} });
    expect(mockArmazenamento).toHaveBeenCalledWith('stories');
    const chamada = insert.mock.calls[0]![0] as { tipo: string; midia_path: string; conteudo: object };
    expect(chamada.tipo).toBe('video');
    expect(chamada.midia_path.startsWith('uid-1/')).toBe(true);
    expect(chamada.conteudo).not.toHaveProperty('uri');
  });

  it('denúncia e bloqueio usam as colunas da migration', async () => {
    insert.mockResolvedValue({ error: null });
    await denunciar('comentario', 'c1', 'ofensa');
    expect(mockFrom).toHaveBeenLastCalledWith('denuncias');
    expect(insert).toHaveBeenLastCalledWith({ alvo_tipo: 'comentario', alvo_id: 'c1', motivo: 'ofensa' });
    await bloquear('u9');
    expect(mockFrom).toHaveBeenLastCalledWith('bloqueios');
    expect(insert).toHaveBeenLastCalledWith({ bloqueado: 'u9' });
  });
});
