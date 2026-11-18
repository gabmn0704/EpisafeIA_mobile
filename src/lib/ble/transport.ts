/**
 * Abstraccion minima del transporte BLE. Permite probar la logica de
 * escaneo/conexion/reconexion con un transporte falso y aislar la
 * dependencia nativa (react-native-ble-plx) en un solo archivo.
 */
export interface BleDeviceInfo {
  id: string;
  name: string | null;
  rssi: number | null;
}

export interface Subscription {
  remove(): void;
}

export type BlePowerState = 'on' | 'off' | 'unauthorized' | 'unsupported' | 'unknown';

export interface BleTransport {
  /** Estado del adaptador Bluetooth. */
  powerState(): Promise<BlePowerState>;
  /** Escanea anuncios que incluyan el servicio Heart Rate. */
  startScan(onDevice: (d: BleDeviceInfo) => void, onError: (e: Error) => void): void;
  stopScan(): void;
  connect(deviceId: string): Promise<void>;
  /** Suscribe a notificaciones de Heart Rate Measurement; entrega el valor base64. */
  monitorHeartRate(deviceId: string, onValue: (base64: string) => void, onError: (e: Error) => void): Subscription;
  /** Avisa cuando el dispositivo se desconecta. */
  onDisconnected(deviceId: string, cb: (error: Error | null) => void): Subscription;
  disconnect(deviceId: string): Promise<void>;
  destroy(): void;
}
