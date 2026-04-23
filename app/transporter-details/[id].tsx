import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Modal,
} from 'react-native';
import { apiClient } from '../services/backService';
import { getToken } from '../utils/tokenStorage';

export default function TransporterProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [isBookingOpen, setIsBookingOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [isCategoryOpen, setIsCategoryOpen] = useState(false);
    const [parcel, setParcel] = useState({
    type: '',
    description: '',
    weightKg: '',
    length: '',
    width: '',
    height: '',
  });
  const [recipient, setRecipient] = useState({
  fullName: '',
  phoneNumber: '',
  address: '',
});

  useEffect(() => {
    loadTransporterData();
  }, [id]);

  const loadTransporterData = async () => {
    try {
      setLoading(true);
      const token = await getToken();

      const userResponse = await apiClient.get(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserInfo(userResponse.data);

      const profileResponse = await apiClient.get(`/catalog/transporters/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(profileResponse.data);
    } catch (error) {
      console.error('[TRANSPORTER-PROFILE] Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const displayName = profile?.displayName || 'Unknown';
  const initials = displayName
    ? displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  const imageUrl = userInfo?.imageUrl || null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transporter Profile</Text>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            {imageUrl ? (
              <Image source={{ uri: imageUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
          </View>

          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileBio}>{profile?.bio || 'No bio provided'}</Text>

          <View style={styles.licenseContainer}>
            <Feather name="truck" size={16} color="#2563EB" />
            <Text style={styles.licenseText}>
              {profile?.licensePlate || 'No license plate'}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom buttons */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={() => {
            setStep(1);
            setIsBookingOpen(true);
          }}
        >
          <Text style={styles.bookText}>Book</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.whatsappButton}>
          <Text style={styles.whatsappText}>WhatsApp</Text>
        </TouchableOpacity>
      </View>

      {/* Modal */}
      <Modal visible={isBookingOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Step {step} / 4</Text>

              {/* STEP 1 */}
              {step === 1 && (
                <View style={{ marginTop: 10 }}>
                 <Text>Catégorie</Text>

                <TouchableOpacity
                style={styles.selectBox}
                onPress={() => setIsCategoryOpen(!isCategoryOpen)}
                >
                <Text
                    style={{
                    color: parcel.type ? '#111827' : '#9CA3AF',
                    }}
                >
                    {parcel.type || 'Sélectionner une catégorie'}
                </Text>
                </TouchableOpacity>

                {isCategoryOpen && (
                <View style={styles.dropdown}>
                    {['ELECTRONICS', 'CLOTHES', 'DOCUMENTS', 'FRAGILE', 'OTHER'].map((item) => (
                    <TouchableOpacity
                        key={item}
                        style={styles.dropdownItem}
                        onPress={() => {
                        setParcel({ ...parcel, type: item });
                        setIsCategoryOpen(false);
                        }}
                    >
                        <Text style={{ color: '#111827' }}>{item}</Text>
                    </TouchableOpacity>
                    ))}
                </View>
                )}

                  <Text>Description</Text>
                  <TextInput
                    placeholder="Describe your parcel"
                    placeholderTextColor="#9CA3AF"
                    value={parcel.description}
                    onChangeText={(text) => setParcel({ ...parcel, description: text })}
                    style={styles.input}
                  />

                  <Text>Weight (kg)</Text>
                  <TextInput
                    placeholder="5"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="numeric"
                    value={parcel.weightKg}
                    onChangeText={(text) => setParcel({ ...parcel, weightKg: text })}
                    style={styles.input}
                  />

                  <Text>Dimensions (cm)</Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <TextInput
                      placeholder="L"
                      placeholderTextColor="#9CA3AF"
                      value={parcel.length}
                      onChangeText={(text) => setParcel({ ...parcel, length: text })}
                      style={[styles.input, { width: '30%' }]}
                    />
                    <TextInput
                      placeholder="W"
                      placeholderTextColor="#9CA3AF"
                      value={parcel.width}
                      onChangeText={(text) => setParcel({ ...parcel, width: text })}
                      style={[styles.input, { width: '30%' }]}
                    />
                    <TextInput
                      placeholder="H"
                      placeholderTextColor="#9CA3AF"
                      value={parcel.height}
                      onChangeText={(text) => setParcel({ ...parcel, height: text })}
                      style={[styles.input, { width: '30%' }]}
                    />
                  </View>
                </View>
                                )}
                    {step === 2 && (
                    <View style={{ marginTop: 10 }}>

                        <Text>Nom du destinataire</Text>
                        <TextInput
                        placeholder="Nom complet"
                        placeholderTextColor="#9CA3AF"
                        value={recipient.fullName}
                        onChangeText={(text) => setRecipient({ ...recipient, fullName: text })}
                        style={styles.input}
                        />

                        <Text>Téléphone</Text>
                        <TextInput
                        placeholder="+216 XX XXX XXX"
                        placeholderTextColor="#9CA3AF"
                        keyboardType="phone-pad"
                        value={recipient.phoneNumber}
                        onChangeText={(text) => setRecipient({ ...recipient, phoneNumber: text })}
                        style={styles.input}
                        />

                        <Text>Adresse de livraison (Tunisie)</Text>
                        <TextInput
                        placeholder="Rue, ville, code postal..."
                        placeholderTextColor="#9CA3AF"
                        value={recipient.address}
                        onChangeText={(text) => setRecipient({ ...recipient, address: text })}
                        style={[styles.input, { height: 80 }]}
                        multiline
                        />

                    </View>
                    )}
              {step === 3 && <Text style={{ marginTop: 10 }}>Step 3: Paiement</Text>}
              {step === 4 && <Text style={{ marginTop: 10 }}>Step 4: Récapitulatif</Text>}

              {/* NAV */}
              <View style={styles.navRow}>
                {step > 1 && (
                  <TouchableOpacity onPress={() => setStep(step - 1)}>
                    <Text>Back</Text>
                  </TouchableOpacity>
                )}

                {step < 4 ? (
                  <TouchableOpacity onPress={() => setStep(step + 1)}>
                    <Text>Next</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => setIsBookingOpen(false)}>
                    <Text style={{ color: 'green' }}>Confirm</Text>
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity onPress={() => setIsBookingOpen(false)}>
                <Text style={{ color: 'red', marginTop: 10 }}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B7280' },

  header: {
    backgroundColor: '#2563EB',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#FFF', flex: 1 },

  scrollContent: { padding: 16, paddingBottom: 100 },

  profileCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },

  avatar: { width: 110, height: 110, borderRadius: 55 },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avatarText: { fontSize: 36, color: '#FFF', fontWeight: 'bold' },
  profileName: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  profileBio: { color: '#6B7280', marginBottom: 16 },

  licenseContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  licenseText: { fontWeight: '600' },

  bottomBar: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFF',
  },

  bookButton: {
    flex: 1,
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  whatsappButton: {
    flex: 1,
    backgroundColor: '#25D366',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },

  bookText: { color: '#FFF' },
  whatsappText: { color: '#FFF' },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    marginTop: 5,
    marginBottom: 10,
    color: '#111827',
    outlineWidth: 0,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 20,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  categoryContainer: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 8,
  marginBottom: 10,
},

categoryItem: {
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 20,
  paddingVertical: 6,
  paddingHorizontal: 12,
  backgroundColor: '#F9FAFB',
},

categoryItemSelected: {
  backgroundColor: '#2563EB',
  borderColor: '#2563EB',
},

categoryText: {
  color: '#374151',
},

categoryTextSelected: {
  color: '#FFFFFF',
  fontWeight: '600',
},
selectBox: {
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 8,
  padding: 12,
  marginTop: 5,
  marginBottom: 10,
  backgroundColor: '#FFFFFF',
},

dropdown: {
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 8,
  backgroundColor: '#FFFFFF',
  marginBottom: 10,
},

dropdownItem: {
  padding: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#F3F4F6',
},
});