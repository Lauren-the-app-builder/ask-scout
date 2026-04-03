import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'scout_token';

export const storage = {
  setToken: (token) => SecureStore.setItemAsync(TOKEN_KEY, token),
  getToken: () => SecureStore.getItemAsync(TOKEN_KEY),
  removeToken: () => SecureStore.deleteItemAsync(TOKEN_KEY),
};
