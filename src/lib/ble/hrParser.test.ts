import { base64ToBytes, bytesToBase64, hexToBytes } from './encoding';
import {
  HeartRateParseError,
  isPlausibleHeartRate,
  parseHeartRateBase64,
  parseHeartRateMeasurement,
  rmssd,
} from './hrParser';

const parse = (hex: string) => parseHeartRateMeasurement(hexToBytes(hex));

describe('parseHeartRateMeasurement', () => {
  it('parses a uint8 heart rate without extras (flags 0x00)', () => {
    const r = parse('00 48'); // 72 bpm
    expect(r.heartRate).toBe(72);
    expect(r.contactSupported).toBe(false);
    expect(r.contactDetected).toBe(false);
    expect(r.energyExpendedKj).toBeNull();
    expect(r.rrIntervalsMs).toEqual([]);
  });

  it('parses a uint16 little-endian heart rate (flags 0x01)', () => {
    expect(parse('01 2C 01').heartRate).toBe(300); // 0x012C
    expect(parse('01 80 00').heartRate).toBe(128);
  });

  it('reads sensor contact bits (flags 0x06 = supported + detected)', () => {
    const r = parse('06 5A');
    expect(r.heartRate).toBe(90);
    expect(r.contactSupported).toBe(true);
    expect(r.contactDetected).toBe(true);
  });

  it('distinguishes supported but not detected (flags 0x04)', () => {
    const r = parse('04 00');
    expect(r.contactSupported).toBe(true);
    expect(r.contactDetected).toBe(false);
  });

  it('parses energy expended (flags 0x08)', () => {
    const r = parse('08 3C 10 00'); // 60 bpm, 16 kJ
    expect(r.heartRate).toBe(60);
    expect(r.energyExpendedKj).toBe(16);
  });

  it('parses RR intervals in 1/1024 s (flags 0x10)', () => {
    // 0x0400 = 1024 -> 1000 ms ; 0x0200 = 512 -> 500 ms
    const r = parse('10 4B 00 04 00 02');
    expect(r.heartRate).toBe(75);
    expect(r.rrIntervalsMs).toEqual([1000, 500]);
  });

  it('parses a full frame with uint16 hr, energy and RR (flags 0x1F)', () => {
    const r = parse('1F 64 00 0A 00 00 04');
    expect(r.heartRate).toBe(100);
    expect(r.energyExpendedKj).toBe(10);
    expect(r.rrIntervalsMs).toEqual([1000]);
    expect(r.contactDetected).toBe(true);
  });

  it('ignores a dangling odd byte at the end of the RR list', () => {
    const r = parse('10 50 00 04 FF');
    expect(r.rrIntervalsMs).toEqual([1000]);
  });

  it('rejects truncated frames', () => {
    expect(() => parse('00')).toThrow(HeartRateParseError);
    expect(() => parse('01 50')).toThrow(HeartRateParseError);
    expect(() => parse('08 50 01')).toThrow(HeartRateParseError);
    expect(() => parseHeartRateMeasurement(new Uint8Array())).toThrow(HeartRateParseError);
  });

  it('parses the base64 value delivered by ble-plx', () => {
    const b64 = bytesToBase64(hexToBytes('06 48'));
    expect(parseHeartRateBase64(b64).heartRate).toBe(72);
  });
});

describe('encoding', () => {
  it('round-trips base64 for different padding lengths', () => {
    for (const hex of ['00', '00 ff', '00 ff 10', 'de ad be ef']) {
      const bytes = hexToBytes(hex);
      expect(Array.from(base64ToBytes(bytesToBase64(bytes)))).toEqual(Array.from(bytes));
    }
  });

  it('matches known base64 vectors', () => {
    expect(bytesToBase64(new TextEncoder().encode('Man'))).toBe('TWFu');
    expect(bytesToBase64(new TextEncoder().encode('Ma'))).toBe('TWE=');
    expect(Array.from(base64ToBytes('TWE='))).toEqual([77, 97]);
  });

  it('rejects invalid input', () => {
    expect(() => base64ToBytes('@@@')).toThrow();
    expect(() => hexToBytes('abc')).toThrow();
    expect(() => hexToBytes('zz')).toThrow();
  });
});

describe('helpers', () => {
  it('validates plausible heart rates', () => {
    expect(isPlausibleHeartRate(72)).toBe(true);
    expect(isPlausibleHeartRate(0)).toBe(false);
    expect(isPlausibleHeartRate(300)).toBe(false);
    expect(isPlausibleHeartRate(Number.NaN)).toBe(false);
  });

  it('computes RMSSD', () => {
    expect(rmssd([800])).toBeNull();
    expect(rmssd([800, 800, 800])).toBe(0);
    expect(rmssd([800, 840])).toBe(40);
  });
});
