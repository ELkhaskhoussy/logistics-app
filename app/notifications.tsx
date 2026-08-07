import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Glow from '../components/meridian/Glow';
import { fonts, M } from '../constants/meridian';
import { useAuth } from '../scripts/context/AuthContext';
import {
  AppNotification,
  getMyNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from './services/notification';

/** Icon + tint per notification type. */
const STYLE_BY_TYPE: Record<string, { icon: any; color: string; bg: string }> = {
  BOOKING_REQUESTED: { icon: 'inbox', color: M.blue, bg: '#EFF6FF' },
  BOOKING_PRE_ACCEPTED: { icon: 'check-circle', color: M.warm1, bg: '#FEF0EC' },
  BOOKING_DECLINED: { icon: 'x-circle', color: '#DC2626', bg: '#FEE2E2' },
  BOOKING_CONFIRMED: { icon: 'package', color: M.green, bg: M.greenBg },
  BOOKING_DELIVERED: { icon: 'check', color: M.green, bg: M.greenBg },
  BOOKING_CANCELLED: { icon: 'slash', color: M.textFaint, bg: '#EEF1F5' },
  TRIP_POSITION_UPDATED: { icon: 'navigation', color: M.cool, bg: '#E4F5FE' },
  TRIP_PUBLISHED: { icon: 'map-pin', color: M.amber, bg: '#FBF3E1' },
};

const relativeTime = (iso: string) => {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} j`;
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { userId } = useAuth();

  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!userId) { setLoading(false); return; }
    try {
      // Polling refreshes must not flash the spinner over existing content.
      if (!opts?.silent) setLoading(true);
      setLoadError(false);
      setItems(await getMyNotifications(userId));
    } catch {
      if (!opts?.silent) {
        setLoadError(true);
        setItems([]);
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, [userId]);

  // Refresh on focus, then poll while visible so new notifications land
  // without the user reloading the page.
  useFocusEffect(
    useCallback(() => {
      load();
      const interval = setInterval(() => { load({ silent: true }); }, 20000);
      return () => clearInterval(interval);
    }, [load])
  );

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  /** Mark as read, then jump to whatever the notification is about. */
  const open = async (n: AppNotification) => {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      markNotificationRead(n.id).catch(() => { /* optimistic */ });
    }

    if (!n.referenceId) return;

    // Route by what the notification points at, not by role:
    // TRIP → the transporter's trip screen (where demands are managed)
    // BOOKING → the sender's parcel tracking screen
    if (n.referenceType === 'TRIP') {
      router.push({ pathname: '/(transporter)/trip-details', params: { tripId: n.referenceId } } as any);
    } else if (n.referenceType === 'BOOKING') {
      router.push({ pathname: '/shipment/[id]', params: { id: n.referenceId } } as any);
    }
  };

  const markAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    if (userId) markAllNotificationsRead(userId).catch(() => { /* optimistic */ });
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        {/* HERO */}
        <View style={styles.hero}>
          <LinearGradient colors={[M.inkHi, M.ink]} start={{ x: 0.2, y: 0 }} end={{ x: 0.9, y: 1 }} style={StyleSheet.absoluteFill} />
          <Glow color="#EC5B43" size={160} style={{ left: -40, bottom: -30 }} />
          <View style={styles.heroTop}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Feather name="arrow-left" size={22} color="#fff" />
            </Pressable>
            {unread > 0 ? (
              <Pressable onPress={markAll} hitSlop={8}>
                <Text style={styles.markAll}>Tout marquer comme lu</Text>
              </Pressable>
            ) : null}
          </View>
          <Text style={styles.heroTitle}>Notifications</Text>
          <Text style={styles.heroSub}>
            {loading ? 'Chargement…' : unread > 0 ? `${unread} non lue${unread > 1 ? 's' : ''}` : 'Tout est à jour'}
          </Text>
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={M.warm1} /></View>
        ) : loadError ? (
          <View style={styles.errorBanner}>
            <Feather name="wifi-off" size={18} color={M.warm1} />
            <View style={{ flex: 1 }}>
              <Text style={styles.errorTitle}>Impossible de charger les notifications</Text>
              <Text style={styles.errorSub}>Vérifiez votre connexion.</Text>
            </View>
            <Pressable style={styles.retryBtn} onPress={() => load()}>
              <Text style={styles.retryTxt}>Réessayer</Text>
            </Pressable>
          </View>
        ) : items.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Feather name="bell" size={26} color={M.textFaint} />
            </View>
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySub}>
              Vous serez informé ici des demandes, acceptations et avancées de vos colis.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {items.map((n) => {
              const s = STYLE_BY_TYPE[n.type] ?? { icon: 'bell', color: M.textMut, bg: '#EEF1F5' };
              return (
                <Pressable key={n.id} style={[styles.card, !n.read && styles.cardUnread]} onPress={() => open(n)}>
                  <View style={[styles.icon, { backgroundColor: s.bg }]}>
                    <Feather name={s.icon} size={18} color={s.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.titleRow}>
                      <Text style={[styles.title, !n.read && styles.titleUnread]} numberOfLines={1}>
                        {n.title}
                      </Text>
                      {!n.read ? <View style={styles.dot} /> : null}
                    </View>
                    <Text style={styles.message}>{n.message}</Text>
                    <Text style={styles.time}>{relativeTime(n.createdAt)}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: M.page },

  hero: { overflow: 'hidden', paddingHorizontal: 22, paddingTop: 16, paddingBottom: 24, borderBottomLeftRadius: 26, borderBottomRightRadius: 26 },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  markAll: { fontSize: 12, color: M.warm2, fontWeight: '600', fontFamily: fonts.body },
  heroTitle: { fontFamily: fonts.display, fontSize: 24, fontWeight: '700', color: '#fff', marginTop: 14, letterSpacing: -0.4 },
  heroSub: { fontSize: 13, color: M.onInkMut, marginTop: 4, fontFamily: fonts.body },

  center: { paddingTop: 60, alignItems: 'center' },
  list: { paddingHorizontal: 20, paddingTop: 20, gap: 12 },

  card: {
    flexDirection: 'row', gap: 14, backgroundColor: '#fff', borderRadius: 18,
    borderWidth: 1, borderColor: M.line, padding: 16,
  },
  cardUnread: { borderColor: M.warm1, borderWidth: 1.5 },
  icon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 14, fontWeight: '600', color: M.text, fontFamily: fonts.body },
  titleUnread: { fontWeight: '700' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: M.warm1 },
  message: { fontSize: 13, color: M.textMut, marginTop: 3, lineHeight: 19, fontFamily: fonts.body },
  time: { fontSize: 11, color: M.textFaint, marginTop: 6, fontFamily: fonts.display },

  empty: { alignItems: 'center', paddingHorizontal: 32, paddingTop: 70 },
  emptyIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#fff', borderWidth: 1, borderColor: M.line, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: fonts.display, fontSize: 20, fontWeight: '700', color: M.text, marginTop: 22 },
  emptySub: { fontSize: 14, color: M.textMut, lineHeight: 21, marginTop: 8, textAlign: 'center', fontFamily: fonts.body },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, margin: 20,
    backgroundColor: '#FEF0EC', borderWidth: 1, borderColor: '#F6D9CE', borderRadius: 16, padding: 14,
  },
  errorTitle: { fontSize: 14, fontWeight: '600', color: '#B33F2A', fontFamily: fonts.body },
  errorSub: { fontSize: 12, color: '#A8705B', marginTop: 2, fontFamily: fonts.body },
  retryBtn: { backgroundColor: M.warm1, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  retryTxt: { color: '#fff', fontSize: 12, fontWeight: '600', fontFamily: fonts.body },
});
