import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { useWindowDimensions, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Glow } from '@/components/ui/Glow';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Logo } from '@/components/ui/Logo';
import { PressableScale } from '@/components/ui/PressableScale';
import { Text } from '@/components/ui/Text';
import { prefs } from '@/lib/prefs';
import { colors, radius, space } from '@/theme/tokens';

interface Slide {
  icon: IconName;
  accent: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    icon: 'activity',
    accent: colors.lime,
    title: 'Anticipa tu día',
    body: 'Cruzamos tu sueño, estrés y medicación para estimar tu riesgo de crisis y mostrarte qué lo mueve.',
  },
  {
    icon: 'alert',
    accent: colors.coral,
    title: 'Ayuda en un toque',
    body: 'Un botón de emergencia con cuenta atrás avisa a tus contactos con tu ubicación. Si fue un error, lo cancelas.',
  },
  {
    icon: 'sparkles',
    accent: colors.cyan,
    title: 'Entiende tus patrones',
    body: 'La IA encuentra relaciones entre tus hábitos y tus crisis, y te lo explica con evidencia. No diagnostica: te ayuda a hablarlo con tu neurólogo.',
  },
];

function Dot({ index, x, width }: { index: number; x: SharedValue<number>; width: number }) {
  const style = useAnimatedStyle(() => ({
    width: interpolate(x.value, [(index - 1) * width, index * width, (index + 1) * width], [8, 26, 8], Extrapolation.CLAMP),
    opacity: interpolate(x.value, [(index - 1) * width, index * width, (index + 1) * width], [0.35, 1, 0.35], Extrapolation.CLAMP),
  }));
  return <Animated.View style={[styles.dot, style]} />;
}

function SlideView({ slide, index, x, width }: { slide: Slide; index: number; x: SharedValue<number>; width: number }) {
  const art = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(x.value, [(index - 1) * width, index * width, (index + 1) * width], [width * 0.35, 0, -width * 0.35], Extrapolation.CLAMP) },
      { scale: interpolate(x.value, [(index - 1) * width, index * width, (index + 1) * width], [0.8, 1, 0.8], Extrapolation.CLAMP) },
    ],
  }));
  return (
    <View style={{ width, paddingHorizontal: space.xxl, justifyContent: 'center' }}>
      <Animated.View style={[styles.art, art]}>
        <Glow color={slide.accent} size={320} opacity={0.35} style={{ top: -50, left: -50 }} />
        <View style={[styles.ring, { borderColor: slide.accent }]} />
        <View style={[styles.ring2, { borderColor: slide.accent }]} />
        <View style={[styles.iconWrap, { backgroundColor: slide.accent }]}>
          <Icon name={slide.icon} size={54} color={colors.limeInk} strokeWidth={2.2} />
        </View>
      </Animated.View>
      <Text variant="display" style={{ marginTop: space.huge }}>
        {slide.title}
      </Text>
      <Text variant="body" color={colors.muted} style={{ marginTop: space.md, fontSize: 17, lineHeight: 26 }}>
        {slide.body}
      </Text>
    </View>
  );
}

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const x = useSharedValue(0);
  // El tipo de instancia de ScrollView no es público en RN 0.88: se tipa solo lo que se usa.
  const ref = useRef<{ scrollTo: (o: { x: number; animated: boolean }) => void } | null>(null);
  const [page, setPage] = useState(0);
  const last = page === SLIDES.length - 1;

  const finish = async () => {
    await prefs.setOnboarded();
    router.replace('/(auth)/register');
  };

  const skip = async () => {
    await prefs.setOnboarded();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={[colors.bgTop, colors.bg]} style={StyleSheet.absoluteFill} />
      <View style={[styles.top, { paddingTop: insets.top + space.md }]}>
        <Logo size={30} />
        <PressableScale onPress={skip} hitSlop={12} accessibilityLabel="Omitir introducción">
          <Text variant="small" color={colors.muted}>
            Omitir
          </Text>
        </PressableScale>
      </View>
      <ScrollView
        ref={ref as never}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={(e) => {
          x.value = e.nativeEvent.contentOffset.x;
        }}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        style={{ flex: 1 }}
      >
        {SLIDES.map((s, i) => (
          <SlideView key={s.title} slide={s} index={i} x={x} width={width} />
        ))}
      </ScrollView>
      <View style={[styles.bottom, { paddingBottom: insets.bottom + space.xl }]}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <Dot key={s.title} index={i} x={x} width={width} />
          ))}
        </View>
        <Button
          label={last ? 'Crear mi cuenta' : 'Siguiente'}
          icon={last ? undefined : 'chevronRight'}
          onPress={() => {
            if (last) void finish();
            else ref.current?.scrollTo({ x: (page + 1) * width, animated: true });
          }}
          size="lg"
        />
        <PressableScale onPress={skip} accessibilityLabel="Ya tengo cuenta">
          <Text variant="small" color={colors.muted} center>
            ¿Ya tienes cuenta? <Text variant="small" color={colors.lime}>Inicia sesión</Text>
          </Text>
        </PressableScale>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.xxl },
  art: { width: 220, height: 220, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  ring: { position: 'absolute', width: 220, height: 220, borderRadius: 110, borderWidth: 1, opacity: 0.25 },
  ring2: { position: 'absolute', width: 168, height: 168, borderRadius: 84, borderWidth: 1, opacity: 0.45 },
  iconWrap: { width: 112, height: 112, borderRadius: radius.xl, alignItems: 'center', justifyContent: 'center' },
  bottom: { paddingHorizontal: space.xxl, gap: space.lg },
  dots: { flexDirection: 'row', gap: 6, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm },
  dot: { height: 8, borderRadius: 4, backgroundColor: colors.lime },
});
