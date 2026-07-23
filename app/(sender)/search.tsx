import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Badge from '../../components/meridian/Badge';
import Card from '../../components/meridian/Card';
import Glow from '../../components/meridian/Glow';
import GradientButton from '../../components/meridian/GradientButton';
import RouteArc from '../../components/meridian/RouteArc';
import RouteDots from '../../components/meridian/RouteDots';
import { fonts, M } from '../../constants/meridian';
import { apiClient } from '../services/backService';

type MonthOption = { value: string; label: string };

// "YYYY-MM" -> first & last day of that month
const monthToRange = (value: string) => {
  const [y, m] = value.split('-').map(Number);
  const from = `${y}-${String(m).padStart(2, '0')}-01`;
  const lastDay = new Date(y, m, 0).getDate();
  const to = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  return { from, to };
};

export default function SearchScreen() {
  const router = useRouter();

  const [collectionCity, setCollectionCity] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<MonthOption | null>(null);

  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchOpen, setSearchOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<{ route: string; month?: string } | null>(null);

  const monthOptions: MonthOption[] = useMemo(() => {
    const opts: MonthOption[] = [];
    const now = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const raw = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      opts.push({ value, label: raw.charAt(0).toUpperCase() + raw.slice(1) });
    }
    return opts;
  }, []);

  const loadAvailableTrips = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/catalog/trips/available');
      setTrips(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAvailableTrips();
  }, []);

  const runSearch = async (dep: string, arr: string, month: MonthOption | null) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('departureCity', dep.trim());
      params.append('arrivalCity', arr.trim());
      if (month) {
        const { from, to } = monthToRange(month.value);
        params.append('dateFrom', from);
        params.append('dateTo', to);
      }
      const response = await apiClient.get(`/catalog/trips/search?${params.toString()}`);
      setTrips(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error(err);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!collectionCity.trim()) {
      Toast.show({ type: 'error', text1: 'Ville de collecte requise' });
      return;
    }
    if (!deliveryCity.trim()) {
      Toast.show({ type: 'error', text1: 'Ville de livraison requise' });
      return;
    }
    await runSearch(collectionCity, deliveryCity, selectedMonth);
    setActiveFilters({ route: `${collectionCity.trim()} → ${deliveryCity.trim()}`, month: selectedMonth?.label });
    setSearchOpen(false);
    setMonthOpen(false);
  };

  const clearAll = () => {
    setCollectionCity('');
    setDeliveryCity('');
    setSelectedMonth(null);
    setActiveFilters(null);
    setSearchOpen(false);
    setMonthOpen(false);
    loadAvailableTrips();
  };

  const clearMonth = async () => {
    setSelectedMonth(null);
    setActiveFilters((prev) => (prev ? { route: prev.route } : null));
    await runSearch(collectionCity, deliveryCity, null);
  };

  const fmtDate = (value: any) => (!value ? '—' : String(value).replace('T', ' ').slice(0, 10));

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 26 }} keyboardShouldPersistTaps="handled">
        {/* HERO */}
        <View style={styles.hero}>
          <LinearGradient colors={[M.inkHi, M.ink]} start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
          <Glow color="#EC5B43" size={200} style={{ left: -40, bottom: 10 }} />
          <Glow color="#38BDF8" size={190} style={{ right: -30, top: 20 }} />
          <RouteArc w={392} h={200} d="M56 150 Q 196 44 336 96" />
          <View style={styles.heroTop}>
            <Text style={styles.brand}>Sendlo</Text>
            <Pressable style={styles.avatarBtn} onPress={() => router.push('/(sender)/profile' as any)}>
              <Feather name="user" size={17} color="#fff" />
            </Pressable>
          </View>
          <Text style={styles.heroTitle}>Envoyez à{'\n'}travers la mer.</Text>
        </View>

        {/* SEARCH CARD (floating) */}
        <View style={styles.searchWrap}>
          <Card style={styles.searchCard}>
            {!searchOpen ? (
              <>
                <Pressable style={styles.pill} onPress={() => setSearchOpen(true)}>
                  <Feather name="search" size={18} color={M.textFaint} />
                  <Text style={styles.pillText}>Rechercher un trajet</Text>
                  <Feather name="sliders" size={18} color={M.warm1} />
                </Pressable>
                {activeFilters ? (
                  <View style={styles.chipsRow}>
                    <Pressable style={styles.chip} onPress={clearAll}>
                      <Text style={styles.chipText}>{activeFilters.route}</Text>
                      <Feather name="x" size={13} color={M.warm1} />
                    </Pressable>
                    {activeFilters.month ? (
                      <Pressable style={styles.chip} onPress={clearMonth}>
                        <Text style={styles.chipText}>{activeFilters.month}</Text>
                        <Feather name="x" size={13} color={M.warm1} />
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </>
            ) : (
              <>
                <View style={styles.panelHeader}>
                  <Text style={styles.panelTitle}>Rechercher un trajet</Text>
                  <Pressable onPress={() => { setSearchOpen(false); setMonthOpen(false); }}>
                    <Feather name="x" size={20} color={M.textFaint} />
                  </Pressable>
                </View>

                <View style={styles.wf}>
                  <Feather name="navigation" size={16} color={M.warm1} />
                  <TextInput style={styles.wfInput} placeholder="Ville de collecte" placeholderTextColor={M.textFaint} value={collectionCity} onChangeText={setCollectionCity} />
                </View>
                <View style={styles.wf}>
                  <Feather name="map-pin" size={16} color={M.blue} />
                  <TextInput style={styles.wfInput} placeholder="Ville de livraison" placeholderTextColor={M.textFaint} value={deliveryCity} onChangeText={setDeliveryCity} />
                </View>

                <Pressable style={styles.wf} onPress={() => setMonthOpen(!monthOpen)}>
                  <Feather name="calendar" size={16} color={M.textMut} />
                  <Text style={[styles.wfInput, { color: selectedMonth ? M.text : M.textFaint }]}>
                    {selectedMonth ? selectedMonth.label : 'Mois (optionnel)'}
                  </Text>
                  <Feather name="chevron-down" size={16} color={M.textMut} />
                </Pressable>

                {monthOpen ? (
                  <View style={styles.dropdown}>
                    {monthOptions.map((opt) => (
                      <Pressable key={opt.value} style={styles.dropdownItem} onPress={() => { setSelectedMonth(opt); setMonthOpen(false); }}>
                        <Text style={{ color: M.text, fontSize: 14, fontFamily: fonts.body }}>{opt.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : null}

                <GradientButton label="Rechercher" onPress={handleSearch} style={{ marginTop: 6 }} />
                <Pressable onPress={clearAll} style={{ marginTop: 10, alignItems: 'center' }}>
                  <Text style={styles.clearLink}>Effacer</Text>
                </Pressable>
              </>
            )}
          </Card>
        </View>

        {/* RESULTS */}
        <View style={styles.results}>
          <Text style={styles.resultsTitle}>
            {activeFilters ? 'Résultats' : 'Trajets disponibles'}
            {!loading ? ` · ${trips.length}` : ''}
          </Text>

          {loading ? <Text style={styles.stateText}>Chargement…</Text> : null}
          {!loading && trips.length === 0 ? <Text style={styles.stateText}>Aucun trajet trouvé</Text> : null}

          {!loading &&
            trips.map((trip) => {
              const stops =
                Array.isArray(trip.collectionStops) && trip.collectionStops.length > 2
                  ? [...trip.collectionStops].sort((a: any, b: any) => (a.ordre ?? 0) - (b.ordre ?? 0)).map((s: any) => s.city).join(' → ')
                  : null;
              return (
                <Card
                  key={trip.id}
                  style={styles.tripCard}
                  onPress={() => {
                    if (!trip.transporterId) return;
                    router.push({
                      pathname: '/transporter-details/[id]',
                      params: { id: String(trip.transporterId), tripId: String(trip.id) },
                    });
                  }}
                >
                  <RouteDots />
                  <View style={styles.cityRow}>
                    <Text style={styles.city}>{trip.departureCity}</Text>
                    <Text style={styles.dateMono}>{fmtDate(trip.departureTime)}</Text>
                    <Text style={styles.city}>{trip.arrivalCity}</Text>
                  </View>
                  {stops ? (
                    <View style={styles.stopsRow}>
                      <Feather name="git-commit" size={13} color={M.textFaint} />
                      <Text style={styles.stopsText}>{stops}</Text>
                    </View>
                  ) : null}
                  <View style={styles.divider} />
                  <View style={styles.footerRow}>
                    <View style={styles.kgWrap}>
                      <Feather name="box" size={15} color={M.textMut} />
                      <Text style={styles.kg}>{trip.availableCapacityKg} kg libres</Text>
                    </View>
                    <View style={styles.priceWrap}>
                      <Text style={styles.price}>€{trip.pricePerKg}</Text>
                      <Text style={styles.priceUnit}>/kg</Text>
                    </View>
                  </View>
                </Card>
              );
            })}
        </View>
      </ScrollView>

      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: M.page },

  hero: { height: 300, overflow: 'hidden' },
  heroTop: {
    position: 'absolute', top: 16, left: 24, right: 24,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  brand: { fontFamily: fonts.display, fontSize: 15, fontWeight: '700', color: '#fff' },
  avatarBtn: { width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  heroTitle: {
    position: 'absolute', bottom: 58, left: 24, right: 24,
    fontFamily: fonts.display, fontSize: 27, fontWeight: '700', color: '#fff', lineHeight: 30, letterSpacing: -0.5,
  },

  searchWrap: { marginTop: -34, paddingHorizontal: 18, zIndex: 2 },
  searchCard: { padding: 16 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: M.surfaceAlt, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 13 },
  pillText: { flex: 1, color: M.textFaint, fontSize: 14, fontFamily: fonts.body },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF0EC', paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16 },
  chipText: { color: M.warm1, fontSize: 13, fontWeight: '600', fontFamily: fonts.body },

  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  panelTitle: { fontSize: 16, fontWeight: '700', color: M.text, fontFamily: fonts.display },
  wf: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: M.surfaceAlt, borderRadius: 14, paddingHorizontal: 14, height: 50, marginBottom: 10 },
  wfInput: { flex: 1, fontSize: 15, color: M.text, fontFamily: fonts.body },
  dropdown: { borderWidth: 1, borderColor: M.line, borderRadius: 12, marginTop: -4, marginBottom: 10, overflow: 'hidden' },
  dropdownItem: { paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: M.hair },
  clearLink: { color: M.warm1, fontWeight: '600', fontFamily: fonts.body },

  results: { paddingHorizontal: 18, paddingTop: 22 },
  resultsTitle: { fontSize: 16, fontWeight: '700', color: M.text, marginBottom: 12, fontFamily: fonts.display },
  stateText: { textAlign: 'center', marginTop: 20, color: M.textMut, fontFamily: fonts.body },

  tripCard: { padding: 18, marginBottom: 14 },
  cityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 7 },
  city: { fontSize: 13, fontWeight: '700', color: M.text, fontFamily: fonts.display },
  dateMono: { fontSize: 11, color: M.textFaint, fontFamily: fonts.display },
  stopsRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  stopsText: { fontSize: 12, color: M.textMut, fontFamily: fonts.body, flex: 1 },
  divider: { height: 1, backgroundColor: M.hair, marginTop: 16, marginBottom: 14 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kgWrap: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  kg: { fontSize: 13, color: M.textMut, fontFamily: fonts.body },
  priceWrap: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
  price: { fontSize: 22, fontWeight: '700', color: M.text, fontFamily: fonts.display, letterSpacing: -0.5 },
  priceUnit: { fontSize: 12, color: M.textFaint, fontFamily: fonts.body },
});
