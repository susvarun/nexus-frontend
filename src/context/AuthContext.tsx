import { createContext, useState } from 'react';
import type { ReactNode } from 'react';

interface AuthContextType {
  token: string | null;
  username: string | null;
  userId: string | null;
  login: (token: string, username: string, userId: string) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType>({
  token: null,
  username: null,
  userId: null,
  login: () => {},
  logout: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));
  const [userId, setUserId] = useState<string | null>(localStorage.getItem('userId'));

  const login = (newToken: string, newUsername: string, newUserId: string) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('username', newUsername);
    localStorage.setItem('userId', newUserId);
    setToken(newToken);
    setUsername(newUsername);
    setUserId(newUserId);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    setToken(null);
    setUsername(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ token, username, userId, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
