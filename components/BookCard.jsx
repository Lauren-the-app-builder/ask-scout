import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, STATUS_COLORS } from '../constants/theme';

export default function BookCard({ userBook, onPress, onStatusPress }) {
  const { book, status } = userBook;
  const statusStyle = STATUS_COLORS[status] || STATUS_COLORS.buy;

  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(userBook)} activeOpacity={0.7}>
      <View style={styles.cover}>
        {book.coverUrl ? (
          <Image source={{ uri: book.coverUrl }} style={styles.coverImg} resizeMode="cover" />
        ) : (
          <View style={styles.coverPlaceholder}>
            <Text style={styles.coverInitial}>{book.title[0]}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={2}>{book.title}</Text>
        <Text style={styles.author} numberOfLines={1}>{book.author}</Text>
        <TouchableOpacity
          style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
          onPress={() => onStatusPress?.(userBook)}
        >
          <Text style={[styles.statusText, { color: statusStyle.text }]}>{statusStyle.label}</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cover: {
    width: 52,
    height: 76,
    borderRadius: 6,
    overflow: 'hidden',
    backgroundColor: colors.bgInput,
  },
  coverImg: { width: '100%', height: '100%' },
  coverPlaceholder: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.purpleDim,
  },
  coverInitial: { color: colors.purple, fontSize: 22, fontWeight: '700' },
  info: { flex: 1, gap: 4 },
  title: { color: colors.cream, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  author: { color: colors.creamMuted, fontSize: 13 },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    marginTop: 4,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
});
