import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import GradientButton from '../../../components/meridian/GradientButton';
import { fonts, M } from '../../../constants/meridian';
import { createTrip } from '../../services/trip';
import { getUserId } from '../../utils/tokenStorage';
import { onlyCity, onlyDecimal, onlyDigits } from '../../utils/inputFilters';

type StopItem = { address: string; dateTime?: string };

const prettyDT = (v?: string) => {
  if (!v) return '';
  const d = new Date(v);
  if (isNaN(d.getTime())) return v;
  return d.toLocaleString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

export default function AddTripScreen() {
  const router = useRouter();
  const TOTAL_STEPS = 2;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [tripData, setTripData] = useState<{
    startAddress: string;
    departureDateTime: string;
    endAddress: string;
    arrivalDateTime: string;
    stops: StopItem[];
    availableWeight: string;
    pricePerKg: string;
  }>({ startAddress: '', departureDateTime: '', endAddress: '', arrivalDateTime: '', stops: [], availableWeight: '', pricePerKg: '' });

  const [invalidDepartureDate, setInvalidDepartureDate] = useState(false);
  const [invalidArrivalDate, setInvalidArrivalDate] = useState(false);
  const [invalidStopDates, setInvalidStopDates] = useState<number[]>([]);

  const [activePicker, setActivePicker] = useState<{
    type: 'departureDate' | 'departureTime' | 'arrivalDate' | 'arrivalTime' | 'stopDate' | 'stopTime' | null;
    stopIndex?: number;
  }>({ type: null });
  const [tempDate, setTempDate] = useState<Date>(new Date());
  const [tempTime, setTempTime] = useState<Date>(new Date());

  const addStop = () => setTripData((prev) => ({ ...prev, stops: [...prev.stops, { address: '', dateTime: '' }] }));
  const updateStopAddress = (index: number, value: string) =>
    setTripData((prev) => { const u = [...prev.stops]; u[index] = { ...u[index], address: value }; return { ...prev, stops: u }; });
  const updateStopDateTime = (index: number, value: string) => {
    setTripData((prev) => { const u = [...prev.stops]; u[index] = { ...u[index], dateTime: value }; return { ...prev, stops: u }; });
    setInvalidStopDates((prev) => prev.filter((i) => i !== index));
  };
  const removeStop = (index: number) => {
    setTripData((prev) => ({ ...prev, stops: prev.stops.filter((_, i) => i !== index) }));
    setInvalidStopDates((prev) => prev.filter((i) => i !== index));
  };

  const formatDateTime = (date: Date, time: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(time.getHours()).padStart(2, '0');
    const minutes = String(time.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:00`;
  };

  const openDatePicker = (type: typeof activePicker.type, stopIndex?: number) => setActivePicker({ type, stopIndex });
  const closePicker = () => setActivePicker({ type: null });

  const updateDateTimeField = (target: 'departure' | 'arrival' | 'stop', stopIndex?: number) => {
    const dt = formatDateTime(tempDate, tempTime);
    if (target === 'departure') { setTripData((prev) => ({ ...prev, departureDateTime: dt })); setInvalidDepartureDate(false); return; }
    if (target === 'arrival') { setTripData((prev) => ({ ...prev, arrivalDateTime: dt })); setInvalidArrivalDate(false); return; }
    if (target === 'stop' && typeof stopIndex === 'number') updateStopDateTime(stopIndex, dt);
  };

  const stopsSummary = useMemo(() => {
    const names = tripData.stops.map((s) => s.address?.trim()).filter((s) => !!s) as string[];
    return names.length ? names.join(', ') : 'Aucune étape';
  }, [tripData.stops]);

  const handleNext = () => {
    setInvalidDepartureDate(false);
    setInvalidArrivalDate(false);
    if (step === 1) {
      if (!tripData.startAddress.trim()) { Toast.show({ type: 'error', text1: 'Veuillez insérer une adresse de départ' }); return; }
      if (!tripData.departureDateTime.trim()) { setInvalidDepartureDate(true); Toast.show({ type: 'error', text1: 'Veuillez saisir la date de départ' }); return; }
      if (!tripData.endAddress.trim()) { Toast.show({ type: 'error', text1: "Veuillez saisir l'adresse d'arrivée" }); return; }
      if (!tripData.arrivalDateTime.trim()) { setInvalidArrivalDate(true); Toast.show({ type: 'error', text1: "Veuillez saisir la date d'arrivée" }); return; }
      const invalidIndexes = tripData.stops.map((s, i) => ({ ...s, i })).filter((s) => s.address.trim() !== '' && (!s.dateTime || s.dateTime.trim() === '')).map((s) => s.i);
      if (invalidIndexes.length > 0) { setInvalidStopDates(invalidIndexes); Toast.show({ type: 'error', text1: 'Veuillez saisir la date de l\'étape' }); return; }
      setInvalidStopDates([]);
    }
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleBack = () => { if (step > 1) setStep(step - 1); };
  const progress = (step / TOTAL_STEPS) * 100;

  const handleSubmit = async () => {
    try {
      setInvalidDepartureDate(false);
      setInvalidArrivalDate(false);
      if (!tripData.startAddress.trim() || !tripData.endAddress.trim()) { Toast.show({ type: 'error', text1: 'Définissez les villes de départ et d\'arrivée' }); return; }
      if (!tripData.departureDateTime.trim()) { setInvalidDepartureDate(true); Toast.show({ type: 'error', text1: 'Veuillez saisir la date' }); return; }
      if (!tripData.arrivalDateTime.trim()) { setInvalidArrivalDate(true); Toast.show({ type: 'error', text1: 'Veuillez saisir la date' }); return; }
      const invalidIndexes = tripData.stops.map((s, i) => ({ ...s, i })).filter((s) => s.address.trim() !== '' && (!s.dateTime || s.dateTime.trim() === '')).map((s) => s.i);
      if (invalidIndexes.length > 0) { setInvalidStopDates(invalidIndexes); Toast.show({ type: 'error', text1: 'Veuillez saisir la date' }); return; }
      if (!tripData.availableWeight || !tripData.pricePerKg) { Toast.show({ type: 'error', text1: 'Définissez la capacité et le prix' }); return; }
      const weight = parseFloat(tripData.availableWeight);
      const price = parseFloat(tripData.pricePerKg);
      // Upper bounds stop absurd values (a trip once shipped with 1e+31 kg).
      if (isNaN(weight) || weight <= 0) { Toast.show({ type: 'error', text1: 'Poids invalide' }); return; }
      if (weight > 1000) { Toast.show({ type: 'error', text1: 'Capacité trop élevée', text2: 'Maximum 1000 kg par trajet.' }); return; }
      if (isNaN(price) || price <= 0) { Toast.show({ type: 'error', text1: 'Prix invalide' }); return; }
      if (price > 500) { Toast.show({ type: 'error', text1: 'Prix trop élevé', text2: 'Maximum 500 € par kg.' }); return; }

      setLoading(true);
      const transporterId = await getUserId();
      if (!transporterId) throw new Error('Transporter ID not found. Please login again.');
      const transporterIdNum = typeof transporterId === 'string' ? parseInt(transporterId, 10) : transporterId;

      const convertToISO = (dateTimeStr: string): string => {
        if (!dateTimeStr || dateTimeStr.trim() === '') return '';
        const trimmed = dateTimeStr.trim();
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed;
        if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(trimmed)) return trimmed.replace(' ', 'T') + ':00';
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) return trimmed + ':00';
        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return `${trimmed}T00:00:00`;
        if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(trimmed)) { const [y, m, d] = trimmed.split('-'); return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T00:00:00`; }
        throw new Error(`Invalid datetime format: ${trimmed}`);
      };

      const createTripRequest = {
        transporterId: transporterIdNum,
        totalCapacityKg: weight,
        departureCity: tripData.startAddress,
        arrivalCity: tripData.endAddress,
        departureTime: convertToISO(tripData.departureDateTime),
        arrivalTime: convertToISO(tripData.arrivalDateTime),
        pricePerKg: price,
        collectionStops: tripData.stops.filter((s) => s.address.trim() !== '').map((s) => ({ city: s.address, fullAddress: s.address, stopTime: convertToISO(s.dateTime || '') })),
        deliveryStops: [],
      };

      await createTrip(createTripRequest);
      Toast.show({ type: 'success', text1: 'Le trajet a été créé avec succès' });
      setTimeout(() => router.replace('/(transporter)/dashboard' as any), 800);
    } catch (error: any) {
      const msg = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Une erreur est survenue';
      Toast.show({ type: 'error', text1: 'Échec de la création du trajet', text2: msg });
    } finally {
      setLoading(false);
    }
  };

  // Web date-picker field (transparent input themed to Meridian)
  const WebDate = ({ value, onChange, placeholder, invalid }: any) =>
    Platform.OS === 'web' ? (
      <View style={[styles.dateWrap, invalid && styles.errBorder]}>
        <DatePicker
          selected={value ? new Date(value) : null}
          onChange={onChange}
          showTimeSelect
          dateFormat="d MMM yyyy, HH:mm"
          placeholderText={placeholder}
          minDate={new Date()}
          popperPlacement="top-start"
          portalId="root"
          customInput={
            <TextInput style={styles.dateInput} placeholder={placeholder} placeholderTextColor={M.textFaint} editable={false} />
          }
        />
      </View>
    ) : null;

  return (
    <View style={styles.container}>
      {/* HERO + progress */}
      <View style={styles.hero}>
        <LinearGradient colors={[M.inkHi, M.ink]} start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={styles.heroTop}>
          <Pressable onPress={() => router.back()} style={styles.iconBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.heroTitle}>Nouveau trajet</Text>
        </View>
        <View style={styles.progressRow}>
          <Text style={styles.progressStep}>Étape {step} / {TOTAL_STEPS} · {step === 1 ? 'Trajet' : 'Capacité'}</Text>
          <Text style={styles.progressPct}>{Math.round(progress)}%</Text>
        </View>
        <View style={styles.track}>
          <LinearGradient colors={[M.warm1, M.warm2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.fill, { width: `${progress}%` }]} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        {/* STEP 1 */}
        {step === 1 && (
          <>
            <View style={styles.card}>
              {/* Departure city */}
              <View style={styles.field}>
                <View style={[styles.dot, { backgroundColor: M.warm2 }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>DÉPART</Text>
                  <TextInput style={styles.cityInput} placeholder="Tunis, TN" placeholderTextColor={M.textFaint} value={tripData.startAddress} onChangeText={(t) => setTripData((p) => ({ ...p, startAddress: onlyCity(t) }))} />
                </View>
              </View>
              <View style={styles.rowDivider} />
              {/* Departure date */}
              <View style={styles.field}>
                <Feather name="calendar" size={16} color={M.textMut} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, invalidDepartureDate && { color: M.warm1 }]}>DATE DE DÉPART</Text>
                  {Platform.OS === 'web' ? (
                    <WebDate value={tripData.departureDateTime} placeholder="Choisir date & heure" invalid={invalidDepartureDate}
                      onChange={(d: Date | null) => { if (!d) return; setTripData((p) => ({ ...p, departureDateTime: formatDateTime(d, d) })); setInvalidDepartureDate(false); }} />
                  ) : (
                    <Pressable onPress={() => { setTempDate(new Date()); setTempTime(new Date()); openDatePicker('departureDate'); }}>
                      <Text style={styles.dateVal}>{prettyDT(tripData.departureDateTime) || 'Choisir date & heure'}</Text>
                    </Pressable>
                  )}
                </View>
              </View>
              <View style={styles.rowDivider} />
              {/* Arrival city */}
              <View style={styles.field}>
                <View style={[styles.dot, { backgroundColor: M.cool }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.fieldLabel}>ARRIVÉE</Text>
                  <TextInput style={styles.cityInput} placeholder="Paris, FR" placeholderTextColor={M.textFaint} value={tripData.endAddress} onChangeText={(t) => setTripData((p) => ({ ...p, endAddress: onlyCity(t) }))} />
                </View>
              </View>
              <View style={styles.rowDivider} />
              {/* Arrival date */}
              <View style={styles.field}>
                <Feather name="calendar" size={16} color={M.textMut} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, invalidArrivalDate && { color: M.warm1 }]}>DATE D'ARRIVÉE</Text>
                  {Platform.OS === 'web' ? (
                    <WebDate value={tripData.arrivalDateTime} placeholder="Choisir date & heure" invalid={invalidArrivalDate}
                      onChange={(d: Date | null) => { if (!d) return; setTripData((p) => ({ ...p, arrivalDateTime: formatDateTime(d, d) })); setInvalidArrivalDate(false); }} />
                  ) : (
                    <Pressable onPress={() => { setTempDate(new Date()); setTempTime(new Date()); openDatePicker('arrivalDate'); }}>
                      <Text style={styles.dateVal}>{prettyDT(tripData.arrivalDateTime) || 'Choisir date & heure'}</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>

            {/* Stops */}
            {tripData.stops.map((stop, index) => (
              <View key={index} style={[styles.card, { marginTop: 12 }]}>
                <View style={styles.stopHead}>
                  <Text style={styles.stopTitle}>Étape {index + 1}</Text>
                  <Pressable onPress={() => removeStop(index)}><Feather name="x" size={18} color={M.textFaint} /></Pressable>
                </View>
                <TextInput style={styles.stopInput} placeholder="Ville de l'étape" placeholderTextColor={M.textFaint} value={stop.address} onChangeText={(t) => updateStopAddress(index, onlyCity(t))} />
                {Platform.OS === 'web' ? (
                  <WebDate value={stop.dateTime} placeholder="Date & heure de l'étape" invalid={invalidStopDates.includes(index)}
                    onChange={(d: Date | null) => { if (!d) return; updateStopDateTime(index, formatDateTime(d, d)); }} />
                ) : (
                  <Pressable style={styles.stopDateBtn} onPress={() => { setTempDate(new Date()); setTempTime(new Date()); openDatePicker('stopDate', index); }}>
                    <Feather name="calendar" size={15} color={M.textMut} />
                    <Text style={styles.dateVal}>{prettyDT(stop.dateTime) || 'Date & heure'}</Text>
                  </Pressable>
                )}
              </View>
            ))}

            <Pressable style={styles.addStop} onPress={addStop}>
              <Feather name="plus" size={16} color={M.warm1} />
              <Text style={styles.addStopTxt}>Ajouter une étape</Text>
            </Pressable>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <View style={styles.card}>
            <Text style={styles.stepTitleBig}>Capacité & Prix</Text>

            <Text style={styles.label2}>Poids disponible (kg)</Text>
            <View style={styles.input2}>
              <Feather name="box" size={16} color={M.textMut} />
              <TextInput style={styles.input2Field} placeholder="300" placeholderTextColor={M.textFaint} keyboardType="number-pad" value={tripData.availableWeight} onChangeText={(t) => setTripData((p) => ({ ...p, availableWeight: onlyDigits(t, 4) }))} />
            </View>

            <Text style={styles.label2}>Prix par kg (€)</Text>
            <View style={styles.input2}>
              <Feather name="tag" size={16} color={M.textMut} />
              <TextInput style={styles.input2Field} placeholder="4.5" placeholderTextColor={M.textFaint} keyboardType="decimal-pad" value={tripData.pricePerKg} onChangeText={(t) => setTripData((p) => ({ ...p, pricePerKg: onlyDecimal(t) }))} />
            </View>

            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Récapitulatif</Text>
              {[
                ['Trajet', `${tripData.startAddress || '—'} → ${tripData.endAddress || '—'}`],
                ['Étapes', stopsSummary],
                ['Départ', prettyDT(tripData.departureDateTime) || 'Non défini'],
                ['Arrivée', prettyDT(tripData.arrivalDateTime) || 'Non défini'],
                ['Capacité', `${tripData.availableWeight || '0'} kg`],
              ].map(([k, v]) => (
                <View key={k} style={styles.sumRow}>
                  <Text style={styles.sumLbl}>{k}</Text>
                  <Text style={styles.sumVal}>{v}</Text>
                </View>
              ))}
              <View style={styles.sumRow}>
                <Text style={styles.sumLbl}>Prix</Text>
                <Text style={styles.sumPrice}>€{tripData.pricePerKg || '0'}/kg</Text>
              </View>
            </View>
          </View>
        )}

        {/* NAV */}
        <View style={styles.nav}>
          {step > 1 && (
            <Pressable style={styles.backBtn} onPress={handleBack}>
              <Text style={styles.backTxt}>Retour</Text>
            </Pressable>
          )}
          <View style={{ flex: step > 1 ? 1.4 : 1 }}>
            {step < TOTAL_STEPS ? (
              <GradientButton label="Suivant" icon="arrow-right" onPress={handleNext} />
            ) : (
              <GradientButton label={loading ? '...' : 'Publier le trajet'} onPress={handleSubmit} loading={loading} />
            )}
          </View>
        </View>
      </ScrollView>

      {/* MOBILE PICKER */}
      {Platform.OS !== 'web' && activePicker.type && (
        <>
          {(activePicker.type === 'departureDate' || activePicker.type === 'arrivalDate' || activePicker.type === 'stopDate') && (
            <DateTimePicker
              value={tempDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(_e: any, selected?: Date) => {
                if (selected) setTempDate(selected);
                if (activePicker.type === 'departureDate') openDatePicker('departureTime');
                if (activePicker.type === 'arrivalDate') openDatePicker('arrivalTime');
                if (activePicker.type === 'stopDate') openDatePicker('stopTime', activePicker.stopIndex);
              }}
            />
          )}
          {(activePicker.type === 'departureTime' || activePicker.type === 'arrivalTime' || activePicker.type === 'stopTime') && (
            <DateTimePicker
              value={tempTime}
              mode="time"
              display="default"
              onChange={(_e: any, selected?: Date) => {
                closePicker();
                if (selected) setTempTime(selected);
                if (activePicker.type === 'departureTime') updateDateTimeField('departure');
                if (activePicker.type === 'arrivalTime') updateDateTimeField('arrival');
                if (activePicker.type === 'stopTime') updateDateTimeField('stop', activePicker.stopIndex);
              }}
            />
          )}
        </>
      )}

      {/* NOTE: no <Toast /> here — a single instance lives in app/_layout.tsx.
          Multiple instances fight over the library's singleton ref and the
          screen-level one renders clipped inside the page, so nothing showed. */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: M.page },

  hero: { overflow: 'hidden', paddingTop: 14, paddingBottom: 20, paddingHorizontal: 20, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: { fontFamily: fonts.display, fontSize: 20, fontWeight: '700', color: '#fff' },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, marginBottom: 8 },
  progressStep: { fontSize: 13, fontWeight: '600', color: '#fff', fontFamily: fonts.body },
  progressPct: { fontSize: 13, color: M.onInkMut, fontFamily: fonts.display },
  track: { height: 8, borderRadius: 9999, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  fill: { height: 8, borderRadius: 9999 },

  card: { backgroundColor: '#fff', borderRadius: 20, borderWidth: 1, borderColor: M.line, padding: 18 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  fieldLabel: { fontSize: 10, color: M.textFaint, letterSpacing: 0.6, fontFamily: fonts.display, fontWeight: '600' },
  cityInput: { fontSize: 16, fontWeight: '600', color: M.text, fontFamily: fonts.body, paddingVertical: 2 },
  rowDivider: { height: 1, backgroundColor: M.hair, marginLeft: 22 },
  dateWrap: { paddingVertical: 2 },
  dateInput: { fontSize: 16, fontWeight: '600', color: M.text, fontFamily: fonts.body, borderWidth: 0, backgroundColor: 'transparent', paddingVertical: 2 },
  dateVal: { fontSize: 16, fontWeight: '600', color: M.text, fontFamily: fonts.body, paddingVertical: 2 },
  errBorder: { borderBottomWidth: 1, borderBottomColor: M.warm1 },

  stopHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  stopTitle: { fontSize: 14, fontWeight: '700', color: M.text, fontFamily: fonts.display },
  stopInput: { backgroundColor: M.surfaceAlt, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12, fontSize: 15, color: M.text, fontFamily: fonts.body, marginBottom: 10 },
  stopDateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: M.surfaceAlt, borderRadius: 12, paddingHorizontal: 13, paddingVertical: 12 },
  addStop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14, paddingVertical: 12, borderRadius: 14, backgroundColor: '#FEF0EC' },
  addStopTxt: { color: M.warm1, fontWeight: '600', fontFamily: fonts.body },

  stepTitleBig: { fontSize: 18, fontWeight: '700', color: M.text, fontFamily: fonts.display, marginBottom: 14 },
  label2: { fontSize: 13, color: M.textMut, marginBottom: 6, marginTop: 8, fontFamily: fonts.body },
  input2: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: M.surfaceAlt, borderRadius: 12, paddingHorizontal: 13, height: 50 },
  input2Field: { flex: 1, fontSize: 15, color: M.text, fontFamily: fonts.body },

  summary: { borderTopWidth: 1, borderTopColor: M.hair, paddingTop: 16, marginTop: 18 },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: M.text, marginBottom: 12, fontFamily: fonts.display },
  sumRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  sumLbl: { fontSize: 14, color: M.textMut, fontFamily: fonts.body },
  sumVal: { fontSize: 14, fontWeight: '500', color: M.text, textAlign: 'right', flex: 1, marginLeft: 16, fontFamily: fonts.body },
  sumPrice: { fontSize: 14, fontWeight: '700', color: M.warm1, fontFamily: fonts.display },

  nav: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  backBtn: { flex: 1, height: 52, borderRadius: 16, backgroundColor: '#fff', borderWidth: 1, borderColor: M.line, alignItems: 'center', justifyContent: 'center' },
  backTxt: { color: M.text, fontWeight: '600', fontFamily: fonts.body },
});
