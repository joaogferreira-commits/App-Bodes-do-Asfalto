// Edge Function "notificar": envia push pelo serviço da Expo.
// Entrada (POST, JSON): { usuario_ids: string[], tipo, titulo, corpo, rota? }
// Chamada só pelo banco (gatilhos via pg_net) com o cabeçalho x-notificar-segredo.
// Publicar com: supabase functions deploy notificar --no-verify-jwt
// Segredo da função: supabase secrets set NOTIFICAR_SEGREDO=<o mesmo valor de config_notificacao.segredo>
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já existem dentro da função (nunca vão para o app).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TIPOS = ['mensagem', 'aceno', 'aprovacao', 'passeio', 'confraternizacao', 'sos'];
const URL_EXPO = 'https://exp.host/--/api/v2/push/send';
const LOTE = 100;
// LGPD: a prévia de mensagem nunca leva o conteúdo.
const CORPO_MENSAGEM = 'Nova mensagem';

function igual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

Deno.serve(async (req) => {
  const segredo = Deno.env.get('NOTIFICAR_SEGREDO') ?? '';
  const enviado = req.headers.get('x-notificar-segredo') ?? '';
  if (req.method !== 'POST' || !segredo || !igual(segredo, enviado)) {
    return new Response('não autorizado', { status: 401 });
  }

  let corpoReq: {
    usuario_ids?: unknown;
    tipo?: unknown;
    titulo?: unknown;
    corpo?: unknown;
    rota?: unknown;
  };
  try {
    corpoReq = await req.json();
  } catch {
    return new Response('json inválido', { status: 400 });
  }
  const { usuario_ids, tipo, titulo, corpo, rota } = corpoReq;
  if (
    !Array.isArray(usuario_ids) ||
    !usuario_ids.every((u) => typeof u === 'string') ||
    typeof tipo !== 'string' ||
    !TIPOS.includes(tipo) ||
    typeof titulo !== 'string' ||
    typeof corpo !== 'string'
  ) {
    return new Response('parâmetros inválidos', { status: 400 });
  }
  const ids = [...new Set(usuario_ids as string[])];
  if (ids.length === 0) return Response.json({ enviados: 0 });

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  // Preferências: quem desligou o tipo sai da lista (SOS ignora as preferências).
  let destinos = ids;
  if (tipo !== 'sos') {
    const { data: desligados } = await sb
      .from('preferencias_notificacao')
      .select('usuario_id')
      .eq('tipo', tipo)
      .eq('ligado', false)
      .in('usuario_id', ids);
    const fora = new Set((desligados ?? []).map((d: { usuario_id: string }) => d.usuario_id));
    destinos = ids.filter((i) => !fora.has(i));
  }
  if (destinos.length === 0) return Response.json({ enviados: 0 });

  const { data: tokens } = await sb.from('tokens_push').select('token').in('usuario_id', destinos);
  const lista = [...new Set((tokens ?? []).map((t: { token: string }) => t.token))];

  const mensagens = lista.map((to) => ({
    to,
    title: titulo.slice(0, 100),
    body: (tipo === 'mensagem' ? CORPO_MENSAGEM : corpo).slice(0, 200),
    data: { rota: typeof rota === 'string' ? rota : null, tipo },
    sound: null,
    channelId: 'default',
    priority: tipo === 'sos' ? 'high' : 'default',
  }));

  let enviados = 0;
  const invalidos: string[] = [];
  for (let i = 0; i < mensagens.length; i += LOTE) {
    const lote = mensagens.slice(i, i + LOTE);
    try {
      const r = await fetch(URL_EXPO, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(lote),
      });
      const json = (await r.json()) as { data?: { status: string; details?: { error?: string } }[] };
      (json.data ?? []).forEach((t, k) => {
        if (t.status === 'ok') enviados++;
        else if (t.details?.error === 'DeviceNotRegistered') invalidos.push(lote[k]!.to);
      });
    } catch {
      // um lote com falha não derruba os outros
    }
  }
  if (invalidos.length) await sb.from('tokens_push').delete().in('token', invalidos);
  return Response.json({ enviados, removidos: invalidos.length });
});
