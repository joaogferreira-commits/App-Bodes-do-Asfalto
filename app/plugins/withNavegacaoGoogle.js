// Ajustes nativos exigidos pelo Google Navigation SDK (README do pacote, Android):
// desugaring da biblioteca Java e Jetifier. A versão do Kotlin (2.3+) vem do expo-build-properties.
const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

const DESUGAR = "coreLibraryDesugaring 'com.android.tools:desugar_jdk_libs_nio:2.1.5'";

function comDesugaring(gradle) {
  let resultado = gradle;
  if (!resultado.includes('coreLibraryDesugaringEnabled')) {
    resultado = resultado.replace(
      /android\s*\{/,
      'android {\n    compileOptions {\n        coreLibraryDesugaringEnabled true\n    }',
    );
  }
  if (!resultado.includes('desugar_jdk_libs')) {
    resultado = resultado.replace(/dependencies\s*\{/, `dependencies {\n    ${DESUGAR}`);
  }
  return resultado;
}

const withNavegacaoGoogle = (config) => {
  config = withAppBuildGradle(config, (c) => {
    c.modResults.contents = comDesugaring(c.modResults.contents);
    return c;
  });
  config = withGradleProperties(config, (c) => {
    const props = c.modResults.filter((p) => !(p.type === 'property' && p.key === 'android.enableJetifier'));
    props.push({ type: 'property', key: 'android.enableJetifier', value: 'true' });
    c.modResults = props;
    return c;
  });
  return config;
};

module.exports = withNavegacaoGoogle;
module.exports.comDesugaring = comDesugaring;
