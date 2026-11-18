import { router } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useAlertWatcher } from '@/hooks/useAlertWatcher';
import { useReminderSync } from '@/hooks/useReminderSync';
import { haptic } from '@/lib/haptics';
import { colors, radius, shadow } from '@/theme/tokens';

export const TAB_BAR_HEIGHT = 76;

interface TabItemProps extends TabTriggerSlotProps {
  icon: IconName;
  label: string;
}

function TabItem({ icon, label, isFocused, onPress, ...rest }: TabItemProps) {
  return (
    <Pressable
      {...(rest as object)}
      onPress={(e) => {
        haptic.select();
        onPress?.(e);
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: !!isFocused }}
      accessibilityLabel={label}
      style={styles.item}
    >
      <View style={[styles.iconPill, isFocused ? styles.iconPillOn : null]}>
        <Icon name={icon} size={22} color={isFocused ? colors.limeInk : colors.muted} />
      </View>
      <Text variant="small" color={isFocused ? colors.ink : colors.faint} style={styles.label}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  useReminderSync();
  useAlertWatcher();
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <View style={[styles.bar, { paddingBottom: insets.bottom + 6, height: TAB_BAR_HEIGHT + insets.bottom }]}>
        <TabList style={styles.list}>
          <TabTrigger name="index" href="/" asChild>
            <TabItem icon="home" label="Inicio" />
          </TabTrigger>
          <TabTrigger name="medications" href="/medications" asChild>
            <TabItem icon="pill" label="Medicinas" />
          </TabTrigger>
          <View style={styles.spacer} />
          <TabTrigger name="crisis" href="/crisis" asChild>
            <TabItem icon="activity" label="Crisis" />
          </TabTrigger>
          <TabTrigger name="more" href="/more" asChild>
            <TabItem icon="menu" label="Más" />
          </TabTrigger>
        </TabList>
        <PressableScale
          onPress={() => {
            haptic.heavy();
            router.push('/emergency');
          }}
          hapticFeedback={false}
          pressedScale={0.92}
          accessibilityLabel="Emergencia"
          accessibilityHint="Abre la pantalla de emergencia con cuenta atrás"
          style={styles.sos}
        >
          <Icon name="alert" size={28} color="#2a0510" strokeWidth={2.4} />
          <Text variant="label" color="#2a0510" style={styles.sosText}>
            SOS
          </Text>
        </PressableScale>
      </View>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  list: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  item: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 2 },
  spacer: { width: 84 },
  iconPill: { width: 48, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  iconPillOn: { backgroundColor: colors.lime },
  label: { fontSize: 11, lineHeight: 14 },
  sos: {
    position: 'absolute',
    alignSelf: 'center',
    top: -26,
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.coral,
    borderWidth: 4,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow(colors.coral),
  },
  sosText: { fontWeight: '800', letterSpacing: 1, marginTop: -2 },
});
