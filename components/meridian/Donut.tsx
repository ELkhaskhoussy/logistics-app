import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { fonts, M } from '../../constants/meridian';

/** Circular capacity ring with a centered percentage. */
export default function Donut({ pct, size = 92, stroke = 10 }: { pct: number; size?: number; stroke?: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = (c * Math.min(Math.max(pct, 0), 100)) / 100;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#EEF1F5" strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={M.warm2}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={`${dash} ${c}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <Text style={styles.pct}>{pct}%</Text>
      <Text style={styles.lbl}>rempli</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pct: { fontFamily: fonts.display, fontSize: 20, fontWeight: '700', color: M.text },
  lbl: { fontSize: 10, color: M.textFaint, fontFamily: fonts.body, marginTop: -2 },
});
