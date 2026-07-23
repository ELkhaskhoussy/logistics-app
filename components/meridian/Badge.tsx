import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { fonts, M } from '../../constants/meridian';

type Tone = 'green' | 'amber' | 'blue';

const TONES: Record<Tone, { c: string; bg: string }> = {
  green: { c: M.green, bg: M.greenBg },
  amber: { c: M.amber, bg: M.amberBg },
  blue: { c: M.blue, bg: '#EFF6FF' },
};

/** Small status pill (OPEN / 3 LEFT / CONFIRMED …). */
export default function Badge({ label, tone = 'green' }: { label: string; tone?: Tone }) {
  const t = TONES[tone];
  return <Text style={[styles.badge, { color: t.c, backgroundColor: t.bg }]}>{label}</Text>;
}

const styles = StyleSheet.create({
  badge: {
    fontSize: 10,
    fontWeight: '700',
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 8,
    overflow: 'hidden',
    letterSpacing: 0.4,
    fontFamily: fonts.display,
  },
});
