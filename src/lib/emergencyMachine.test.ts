import { COUNTDOWN_SECONDS, emergencyMessage, emergencyReducer, initialEmergency, mapsLink, smsUrl, telUrl, whatsappUrl, type EmergencyState } from './emergencyMachine';

describe('emergencyReducer', () => {
  it('starts a countdown and ticks down', () => {
    let s: EmergencyState = initialEmergency();
    expect(s).toEqual({ phase: 'countdown', remaining: COUNTDOWN_SECONDS });
    s = emergencyReducer(s, { type: 'tick' });
    expect(s).toEqual({ phase: 'countdown', remaining: COUNTDOWN_SECONDS - 1 });
  });

  it('moves to sending when the countdown reaches zero', () => {
    let s: EmergencyState = initialEmergency(2);
    s = emergencyReducer(s, { type: 'tick' });
    s = emergencyReducer(s, { type: 'tick' });
    expect(s.phase).toBe('sending');
  });

  it('can be cancelled only during the countdown', () => {
    expect(emergencyReducer(initialEmergency(), { type: 'cancel' }).phase).toBe('cancelled');
    const sending: EmergencyState = { phase: 'sending' };
    expect(emergencyReducer(sending, { type: 'cancel' })).toBe(sending);
    const sent: EmergencyState = { phase: 'sent', eventId: 'e1' };
    expect(emergencyReducer(sent, { type: 'cancel' })).toBe(sent);
  });

  it('send now skips the wait', () => {
    expect(emergencyReducer(initialEmergency(), { type: 'sendNow' }).phase).toBe('sending');
    expect(emergencyReducer({ phase: 'cancelled' }, { type: 'sendNow' }).phase).toBe('cancelled');
  });

  it('records success and failure only while sending, and allows a retry', () => {
    const sending: EmergencyState = { phase: 'sending' };
    expect(emergencyReducer(sending, { type: 'sent', eventId: 'e1', warning: 'sin contactos' })).toEqual({ phase: 'sent', eventId: 'e1', warning: 'sin contactos' });
    const failed = emergencyReducer(sending, { type: 'failed', message: 'sin red' });
    expect(failed).toEqual({ phase: 'error', message: 'sin red' });
    expect(emergencyReducer(failed, { type: 'retry' }).phase).toBe('sending');
    expect(emergencyReducer(initialEmergency(), { type: 'sent', eventId: 'x' }).phase).toBe('countdown');
  });

  it('ignores ticks after leaving the countdown', () => {
    const cancelled: EmergencyState = { phase: 'cancelled' };
    expect(emergencyReducer(cancelled, { type: 'tick' })).toBe(cancelled);
  });
});

describe('contact links', () => {
  it('builds a message with the map link only when there is a position', () => {
    const at = new Date(2026, 10, 17, 9, 5);
    expect(emergencyMessage('Laura', at)).toContain('Soy Laura');
    expect(emergencyMessage('Laura', at)).not.toContain('maps');
    expect(emergencyMessage('Laura', at, { latitude: 4.7, longitude: -74.1 })).toContain('https://maps.google.com/?q=4.700000,-74.100000');
  });
  it('builds sms and whatsapp urls', () => {
    expect(smsUrl('+57 300 1', 'hola mundo', 'ios')).toBe('sms:+573001&body=hola%20mundo');
    expect(smsUrl('+57 300 1', 'hola', 'android')).toBe('sms:+573001?body=hola');
    expect(whatsappUrl('+57 (300) 123', 'a b')).toBe('https://wa.me/57300123?text=a%20b');
  });
});

describe('helpers', () => {
  it('builds a maps link with fixed precision', () => {
    expect(mapsLink(4.711, -74.0721)).toBe('https://maps.google.com/?q=4.711000,-74.072100');
  });

  it('sanitizes phone numbers for tel: links', () => {
    expect(telUrl('+57 (300) 123-4567')).toBe('tel:+573001234567');
  });
});

describe('contact links', () => {
  it('builds a message with the map link only when there is a position', () => {
    const at = new Date(2026, 10, 17, 9, 5);
    expect(emergencyMessage('Laura', at)).toContain('Soy Laura');
    expect(emergencyMessage('Laura', at)).not.toContain('maps');
    expect(emergencyMessage('Laura', at, { latitude: 4.7, longitude: -74.1 })).toContain('https://maps.google.com/?q=4.700000,-74.100000');
  });

  it('builds sms and whatsapp urls', () => {
    expect(smsUrl('+57 300 1', 'hola mundo', 'ios')).toBe('sms:+573001&body=hola%20mundo');
    expect(smsUrl('+57 300 1', 'hola', 'android')).toBe('sms:+573001?body=hola');
    expect(whatsappUrl('+57 (300) 123', 'a b')).toBe('https://wa.me/57300123?text=a%20b');
  });
});
