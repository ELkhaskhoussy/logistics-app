import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
  Switch,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { apiClient } from '../services/backService';
import { getToken , getUserId} from '../utils/tokenStorage';

export default function TransporterProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

const { id, tripId } = useLocalSearchParams<{
  id: string;
  tripId: string;
}>();


const [message, setMessage] = useState<string | null>(null);
const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [step, setStep] = useState(1);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [parcels, setParcels] = useState([
  {
    type: '',
    description: '',
    weightKg: '',
    fragile: false,
  },
]);
const [delivery, setDelivery] = useState({
  pickupAddress: '',
  pickupCity: '',
  pickupPostalCode: '',
  deliveryAddress: '',
  deliveryCity: '',
  phone: '',
});
 const [recipient, setRecipient] = useState({
  fullName: '',
  phoneNumber: '',
  street: '',
});

  const categories = [
    { label: 'Electroménager', value: 'ELECTROMENAGER' },
    { label: 'Commercial', value: 'COMMERCIAL' },
    { label: 'Standard', value: 'STANDARD' },
  ];

  
 useEffect(() => {
  if (message) {
    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer);
  }
}, [message]);

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
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

const handleConfirm = async () => {
  
  if (isBooking) return;

  try {
    setIsBooking(true);

    const token = await getToken();
    const senderId = await getUserId();

    if (!senderId) {
      throw new Error("User not authenticated");
    }

    const requestBody = {
      senderId: senderId,
      tripId: tripId,
      parcels: parcels.map(p => ({
        type: p.type,
        description: p.description,
        weightKg: parseFloat(p.weightKg),
      })),
      recipient: {
        fullName: recipient.fullName,
        phoneNumber: recipient.phoneNumber,
        tunisiaAddress: recipient.street
      },
    };

    console.log("FINAL REQUEST BODY:", JSON.stringify(requestBody, null, 2));


  const response = await apiClient.post('/bookings', requestBody, {
    headers: { Authorization: `Bearer ${token}` },
  });

setMessage("Booking confirmed");
setIsBookingOpen(false);

} catch (error: any) {
  const message =
    error.response?.data?.message ??
    error.message ??
    "Something went wrong";

setMessage("You already booked this trip");
setIsBookingOpen(false);

} finally {
  setIsBooking(false);
}
  };
console.log("FINAL RECIPIENT:", {
  fullName: recipient.fullName,
  phoneNumber: recipient.phoneNumber,
  address: `${recipient.street}`,
});
  const displayName = profile?.displayName || 'Unknown';
  const imageUrl = userInfo?.imageUrl || null;

  return (
    <View style={styles.container}>
        {message && (
          <View style={styles.toast}>
            <Text style={styles.toastText}>{message}</Text>
          </View>
        )}
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Transporter Profile</Text>
      </View>

      {/* PROFILE */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>?</Text>
            </View>
          )}

          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileBio}>{profile?.bio || 'No bio'}</Text>
        </View>
      </ScrollView>

      {/* BUTTONS */}
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
       
      {/* MODAL */}

      <Modal visible={isBookingOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
                
            <ScrollView showsVerticalScrollIndicator={false}>
             <View style={styles.modalHeader}>
  
                <Text style={styles.modalMainTitle}>
                  {step === 1 && 'Déclaration du colis'}
                  {step === 2 && 'Adresses'}
                  {step === 3 && 'Récapitulatif'}
                </Text>

                <TouchableOpacity onPress={() => setIsBookingOpen(false)}>
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>

              </View>

              {/* Progress */}
              <Text style={styles.stepText}>Étape {step} / 3 </Text>

              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${(step / 3 ) * 100}%` }]} />
              </View>

              {/* STEP 1 */}
              <View style={styles.sectionHeader}>
                    <View style={styles.iconBox}>
                      <Feather name="package" size={20} color="#2563EB" />
                    </View>

                    <View>
                      <Text style={styles.sectionTitle}>Déclaration du colis</Text>
                      <Text style={styles.sectionSubtitle}>
                        Décrivez votre colis en détail
                      </Text>
                    </View>
                  </View>
              {step === 1 && (
                <ScrollView>
              {parcels.map((parcel, index) => (
               <View
                      key={index}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: 12,
                        padding: 16,
                        marginBottom: 16,
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                      }}
                    >
                 <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
  
                    <Text style={{ fontWeight: '600' }}>
                      Colis {index + 1}
                    </Text>

                    {parcels.length > 1 && (
                      <TouchableOpacity
                        onPress={() => {
                          const updated = parcels.filter((_, i) => i !== index);
                          setParcels(updated);
                        }}
                        style={{
                          paddingVertical: 6,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                          backgroundColor: '#FEE2E2'
                        }}
                      >
                        <Text style={{ color: '#DC2626', fontWeight: '600' }}>
                          Supprimer
                        </Text>
                      </TouchableOpacity>
                    )}

                    </View>
                  
                
                  <Text>Catégorie</Text>

                  <TouchableOpacity
                    style={[
                      styles.selectBox,
                      showErrors && !parcel.type && { borderColor: 'red', borderWidth: 1 }
                    ]}
                    onPress={() => setIsCategoryOpen(!isCategoryOpen)}
                  >
                    <Text style={{ color: parcel.type ? '#111' : '#9CA3AF' }}>
                      {categories.find(c => c.value === parcel.type)?.label || 'Sélectionner une catégorie'}

                    </Text>
                  </TouchableOpacity>

                  {isCategoryOpen && (
                    <View style={styles.dropdown}>
                      {categories.map((item) => (
                        <TouchableOpacity
                          key={item.value}
                          style={styles.dropdownItem}
                          onPress={() => {
                            const updated = [...parcels];
                            updated[index].type = item.value;
                            setParcels(updated);
                            setIsCategoryOpen(false);
                          }}
                        >
                          <Text>{item.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <Text>Description</Text>
                  <TextInput
                    placeholder="Décrire le colis..."
                    placeholderTextColor="#9CA3AF"
                    style={[
                      styles.input,
                      showErrors && !parcel.description && { borderColor: 'red', borderWidth: 1 }
                    ]}
                    value={parcel.description}
                    onChangeText={(t) => {
                      const updated = [...parcels];
                      updated[index].description = t;
                      setParcels(updated);
                    }}
                  />

                  

                  <Text>Poids (kg)</Text>
                  <TextInput
                      placeholder="5"
                      placeholderTextColor="#9CA3AF"
                      style={[
                        styles.input,
                        showErrors && !parcel.weightKg && { borderColor: 'red', borderWidth: 1 }
                      ]}

                      value={parcel.weightKg}
                      onChangeText={(t) => {
                        const updated = [...parcels];
                        updated[index].weightKg = t;
                        setParcels(updated);
                      }}
                    />

                    
                  {/* FRAGILE */}
                  <View style={styles.fragileBox}>
                    <View>
                      <Text style={styles.fragileTitle}>Fragile</Text>
                      <Text style={styles.fragileSubtitle}>
                        Colis nécessitant une attention particulière
                      </Text>
                    </View>

                    <Switch
                        value={parcel.fragile}
                        onValueChange={(value) => {
                          const updated = [...parcels];
                          updated[index].fragile = value;
                          setParcels(updated);
                        }}
                      />
                  </View>

                  {/* PHOTO UPLOAD */}
                  <View style={styles.uploadBox}>
                    <Feather name="upload" size={24} color="#9CA3AF" />
                    <Text style={styles.uploadText}>Ajouter une photo</Text>
                  </View>


                    <TouchableOpacity
                      style={styles.nextButton}
                      onPress={() =>
                        setParcels([
                          ...parcels,
                          { type: '', description: '', weightKg: '', fragile: false },
                        ])
                      }
                    >
                      <Text style={styles.nextText}>+ Ajouter un colis</Text>
                    </TouchableOpacity>
                    </View>
                      ))}
                    </ScrollView>
                  )}
          

              {/* STEP 2 */}
             {step === 2 && (
                <View>

                  {/* COLLECT ADDRESS */}
                  <View style={styles.addressSection}>
                    <View style={styles.addressHeader}>
                      <View style={styles.addressIconBlue}>
                        <Feather name="map-pin" size={18} color="#2563EB" />
                      </View>

                      <View>
                        <Text style={styles.addressTitle}>
                          Adresse de collecte (France)
                        </Text>
                        <Text style={styles.addressSubtitle}>
                          Où récupérer votre colis
                        </Text>
                      </View>
                    </View>

                    <TextInput
                      value="Nantes"
                      editable={false}
                      style={styles.input}
                    />
                  </View>


                  {/* DELIVERY ADDRESS */}
                  <View style={{ marginTop: 20 }}>
                    <View style={styles.addressHeader}>
                      <View style={styles.addressIconOrange}>
                        <Feather name="map-pin" size={18} color="#F97316" />
                      </View>

                      <View>
                        <Text style={styles.addressTitle}>
                          Adresse de livraison (Tunisie)
                        </Text>
                        <Text style={styles.addressSubtitle}>
                          Destination en Tunisie
                        </Text>
                      </View>
                    </View>

                    <TextInput
                      placeholder="ville"
                      placeholderTextColor="#9CA3AF"
                     style={[
                      styles.input,
                      showErrors && !recipient.street&& { borderColor: 'red', borderWidth: 1 }
                    ]}
                      value={recipient.street}
                      onChangeText={(text) =>
                        setRecipient({ ...recipient, street: text })
                      }
                    />
                    

                    <Text style={styles.label}>Nom du destinataire</Text>
                    <TextInput
                      placeholder="Nom complet"
                      placeholderTextColor="#9CA3AF"
                      value={recipient.fullName}
                      onChangeText={(text) =>
                        setRecipient({ ...recipient, fullName: text })
                      }
                      style={[
                    styles.input,
                    showErrors && !recipient.fullName && { borderColor: 'red', borderWidth: 1 }
                  ]}
                    />
                    
                    <TextInput
                      placeholder="Téléphone destinataire"
                      placeholderTextColor="#9CA3AF"
                     style={[
                        styles.input,
                        showErrors && !recipient.phoneNumber&& { borderColor: 'red', borderWidth: 1 }
                      ]}
                      value={recipient.phoneNumber}
                      onChangeText={(text) =>
                        setRecipient({ ...recipient, phoneNumber: text })
                      }
                    />
                    
                  </View>

                </View>
              )}

              {/* STEP 3 */}
                        {step === 3 && (
                <View style={styles.recapContainer}>

                  {/* COLIS */}
                  <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                      <Feather name="package" size={18} color="#6B7280" />
                      <Text style={styles.cardTitle}>Colis</Text>
                    </View>

              {parcels.map((parcel, index) => (
                        <View key={index} style={{ marginBottom: 12 }}>
                          
                          <Text style={{ fontWeight: '600', marginBottom: 4 }}>
                            Colis {index + 1}
                          </Text>

                          <View style={styles.row}>
                            <Text style={styles.label}>Catégorie</Text>
                            <Text style={styles.value}>{parcel.type || '-'}</Text>
                          </View>

                          <View style={styles.row}>
                            <Text style={styles.label}>Poids</Text>
                            <Text style={styles.value}>{parcel.weightKg || '-'} kg</Text>
                          </View>

                        </View>
                      ))}

                    
                  </View>

                  {/* ADDRESSES */}
                  <View style={styles.card}>
                    <View style={styles.sectionHeader}>
                      <Feather name="map-pin" size={18} color="#6B7280" />
                      <Text style={styles.cardTitle}>Adresses</Text>
                    </View>

                    <Text style={styles.subSection}>Collecte (France)</Text>
                    <Text style={styles.value}>
                      Nantes
                    </Text>

                    <View style={{ height: 12 }} />

                    <Text style={styles.subSection}>Livraison (Tunisie)</Text>
                    <Text style={styles.value}>
                      {recipient.street
                        ? `${recipient.street}`
                        : '-'}
                    </Text>
                    <Text style={styles.value}>{recipient.phoneNumber || '-'}</Text>
                  </View>

                  {/* PRICE */}
                  <View style={styles.priceCard}>
                    <Text style={styles.priceLabel}>Prix total</Text>
                    <Text style={styles.priceValue}>299€</Text>
                  </View>

                </View>
              )}
                              {/* NAV */}
              <View style={styles.footerButtons}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {step > 1 && (
                    <TouchableOpacity
                      style={styles.backButton}
                      onPress={() => setStep(step - 1)}
                    >
                      <Text style={styles.backText}>Retour</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => setIsBookingOpen(false)}
                  >
                    <Text style={styles.closeButtonText}>Fermer</Text>
                  </TouchableOpacity>
                </View>

                {step < 3 ? (
                  <TouchableOpacity
                    style={styles.nextButton}
                    
                    onPress={() => {
                      setShowErrors(true);

                      if (step === 1) {
                        const isValid = parcels.every(
                          (p) => p.type && p.description && p.weightKg
                        );

                        if (!isValid) return;
                      }

                      if (step === 2) {
                        const isValid =
                          recipient.fullName &&
                          recipient.phoneNumber &&
                          recipient.street;

                        if (!isValid) return;
                      }

                      setShowErrors(false); // reset for next step
                      setStep(step + 1);
                    }}

                  >
                    <Text style={styles.nextText}>Suivant</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                        onPress={handleConfirm}
                        disabled={isBooking}
                        style={[
                          styles.confirmButton,
                          isBooking && { opacity: 0.5 }
                        ]}
>
                    <Text style={styles.confirmText}>Confirmer</Text>
                  </TouchableOpacity>
                )}
              </View>

            </ScrollView> 
            <Toast />
          </View>
        </View>
      </Modal>
    </View>
  );
}

             
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  centered: { justifyContent: 'center', alignItems: 'center' },

  header: {
    backgroundColor: '#2563EB',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  headerTitle: { color: '#fff', fontWeight: 'bold', fontSize: 18 },

  scrollContent: { padding: 16 },

  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },

  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },

  avatarText: { color: '#fff', fontSize: 30 },

  profileName: { fontSize: 22, fontWeight: 'bold' },
  profileBio: { color: '#6B7280' },

  bottomBar: { flexDirection: 'row', padding: 16, gap: 10 },

  bookButton: { flex: 1, backgroundColor: '#2563EB', padding: 14, borderRadius: 10, alignItems: 'center' },
  whatsappButton: { flex: 1, backgroundColor: '#25D366', padding: 14, borderRadius: 10, alignItems: 'center' },

  bookText: { color: '#fff' },
  whatsappText: { color: '#fff' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },

  modalTitle: { fontSize: 18, fontWeight: 'bold' },

  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },

  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },

  selectBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },

  dropdown: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    marginBottom: 10,
  },

  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalHeader: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
},

modalMainTitle: {
  fontSize: 18,
  fontWeight: 'bold',
  color: '#111827',
},

closeIcon: {
  fontSize: 18,
  color: '#6B7280',
},

stepText: {
  marginTop: 10,
  fontSize: 12,
  color: '#6B7280',
},

progressBar: {
  height: 6,
  backgroundColor: '#E5E7EB',
  borderRadius: 10,
  marginTop: 6,
  marginBottom: 15,
},

progressFill: {
  height: 6,
  backgroundColor: '#2563EB',
  borderRadius: 10,
},

iconBox: {
  width: 40,
  height: 40,
  borderRadius: 10,
  backgroundColor: '#EFF6FF',
  justifyContent: 'center',
  alignItems: 'center',
},

sectionTitle: {
  fontSize: 16,
  fontWeight: '600',
  color: '#111827',
},

sectionSubtitle: {
  fontSize: 12,
  color: '#6B7280',
},
fragileBox: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: 12,
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 10,
  marginTop: 10,
},

fragileTitle: {
  fontSize: 14,
  fontWeight: '600',
},

fragileSubtitle: {
  fontSize: 12,
  color: '#6B7280',
},

uploadBox: {
  marginTop: 15,
  borderWidth: 1,
  borderStyle: 'dashed',
  borderColor: '#D1D5DB',
  borderRadius: 10,
  padding: 20,
  alignItems: 'center',
  justifyContent: 'center',
},

uploadText: {
  marginTop: 8,
  fontSize: 12,
  color: '#6B7280',
},
addressSection: {
  marginTop: 10,
},

addressHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12,
  marginBottom: 10,
},

addressIconBlue: {
  width: 36,
  height: 36,
  borderRadius: 10,
  backgroundColor: '#EFF6FF',
  justifyContent: 'center',
  alignItems: 'center',
},

addressIconOrange: {
  width: 36,
  height: 36,
  borderRadius: 10,
  backgroundColor: '#FFF7ED',
  justifyContent: 'center',
  alignItems: 'center',
},

addressTitle: {
  fontSize: 14,
  fontWeight: '600',
},

addressSubtitle: {
  fontSize: 12,
  color: '#6B7280',
},

half: {
  flex: 1,
},
radioCircle: {
  width: 18,
  height: 18,
  borderRadius: 9,
  borderWidth: 2,
  borderColor: '#2563EB',
  justifyContent: 'center',
  alignItems: 'center',
},

radioDot: {
  width: 8,
  height: 8,
  borderRadius: 4,
  backgroundColor: '#2563EB',
},


sectionRecapTitle: {
  fontSize: 14,
  fontWeight: '600',
  marginTop: 15,
  marginBottom: 8,
},

recapBox: {
  borderWidth: 1,
  borderColor: '#E5E7EB',
  borderRadius: 10,
  padding: 12,
},

priceBox: {
  marginTop: 20,
  padding: 15,
  backgroundColor: '#F3F4F6',
  borderRadius: 10,
  flexDirection: 'row',
  justifyContent: 'space-between',
},
footerButtons: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginTop: 20,
},

/* LEFT BUTTONS */
backButton: {
  borderWidth: 1,
  borderColor: '#E5E7EB',
  paddingVertical: 10,
  paddingHorizontal: 16,
  borderRadius: 8,
  backgroundColor: '#FFFFFF',
},

backText: {
  color: '#111827',
  fontWeight: '500',
},

closeButton: {
  paddingVertical: 10,
  paddingHorizontal: 10,
},

closeButtonText: {
  color: '#EF4444',
  fontWeight: '500',
},

/* RIGHT BUTTON */
nextButton: {
  backgroundColor: '#2563EB',
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 8,
  marginTop:20,
},

nextText: {
  color: '#FFFFFF',
  fontWeight: '600',
},

confirmButton: {
  backgroundColor: '#2563EB', 
  paddingVertical: 10,
  paddingHorizontal: 20,
  borderRadius: 8,
},

confirmText: {
  color: '#FFFFFF',
  fontWeight: '600',
},
 
card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
    color: '#333',
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  label: {
    color: '#777',
    fontSize: 13,
  },

  value: {
    color: '#222',
    fontSize: 13,
    fontWeight: '500',
  },

  subSection: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
    fontWeight: '500',
  },


  priceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  priceLabel: {
    fontSize: 14,
    color: '#666',
  },

  priceValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2563eb',
  },
  recapContainer: {
    padding: 16,
    backgroundColor: '#f5f6f8',
  },
  sectionHeader: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 10,
},

toast: {
  position: 'absolute',
  top: 80,
  left: 20,
  right: 20,
  backgroundColor: '#111',
  padding: 12,
  borderRadius: 10,
  zIndex: 9999,
  elevation: 9999,
},

toastText: {
  color: '#fff',
  textAlign: 'center',
  fontWeight: '600',
},
validationText: {
  color: '#DC2626',
  fontSize: 12,
  marginTop: 4,
},
});
