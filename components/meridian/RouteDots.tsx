import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { M } from '../../constants/meridian';

/** Warm→cool route line with a centered send glyph. Used on trip/booking cards. */
export default function RouteDots({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.row, style]}>
      <View style={[styles.dot, { backgroundColor: M.warm2 }]} />
      <View style={styles.lineWrap}>
        <LinearGradient
          colors={[M.warm2, M.cool]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.line}
        />
        <View style={styles.send}>
          <Feather name="send" size={12} color={M.blue} />
        </View>
      </View>
      <View style={[styles.dot, { backgroundColor: M.cool }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  lineWrap: { flex: 1, height: 2, justifyContent: 'center' },
  line: { height: 2, borderRadius: 2 },
  send: {
    position: 'absolute',
    left: '50%',
    marginLeft: -9,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
