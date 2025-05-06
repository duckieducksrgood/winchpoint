import { create } from 'zustand';
import axios from '../utils/axiosInstance';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

interface UserState {
  user: any | null;
  isLoggedout: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (username: string, password: string) => Promise<any>;
  logout: () => void;
  checkAuthStatus: () => Promise<boolean>;
}

export const useUserStore = create<UserState>((set, get) => ({
  user: null,
  isLoggedout: true,
  isLoading: true,
  error: null,

  login: async (username, password) => {
    try {
      const response = await axios.post('token/', { username, password });
      
      // Special handling for @admin user - ensure admin role is set
      if (username === 'admin') {
        if (!response.data.user) {
          response.data.user = { username: 'admin', role: 'admin' };
        } else {
          response.data.user.role = 'admin';
        }
        
        // Make sure redirect URL points to admin page
        response.data.redirect_url = '/AdminPage/AdminHome';
      }
      
      // Cookie is set by the backend
      set({ 
        user: response.data.user,
        isLoggedout: false, 
        error: null 
      });
      
      // Log successful login with role
      console.log("Login successful:", response.data.user);
      
      return response.data;
    } catch (error: any) {
      set({ error: error.response?.data?.detail || 'Login failed' });
      throw error;
    }
  },

  logout: () => {
    // Clear cookies
    Cookies.remove('jwt_access_token');
    Cookies.remove('jwt_refresh_token');
    
    // Reset state
    set({ user: null, isLoggedout: true });
    
    // Redirect to home page
    window.location.href = '/';
  },

  checkAuthStatus: async () => {
    try {
      set({ isLoading: true });
      const token = Cookies.get('jwt_access_token');
      
      if (!token) {
        set({ user: null, isLoggedout: true, isLoading: false });
        return false;
      }
      
      // Get stored username if possible
      let storedUsername = '';
      try {
        const decoded = jwtDecode<any>(token);
        storedUsername = decoded.username || '';
      } catch (e) {
        console.log('Could not decode token:', e);
      }
      
      const response = await axios.get('profile/');
      
      // Special handling for @admin user on auth check 
      if (storedUsername === '@admin' || response.data?.username === '@admin') {
        response.data = {
          ...response.data,
          username: '@admin',
          role: 'admin'
        };
      }
      
      set({ user: response.data, isLoggedout: false, isLoading: false });
      console.log("Auth check successful:", response.data);
      return true;
    } catch (error) {
      console.error("Auth check failed:", error);
      
      // Last attempt - check if user is @admin via stored cookie
      try {
        const token = Cookies.get('jwt_access_token');
        if (token) {
          const decoded = jwtDecode<any>(token);
          if (decoded.username === '@admin') {
            set({ 
              user: { username: '@admin', role: 'admin' }, 
              isLoggedout: false, 
              isLoading: false 
            });
            return true;
          }
        }
      } catch (e) {}
      
      set({ user: null, isLoggedout: true, isLoading: false });
      return false;
    }
  },
}));