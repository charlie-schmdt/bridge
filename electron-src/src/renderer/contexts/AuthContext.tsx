import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider?: string;
  isVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking authentication status...');
      
      const token = localStorage.getItem('bridge_token');
      const userData = localStorage.getItem('bridge_user');
      
      if (token && userData) {
        console.log('🔍 Token and user data found');
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          console.log('✅ User restored from storage:', parsedUser.email);
        } catch (error) {
          console.error('❌ Error parsing user data:', error);
          localStorage.removeItem('bridge_token');
          localStorage.removeItem('bridge_user');
        }
      } else {
        console.log('🔍 No valid session found');
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      localStorage.removeItem('bridge_token');
      localStorage.removeItem('bridge_user');
    } finally {
      console.log('🏁 Auth check complete');
      setIsLoading(false);
    }
  };

  const login = async (token: string, userData: User) => {
    try {
      console.log('✅ Logging in user:', userData.email);
      localStorage.setItem('bridge_token', token);
      localStorage.setItem('bridge_user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      console.log('👋 Logging out user');
      localStorage.removeItem('bridge_token');
      localStorage.removeItem('bridge_user');
      setUser(null);
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};