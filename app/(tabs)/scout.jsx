import { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/theme';
import ChatBubble from '../../components/ChatBubble';
import ScoutAvatar from '../../components/ScoutAvatar';
import DailyRecommendation from '../../components/DailyRecommendation';
import TasteUpdateBanner from '../../components/TasteUpdateBanner';
import { api } from '../../lib/api';
import { storage } from '../../lib/storage';

export default function ScoutScreen() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [dailyRec, setDailyRec] = useState(null);
  const [dailyLoading, setDailyLoading] = useState(true);
  const [tasteUpdate, setTasteUpdate] = useState(null);
  const [token, setToken] = useState(null);
  const listRef = useRef(null);

  useEffect(() => {
    storage.getToken().then(t => {
      setToken(t);
      if (t) {
        loadHistory();
        loadDailyRec();
      }
    });
  }, []);

  const loadHistory = async () => {
    try {
      const history = await api.getChatHistory();
      const filtered = history.filter(m => !m.content.startsWith('[daily_rec_'));
      setMessages(filtered);
    } catch (e) {}
  };

  const loadDailyRec = async () => {
    try {
      const { recommendation } = await api.getDailyRec();
      setDailyRec(recommendation);
    } catch (e) {
      setDailyRec('Ask me anything about books — what to read next, what you loved, what to avoid.');
    } finally {
      setDailyLoading(false);
    }
  };

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || loading) return;
    setInput('');
    const userMsg = { id: Date.now().toString(), role: 'user', content };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const { reply, tasteUpdate: update } = await api.sendMessage(content);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'scout', content: reply }]);
      if (update) setTasteUpdate(update);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'scout', content: "Sorry, I'm having a moment. Try again?" }]);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.locked}>
          <ScoutAvatar size={64} idle />
          <Text style={styles.lockedTitle}>Scout</Text>
          <Text style={styles.lockedText}>Sign in from the Up Next tab to meet Scout.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TasteUpdateBanner text={tasteUpdate} onDone={() => setTasteUpdate(null)} />

      {/* Header */}
      <View style={styles.header}>
        <ScoutAvatar size={36} idle />
        <View>
          <Text style={styles.headerTitle}>Scout</Text>
          <Text style={styles.headerSub}>your book companion</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={item => item.id || item.createdAt}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
          ListHeaderComponent={<DailyRecommendation recommendation={dailyRec} loading={dailyLoading} />}
          renderItem={({ item }) => <ChatBubble message={item} />}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        />

        {loading && (
          <View style={styles.typing}>
            <ScoutAvatar size={24} />
            <View style={styles.typingDots}>
              <ActivityIndicator size="small" color={colors.creamMuted} />
            </View>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            placeholder="Ask Scout anything..."
            placeholderTextColor={colors.creamMuted}
            returnKeyType="send"
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!input.trim() || loading}
          >
            <Ionicons name="arrow-up" size={18} color={(!input.trim() || loading) ? colors.creamMuted : colors.bg} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { color: colors.cream, fontSize: 18, fontWeight: '700' },
  headerSub: { color: colors.creamMuted, fontSize: 12 },
  locked: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  lockedTitle: { color: colors.cream, fontSize: 28, fontWeight: '700' },
  lockedText: { color: colors.creamMuted, fontSize: 15, textAlign: 'center', paddingHorizontal: 32 },
  typing: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  typingDots: { backgroundColor: colors.bgCard, borderRadius: 12, padding: 8 },
  inputRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'flex-end' },
  input: {
    flex: 1, backgroundColor: colors.bgCard, color: colors.cream, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, borderWidth: 1,
    borderColor: colors.border, maxHeight: 100,
  },
  sendBtn: { backgroundColor: colors.purple, borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: colors.bgCard },
});
