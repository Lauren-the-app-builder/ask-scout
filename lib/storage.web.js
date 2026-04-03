const TOKEN_KEY = 'scout_token';

export const storage = {
  setToken: (token) => { localStorage.setItem(TOKEN_KEY, token); return Promise.resolve(); },
  getToken: () => Promise.resolve(localStorage.getItem(TOKEN_KEY)),
  removeToken: () => { localStorage.removeItem(TOKEN_KEY); return Promise.resolve(); },
};
