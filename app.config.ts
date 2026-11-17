import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Extiende app.json. El tráfico http sin cifrar en Android solo se permite
 * cuando EXPO_PUBLIC_ALLOW_CLEARTEXT=true (builds de prueba contra una API local).
 * En producción queda bloqueado.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  plugins: [
    ...(config.plugins ?? []),
    [
      'expo-build-properties',
      { android: { usesCleartextTraffic: process.env.EXPO_PUBLIC_ALLOW_CLEARTEXT === 'true' } },
    ],
  ],
});
