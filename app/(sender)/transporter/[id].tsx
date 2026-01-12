import { useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function TransporterDetailScreen() {
    const { id } = useLocalSearchParams();
    return (
        <View style={styles.container}>
            <Text>Transporter Detail Screen: {id}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
