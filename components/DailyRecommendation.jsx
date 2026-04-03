import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../constants/theme';

export default function DailyRecommendation({ recommendation, loading }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>✦ Today's pick</Text>
      {loading ? (
        <ActivityIndicator color={colors.purple} style={{ marginTop: 8 }} />
      ) : (
        <Text style={styles.text}>{recommendation || 'Ask Scout for a recommendation'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.purpleDim,
    borderWidth: 1,
    borderColor: 'rgba(155,77,202,0.3)',
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  label: { color: colors.purple, fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  text: { color: colors.cream, fontSize: 14, lineHeight: 21 },
});
