import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useEffect, useReducer, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { Text } from '@/components/ui/Text';
import { useContacts } from '@/hooks/queries';
import { endpoints } from '@/lib/api/instance';
import { friendlyMessage } from '@/lib/api/errors';
import type { Contact } from '@/lib/api/schemas';
import { emergencyMessage, emergencyReducer, initialEmergency, smsUrl, telUrl, whatsappUrl } from '@/lib/emergencyMachine';
import { useAuth } from '@/providers/AuthProvider';
import { haptic } from '@/lib/haptics';
import { getEmergencyPosition, type PositionResult } from '@/lib/location';
import { useToast } from '@/providers/ToastProvider';
import { colors, radius, space } from '@/theme/tokens';

function Ripple({ delay }: { delay: number }) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withRepeat(withTiming(1, { duration: 2000, easing: Easing.out(Easing.quad) }), -1));
  }, [delay, p]);
  const style = useAnimatedStyle(() => ({ opacity: 0.5 * (1 - p.value), transform: [{ scale: 0.6 + p.value * 1.1 }] }));
  return <Animated.View pointerEvents="none" style={[styles.ripple, style]} />;
}

export default function Emergency() {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const contacts = useContacts();
  const [state, dispatch] = useReducer(emergencyReducer, undefined, () => initialEmergency());
  const [position, setPosition] = useState<PositionResult | null>(null);
  const positionPromise = useRef<Promise<PositionResult> | null>(null);
  const sentGuard = useRef(false);
  const [attempt, setAttempt] = useState(0);


  // La ubicación se pide durante la cuenta atrás para no retrasar el aviso.
  useEffect(() => {
    positionPromise.current = getEmergencyPosition().then((r) => {
      setPosition(r);
      return r;
    });
  }, []);

  // Cuenta atrás: un tick por segundo con vibración creciente.
  useEffect(() => {
    if (state.phase !== 'countdown') return;
    const id = setInterval(() => {
      dispatch({ type: 'tick' });
      haptic.heavy();
    }, 1000);
    return () => clearInterval(id);
  }, [state.phase]);

  // Envío real al backend (una vez por intento).
  useEffect(() => {
    if (state.phase !== 'sending') {
      if (state.phase !== 'error') sentGuard.current = false;
      return;
    }
    if (sentGuard.current) return;
    sentGuard.current = true;
    (async () => {
      const pos = await Promise.race([positionPromise.current ?? Promise.resolve(null), new Promise<null>((r) => setTimeout(() => r(null), 3000))]);
      try {
        const res = await endpoints.emergency.trigger(pos && pos.ok ? { latitude: pos.latitude, longitude: pos.longitude } : {});
        haptic.success();
        dispatch({ type: 'sent', eventId: res.event.id, warning: res.warning });
      } catch (e) {
        haptic.error();
        dispatch({ type: 'failed', message: friendlyMessage(e) });
      }
    })();
  }, [state.phase, attempt]);

  const call = (url: string) => Linking.openURL(url).catch(() => toast.error('No se pudo abrir el marcador del teléfono.'));

  const finish = async (kind: 'resolve' | 'false') => {
    if (state.phase !== 'sent') return;
    try {
      if (kind === 'resolve') await endpoints.emergency.resolve(state.eventId);
      else await endpoints.emergency.falseAlarm(state.eventId);
      toast.success(kind === 'resolve' ? 'Marcado como resuelto. Que te recuperes.' : 'Marcado como falsa alarma.');
      router.back();
    } catch (e) {
      toast.error(friendlyMessage(e));
    }
  };

  const { user } = useAuth();
  const sorted = [...(contacts.data ?? [])].sort((a, b) => a.priority - b.priority);
  const message = emergencyMessage(user?.fullName ?? 'un usuario de EpiSafe', new Date(), position?.ok ? position : null);
  const contactList = <ContactList contacts={sorted} message={message} open={call} />;
  const countdown = state.phase === 'countdown';

  return (
    <View style={styles.root}>
      <LinearGradient colors={countdown ? ['#5a0f22', '#2a0716', colors.bg] : ['#1a1450', colors.bg, colors.bg]} style={StyleSheet.absoluteFill} />
      <View style={[styles.content, { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl }]}>
        <Text variant="label" color={colors.coral} center>
          EMERGENCIA
        </Text>

        {state.phase === 'countdown' ? (
          <>
            <View style={styles.center}>
              <View style={styles.ringWrap}>
                <Ripple delay={0} />
                <Ripple delay={650} />
                <Ripple delay={1300} />
                <View style={styles.disc} accessibilityLiveRegion="polite" accessibilityLabel={`Aviso en ${state.remaining} segundos`}>
                  <Text style={styles.count}>{state.remaining}</Text>
                </View>
              </View>
              <Text variant="h1" center style={{ marginTop: space.xl }}>
                Avisando a tus contactos
              </Text>
              <Text variant="body" color={colors.muted} center style={{ marginTop: space.sm, maxWidth: 300 }}>
                Se enviará tu ubicación y la hora. Si fue un error, cancela ahora.
              </Text>
            </View>
            <View style={{ gap: space.md }}>
              <Button label="Cancelar, estoy bien" onPress={() => dispatch({ type: 'cancel' })} size="lg" variant="primary" />
              <Button label="Enviar ahora" onPress={() => dispatch({ type: 'sendNow' })} variant="danger" />
            </View>
          </>
        ) : state.phase === 'sending' ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.coral} />
            <Text variant="h1" center style={{ marginTop: space.xl }}>
              Enviando aviso…
            </Text>
            <Text variant="body" color={colors.muted} center style={{ marginTop: space.sm }}>
              Notificando a tus contactos por orden de prioridad.
            </Text>
          </View>
        ) : state.phase === 'sent' ? (
          <>
            <View style={styles.statusRow}>
              <View style={[styles.miniDisc, { backgroundColor: colors.lime }]}>
                <Icon name="check" size={30} color={colors.limeInk} strokeWidth={3} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="h1">{sorted.length === 0 ? 'Alerta registrada' : 'Aviso enviado'}</Text>
                <Text variant="small" color={colors.muted}>
                  {state.warning ?? 'Tus contactos con aviso activo recibieron tu alerta.'}
                </Text>
              </View>
            </View>
            <View style={styles.loc}>
              <Icon name="location" size={16} color={position?.ok ? colors.lime : colors.amber} />
              <Text variant="small" color={colors.muted}>
                {position?.ok ? 'Ubicación incluida en los mensajes' : position?.ok === false && position.reason === 'denied' ? 'Sin permiso de ubicación: se avisó sin ella' : 'No se pudo obtener tu ubicación'}
              </Text>
            </View>
            {contactList}
            <View style={styles.rowButtons}>
              <Button label="Ya estoy bien" variant="ghost" size="sm" onPress={() => finish('resolve')} style={{ flex: 1 }} />
              <Button label="Falsa alarma" variant="ghost" size="sm" onPress={() => finish('false')} style={{ flex: 1 }} />
            </View>
          </>
        ) : state.phase === 'error' ? (
          <>
            <View style={styles.statusRow}>
              <View style={[styles.miniDisc, { backgroundColor: colors.coralSoft, borderWidth: 2, borderColor: colors.coral }]}>
                <Icon name="alert" size={28} color={colors.coral} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="h1">No pudimos avisar</Text>
                <Text variant="small" color={colors.muted}>
                  {state.message} Avisa tú directamente con los botones mientras reintentamos.
                </Text>
              </View>
            </View>
            {contactList}
            <View style={{ gap: space.md }}>
              <Button
                label="Reintentar aviso"
                icon="refresh"
                variant="primary"
                onPress={() => {
                  sentGuard.current = false;
                  dispatch({ type: 'retry' });
                  setAttempt((a) => a + 1);
                }}
              />
              <Button label="Cerrar" variant="ghost" size="sm" onPress={() => router.back()} />
            </View>
          </>
        ) : (
          <>
            <View style={styles.center}>
              <View style={[styles.disc, { backgroundColor: colors.surface2 }]}>
                <Icon name="shield" size={60} color={colors.lime} />
              </View>
              <Text variant="h1" center style={{ marginTop: space.xl }}>
                Cancelado
              </Text>
              <Text variant="body" color={colors.muted} center style={{ marginTop: space.sm }}>
                No se envió ningún aviso.
              </Text>
            </View>
            <Button label="Volver" onPress={() => router.back()} size="lg" />
          </>
        )}
      </View>
    </View>
  );
}

function ContactList({ contacts, message, open }: { contacts: Contact[]; message: string; open: (url: string) => void }) {
  if (contacts.length === 0) {
    return (
      <View style={[styles.center, { gap: space.md }]}>
        <Icon name="users" size={44} color={colors.amber} />
        <Text variant="h2" center>
          No tienes contactos de emergencia
        </Text>
        <Text variant="body" color={colors.muted} center style={{ maxWidth: 300 }}>
          Añade al menos una persona de confianza para poder avisarle desde aquí.
        </Text>
        <Button label="Añadir contacto" icon="plus" onPress={() => router.push('/contact-form')} />
      </View>
    );
  }
  const os = Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ gap: space.md, paddingVertical: space.md }} showsVerticalScrollIndicator={false}>
      {contacts.map((c) => {
        const auto = (c.notifySms && !!c.phone) || (c.notifyEmail && !!c.email);
        return (
          <View key={c.id} style={styles.contact}>
            <View style={styles.contactTop}>
              <View style={styles.badge}>
                <Text variant="label" color={colors.limeInk}>
                  {c.priority}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="title" numberOfLines={1}>
                  {c.name}
                </Text>
                <Text variant="small" color={auto ? colors.muted : colors.amber} numberOfLines={1}>
                  {[c.relationship, auto ? 'Recibió aviso automático' : 'Sin aviso automático'].filter(Boolean).join(' · ')}
                </Text>
              </View>
            </View>
            {c.phone ? (
              <View style={styles.rowButtons}>
                <Button label="Llamar" icon="phone" size="sm" onPress={() => open(telUrl(c.phone as string))} style={{ flex: 1 }} />
                <Button label="SMS" icon="mail" size="sm" variant="soft" onPress={() => open(smsUrl(c.phone as string, message, os))} style={{ flex: 1 }} />
                <Button label="WhatsApp" size="sm" variant="soft" onPress={() => open(whatsappUrl(c.phone as string, message))} style={{ flex: 1.3 }} />
              </View>
            ) : (
              <Text variant="small" color={colors.faint}>
                Sin teléfono: añade uno para llamarle o escribirle.
              </Text>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const DISC = 168;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  content: { flex: 1, paddingHorizontal: space.xxl, justifyContent: 'space-between' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  ringWrap: { width: 300, height: 300, alignItems: 'center', justifyContent: 'center' },
  ripple: { position: 'absolute', width: 300, height: 300, borderRadius: 150, borderWidth: 2, borderColor: colors.coral, backgroundColor: 'rgba(255,92,120,0.12)' },
  disc: { width: DISC, height: DISC, borderRadius: DISC / 2, backgroundColor: colors.coral, alignItems: 'center', justifyContent: 'center' },
  count: { fontFamily: 'Outfit_800ExtraBold', fontSize: 96, lineHeight: 104, color: '#2a0510', letterSpacing: -4 },
  loc: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: space.lg, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, marginTop: space.lg },
  miniDisc: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  contact: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: space.md, gap: space.md, borderWidth: 1, borderColor: colors.line },
  contactTop: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  badge: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  rowButtons: { flexDirection: 'row', gap: space.md },
});
