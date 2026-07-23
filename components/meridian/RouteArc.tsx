import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
let seq = 0;

/** Animated dashed warm→cool route arc used across ink heroes. */
export default function RouteArc({
  w = 392,
  h = 210,
  d = 'M50 160 Q 196 40 342 90',
  animate = true,
  style,
}: {
  w?: number;
  h?: number;
  d?: string;
  animate?: boolean;
  style?: ViewStyle;
}) {
  const off = useSharedValue(0);
  const id = React.useMemo(() => `route${seq++}`, []);

  useEffect(() => {
    if (animate) {
      off.value = withRepeat(withTiming(-28, { duration: 1200, easing: Easing.linear }), -1, false);
    }
  }, [animate, off]);

  const animatedProps = useAnimatedProps(() => ({ strokeDashoffset: off.value }));

  return (
    <Svg viewBox={`0 0 ${w} ${h}`} style={[StyleSheet.absoluteFill, style]} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="1" x2="1" y2="0">
          <Stop offset="0" stopColor="#F5A623" />
          <Stop offset="0.5" stopColor="#EC5B43" />
          <Stop offset="1" stopColor="#38BDF8" />
        </LinearGradient>
      </Defs>
      <AnimatedPath
        d={d}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray="7 7"
        animatedProps={animatedProps}
      />
    </Svg>
  );
}
