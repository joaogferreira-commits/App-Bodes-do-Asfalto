// Android Auto (Car App Library, categoria navegação) usando a tela base do Google Navigation SDK.
// Copia as classes Java de plugins/android-auto para o projeto nativo e registra o serviço no manifesto.
const fs = require('fs');
const path = require('path');
const {
  AndroidConfig,
  withAndroidManifest,
  withAppBuildGradle,
  withDangerousMod,
} = require('expo/config-plugins');

const CAR_APP = "implementation 'androidx.car.app:app:1.4.0'";

const TEXTOS = {
  values: {
    auto_alerta: 'Alerta',
    auto_encerrar: 'Encerrar',
    auto_postos: 'Postos',
    auto_sos: 'SOS',
    auto_aviso_em_breve: 'Disponível em breve',
    auto_aviso_sos: 'Teste: o SOS ainda não avisa ninguém. Não substitui o 192/193',
    auto_aviso_encerrar: 'Encerrando a navegação',
  },
  'values-es': {
    auto_alerta: 'Alerta',
    auto_encerrar: 'Terminar',
    auto_postos: 'Gasolineras',
    auto_sos: 'SOS',
    auto_aviso_em_breve: 'Disponible pronto',
    auto_aviso_sos: 'Prueba: el SOS todavía no avisa a nadie. No sustituye al 192/193',
    auto_aviso_encerrar: 'Terminando la navegación',
  },
  'values-en': {
    auto_alerta: 'Alert',
    auto_encerrar: 'End',
    auto_postos: 'Gas',
    auto_sos: 'SOS',
    auto_aviso_em_breve: 'Coming soon',
    auto_aviso_sos: 'Test: SOS does not alert anyone yet. Not a replacement for 192/193',
    auto_aviso_encerrar: 'Ending navigation',
  },
};

function xmlDeTextos(textos) {
  const linhas = Object.entries(textos).map(([k, v]) => `    <string name="${k}">${v}</string>`);
  return `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n${linhas.join('\n')}\n</resources>\n`;
}

function adicionarAoManifesto(manifest, pacote) {
  const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  const permissoes = (manifest.manifest['uses-permission'] ??= []);
  for (const nome of ['androidx.car.app.NAVIGATION_TEMPLATES', 'androidx.car.app.ACCESS_SURFACE']) {
    if (!permissoes.some((p) => p.$['android:name'] === nome)) permissoes.push({ $: { 'android:name': nome } });
  }
  const metas = (app['meta-data'] ??= []);
  const meta = (nome, atributos) => {
    if (!metas.some((m) => m.$['android:name'] === nome)) metas.push({ $: { 'android:name': nome, ...atributos } });
  };
  meta('com.google.android.gms.car.application', { 'android:resource': '@xml/automotive_app_desc' });
  meta('androidx.car.app.minCarApiLevel', { 'android:value': '1' });
  const servicos = (app.service ??= []);
  const nomeServico = `${pacote}.auto.BodesCarAppService`;
  if (!servicos.some((s) => s.$['android:name'] === nomeServico)) {
    servicos.push({
      $: { 'android:name': nomeServico, 'android:exported': 'true' },
      'intent-filter': [
        {
          action: [{ $: { 'android:name': 'androidx.car.app.CarAppService' } }],
          category: [{ $: { 'android:name': 'androidx.car.app.category.NAVIGATION' } }],
        },
      ],
    });
  }
  return manifest;
}

const withAndroidAuto = (config) => {
  const pacote = config.android?.package;
  if (!pacote) throw new Error('android.package é obrigatório para o Android Auto');

  config = withAndroidManifest(config, (c) => {
    c.modResults = adicionarAoManifesto(c.modResults, pacote);
    return c;
  });
  config = withAppBuildGradle(config, (c) => {
    if (!c.modResults.contents.includes('androidx.car.app:app:')) {
      c.modResults.contents = c.modResults.contents.replace(/dependencies\s*\{/, `dependencies {\n    ${CAR_APP}`);
    }
    return c;
  });
  config = withDangerousMod(config, [
    'android',
    (c) => {
      const raiz = path.join(c.modRequest.platformProjectRoot, 'app', 'src', 'main');
      const destinoJava = path.join(raiz, 'java', ...pacote.split('.'), 'auto');
      fs.mkdirSync(destinoJava, { recursive: true });
      for (const arquivo of fs.readdirSync(path.join(__dirname, 'android-auto'))) {
        if (!arquivo.endsWith('.java')) continue;
        const fonte = fs.readFileSync(path.join(__dirname, 'android-auto', arquivo), 'utf8');
        fs.writeFileSync(path.join(destinoJava, arquivo), fonte.replaceAll('__PACOTE__', pacote));
      }
      const origemDesenhos = path.join(__dirname, 'android-auto', 'drawable');
      fs.mkdirSync(path.join(raiz, 'res', 'drawable'), { recursive: true });
      for (const arquivo of fs.readdirSync(origemDesenhos)) {
        fs.copyFileSync(path.join(origemDesenhos, arquivo), path.join(raiz, 'res', 'drawable', arquivo));
      }
      fs.mkdirSync(path.join(raiz, 'res', 'xml'), { recursive: true });
      fs.writeFileSync(
        path.join(raiz, 'res', 'xml', 'automotive_app_desc.xml'),
        '<?xml version="1.0" encoding="utf-8"?>\n<automotiveApp>\n    <uses name="template" />\n</automotiveApp>\n',
      );
      for (const [pasta, textos] of Object.entries(TEXTOS)) {
        fs.mkdirSync(path.join(raiz, 'res', pasta), { recursive: true });
        fs.writeFileSync(path.join(raiz, 'res', pasta, 'strings_auto.xml'), xmlDeTextos(textos));
      }
      return c;
    },
  ]);
  return config;
};

module.exports = withAndroidAuto;
module.exports.adicionarAoManifesto = adicionarAoManifesto;
