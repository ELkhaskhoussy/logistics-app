import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { fonts, M } from '../../constants/meridian';
import { COUNTRIES, Country, onlyNationalDigits } from '../../app/utils/phone';

type Props = {
  label: string;
  country: Country;
  onCountryChange: (c: Country) => void;
  national: string;
  onNationalChange: (v: string) => void;
};

/**
 * Phone entry with an explicit country.
 *
 * Replaces a plain text field whose placeholder was hardcoded to "+216 …" for
 * every user — which taught French senders the wrong format and produced
 * unusable WhatsApp links. Making the country an explicit choice means the
 * stored number is always unambiguous.
 */
export default function PhoneField({
  label,
  country,
  onCountryChange,
  national,
  onNationalChange,
}: Props) {
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <>
      <View style={styles.gf}>
        <Feather name="phone" size={17} color={M.onInkMut} />
        <View style={{ flex: 1 }}>
          <Text style={styles.lbl}>{label}</Text>
          <View style={styles.row}>
            <Pressable
              onPress={() => setPickerOpen(true)}
              style={styles.dial}
              accessibilityLabel="Choisir le pays"
            >
              <Text style={styles.dialTxt}>
                {country.flag} +{country.dial}
              </Text>
              <Feather name="chevron-down" size={13} color={M.onInkMut} />
            </Pressable>
            <TextInput
              style={styles.val}
              value={national}
              onChangeText={(t) => onNationalChange(onlyNationalDigits(t))}
              placeholder={country.example}
              placeholderTextColor={M.onInkFaint}
              keyboardType="phone-pad"
              autoCapitalize="none"
            />
          </View>
        </View>
      </View>

      <Modal visible={pickerOpen} transparent animationType="fade" onRequestClose={() => setPickerOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setPickerOpen(false)}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.sheetTitle}>Indicatif du pays</Text>
            <ScrollView style={{ maxHeight: 320 }}>
              {COUNTRIES.map((c) => {
                const active = c.code === country.code;
                return (
                  <Pressable
                    key={c.code}
                    style={[styles.item, active && styles.itemActive]}
                    onPress={() => {
                      onCountryChange(c);
                      setPickerOpen(false);
                    }}
                  >
                    <Text style={styles.itemFlag}>{c.flag}</Text>
                    <Text style={styles.itemLabel}>{c.label}</Text>
                    <Text style={styles.itemDial}>+{c.dial}</Text>
                    {active ? <Feather name="check" size={15} color={M.warm1} /> : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  gf: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 11, paddingHorizontal: 14, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  lbl: { fontSize: 10, color: M.onInkMut, letterSpacing: 0.6, fontFamily: fonts.body },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 1 },
  dial: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  dialTxt: { fontSize: 16, color: '#fff', fontWeight: '600', fontFamily: fonts.body },
  val: { flex: 1, fontSize: 16, color: '#fff', fontWeight: '600', fontFamily: fonts.body, paddingVertical: 0 },

  backdrop: { flex: 1, backgroundColor: 'rgba(10,22,38,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 340, backgroundColor: M.surface, borderRadius: 18, padding: 16 },
  sheetTitle: { fontSize: 14, color: M.text, fontFamily: fonts.display, fontWeight: '700', marginBottom: 10 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 10, borderRadius: 12 },
  itemActive: { backgroundColor: M.surfaceAlt },
  itemFlag: { fontSize: 17 },
  itemLabel: { flex: 1, fontSize: 14, color: M.text, fontFamily: fonts.body },
  itemDial: { fontSize: 13, color: M.textMut, fontFamily: fonts.body },
});
