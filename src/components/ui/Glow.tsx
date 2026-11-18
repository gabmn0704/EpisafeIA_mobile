import { StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

export interface GlowProps {
  color: string;
  size: number;
  opacity?: number;
  style?: ViewStyle;
}

/** Resplandor radial suave (sustituye al blur, que no es portable en RN). */
export function Glow({ color, size, opacity = 0.55, style }: GlowProps) {
  return (
    <View pointerEvents="none" style={[{ width: size, height: size, position: 'absolute' }, style]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <RadialGradient id="g" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={color} stopOpacity={opacity} />
            <Stop offset="100%" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} fill="url(#g)" />
      </Svg>
    </View>
  );
}
