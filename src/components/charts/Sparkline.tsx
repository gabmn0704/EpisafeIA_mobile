import { useId } from 'react';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors } from '@/theme/tokens';
import { buildSparkPath } from './sparkPath';

export interface SparklineProps {
  values: readonly number[];
  width?: number;
  height?: number;
  color?: string;
  min?: number;
  max?: number;
}

export function Sparkline({ values, width = 260, height = 64, color = colors.lime, min, max }: SparklineProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const g = buildSparkPath(values, width, height, { min, max, pad: 6 });
  if (!g.last) return null;
  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id={`f${id}`} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={color} stopOpacity={0.35} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={g.area} fill={`url(#f${id})`} />
      <Path d={g.line} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={g.last.x} cy={g.last.y} r={6} fill={color} fillOpacity={0.25} />
      <Circle cx={g.last.x} cy={g.last.y} r={3.5} fill={color} />
    </Svg>
  );
}
