import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Endpoints } from '@/utils/endpoints';

// Add OAuth handler to window
declare global {
  interface Window {
    processOAuthCallback: (fragment: string) => void;
    handleOAuthSuccess: (tokens: any) => void;
  }
}

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  provider?: string;
  isVerified?: boolean;
  createdAt?: string;
  onboarding_completed?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => Promise<void>;
  loginManual: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (password?: string, reauthToken?: string) => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on startup
    const token = localStorage.getItem('bridge_token');
    const userData = localStorage.getItem('bridge_user');
    
    if (token && userData) {
      try {
        const parsed = JSON.parse(userData);
  console.log('AuthContext: rehydrated user from localStorage', parsed);
        setUser(parsed);
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        localStorage.removeItem('bridge_token');
        localStorage.removeItem('bridge_user');
      }
    } else {
      console.log('AuthContext: no stored user/token found during init', { token, userData });
    }

    // Define OAuth success handler for Electron main process
    window.handleOAuthSuccess = async (tokens: any) => {
      console.log('🎉 OAuth success handler called with tokens:', tokens);
      
      try {
        const providerToken = tokens.provider_token || tokens.access_token;
        
        if (providerToken) {
          console.log('🔄 Getting user info from Google...');
          
          const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: {
              Authorization: `Bearer ${providerToken}`
            }
          });
          
          if (userResponse.ok) {
            const googleUser = await userResponse.json();
            console.log('✅ Google user info:', googleUser);
            
            // Send to your backend
            const response = await fetch(Endpoints.AUTH_OAUTH, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: googleUser.email,
                name: googleUser.name,
                picture: googleUser.picture,
                provider: 'google',
                providerId: googleUser.id
              }),
            });

            const data = await response.json();
            
            if (data.success) {
              console.log('✅ Backend OAuth processing successful');
              await login(data.data.token, data.data.user);
              
              // Navigate to home
              window.location.hash = '#/';
              console.log('✅ User authenticated and redirected!');
            } else {
              console.error('❌ Backend OAuth failed:', data.message);
            }
          } else {
            console.error('❌ Failed to get user info from Google');
          }
        } else {
          console.error('❌ No provider token found');
        }
      } catch (error) {
        console.error('❌ Error in OAuth success handler:', error);
      }
    };

    setLoading(false);
  }, []);

    const processOAuth = async (tokens: any) => {
      console.log('🎉 Processing OAuth with tokens:', tokens);
      
      try {
        const providerToken = tokens.provider_token || tokens.access_token;
        
        if (!providerToken) {
          console.error('❌ No provider token found in:', tokens);
          return;
        }

        console.log('🔄 Getting user info from Google API...');
        
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: {
            Authorization: `Bearer ${providerToken}`
          }
        });
        
        if (!userResponse.ok) {
          console.error('❌ Failed to get user info from Google:', userResponse.status, userResponse.statusText);
          return;
        }

        const googleUser = await userResponse.json();
        console.log('✅ Got Google user info:', googleUser);
        
        // Send to your backend
        console.log('🔄 Sending user data to backend...');
        const response = await fetch(Endpoints.AUTH_OAUTH, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: googleUser.email,
            name: googleUser.name,
            picture: googleUser.picture,
            provider: 'google',
            providerId: googleUser.id
          }),
        });

        const data = await response.json();
        console.log('📨 Backend response:', data);
        
        if (data.success) {
          console.log('✅ Backend OAuth processing successful');
          await login(data.data.token, data.data.user);
          
          // Navigate to home
          console.log('🏠 Navigating to home...');
          window.location.hash = '#/';
          console.log('✅ OAuth flow completed successfully!');
        } else {
          console.error('❌ Backend OAuth failed:', data.message);
        }
        
      } catch (error) {
        console.error('❌ Error processing OAuth:', error);
      }
    };

    // Set up OAuth callback functions on window
    window.processOAuthCallback = async (fragment: string) => {
      console.log('🔄 processOAuthCallback called with fragment');
      
      try {
        const params = new URLSearchParams(fragment);
        const tokens = {
          access_token: params.get('access_token'),
          provider_token: params.get('provider_token'),
          refresh_token: params.get('refresh_token'),
          expires_in: params.get('expires_in')
        };
        
        console.log('📋 Parsed tokens from fragment:', tokens);
        await processOAuth(tokens);
      } catch (error) {
        console.error('❌ Error in processOAuthCallback:', error);
      }
    };


  const login = async (token: string, userData: User) => {
  console.log('AuthContext: login - storing token and user', { userId: userData?.id });
    localStorage.setItem('bridge_token', token);
    localStorage.setItem('bridge_user', JSON.stringify(userData));
    setUser(userData);
  };

  const loginManual = async (email: string, password: string) => {
    const response = await fetch(Endpoints.AUTH_LOGIN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    
    if (data.success) {
      await login(data.data.token, data.data.user);
    } else {
      throw new Error(data.message);
    }
  };

  const loginWithGoogle = async () => {
    console.log('🔄 Starting Google OAuth...');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // This will trigger the navigation handler
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      }
    });
    
    if (error) {
      console.error('❌ OAuth error:', error);
      throw error;
    }
    
    console.log('✅ OAuth initiated');
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await fetch(Endpoints.AUTH_REGISTER, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name }),
    });

    const data = await response.json();
    
    if (data.success) {
      await login(data.data.token, data.data.user);
    } else {
      throw new Error(data.message);
    }
  };

  const logout = async () => {
    try {
      localStorage.removeItem('bridge_token');
      localStorage.removeItem('bridge_user');
      setUser(null);
      await supabase.auth.signOut();
    } catch (error) {
      console.error('❌ Logout failed:', error);
    }
  };

  const deleteAccount = async (password?: string, reauthToken?: string) => {
    const token = localStorage.getItem('bridge_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(Endpoints.AUTH_ACCOUNT, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ password, reauthToken }),
    });

    const data = await response.json();

    if (data.success) {
      // Clear local storage and logout
      await logout();
    } else {
      throw new Error(data.message || 'Failed to delete account');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...userData };
  console.log('AuthContext: updateUser', { before: user, after: updatedUser });
    localStorage.setItem('bridge_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      loginManual,
      loginWithGoogle,
      register,
      logout,
      deleteAccount,
      updateUser,
      loading
    }}>
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