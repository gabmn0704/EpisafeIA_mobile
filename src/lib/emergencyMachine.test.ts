import { COUNTDOWN_SECONDS, emergencyReducer, initialEmergency, mapsLink, telUrl, type EmergencyState } from './emergencyMachine';

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

describe('helpers', () => {
  it('builds a maps link with fixed precision', () => {
    expect(mapsLink(4.711, -74.0721)).toBe('https://maps.google.com/?q=4.711000,-74.072100');
  });

  it('sanitizes phone numbers for tel: links', () => {
    expect(telUrl('+57 (300) 123-4567')).toBe('tel:+573001234567');
  });
});
