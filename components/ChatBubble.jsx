import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';
import ScoutAvatar from './ScoutAvatar';

export default function ChatBubble({ message }) {
  const isScout = message.role === 'scout' || message.role === 'assistant';

  return (
    <View style={[styles.row, isScout ? styles.rowScout : styles.rowUser]}>
      {isScout && <ScoutAvatar size={28} />}
      <View style={[styles.bubble, isScout ? styles.bubbleScout : styles.bubbleUser]}>
        <Text style={[styles.text, isScout ? styles.textScout : styles.textUser]}>
          {message.content}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginBottom: 12, gap: 8, paddingHorizontal: 16 },
  rowScout: { alignItems: 'flex-end' },
  rowUser: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: 16, padding: 12 },
  bubbleScout: { backgroundColor: colors.bgCard, borderWidth: 1, borderColor: colors.border, borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: colors.purpleDim, borderWidth: 1, borderColor: 'rgba(155,77,202,0.3)', borderBottomRightRadius: 4 },
  text: { fontSize: 14, lineHeight: 21 },
  textScout: { color: colors.cream },
  textUser: { color: colors.purpleLight },
});
