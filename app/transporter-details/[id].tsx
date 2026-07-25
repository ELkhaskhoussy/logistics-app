import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import GradientButton from '../../components/meridian/GradientButton';
import RouteDots from '../../components/meridian/RouteDots';
import { fonts, M } from '../../constants/meridian';
import { getApiBaseUrl } from '../networking/config';
import { apiClient } from '../services/backService';
import { getToken, getUserId } from '../utils/tokenStorage';
import { cappedText, onlyCity, onlyDecimal, onlyDigits, onlyName, onlyPhone } from '../utils/inputFilters';

const BOOKING_SUCCESS_MESSAGE = 'Votre réservation est confirmée ✅';

type ParcelItem = {
  type: string;
  description: string;
  weightKg: string;
  quantity: string;
  fragile: boolean;
  localImages: string[];
  imageUrls: string[];
};

export default function TransporterProfileScreen() {
  const router = useRouter();
  const { id, tripId } = useLocalSearchParams<{ id: string; tripId: string }>();

  const [trip, setTrip] = useState<any>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [step, setStep] = useState(1);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [parcels, setParcels] = useState<ParcelItem[]>([
    { type: '', description: '', weightKg: '', quantity: '', fragile: false, localImages: [], imageUrls: [] },
  ]);
  const [recipient, setRecipient] = useState({ fullName: '', phoneNumber: '', street: '' });

  const categories = [
    { label: 'Electroménager', value: 'ELECTROMENAGER' },
    { label: 'Commercial', value: 'COMMERCIAL' },
    { label: 'Standard', value: 'STANDARD' },
  ];

  useEffect(() => {
    if (message) {
      const duration = message === BOOKING_SUCCESS_MESSAGE ? 1000 : 3000;
      const timer = setTimeout(() => setMessage(null), duration);
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
      const userResponse = await apiClient.get(`/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setUserInfo(userResponse.data);
      const profileResponse = await apiClient.get(`/catalog/transporters/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setProfile(profileResponse.data);
      const tripResponse = await apiClient.get(`/catalog/trips/${tripId}`, { headers: { Authorization: `Bearer ${token}` } });
      setTrip(tripResponse.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const pickParcelImages = async (parcelIndex: number) => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access gallery is required.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, quality: 0.8 });
    if (result.canceled) return;
    const selectedImages = result.assets.map((asset) => asset.uri);
    const uploadedUrls = await uploadParcelImages(selectedImages);
    setParcels((prev) => {
      const updated = [...prev];
      updated[parcelIndex] = {
        ...updated[parcelIndex],
        localImages: [...updated[parcelIndex].localImages, ...selectedImages],
        imageUrls: [...updated[parcelIndex].imageUrls, ...uploadedUrls],
      };
      return updated;
    });
  };

  const uploadParcelImages = async (imageUris: string[]): Promise<string[]> => {
    const token = await getToken();
    const senderId = await getUserId();
    let senderName = senderId ? `user-${senderId}` : 'sender';
    try {
      const me = await apiClient.get(`/users/${senderId}`, { headers: { Authorization: `Bearer ${token}` } });
      const full = `${me.data?.firstName ?? ''} ${me.data?.lastName ?? ''}`.trim();
      if (full) senderName = full;
    } catch {
      // fall back to user-{id}
    }

    const formData = new FormData();
    for (let index = 0; index < imageUris.length; index++) {
      const uri = imageUris[index];
      const filename = uri.split('/').pop() || `image-${index}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image`;
      if (Platform.OS === 'web') {
        const response = await fetch(uri);
        const blob = await response.blob();
        formData.append('files', blob, filename);
      } else {
        formData.append('files', { uri, name: filename, type } as any);
      }
    }

    const transporterName =
      profile?.displayName || `${userInfo?.firstName ?? ''} ${userInfo?.lastName ?? ''}`.trim() || 'transporteur';
    const dep = trip?.departureTime || trip?.departureDate || '';
    const d = new Date(dep);
    const dateStr = isNaN(d.getTime())
      ? 'date'
      : `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
    const tripFolder = `${transporterName}-${trip?.departureCity ?? 'ville'}-${trip?.arrivalCity ?? 'ville'}-${dateStr}`;

    formData.append('tripFolder', tripFolder);
    formData.append('senderName', senderName);

    const response = await apiClient.post('/parcel-uploads/images', formData, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  };

  const handleConfirm = async () => {
    if (isBooking) return;
    try {
      setIsBooking(true);
      const token = await getToken();
      const senderId = await getUserId();
      if (!senderId) throw new Error('User not authenticated');
      const requestBody = {
        senderId,
        tripId,
        parcels: parcels.map((p) => ({
          type: p.type,
          description: p.description,
          weightKg: parseFloat(p.weightKg),
          quantity: parseInt(p.quantity, 10),
          imageUrls: p.imageUrls,
        })),
        recipient: { fullName: recipient.fullName, phoneNumber: recipient.phoneNumber, tunisiaAddress: recipient.street },
      };
      await apiClient.post('/bookings', requestBody, { headers: { Authorization: `Bearer ${token}` } });
      setMessage(BOOKING_SUCCESS_MESSAGE);
      setIsBookingOpen(false);
    } catch (error: any) {
      const msg = error.response?.data?.message ?? error.message ?? 'Something went wrong';
      setMessage(msg);
      setIsBookingOpen(false);
    } finally {
      setIsBooking(false);
    }
  };

  const displayName = profile?.displayName || userInfo?.firstName || 'Transporteur';
  const photoUrl = profile?.photoUrl ? `${getApiBaseUrl()}${profile.photoUrl}` : null;
  const initials = displayName.split(' ').map((w: string) => w.charAt(0)).join('').slice(0, 2).toUpperCase();
  const phone = userInfo?.phone || '';

  const openWhatsApp = () => {
    const digits = phone.replace(/[^0-9]/g, '');
    if (!digits) {
      setMessage('Numéro du transporteur indisponible');
      return;
    }
    const text = encodeURIComponent(`Bonjour ${displayName}, je vous contacte via Sendlo au sujet d'un transport.`);
    Linking.openURL(`https://wa.me/${digits}?text=${text}`);
  };

  const onShare = async () => {
    const shareUrl = Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.href : 'https://sendlo.fr';
    const shareMessage = `${displayName} — transporteur sur Sendlo`;
    try {
      if (Platform.OS === 'web') {
        const nav: any = typeof navigator !== 'undefined' ? navigator : null;
        if (nav?.share) {
          await nav.share({ title: displayName, text: shareMessage, url: shareUrl });
        } else if (nav?.clipboard) {
          await nav.clipboard.writeText(shareUrl);
          setMessage('Lien copié ✅');
        }
      } else {
        await Share.share({ message: `${shareMessage}\n${shareUrl}` });
      }
    } catch {
      // cancelled or unavailable
    }
  };

  const totalWeight = parcels.reduce((sum, parcel) => sum + Number(parcel.weightKg || 0), 0);
  const totalPrice = totalWeight * Number(trip?.pricePerKg || 0);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={M.warm1} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {message ? (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{message}</Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={{ paddingBottom: 20 }} showsVerticalScrollIndicator={false}>
      {/* HERO */}
      <View style={styles.hero}>
        <LinearGradient colors={[M.inkHi, M.ink]} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.heroTop}>
          <Pressable onPress={() => router.back()} style={styles.headerIcon}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <Pressable onPress={onShare} style={styles.headerIcon}>
            <Feather name="share-2" size={20} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.avatarWrap}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={[M.warm1, M.warm2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatarGrad}>
              <Text style={styles.avatarText}>{initials || '?'}</Text>
            </LinearGradient>
          )}
          <View style={styles.nameRow}>
            <Text style={styles.profileName}>{displayName}</Text>
            <Feather name="check-circle" size={17} color={M.cool} />
          </View>
          <Text style={styles.profileSubtitle}>Transporteur · Tunisie ⇄ France</Text>
        </View>
      </View>

        {/* Stat cards (overlap hero) */}
        <View style={styles.padded}>
        <View style={styles.statRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{trip?.pricePerKg ?? profile?.pricingPerKg ?? '—'}€</Text>
            <Text style={styles.statLabel}>par kg</Text>
          </View>
          <View style={styles.statCard}>
            <Feather name="truck" size={18} color={M.blue} />
            <Text style={styles.statLabel}>{profile?.vehicleType || 'Véhicule'}</Text>
          </View>
        </View>

        {/* Info card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoSectionLabel}>À propos</Text>
          <Text style={styles.infoBio}>{profile?.bio || 'Aucune description.'}</Text>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Plaque</Text>
            <Text style={styles.infoRowValue}>{profile?.licensePlate || '—'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoRowLabel}>Téléphone</Text>
            <Text style={styles.infoRowValue}>{phone || '—'}</Text>
          </View>
        </View>

        {/* Selected trip */}
        {trip ? (
          <View style={styles.tripCard}>
            <Text style={styles.tripCardLabel}>Trajet sélectionné</Text>
            <RouteDots style={{ marginTop: 10 }} />
            <View style={styles.tripCities}>
              <Text style={styles.tripCity}>{trip.departureCity}</Text>
              <Text style={styles.tripCity}>{trip.arrivalCity}</Text>
            </View>
            <View style={styles.tripDivider} />
            <View style={styles.tripMetaRow}>
              <View style={styles.tripMetaItem}>
                <Feather name="calendar" size={14} color={M.textMut} />
                <Text style={styles.tripMeta}>
                  {(() => {
                    const d = new Date(trip.departureTime);
                    return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR');
                  })()}
                </Text>
              </View>
              <View style={styles.tripMetaItem}>
                <Feather name="box" size={14} color={M.textMut} />
                <Text style={styles.tripMeta}>{trip.availableCapacityKg} kg · €{trip.pricePerKg}/kg</Text>
              </View>
            </View>
          </View>
        ) : null}
        </View>
      </ScrollView>

      {/* BOTTOM BAR */}
      <View style={styles.bottomBar}>
        <Pressable style={styles.whatsappButton} onPress={openWhatsApp}>
          <Feather name="message-circle" size={18} color="#fff" />
          <Text style={styles.whatsappText}>WhatsApp</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <GradientButton label="Réserver" icon="send" onPress={() => { setStep(1); setIsBookingOpen(true); }} />
        </View>
      </View>

      {/* BOOKING SHEET */}
      <Modal visible={isBookingOpen} animationType="slide" transparent>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <View style={styles.grabber} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalMainTitle}>
                {step === 1 && 'Déclaration du colis'}
                {step === 2 && 'Adresses'}
                {step === 3 && 'Récapitulatif'}
              </Text>
              <Pressable onPress={() => setIsBookingOpen(false)}>
                <Feather name="x" size={22} color={M.textFaint} />
              </Pressable>
            </View>

            <View style={styles.stepRow}>
              <Text style={styles.stepText}>Étape {step} / 3</Text>
              <Text style={styles.stepPct}>{Math.round((step / 3) * 100)}%</Text>
            </View>
            <View style={styles.progressBar}>
              <LinearGradient colors={[M.warm1, M.warm2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.progressFill, { width: `${(step / 3) * 100}%` }]} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* STEP 1 */}
              {step === 1 &&
                parcels.map((parcel, index) => (
                  <View key={index} style={styles.parcelCard}>
                    <View style={styles.parcelHead}>
                      <Text style={styles.parcelTitle}>Colis {index + 1}</Text>
                      {parcels.length > 1 && (
                        <Pressable
                          onPress={() => setParcels(parcels.filter((_, i) => i !== index))}
                          style={styles.removeBtn}
                        >
                          <Text style={styles.removeTxt}>Supprimer</Text>
                        </Pressable>
                      )}
                    </View>

                    <Text style={styles.fieldLabel}>Catégorie</Text>
                    <Pressable
                      style={[styles.select, showErrors && !parcel.type && styles.errBorder]}
                      onPress={() => setIsCategoryOpen(!isCategoryOpen)}
                    >
                      <Text style={{ color: parcel.type ? M.text : M.textFaint, fontFamily: fonts.body }}>
                        {categories.find((c) => c.value === parcel.type)?.label || 'Sélectionner une catégorie'}
                      </Text>
                      <Feather name="chevron-down" size={16} color={M.textMut} />
                    </Pressable>
                    {isCategoryOpen && (
                      <View style={styles.dropdown}>
                        {categories.map((item) => (
                          <Pressable
                            key={item.value}
                            style={styles.dropdownItem}
                            onPress={() => {
                              const updated = [...parcels];
                              updated[index].type = item.value;
                              setParcels(updated);
                              setIsCategoryOpen(false);
                            }}
                          >
                            <Text style={{ fontFamily: fonts.body, color: M.text }}>{item.label}</Text>
                          </Pressable>
                        ))}
                      </View>
                    )}

                    <Text style={styles.fieldLabel}>Description</Text>
                    <TextInput
                      placeholder="Décrire le colis..."
                      placeholderTextColor={M.textFaint}
                      style={[styles.input, showErrors && !parcel.description && styles.errBorder]}
                      value={parcel.description}
                      onChangeText={(t) => { const u = [...parcels]; u[index].description = cappedText(t, 200); setParcels(u); }}
                    />

                    <Text style={styles.fieldLabel}>Poids (kg)</Text>
                    <TextInput
                      placeholder="5"
                      placeholderTextColor={M.textFaint}
                      keyboardType="decimal-pad"
                      style={[styles.input, showErrors && !parcel.weightKg && styles.errBorder]}
                      value={parcel.weightKg}
                      onChangeText={(t) => { const u = [...parcels]; u[index].weightKg = onlyDecimal(t); setParcels(u); }}
                    />

                    <Text style={styles.fieldLabel}>Quantité</Text>
                    <TextInput
                      placeholder="1"
                      placeholderTextColor={M.textFaint}
                      keyboardType="numeric"
                      style={[styles.input, showErrors && !parcel.quantity && styles.errBorder]}
                      value={parcel.quantity}
                      onChangeText={(t) => { const u = [...parcels]; u[index].quantity = onlyDigits(t, 3); setParcels(u); }}
                    />

                    <View style={styles.fragileBox}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.fragileTitle}>Fragile</Text>
                        <Text style={styles.fragileSubtitle}>Colis nécessitant une attention particulière</Text>
                      </View>
                      <Switch
                        value={parcel.fragile}
                        trackColor={{ true: M.warm1, false: '#D6DBE3' }}
                        onValueChange={(value) => { const u = [...parcels]; u[index].fragile = value; setParcels(u); }}
                      />
                    </View>

                    <Pressable style={styles.uploadBox} onPress={() => pickParcelImages(index)}>
                      {parcel.localImages.length === 0 && (
                        <>
                          <Feather name="upload" size={22} color={M.textFaint} />
                          <Text style={styles.uploadText}>Ajouter une photo</Text>
                        </>
                      )}
                      {parcel.localImages.length > 0 && (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                          {parcel.localImages.map((img, imgIndex) => (
                            <Image key={imgIndex} source={{ uri: img }} style={styles.thumb} />
                          ))}
                        </ScrollView>
                      )}
                    </Pressable>

                    <Pressable
                      style={styles.addParcel}
                      onPress={() =>
                        setParcels([...parcels, { type: '', description: '', weightKg: '', quantity: '', fragile: false, localImages: [], imageUrls: [] }])
                      }
                    >
                      <Feather name="plus" size={16} color={M.warm1} />
                      <Text style={styles.addParcelTxt}>Ajouter un colis</Text>
                    </Pressable>
                  </View>
                ))}

              {/* STEP 2 */}
              {step === 2 && (
                <View>
                  <View style={styles.addressHead}>
                    <View style={[styles.addrIcon, { backgroundColor: '#EFF6FF' }]}>
                      <Feather name="map-pin" size={18} color={M.blue} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addrTitle}>Adresse de collecte (France)</Text>
                      <Text style={styles.addrSub}>Où récupérer votre colis</Text>
                    </View>
                  </View>
                  <TextInput value="Nantes" editable={false} style={[styles.input, { color: M.textMut }]} />

                  <View style={[styles.addressHead, { marginTop: 18 }]}>
                    <View style={[styles.addrIcon, { backgroundColor: '#FEF0EC' }]}>
                      <Feather name="map-pin" size={18} color={M.warm1} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.addrTitle}>Adresse de livraison (Tunisie)</Text>
                      <Text style={styles.addrSub}>Destination en Tunisie</Text>
                    </View>
                  </View>
                  <TextInput
                    placeholder="Ville"
                    placeholderTextColor={M.textFaint}
                    style={[styles.input, showErrors && !recipient.street && styles.errBorder]}
                    value={recipient.street}
                    onChangeText={(text) => setRecipient({ ...recipient, street: onlyCity(text) })}
                  />
                  <Text style={styles.fieldLabel}>Nom du destinataire</Text>
                  <TextInput
                    placeholder="Nom complet"
                    placeholderTextColor={M.textFaint}
                    value={recipient.fullName}
                    onChangeText={(text) => setRecipient({ ...recipient, fullName: onlyName(text) })}
                    style={[styles.input, showErrors && !recipient.fullName && styles.errBorder]}
                  />
                  <TextInput
                    placeholder="Téléphone destinataire"
                    placeholderTextColor={M.textFaint}
                    keyboardType="phone-pad"
                    style={[styles.input, showErrors && !recipient.phoneNumber && styles.errBorder]}
                    value={recipient.phoneNumber}
                    onChangeText={(text) => setRecipient({ ...recipient, phoneNumber: onlyPhone(text) })}
                  />
                </View>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <View>
                  <View style={styles.recapCard}>
                    <View style={styles.recapHead}>
                      <Feather name="package" size={16} color={M.textMut} />
                      <Text style={styles.recapTitle}>Colis</Text>
                    </View>
                    {parcels.map((parcel, index) => (
                      <View key={index} style={{ marginBottom: 12 }}>
                        <Text style={styles.recapParcel}>Colis {index + 1}</Text>
                        <View style={styles.recapRow}><Text style={styles.recapLbl}>Catégorie</Text><Text style={styles.recapVal}>{parcel.type || '-'}</Text></View>
                        <View style={styles.recapRow}><Text style={styles.recapLbl}>Poids</Text><Text style={styles.recapVal}>{parcel.weightKg || '-'} kg</Text></View>
                        <View style={styles.recapRow}><Text style={styles.recapLbl}>Quantité</Text><Text style={styles.recapVal}>{parcel.quantity || '-'}</Text></View>
                      </View>
                    ))}
                  </View>

                  <View style={styles.recapCard}>
                    <View style={styles.recapHead}>
                      <Feather name="map-pin" size={16} color={M.textMut} />
                      <Text style={styles.recapTitle}>Adresses</Text>
                    </View>
                    <Text style={styles.recapSub}>Collecte (France)</Text>
                    <Text style={styles.recapVal}>Nantes</Text>
                    <View style={{ height: 12 }} />
                    <Text style={styles.recapSub}>Livraison (Tunisie)</Text>
                    <Text style={styles.recapVal}>{recipient.street || '-'}</Text>
                    <Text style={styles.recapVal}>{recipient.phoneNumber || '-'}</Text>
                  </View>

                  <View style={styles.priceCard}>
                    <Text style={styles.priceLabel}>Prix total</Text>
                    <Text style={styles.priceValue}>{totalPrice.toFixed(2)} €</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* NAV */}
            <View style={styles.footerButtons}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {step > 1 && (
                  <Pressable style={styles.backButton} onPress={() => setStep(step - 1)}>
                    <Text style={styles.backText}>Retour</Text>
                  </Pressable>
                )}
                <Pressable style={styles.closeButton} onPress={() => setIsBookingOpen(false)}>
                  <Text style={styles.closeButtonText}>Fermer</Text>
                </Pressable>
              </View>

              {step < 3 ? (
                <Pressable
                  onPress={() => {
                    setShowErrors(true);
                    if (step === 1) {
                      const isValid = parcels.every((p) => p.type && p.description && p.weightKg);
                      if (!isValid) return;
                      // Weights must be real positive numbers…
                      if (!parcels.every((p) => parseFloat(p.weightKg) > 0)) {
                        setMessage('Le poids doit être supérieur à 0.');
                        return;
                      }
                      // …and must fit the remaining capacity on this trip.
                      const available = Number(trip?.availableCapacityKg ?? 0);
                      const asked = parcels.reduce((s, p) => s + Number(p.weightKg || 0), 0);
                      if (available > 0 && asked > available) {
                        setMessage(`Poids total (${asked} kg) supérieur à la capacité disponible (${available} kg).`);
                        return;
                      }
                    }
                    if (step === 2) {
                      const isValid = recipient.fullName && recipient.phoneNumber && recipient.street;
                      if (!isValid) return;
                    }
                    setShowErrors(false);
                    setStep(step + 1);
                  }}
                >
                  <LinearGradient colors={[M.warm1, M.warm2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.navPrimary}>
                    <Text style={styles.navPrimaryTxt}>Suivant</Text>
                    <Feather name="arrow-right" size={16} color="#fff" />
                  </LinearGradient>
                </Pressable>
              ) : (
                <Pressable onPress={handleConfirm} disabled={isBooking}>
                  <LinearGradient colors={[M.warm1, M.warm2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.navPrimary, isBooking && { opacity: 0.5 }]}>
                    <Text style={styles.navPrimaryTxt}>{isBooking ? '...' : 'Confirmer'}</Text>
                  </LinearGradient>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: M.page },
  centered: { justifyContent: 'center', alignItems: 'center' },
  padded: { paddingHorizontal: 20 },

  hero: { overflow: 'hidden', paddingTop: 12, paddingBottom: 44, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  headerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', justifyContent: 'center', alignItems: 'center' },
  avatarWrap: { alignItems: 'center', marginTop: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44 },
  avatarGrad: { width: 88, height: 88, borderRadius: 44, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700', fontFamily: fonts.display },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  profileName: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: fonts.display },
  profileSubtitle: { color: M.onInkMut, fontSize: 12, marginTop: 4, fontFamily: fonts.body },

  statRow: { flexDirection: 'row', gap: 12, marginTop: -24 },
  statCard: {
    flex: 1, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: M.line, paddingVertical: 16,
    alignItems: 'center', gap: 4,
    shadowColor: '#0A1626', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.1, shadowRadius: 18, elevation: 3,
  },
  statValue: { fontSize: 20, fontWeight: '700', color: M.text, fontFamily: fonts.display },
  statLabel: { fontSize: 12, color: M.textFaint, fontFamily: fonts.body },

  infoCard: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: M.line, padding: 16, marginTop: 16 },
  infoSectionLabel: { fontSize: 12, fontWeight: '700', color: M.textFaint, marginBottom: 6, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.5 },
  infoBio: { fontSize: 14, color: M.text, lineHeight: 21, fontFamily: fonts.body },
  infoDivider: { height: 1, backgroundColor: M.hair, marginVertical: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  infoRowLabel: { fontSize: 14, color: M.textMut, fontFamily: fonts.body },
  infoRowValue: { fontSize: 14, fontWeight: '600', color: M.text, fontFamily: fonts.body },

  tripCard: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: M.line, padding: 18, marginTop: 16 },
  tripCardLabel: { fontSize: 12, fontWeight: '700', color: M.textFaint, fontFamily: fonts.display, textTransform: 'uppercase', letterSpacing: 0.5 },
  tripCities: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 7 },
  tripCity: { fontSize: 15, fontWeight: '700', color: M.text, fontFamily: fonts.display },
  tripDivider: { height: 1, backgroundColor: M.hair, marginTop: 14, marginBottom: 12 },
  tripMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tripMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tripMeta: { fontSize: 13, color: M.textMut, fontFamily: fonts.body },

  bottomBar: { flexDirection: 'row', padding: 16, gap: 10, backgroundColor: M.page },
  whatsappButton: { flex: 1, backgroundColor: '#25D366', height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  whatsappText: { color: '#fff', fontWeight: '600', fontSize: 14, fontFamily: fonts.body },

  // Booking sheet
  sheetOverlay: { flex: 1, backgroundColor: 'rgba(10,22,38,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: M.surfaceAlt, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 28, maxHeight: '90%' },
  grabber: { width: 44, height: 4, borderRadius: 9999, backgroundColor: '#D6DBE3', alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalMainTitle: { fontSize: 20, fontWeight: '700', color: M.text, fontFamily: fonts.display },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 14, marginBottom: 6 },
  stepText: { fontSize: 12, color: M.textMut, fontFamily: fonts.body },
  stepPct: { fontSize: 12, color: M.textMut, fontFamily: fonts.display },
  progressBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 9999, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: 8, borderRadius: 9999 },

  parcelCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: M.line },
  parcelHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  parcelTitle: { fontWeight: '700', color: M.text, fontFamily: fonts.display, fontSize: 15 },
  removeBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#FEE2E2' },
  removeTxt: { color: '#DC2626', fontWeight: '600', fontSize: 12, fontFamily: fonts.body },

  fieldLabel: { fontSize: 12, color: M.textMut, marginBottom: 6, marginTop: 4, fontFamily: fonts.body },
  select: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: M.surfaceAlt, borderRadius: 12, padding: 13, marginBottom: 10 },
  input: { backgroundColor: M.surfaceAlt, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, marginBottom: 10, fontSize: 14, color: M.text, fontFamily: fonts.body },
  errBorder: { borderColor: M.warm1, borderWidth: 1 },
  dropdown: { borderWidth: 1, borderColor: M.line, borderRadius: 12, marginBottom: 10, overflow: 'hidden' },
  dropdownItem: { padding: 13, borderBottomWidth: 1, borderBottomColor: M.hair },

  fragileBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, backgroundColor: M.surfaceAlt, borderRadius: 12, marginTop: 6 },
  fragileTitle: { fontSize: 14, fontWeight: '600', color: M.text, fontFamily: fonts.body },
  fragileSubtitle: { fontSize: 12, color: M.textFaint, fontFamily: fonts.body },

  uploadBox: { marginTop: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: '#D1D5DB', borderRadius: 12, padding: 20, alignItems: 'center', justifyContent: 'center' },
  uploadText: { marginTop: 8, fontSize: 12, color: M.textMut, fontFamily: fonts.body },
  thumb: { width: 80, height: 80, borderRadius: 10, marginRight: 10 },
  addParcel: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, paddingVertical: 12, borderRadius: 12, backgroundColor: '#FEF0EC' },
  addParcelTxt: { color: M.warm1, fontWeight: '600', fontFamily: fonts.body },

  addressHead: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  addrIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  addrTitle: { fontSize: 14, fontWeight: '600', color: M.text, fontFamily: fonts.body },
  addrSub: { fontSize: 12, color: M.textFaint, fontFamily: fonts.body },

  recapCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: M.line },
  recapHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  recapTitle: { fontSize: 15, fontWeight: '700', color: M.text, fontFamily: fonts.display },
  recapParcel: { fontWeight: '600', marginBottom: 4, color: M.text, fontFamily: fonts.body },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  recapLbl: { color: M.textFaint, fontSize: 13, fontFamily: fonts.body },
  recapVal: { color: M.text, fontSize: 13, fontWeight: '500', fontFamily: fonts.body },
  recapSub: { fontSize: 13, color: M.textMut, marginBottom: 4, fontWeight: '500', fontFamily: fonts.body },
  priceCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: M.line },
  priceLabel: { fontSize: 14, color: M.textMut, fontFamily: fonts.body },
  priceValue: { fontSize: 22, fontWeight: '700', color: M.text, fontFamily: fonts.display },

  footerButtons: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 },
  backButton: { borderWidth: 1, borderColor: M.line, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, backgroundColor: '#fff' },
  backText: { color: M.text, fontWeight: '600', fontFamily: fonts.body },
  closeButton: { paddingVertical: 10, paddingHorizontal: 8 },
  closeButtonText: { color: M.warm1, fontWeight: '600', fontFamily: fonts.body },
  navPrimary: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 13, paddingHorizontal: 22, borderRadius: 14 },
  navPrimaryTxt: { color: '#fff', fontWeight: '600', fontFamily: fonts.body },

  toast: { position: 'absolute', top: 60, left: 20, right: 20, backgroundColor: M.ink, padding: 12, borderRadius: 12, zIndex: 9999, elevation: 9999 },
  toastText: { color: '#fff', textAlign: 'center', fontWeight: '600', fontFamily: fonts.body },
});
