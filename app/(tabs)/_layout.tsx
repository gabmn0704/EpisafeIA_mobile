import { router } from 'expo-router';
import { TabList, TabSlot, TabTrigger, Tabs, type TabTriggerSlotProps } from 'expo-router/ui';
import { useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, type IconName } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { useReminderSync } from '@/hooks/useReminderSync';
import { haptic } from '@/lib/haptics';
import { colors, shadow } from '@/theme/tokens';

export const TAB_BAR_HEIGHT = 72;
const BAR_MARGIN = 14;

interface TabItemProps extends TabTriggerSlotProps {
  icon: IconName;
  label: string;
}

function TabItem({ icon, label, isFocused, onPress, ...rest }: TabItemProps) {
  const on = useSharedValue(isFocused ? 1 : 0);
  useEffect(() => {
    on.value = withSpring(isFocused ? 1 : 0, { damping: 16, stiffness: 240 });
  }, [isFocused, on]);
  const pillStyle = useAnimatedStyle(() => ({ opacity: on.value, transform: [{ scaleX: 0.5 + on.value * 0.5 }, { scaleY: 0.7 + on.value * 0.3 }] }));
  const iconStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -on.value * 1 }, { scale: 1 + on.value * 0.08 }] }));
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
      <View style={styles.iconPill}>
        <Animated.View style={[StyleSheet.absoluteFill, styles.iconPillOn, pillStyle]} />
        <Animated.View style={iconStyle}>
          <Icon name={icon} size={22} color={isFocused ? colors.limeInk : colors.muted} strokeWidth={isFocused ? 2.4 : 2} />
        </Animated.View>
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
  return (
    <Tabs>
      <TabSlot style={{ flex: 1 }} />
      <View pointerEvents="box-none" style={[styles.dock, { bottom: Math.max(insets.bottom, 10), height: TAB_BAR_HEIGHT + 30 }]}>
      <View style={styles.bar}>
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
      </View>
        <SosButton />
      </View>
    </Tabs>
  );
}

function SosButton() {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false);
  }, [pulse]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.55 * (1 - pulse.value), transform: [{ scale: 1 + pulse.value * 0.55 }] }));
  return (
    <View style={styles.sosWrap} pointerEvents="box-none">
      <Animated.View pointerEvents="none" style={[styles.sosRing, ring]} />
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
          <Icon name="alert" size={26} color="#2a0510" strokeWidth={2.4} />
          <Text variant="label" color="#2a0510" style={styles.sosText}>
            SOS
          </Text>
        </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: { position: 'absolute', left: BAR_MARGIN, right: BAR_MARGIN, justifyContent: 'flex-end' },
  bar: {
    height: TAB_BAR_HEIGHT,
    backgroundColor: 'rgba(22, 18, 58, 0.97)',
    borderWidth: 1,
    borderColor: colors.lineStrong,
    borderRadius: 32,
    paddingHorizontal: 8,
    justifyContent: 'center',
    ...shadow.card,
  },
  list: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  item: { flex: 1, alignItems: 'center', gap: 3, paddingVertical: 2 },
  spacer: { width: 76 },
  iconPill: { width: 52, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  iconPillOn: { backgroundColor: colors.lime, borderRadius: 16 },
  label: { fontSize: 11, lineHeight: 14 },
  sosWrap: { position: 'absolute', alignSelf: 'center', bottom: TAB_BAR_HEIGHT - 44, width: 76, height: 76, alignItems: 'center', justifyContent: 'center' },
  sosRing: { position: 'absolute', width: 76, height: 76, borderRadius: 38, backgroundColor: colors.coral },
  sos: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.coral,
    borderWidth: 4,
    borderColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.glow(colors.coral),
  },
  sosText: { fontWeight: '800', letterSpacing: 1, marginTop: -2 },
});
