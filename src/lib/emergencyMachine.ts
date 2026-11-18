export const COUNTDOWN_SECONDS = 10;

export type EmergencyState =
  | { phase: 'countdown'; remaining: number }
  | { phase: 'sending' }
  | { phase: 'sent'; eventId: string; warning?: string }
  | { phase: 'cancelled' }
  | { phase: 'error'; message: string };

export type EmergencyAction =
  | { type: 'tick' }
  | { type: 'cancel' }
  | { type: 'sendNow' }
  | { type: 'sent'; eventId: string; warning?: string }
  | { type: 'failed'; message: string }
  | { type: 'retry' };

export const initialEmergency = (seconds: number = COUNTDOWN_SECONDS): EmergencyState => ({ phase: 'countdown', remaining: seconds });

/**
 * Máquina de estados de la emergencia. Reglas:
 * - La cuenta atrás solo puede cancelarse mientras está en curso.
 * - Al llegar a 0 pasa a `sending` (el envío real lo dispara la pantalla).
 * - Una vez `sending`/`sent` ya no se puede cancelar: para eso existe "falsa alarma" en el servidor.
 */
export function emergencyReducer(state: EmergencyState, action: EmergencyAction): EmergencyState {
  switch (action.type) {
    case 'tick':
      if (state.phase !== 'countdown') return state;
      return state.remaining <= 1 ? { phase: 'sending' } : { phase: 'countdown', remaining: state.remaining - 1 };
    case 'cancel':
      return state.phase === 'countdown' ? { phase: 'cancelled' } : state;
    case 'sendNow':
      return state.phase === 'countdown' ? { phase: 'sending' } : state;
    case 'sent':
      return state.phase === 'sending' ? { phase: 'sent', eventId: action.eventId, warning: action.warning } : state;
    case 'failed':
      return state.phase === 'sending' ? { phase: 'error', message: action.message } : state;
    case 'retry':
      return state.phase === 'error' ? { phase: 'sending' } : state;
  }
}

/** Enlace de mapa para compartir la posición. */
export function mapsLink(latitude: number, longitude: number): string {
  return `https://maps.google.com/?q=${latitude.toFixed(6)},${longitude.toFixed(6)}`;
}

/** Quita todo menos dígitos y "+" para construir un enlace tel:. */
export function telUrl(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

/** Mensaje prellenado para SMS / WhatsApp: quien avisa, hora y mapa si hay ubicacion. */
export function emergencyMessage(userName: string, when: Date, position?: { latitude: number; longitude: number } | null): string {
  const hour = when.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
  const base = `Necesito ayuda. Soy ${userName} y activé mi alerta de emergencia en EpiSafe a las ${hour}.`;
  return position ? `${base} Mi ubicación: ${mapsLink(position.latitude, position.longitude)}` : base;
}

/** Enlace sms: con texto. iOS separa el cuerpo con "&", Android con "?". */
export function smsUrl(phone: string, body: string, os: 'ios' | 'android' | 'web' = 'android'): string {
  return `sms:${phone.replace(/[^\d+]/g, '')}${os === 'ios' ? '&' : '?'}body=${encodeURIComponent(body)}`;
}

/** Enlace de WhatsApp (wa.me exige el numero solo con digitos, sin "+"). */
export function whatsappUrl(phone: string, body: string): string {
  return `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(body)}`;
}
