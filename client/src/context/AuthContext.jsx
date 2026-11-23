import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!localStorage.getItem('squad_token')) return setLoading(false);
    api('/auth/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('squad_token'))
      .finally(() => setLoading(false));
  }, []);

  const saveSession = ({ token, user }) => {
    localStorage.setItem('squad_token', token);
    setUser(user);
  };

  const value = {
    user,
    loading,
    setUser,
    login: async (email, password) => saveSession(await api('/auth/login', { method: 'POST', body: { email, password } })),
    register: async (data) => saveSession(await api('/auth/register', { method: 'POST', body: data })),
    loginWithGoogle: async (credential) => saveSession(await api('/auth/google', { method: 'POST', body: { credential } })),
    logout: () => {
      localStorage.removeItem('squad_token');
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
