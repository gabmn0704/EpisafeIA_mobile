# EpiSafe IA — App móvil

App móvil (Expo + React Native + TypeScript estricto) para personas con epilepsia: predicción de riesgo diario con IA, agenda de medicación con recordatorios, registro de crisis, botón de emergencia con cuenta atrás y lectura de pulso desde un reloj por Bluetooth.

Consume el API de `EpisafeIa_back` (contrato en `docs/API.md` de ese repo) y reutiliza la identidad visual de `EpisafeIA_front` (violeta profundo, lima de acento, Outfit + Geist).

## Pantallas

Onboarding, login/registro, Dashboard (medidor de riesgo animado, factores, pulso, adherencia, racha), registro diario (con deshacer), medicamentos (agenda, marcar toma, recordatorios locales), crisis (línea de tiempo y alta manual), **emergencia** (cuenta atrás cancelable, ubicación, llamada a contacto), insights de IA, contactos, reloj/dispositivos y ajustes.

## Requisitos

- Node 20+ y npm.
- App **Expo Go** en el celular (todo menos el Bluetooth del reloj funciona en Expo Go).
- El API corriendo en tu PC (`EpisafeIa_back`, puerto 4000 por defecto).

## Correr en el celular con Expo Go (API en la PC, red local)

1. Instala dependencias: `npm install`.
2. Averigua la IP de tu PC en la red local (`ipconfig` en Windows, p. ej. `192.168.1.50`).
3. Crea `.env` (hay un ejemplo en `.env.example`):
   ```
   EXPO_PUBLIC_API_URL=http://192.168.1.50:4000/api/v1
   ```
   En Expo Go, si no defines la variable, la app usa la IP desde la que se sirve el bundle y asume el API en el puerto 4000 de esa misma máquina.
4. Asegúrate de que el API escuche en todas las interfaces y de que el firewall de Windows permita el puerto 4000. Celular y PC deben estar en la misma Wi-Fi.
5. `npx expo start` y escanea el QR con Expo Go.
6. Usuario de prueba (seed del back): `demo@episafe.app` / `Demo1234!`.

Variables disponibles (todas públicas, **no pongas secretos**):

| Variable | Uso |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | URL base del API, incluyendo `/api/v1`. |
| `EXPO_PUBLIC_EMERGENCY_NUMBER` | Número local de emergencias para el botón de llamada (por defecto `123`). Cámbialo según tu país. |

## Reloj y Bluetooth (requiere development build)

El reloj se lee con `react-native-ble-plx` y el servicio estándar **Heart Rate** (`0x180D`, característica `0x2A37`). Ese módulo es nativo, así que **no funciona en Expo Go**: ahí la pantalla *Reloj* explica la limitación y el resto de la app sigue funcionando.

Para probar con un reloj o banda real:

```bash
npm install -g eas-cli
eas login
eas build --profile development --platform android   # o ios
```

Instala el APK/IPA resultante y arranca con `npx expo start --dev-client`. En el reloj activa la emisión de pulso por Bluetooth (*Heart Rate Broadcast*) y usa **Reloj → Buscar mi reloj**.

Cómo funciona (`src/lib/ble`):

- `hrParser.ts`: parser de la trama GATT (flags, pulso uint8/uint16, contacto con la piel, energía, intervalos RR y RMSSD), con tests sobre tramas hexadecimales.
- `HeartRateClient.ts`: escaneo, conexión y reconexión con backoff exponencial sobre una abstracción `BleTransport` (probada con un transporte falso). `BlxTransport.ts` es el único archivo que toca el módulo nativo.
- `SampleUploader.ts`: buffer circular propio y envío por lotes (máx. 200) a `POST /wearables/samples`; si falla la red las muestras se conservan y se reintenta.
- **No hay datos simulados.** Sin dispositivo, la UI lo dice y no muestra pulso.

### Salud del sistema (HealthKit / Health Connect): PENDIENTE

`src/lib/health/HealthProvider.ts` define la interfaz y `StubHealthProvider` es un marcador **explícitamente no implementado** (siempre "no disponible", sin datos). Falta implementar `HealthKitProvider` (iOS) y `HealthConnectProvider` (Android), que también requieren development build.

## Generar APK / IPA con EAS

```bash
eas build --profile preview --platform android      # APK instalable (distribución interna)
eas build --profile preview --platform ios          # IPA ad hoc (requiere cuenta Apple Developer)
eas build --profile production --platform android   # AAB para Play Store
```

Define la URL del API para el build sin guardar secretos en el repo:

```bash
eas env:create --name EXPO_PUBLIC_API_URL --value https://tu-api.ejemplo/api/v1 --environment preview --visibility plain
```

Antes del primer build, `eas init` enlazará el proyecto a tu cuenta de Expo (rellena `extra.eas.projectId`).

## Calidad

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint, sin warnings
npm test            # jest-expo
npm run export:web  # verifica que el bundle compila (expo export --platform web)
```

Estructuras de datos propias en `src/lib/structures` (con tests y uso real): `Stack` (deshacer en registro diario y en marcas de dosis), `Queue` (cola de toasts), `CircularBuffer` (muestras del reloj y gráfica en vivo), `Trie` (autocompletado de medicamentos sin red).

## Seguridad y privacidad

- Tokens en `expo-secure-store` (Keychain/Keystore); renovación automática con una sola petición de refresh en vuelo.
- Respuestas del API validadas con `zod`.
- La ubicación solo se pide al activar una emergencia.
- EpiSafe IA no diagnostica ni ajusta dosis: es una herramienta de apoyo.
