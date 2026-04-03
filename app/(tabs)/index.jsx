import { useState, useEffect, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  TextInput, Modal, ActivityIndicator, SafeAreaView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, STATUS_COLORS } from '../../constants/theme';
import BookCard from '../../components/BookCard';
import { api } from '../../lib/api';
import { storage } from '../../lib/storage';

const STATUSES = ['buy', 'library', 'gift', 'sample'];

export default function UpNextScreen() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [addingStatus, setAddingStatus] = useState('buy');
  const [token, setToken] = useState(null);

  useEffect(() => {
    storage.getToken().then(t => {
      setToken(t);
      if (t) loadBooks();
      else setLoading(false);
    });
  }, []);

  const loadBooks = async () => {
    try {
      const data = await api.getUserBooks();
      setBooks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const results = await api.searchBooks(query);
      setSearchResults(results);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (bookData) => {
    try {
      const book = await api.upsertBook(bookData);
      await api.addUserBook(book.id, addingStatus);
      await loadBooks();
      setSearchOpen(false);
      setQuery('');
      setSearchResults([]);
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleMarkRead = async (userBook) => {
    Alert.alert(
      `Finished "${userBook.book.title}"?`,
      'How was it?',
      [
        { text: 'Loved it', onPress: () => doMarkRead(userBook.id, 'loved') },
        { text: 'Liked it', onPress: () => doMarkRead(userBook.id, 'liked') },
        { text: 'It was okay', onPress: () => doMarkRead(userBook.id, 'okay') },
        { text: 'Not for me', onPress: () => doMarkRead(userBook.id, 'notForMe') },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const doMarkRead = async (id, rating) => {
    try {
      await api.markRead(id, rating);
      await loadBooks();
    } catch (e) {
      Alert.alert('Error', e.message);
    }
  };

  const handleRemove = async (id) => {
    try {
      await api.removeUserBook(id);
      await loadBooks();
    } catch (e) {}
  };

  if (!token) {
    return (
      <SafeAreaView style={styles.container}>
        <AuthScreen onAuth={(t) => { setToken(t); loadBooks(); }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Up Next</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setSearchOpen(true)}>
          <Ionicons name="add" size={22} color={colors.bg} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.purple} style={{ marginTop: 40 }} />
      ) : books.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Your list is empty</Text>
          <Text style={styles.emptyText}>Tap + to add your first book</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View>
              <BookCard
                userBook={item}
                onPress={() => {}}
                onStatusPress={() => {}}
              />
              <View style={styles.rowActions}>
                <TouchableOpacity onPress={() => handleMarkRead(item)} style={styles.actionBtn}>
                  <Ionicons name="checkmark-circle-outline" size={16} color={colors.purple} />
                  <Text style={styles.actionText}>Mark read</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={16} color={colors.creamMuted} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Add book modal */}
      <Modal visible={searchOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add a book</Text>
              <TouchableOpacity onPress={() => { setSearchOpen(false); setQuery(''); setSearchResults([]); }}>
                <Ionicons name="close" size={24} color={colors.creamMuted} />
              </TouchableOpacity>
            </View>

            {/* Status selector */}
            <View style={styles.statusRow}>
              {STATUSES.map(s => (
                <TouchableOpacity
                  key={s}
                  style={[styles.statusChip, addingStatus === s && { backgroundColor: STATUS_COLORS[s].bg, borderColor: STATUS_COLORS[s].text }]}
                  onPress={() => setAddingStatus(s)}
                >
                  <Text style={[styles.statusChipText, { color: addingStatus === s ? STATUS_COLORS[s].text : colors.creamMuted }]}>
                    {STATUS_COLORS[s].label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.searchRow}>
              <TextInput
                style={styles.searchInput}
                value={query}
                onChangeText={setQuery}
                onSubmitEditing={handleSearch}
                placeholder="Search title or author..."
                placeholderTextColor={colors.creamMuted}
                returnKeyType="search"
                autoFocus
              />
              <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
                {searching ? <ActivityIndicator size="small" color={colors.bg} /> : <Ionicons name="search" size={18} color={colors.bg} />}
              </TouchableOpacity>
            </View>

            <FlatList
              data={searchResults}
              keyExtractor={(_, i) => i.toString()}
              style={{ maxHeight: 340 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.resultItem} onPress={() => handleAdd(item)}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultTitle}>{item.title}</Text>
                    <Text style={styles.resultAuthor}>{item.author}{item.year ? ` · ${item.year}` : ''}</Text>
                  </View>
                  <Ionicons name="add-circle-outline" size={24} color={colors.purple} />
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// Simple inline auth screen
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      let result;
      if (mode === 'register') {
        result = await api.register(email, name, password);
      } else {
        result = await api.login(email, password);
      }
      await storage.setToken(result.token);
      onAuth(result.token);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <Text style={authStyles.logo}>Scout</Text>
      <Text style={authStyles.tagline}>Your personal book companion</Text>

      {mode === 'register' && (
        <TextInput style={authStyles.input} value={name} onChangeText={setName} placeholder="Your name" placeholderTextColor={colors.creamMuted} autoCapitalize="words" />
      )}
      <TextInput style={authStyles.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor={colors.creamMuted} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={authStyles.input} value={password} onChangeText={setPassword} placeholder="Password" placeholderTextColor={colors.creamMuted} secureTextEntry />

      {error ? <Text style={authStyles.error}>{error}</Text> : null}

      <TouchableOpacity style={authStyles.btn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={authStyles.btnText}>{mode === 'login' ? 'Sign in' : 'Create account'}</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
        <Text style={authStyles.toggle}>{mode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const authStyles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  logo: { color: colors.cream, fontSize: 48, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  tagline: { color: colors.creamMuted, fontSize: 16, textAlign: 'center', marginBottom: 48 },
  input: {
    backgroundColor: colors.bgCard, color: colors.cream, borderRadius: 12, padding: 14,
    fontSize: 15, borderWidth: 1, borderColor: colors.border, marginBottom: 12,
  },
  btn: { backgroundColor: colors.purple, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  toggle: { color: colors.purple, fontSize: 14, textAlign: 'center', marginTop: 20 },
  error: { color: '#F87171', fontSize: 13, marginBottom: 8 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16 },
  headerTitle: { color: colors.cream, fontSize: 28, fontWeight: '700' },
  addBtn: { backgroundColor: colors.purple, borderRadius: 20, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyTitle: { color: colors.cream, fontSize: 20, fontWeight: '600' },
  emptyText: { color: colors.creamMuted, fontSize: 15 },
  rowActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, marginTop: -4, marginBottom: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, padding: 4 },
  actionText: { color: colors.purple, fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: colors.bgCard, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { color: colors.cream, fontSize: 18, fontWeight: '600' },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  statusChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: colors.border, backgroundColor: 'transparent' },
  statusChipText: { fontSize: 13, fontWeight: '500' },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchInput: {
    flex: 1, backgroundColor: colors.bgInput, color: colors.cream, borderRadius: 10, paddingHorizontal: 14,
    paddingVertical: 10, fontSize: 15, borderWidth: 1, borderColor: colors.border,
  },
  searchBtn: { backgroundColor: colors.purple, borderRadius: 10, width: 44, alignItems: 'center', justifyContent: 'center' },
  resultItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 10 },
  resultTitle: { color: colors.cream, fontSize: 14, fontWeight: '500' },
  resultAuthor: { color: colors.creamMuted, fontSize: 12, marginTop: 2 },
});
