import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { KeyboardTypeOptions, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { fonts, M } from '../../constants/meridian';

type Props = {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secure?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
};

/** Translucent field used on ink surfaces: leading icon, uppercase label, input, optional show/hide toggle. */
export default function InkField({
  icon,
  label,
  value,
  onChangeText,
  placeholder,
  secure,
  keyboardType,
  autoCapitalize = 'none',
}: Props) {
  const [hidden, setHidden] = useState(!!secure);
  return (
    <View style={styles.gf}>
      <Feather name={icon} size={17} color={M.onInkMut} />
      <View style={{ flex: 1 }}>
        <Text style={styles.lbl}>{label}</Text>
        <TextInput
          style={styles.val}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={M.onInkFaint}
          secureTextEntry={hidden}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
        />
      </View>
      {secure ? (
        <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
          <Feather name={hidden ? 'eye' : 'eye-off'} size={17} color={M.onInkMut} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  gf: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
  },
  lbl: { fontSize: 10, color: M.onInkMut, letterSpacing: 0.6, fontFamily: fonts.body },
  val: { fontSize: 16, color: '#fff', fontWeight: '600', fontFamily: fonts.body, paddingVertical: 0, marginTop: 1 },
});
