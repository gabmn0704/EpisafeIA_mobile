import type { BleManager as BleManagerType, Device } from 'react-native-ble-plx';
import { HEART_RATE_MEASUREMENT, HEART_RATE_SERVICE } from './hrParser';
import type { BleDeviceInfo, BlePowerState, BleTransport, Subscription } from './transport';

type BlxModule = typeof import('react-native-ble-plx');

/**
 * Implementacion real sobre react-native-ble-plx. Es el UNICO archivo que
 * toca el modulo nativo, y lo carga de forma perezosa: en Expo Go o en web
 * el modulo no existe y `createBlxTransport` devuelve null en lugar de romper.
 */
export function createBlxTransport(): BleTransport | null {
  let mod: BlxModule;
  let manager: BleManagerType;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('react-native-ble-plx') as BlxModule;
    manager = new mod.BleManager();
  } catch {
    return null;
  }

  const info = (d: Device): BleDeviceInfo => ({ id: d.id, name: d.name ?? d.localName ?? null, rssi: d.rssi ?? null });
  const mapState = (s: string): BlePowerState => {
    switch (s) {
      case 'PoweredOn':
        return 'on';
      case 'PoweredOff':
        return 'off';
      case 'Unauthorized':
        return 'unauthorized';
      case 'Unsupported':
        return 'unsupported';
      default:
        return 'unknown';
    }
  };

  return {
    async powerState() {
      return mapState(await manager.state());
    },
    startScan(onDevice, onError) {
      void manager.startDeviceScan([HEART_RATE_SERVICE], { allowDuplicates: false }, (error, device) => {
        if (error) return onError(new Error(error.message));
        if (device) onDevice(info(device));
      });
    },
    stopScan() {
      void manager.stopDeviceScan();
    },
    async connect(deviceId) {
      const device = await manager.connectToDevice(deviceId, { timeout: 10_000 });
      await device.discoverAllServicesAndCharacteristics();
    },
    monitorHeartRate(deviceId, onValue, onError): Subscription {
      return manager.monitorCharacteristicForDevice(deviceId, HEART_RATE_SERVICE, HEART_RATE_MEASUREMENT, (error, ch) => {
        if (error) return onError(new Error(error.message));
        if (ch?.value) onValue(ch.value);
      });
    },
    onDisconnected(deviceId, cb): Subscription {
      return manager.onDeviceDisconnected(deviceId, (error) => cb(error ? new Error(error.message) : null));
    },
    async disconnect(deviceId) {
      await manager.cancelDeviceConnection(deviceId);
    },
    destroy() {
      void manager.destroy();
    },
  };
}
