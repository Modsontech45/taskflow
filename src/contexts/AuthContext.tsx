import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { AuthContextType, User, LoginRequest, RegisterRequest } from '../types/auth';
import { apiClient } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: { user: User; token: string } }
  | { type: 'LOGOUT' };

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
      };
    case 'LOGOUT':
      return { user: null, token: null, loading: false };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');

    if (token && userData) {
      try {
        const user = JSON.parse(userData);
        apiClient.setToken(token);
        dispatch({ type: 'SET_USER', payload: { user, token } });
      } catch (error) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_data');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = async (credentials: LoginRequest) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response: any = await apiClient.login(credentials);
      const { token, user } = response;
      
      localStorage.setItem('auth_token', token);
      localStorage.setItem('user_data', JSON.stringify(user));
      apiClient.setToken(token);
      
      dispatch({ type: 'SET_USER', payload: { user, token } });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const register = async (data: RegisterRequest) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      await apiClient.register(data);
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    apiClient.setToken(null);
    dispatch({ type: 'LOGOUT' });
  };

  const value: AuthContextType = {
    user: state.user,
    token: state.token,
    login,
    register,
    logout,
    loading: state.loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}