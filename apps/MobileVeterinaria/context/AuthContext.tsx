import { createContext, useContext } from 'react';

export type User = {
  nombre: string;
  email: string;
  telefono: string;
  fecha_creacion: string;
  fecha_actualizacion: string;
  tipo_Usuario?: string;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
};

export const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  login: () => {},
  logout: () => {},
});

export const useAuth = () => useContext(AuthContext);
