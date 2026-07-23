import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { fonts, M } from '../../../constants/meridian';

interface AcceptBookingModalProps {
  visible: boolean;
  booking: any;
  onClose: () => void;
  onConfirm: (data: { parcels: { id: number; type: string; weightKg: number }[]; notes: string }) => void;
}

const AcceptBookingModal = ({ visible, booking, onClose, onConfirm }: AcceptBookingModalProps) => {
  const [parcelWeights, setParcelWeights] = useState<{ type: string; weightKg: string; quantity: number }[]>([]);
  const [editedFields, setEditedFields] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (booking) {
      const parcels = booking?.parcels ?? [];
      setParcelWeights(
        parcels.map((parcel: any) => ({ type: parcel.type || 'COLIS', weightKg: String(parcel.weightKg || ''), quantity: parcel.quantity || 0 }))
      );
      setEditedFields([]);
      setNotes('');
    }
  }, [booking]);

  const handleConfirm = () => {
    onConfirm({
      parcels: parcelWeights.map((parcel, index) => ({ id: booking?.parcels?.[index]?.id, type: parcel.type, weightKg: Number(parcel.weightKg) })),
      notes,
    });
  };

  const totalQuantity = parcelWeights.reduce((sum, parcel) => sum + parcel.quantity, 0);

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Accepter ce colis ?</Text>

          <Text style={styles.label}>Quantité</Text>
          <TextInput value={String(totalQuantity)} editable={false} style={[styles.input, styles.disabled]} />

          {parcelWeights.map((parcel, index) => (
            <View key={index}>
              <Text style={styles.label}>Colis {index + 1} — {parcel.type} (kg)</Text>
              <TextInput
                value={parcel.weightKg}
                keyboardType="numeric"
                onChangeText={(value) => {
                  const updated = [...parcelWeights];
                  updated[index].weightKg = value;
                  setParcelWeights(updated);
                  setEditedFields((prev) => (prev.includes(parcel.type) ? prev : [...prev, parcel.type]));
                }}
                style={[styles.input, editedFields.includes(parcel.type) ? styles.edited : styles.default]}
              />
            </View>
          ))}

          <Text style={styles.label}>Notes</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Ajouter une remarque…"
            placeholderTextColor={M.textFaint}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            style={[styles.input, { minHeight: 90, paddingTop: 12 }]}
          />

          <View style={styles.buttons}>
            <Pressable style={styles.cancel} onPress={onClose}>
              <Text style={styles.cancelTxt}>Annuler</Text>
            </Pressable>
            <Pressable style={{ flex: 1 }} onPress={handleConfirm}>
              <LinearGradient colors={[M.warm1, M.warm2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.confirm}>
                <Text style={styles.confirmTxt}>Confirmer</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AcceptBookingModal;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10,22,38,0.55)', justifyContent: 'center', padding: 20 },
  container: { backgroundColor: '#fff', borderRadius: 22, padding: 22 },
  title: { fontSize: 19, fontWeight: '700', marginBottom: 14, color: M.text, fontFamily: fonts.display },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6, marginTop: 12, color: M.textMut, fontFamily: fonts.body },
  input: { backgroundColor: M.surfaceAlt, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, fontSize: 15, color: M.text, fontFamily: fonts.body },
  disabled: { color: M.textMut, backgroundColor: M.page },
  default: { color: M.textMut, fontWeight: '500' },
  edited: { color: M.text, fontWeight: '700' },
  buttons: { flexDirection: 'row', gap: 12, marginTop: 22 },
  cancel: { flex: 1, backgroundColor: M.surfaceAlt, borderWidth: 1, borderColor: M.line, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  cancelTxt: { color: M.textMut, fontWeight: '600', fontSize: 15, fontFamily: fonts.body },
  confirm: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  confirmTxt: { color: '#fff', fontWeight: '600', fontSize: 15, fontFamily: fonts.body },
});
