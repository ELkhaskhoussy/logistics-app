import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { fonts, warmGrad } from '../../constants/meridian';

type Props = {
  label: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Feather.glyphMap;
  style?: ViewStyle;
};

/** Primary warm-gradient CTA (52px). Loading + disabled states. */
export default function GradientButton({ label, onPress, loading, disabled, icon, style }: Props) {
  const off = disabled || loading;
  return (
    <Pressable onPress={onPress} disabled={off} style={style}>
      <LinearGradient
        colors={disabled ? ['#3A465A', '#3A465A'] : warmGrad}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.btn}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <View style={styles.row}>
            <Text style={styles.txt}>{label}</Text>
            {icon ? <Feather name={icon} size={16} color="#fff" /> : null}
          </View>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EC5B43',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 6,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  txt: { color: '#fff', fontSize: 15, fontWeight: '600', fontFamily: fonts.body },
});
