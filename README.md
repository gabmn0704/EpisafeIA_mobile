# EpiSafe IA — App móvil

App móvil (Expo + React Native + TypeScript estricto) para personas con epilepsia: predicción de riesgo diario con IA, agenda de medicación con recordatorios, registro de crisis, botón de emergencia con cuenta atrás y lectura de pulso desde un reloj por Bluetooth.

Consume el API de `EpisafeIa_back` (contrato en `docs/API.md` de ese repo) y reutiliza la identidad visual de `EpisafeIA_front` (violeta profundo, lima de acento, Outfit + Geist).

## Pantallas

Onboarding, login/registro, Dashboard (medidor de riesgo animado, factores, pulso, adherencia, racha), registro diario (con deshacer), medicamentos (agenda, marcar toma, recordatorios locales), crisis (línea de tiempo y alta manual), **emergencia** (cuenta atrás cancelable, ubicación, lista de todos tus contactos con Llamar, SMS y WhatsApp), insights de IA, contactos, reloj/dispositivos y ajustes.

## Funciones extra

- **Cola offline** (`src/lib/offlineQueue.ts`): si falla la red al guardar una crisis, un registro diario o una toma de medicación, se guarda en AsyncStorage (una cola por usuario) y se reintenta cada 20 s y al volver a la app. Un aviso ámbar "N registros pendientes de enviar" aparece en las pantallas y permite reintentar a mano. Los rechazos 4xx se descartan; red y 5xx se reintentan.
- **Recordatorios de medicación**: notificaciones locales diarias por horario, canal Android, permiso pedido con explicación previa, botones "Ya la tomé" y "Recordar en 10 min" (la app se abre un instante para registrar la toma) y reprogramación al editar o borrar medicamentos.
- **Ficha médica de emergencia** (`/medical-id`): alergias, grupo sanguíneo, condiciones e indicaciones (solo en el teléfono, no hay endpoint en el API) más medicación y contactos copiados del API para verlos sin red. Accesible desde la pantalla de emergencia y sin desbloquear la app.
- **Bloqueo con huella/rostro/PIN** (Ajustes): desactivado por defecto. Pide desbloqueo al abrir y tras 30 s en segundo plano. La emergencia y la ficha médica quedan abiertas.
- **Reporte para el médico** (`/report`): crisis, desencadenantes frecuentes, medicación y adherencia, y hábitos de un periodo; se comparte como PDF (`expo-print` + `expo-sharing`) o texto.
- **Calendario de crisis** (`/calendar`): vista mensual con los días con crisis marcados y detalle al tocar un día.

Todo funciona en Expo Go.

## Requisitos

- Node 20+ y npm.
- App **Expo Go** en el celular (todo funciona en Expo Go).
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

## Reloj: próximamente

La función de reloj está desactivada en la app (pantalla "Próximamente"). No se pide ningún permiso de Bluetooth y `react-native-ble-plx` ya no es dependencia. Se conserva la lógica pura en `src/lib/ble` (parser de la trama Heart Rate `0x180D/0x2A37`, cliente con reconexión sobre una abstracción `BleTransport` y `SampleUploader`), con sus tests, para reactivarla cuando se añada un transporte nativo.

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
