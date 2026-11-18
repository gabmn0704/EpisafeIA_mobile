import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Card } from '@/components/ui/Card';
import { Header } from '@/components/ui/Header';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAuth } from '@/providers/AuthProvider';
import { colors, space } from '@/theme/tokens';

interface Item {
  icon: IconName;
  title: string;
  sub: string;
  href: string;
  tone: string;
}

const ITEMS: Item[] = [
  { icon: 'edit', title: 'Registro de hoy', sub: 'Sueño, estrés, cafeína, ánimo', href: '/daily-log', tone: colors.lime },
  { icon: 'sparkles', title: 'Insights IA', sub: 'Patrones entre tus hábitos y tus crisis', href: '/insights', tone: colors.cyan },
  { icon: 'watch', title: 'Reloj y dispositivos', sub: 'Pulso en tiempo real por Bluetooth', href: '/devices', tone: colors.coral },
  { icon: 'calendar', title: 'Calendario de crisis', sub: 'Mira por mes qué días tuviste crisis', href: '/calendar', tone: colors.coral },
  { icon: 'chart', title: 'Reporte para el médico', sub: 'Resumen en PDF o texto para tu consulta', href: '/report', tone: colors.cyan },
  { icon: 'heart', title: 'Ficha médica', sub: 'Alergias, medicación y contactos para emergencias', href: '/medical-id', tone: colors.coral },
  { icon: 'users', title: 'Contactos de emergencia', sub: 'Quién recibe tu aviso SOS', href: '/contacts', tone: colors.amber },
  { icon: 'shield', title: 'Perfil y ajustes', sub: 'Recordatorios, cuenta y privacidad', href: '/settings', tone: colors.brand },
];

export default function More() {
  const { user } = useAuth();
  return (
    <Screen bottomInset={90}>
      <Header title="Más" subtitle="Todo lo demás de EpiSafe" />
      <Animated.View entering={FadeInDown.duration(350)}>
        <PressableScale onPress={() => router.push('/settings')} accessibilityLabel="Abrir perfil">
          <Card tone="raised" style={styles.profile}>
            <View style={styles.avatar}>
              <Text variant="h2" color={colors.limeInk}>
                {user?.fullName.charAt(0).toUpperCase() ?? 'E'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="title">{user?.fullName}</Text>
              <Text variant="small" color={colors.muted}>
                {user?.email}
              </Text>
            </View>
            <Icon name="chevronRight" size={18} color={colors.faint} />
          </Card>
        </PressableScale>
      </Animated.View>
      <View style={{ gap: space.md, marginTop: space.lg }}>
        {ITEMS.map((it, i) => (
          <Animated.View key={it.href} entering={FadeInDown.delay(60 + i * 60).duration(380)}>
            <PressableScale onPress={() => router.push(it.href as never)} accessibilityLabel={it.title}>
              <Card style={styles.row}>
                <View style={[styles.icon, { backgroundColor: `${it.tone}22` }]}>
                  <Icon name={it.icon} size={20} color={it.tone} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="title">{it.title}</Text>
                  <Text variant="small" color={colors.muted}>
                    {it.sub}
                  </Text>
                </View>
                <Icon name="chevronRight" size={18} color={colors.faint} />
              </Card>
            </PressableScale>
          </Animated.View>
        ))}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.md },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
});
