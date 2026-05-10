import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

interface AcceptBookingModalProps {
  visible: boolean;
  booking: any;
  onClose: () => void;
onConfirm: (data: {
  parcels: {
    id: number;
    type: string;
    weightKg: number;
  }[];
}) => void;
}

const AcceptBookingModal = ({
  visible,
  booking,
  onClose,
  onConfirm,
}: AcceptBookingModalProps) => {
 

const [parcelWeights, setParcelWeights] = useState<
  {
    type: string;
    weightKg: string;
  }[]
>([]);
const [editedFields, setEditedFields] = useState<string[]>([]);

  useEffect(() => {
  if (booking) {
    const parcels = booking?.parcels ?? [];

   

    setParcelWeights(
      parcels.map((parcel: any) => ({
        type: parcel.type || 'COLIS',
        weightKg: String(parcel.weightKg || ''),
      }))
    );
    setEditedFields([]);
  }
}, [booking]);

  const handleConfirm = () => {
    onConfirm({
    parcels: parcelWeights.map((parcel, index) => ({
        id: booking?.parcels?.[index]?.id,
        type: parcel.type,
        weightKg: Number(parcel.weightKg),
    })),
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>
            Voulez-vous vraiment accepter ce colis ?
          </Text>

         <View style={styles.quantityContainer}>
            <Text style={styles.label}>Quantité</Text>

            <TextInput
              value={String(parcelWeights.length)}
              editable={false}
              selectTextOnFocus={false}
              style={[styles.input, styles.disabledInput]}
            />
          </View>

            {parcelWeights.map((parcel, index) => (
            <View key={index}>
                <Text style={styles.label}>
                Colis {index + 1} — {parcel.type}
                </Text>

                <TextInput
                value={parcel.weightKg}
                keyboardType="numeric"
                onChangeText={(value) => {
                    const updated = [...parcelWeights];

                    updated[index].weightKg = value;

                    setParcelWeights(updated);
                    setEditedFields((prev) => {
                    if (prev.includes(parcel.type)) return prev;
                    return [...prev, parcel.type];
                    });
                }}
                style={[
            styles.input,
            editedFields.includes(parcel.type)
                ? styles.editedInput
                : styles.defaultInput
            ]}
                />
            </View>
            ))}
          

          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={onClose}
            >
              <Text style={styles.buttonText}>
                Annuler
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <Text style={styles.buttonText}>
                Confirmer
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default AcceptBookingModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },

  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },

  title: {
  fontSize: 18,
  fontWeight: '600',
  marginBottom: 20,
  color: '#111827',
},

label: {
  fontSize: 14,
  fontWeight: '500',
  marginBottom: 8,
  marginTop: 10,
  color: '#374151',
},

input: {
  borderWidth: 1,
  borderColor: '#D1D5DB',
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 12,
  fontSize: 15,
  color: '#111827',
  backgroundColor: '#F9FAFB',
},

buttonsContainer: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  marginTop: 24,
},

cancelButton: {
  flex: 1,
  backgroundColor: '#9CA3AF',
  padding: 14,
  borderRadius: 12,
  marginRight: 10,
  alignItems: 'center',
},

confirmButton: {
  flex: 1,
  backgroundColor: '#2563EB',
  padding: 14,
  borderRadius: 12,
  alignItems: 'center',
},

buttonText: {
  color: '#F9FAFB',
  fontWeight: '600',
  fontSize: 15,
},
defaultInput: {
  color: '#6B7280',
  fontWeight: '500',
},

editedInput: {
  color: '#111827',
  fontWeight: '700',
},
quantityContainer: {
  marginBottom: 18,
},

disabledInput: {
  color: '#6B7280',
  backgroundColor: '#F3F4F6',
},
});