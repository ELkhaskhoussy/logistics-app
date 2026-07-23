import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { fonts, M } from '../../../constants/meridian';

type Stop = { id: string; city: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  stops: Stop[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

const StopSelectorModal: React.FC<Props> = ({ visible, onClose, stops, selectedIndex, onSelect }) => {
  const [local, setLocal] = useState(selectedIndex);
  useEffect(() => { setLocal(selectedIndex); }, [selectedIndex, visible]);

  const stepSub = (index: number) => {
    if (index === 0) return 'Départ — trajet en cours';
    if (index === stops.length - 1) return 'Destination finale atteinte';
    return 'Point d\'étape';
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Statut du trajet</Text>
              <Text style={styles.sub}>Où en êtes-vous maintenant ?</Text>
            </View>
            <Pressable onPress={onClose}>
              <Feather name="x" size={22} color={M.textFaint} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }} contentContainerStyle={{ gap: 12, paddingVertical: 4 }}>
            {stops.map((item, index) => {
              const active = index === local;
              return (
                <Pressable key={item.id} style={[styles.step, active && styles.stepActive]} onPress={() => setLocal(index)}>
                  {active ? (
                    <LinearGradient colors={[M.warm1, M.warm2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.stepIcon}>
                      <Feather name="navigation" size={16} color="#fff" />
                    </LinearGradient>
                  ) : (
                    <View style={styles.stepIconMuted}>
                      <Feather name="map-pin" size={16} color={M.textFaint} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stepTitle}>{item.city}</Text>
                    <Text style={styles.stepSub}>{stepSub(index)}</Text>
                  </View>
                  {active ? (
                    <Feather name="check-circle" size={20} color={M.warm1} />
                  ) : (
                    <View style={styles.radio} />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable style={{ marginTop: 14 }} onPress={() => onSelect(local)}>
            <LinearGradient colors={[M.warm1, M.warm2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.save}>
              <Text style={styles.saveTxt}>Enregistrer le statut</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

export default StopSelectorModal;

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(10,22,38,0.55)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: M.surfaceAlt, borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 20, paddingBottom: 28, maxHeight: '85%' },
  handle: { width: 44, height: 4, borderRadius: 9999, backgroundColor: '#D6DBE3', alignSelf: 'center', marginBottom: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  title: { fontSize: 20, fontWeight: '700', color: M.text, fontFamily: fonts.display },
  sub: { fontSize: 13, color: M.textFaint, marginTop: 2, fontFamily: fonts.body },

  step: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: M.line },
  stepActive: { borderWidth: 1.5, borderColor: M.warm1 },
  stepIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepIconMuted: { width: 40, height: 40, borderRadius: 12, backgroundColor: M.page, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 15, fontWeight: '700', color: M.text, fontFamily: fonts.display },
  stepSub: { fontSize: 12, color: M.textFaint, marginTop: 2, fontFamily: fonts.body },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: '#D6DBE3' },

  save: { height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  saveTxt: { color: '#fff', fontWeight: '600', fontSize: 15, fontFamily: fonts.body },
});
