import { bytesToBase64, hexToBytes } from './encoding';
import { HeartRateClient } from './HeartRateClient';
import type { SampleInput } from './SampleUploader';
import type { BleDeviceInfo, BlePowerState, BleTransport } from './transport';

const frame = (hex: string) => bytesToBase64(hexToBytes(hex));
const watch: BleDeviceInfo = { id: 'AA:BB', name: 'Band 7', rssi: -50 };

class FakeTransport implements BleTransport {
  power: BlePowerState = 'on';
  connectFailures = 0;
  connectCalls = 0;
  emitValue: (b64: string) => void = () => undefined;
  emitDisconnect: () => void = () => undefined;
  scanCb: (d: BleDeviceInfo) => void = () => undefined;
  scanning = false;
  destroyed = false;
  powerState = async () => this.power;
  startScan = (cb: (d: BleDeviceInfo) => void) => {
    this.scanning = true;
    this.scanCb = cb;
  };
  stopScan = () => {
    this.scanning = false;
  };
  connect = async () => {
    this.connectCalls++;
    if (this.connectFailures > 0) {
      this.connectFailures--;
      throw new Error('timeout');
    }
  };
  monitorHeartRate = (_id: string, onValue: (b: string) => void) => {
    this.emitValue = onValue;
    return { remove: () => undefined };
  };
  onDisconnected = (_id: string, cb: (e: Error | null) => void) => {
    this.emitDisconnect = () => cb(null);
    return { remove: () => undefined };
  };
  disconnect = async () => undefined;
  destroy = () => {
    this.destroyed = true;
  };
}

const setup = (opts: { maxReconnectAttempts?: number } = {}) => {
  const transport = new FakeTransport();
  const samples: SampleInput[] = [];
  const client = new HeartRateClient({
    transport,
    onSample: (s) => samples.push(s),
    now: () => 1_700_000_000_000,
    baseBackoffMs: 1000,
    ...opts,
  });
  return { transport, samples, client };
};

describe('HeartRateClient', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('reports an error when Bluetooth is off and never scans', async () => {
    const { client, transport } = setup();
    transport.power = 'off';
    await client.startScan();
    expect(client.getState().status).toBe('error');
    expect(client.getState().message).toMatch(/Bluetooth/);
    expect(transport.scanning).toBe(false);
  });

  it('collects unique devices while scanning and stops after the timeout', async () => {
    const { client, transport } = setup();
    await client.startScan(5000);
    expect(client.getState().status).toBe('scanning');
    transport.scanCb(watch);
    transport.scanCb(watch);
    expect(client.getState().found).toHaveLength(1);
    jest.advanceTimersByTime(5000);
    expect(client.getState().status).toBe('idle');
    expect(transport.scanning).toBe(false);
  });

  it('connects and converts notifications into samples', async () => {
    const { client, transport, samples } = setup();
    await client.connect(watch);
    expect(client.getState().status).toBe('connected');
    transport.emitValue(frame('16 48 00 04 00 04')); // 72 bpm, contacto ok, 2 RR de 1000 ms
    expect(client.getState().lastHeartRate).toBe(72);
    expect(samples).toHaveLength(1);
    expect(samples[0]).toMatchObject({ heartRate: 72, hrvMs: 0 });
    expect(samples[0]?.sampledAt).toBe(new Date(1_700_000_000_000).toISOString());
  });

  it('drops readings when the sensor is not on the skin', async () => {
    const { client, transport, samples } = setup();
    await client.connect(watch);
    transport.emitValue(frame('04 48')); // contacto soportado pero no detectado
    expect(samples).toHaveLength(0);
    expect(client.getState().contactDetected).toBe(false);
    expect(client.getState().lastHeartRate).toBeNull();
  });

  it('ignores corrupt or implausible frames', async () => {
    const { client, transport, samples } = setup();
    await client.connect(watch);
    transport.emitValue(frame('00')); // truncada
    transport.emitValue(frame('00 00')); // 0 bpm
    transport.emitValue(frame('01 2C 01')); // 300 bpm
    expect(samples).toHaveLength(0);
  });

  it('reconnects with exponential backoff after a lost connection', async () => {
    const { client, transport } = setup();
    await client.connect(watch);
    transport.connectFailures = 1;
    transport.emitDisconnect();
    expect(client.getState().status).toBe('reconnecting');
    expect(client.getState().reconnectAttempt).toBe(1);
    await jest.advanceTimersByTimeAsync(1000); // intento 1 falla
    expect(client.getState().reconnectAttempt).toBe(2);
    expect(client.getState().status).toBe('reconnecting');
    await jest.advanceTimersByTimeAsync(2000); // intento 2 ok
    expect(client.getState().status).toBe('connected');
    expect(client.getState().reconnectAttempt).toBe(0);
    expect(transport.connectCalls).toBe(3);
  });

  it('gives up after the maximum number of attempts', async () => {
    const { client, transport } = setup({ maxReconnectAttempts: 2 });
    transport.connectFailures = 99;
    await client.connect(watch);
    await jest.advanceTimersByTimeAsync(1000);
    await jest.advanceTimersByTimeAsync(2000);
    expect(client.getState().status).toBe('error');
    expect(client.getState().message).toMatch(/reintentos/);
  });

  it('does not reconnect after a user-initiated disconnect', async () => {
    const { client, transport } = setup();
    await client.connect(watch);
    await client.disconnect();
    const calls = transport.connectCalls;
    transport.emitDisconnect();
    await jest.advanceTimersByTimeAsync(60_000);
    expect(transport.connectCalls).toBe(calls);
    expect(client.getState().status).toBe('idle');
  });

  it('notifies subscribers and releases the transport on dispose', async () => {
    const { client, transport } = setup();
    const seen: string[] = [];
    const off = client.subscribe((s) => seen.push(s.status));
    await client.connect(watch);
    expect(seen).toEqual(['connecting', 'connected']);
    off();
    client.dispose();
    expect(transport.destroyed).toBe(true);
  });
});
