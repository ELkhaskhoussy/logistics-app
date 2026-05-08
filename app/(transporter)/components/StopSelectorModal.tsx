import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { Feather } from "@expo/vector-icons";

type Stop = {
  id: string;
  city: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  stops: Stop[];
  selectedIndex: number;
  onSelect: (index: number) => void;
};

const StopSelectorModal: React.FC<Props> = ({
  visible,
  onClose,
  stops,
  selectedIndex,
  onSelect,
}) => {
  const renderItem = ({ item, index }: { item: Stop; index: number }) => {
    const isSelected = index === selectedIndex;

    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.selectedItem]}
        onPress={() => onSelect(index)}
      >
        <View style={styles.itemRow}>
          <Text style={[styles.text, isSelected && styles.selectedText]}>
            {item.city}
          </Text>

          {isSelected && (
            <Feather name="check-circle" size={18} color="#2563EB" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      {/* Overlay (click outside to close) */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        {/* Prevent closing when clicking inside */}
        <TouchableOpacity activeOpacity={1} style={styles.container}>
          <View style={styles.handle} />

          <Text style={styles.title}>Select Current Stop</Text>

          <FlatList
            data={stops}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 10 }}
          />

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

export default StopSelectorModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#fff",
    padding: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "75%",
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: "#D1D5DB",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  item: {
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    marginBottom: 8,
  },
  selectedItem: {
    backgroundColor: "#DBEAFE",
    borderWidth: 1,
    borderColor: "#2563EB",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  text: {
    fontSize: 14,
    color: "#111827",
  },
  selectedText: {
    color: "#2563EB",
    fontWeight: "600",
  },
  closeButton: {
    marginTop: 10,
    padding: 12,
    alignItems: "center",
  },
  closeText: {
    color: "red",
    fontWeight: "500",
  },
});