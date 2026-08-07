import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { fonts, M } from '../../constants/meridian';
import { useAuth } from '../../scripts/context/AuthContext';
import { getUnreadCount } from '../../app/services/notification';

/** How often the badge re-checks for new notifications while visible. */
const POLL_MS = 20000;

/**
 * Bell with an unread badge. Refreshes on focus and then polls, so new
 * notifications appear without the user reloading the page.
 */
export default function NotificationBell({ style, color = '#fff' }: { style?: ViewStyle; color?: string }) {
  const router = useRouter();
  const { userId } = useAuth();
  const [count, setCount] = useState(0);

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let cancelled = false;

      const refresh = () => {
        getUnreadCount(userId)
          .then((c) => { if (!cancelled) setCount(c); })
          .catch(() => { /* badge is non-critical — stay silent */ });
      };

      refresh();
      // Poll while the screen is focused so notifications appear without a
      // manual refresh. Cleared on blur to avoid background requests.
      const interval = setInterval(refresh, POLL_MS);

      return () => {
        cancelled = true;
        clearInterval(interval);
      };
    }, [userId])
  );

  return (
    <Pressable style={[styles.wrap, style]} onPress={() => router.push('/notifications' as any)}>
      <Feather name="bell" size={18} color={color} />
      {count > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeTxt}>{count > 9 ? '9+' : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: -2, right: -2,
    minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: M.warm1, borderWidth: 2, borderColor: M.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeTxt: { fontSize: 9, fontWeight: '700', color: '#fff', fontFamily: fonts.display },
});
