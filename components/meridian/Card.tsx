import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import { M } from '../../constants/meridian';

/** White "icard" surface with soft shadow. Optional onPress makes it tappable. */
export default function Card({
  children,
  style,
  onPress,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
}) {
  const inner = <View style={[styles.card, style]}>{children}</View>;
  if (onPress) return <Pressable onPress={onPress}>{inner}</Pressable>;
  return inner;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: M.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: M.line,
    shadowColor: '#0A1626',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 3,
  },
});
