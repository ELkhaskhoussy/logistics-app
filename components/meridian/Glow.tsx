import React from 'react';
import { View, ViewStyle } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

let seq = 0;

/** Soft radial glow blob for ink heroes (warm or cool). Positioned via `style`. */
export default function Glow({
  color,
  size = 160,
  opacity = 0.5,
  style,
}: {
  color: string;
  size?: number;
  opacity?: number;
  style?: ViewStyle;
}) {
  const id = React.useMemo(() => `glow${seq++}`, []);
  return (
    <View pointerEvents="none" style={[{ position: 'absolute', width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={opacity} />
            <Stop offset="0.68" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width={size} height={size} fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}
