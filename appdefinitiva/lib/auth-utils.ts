import { supabase } from './supabase';
import * as SecureStore from 'expo-secure-store';

const SESSION_KEY = 'supabase.auth.token';

export const signOutAllUsers = async () => {
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();
    
    // Clear any stored session data
    await SecureStore.deleteItemAsync(SESSION_KEY);
    
    // Clear local storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(SESSION_KEY);
      sessionStorage.clear();
    }
    
    if (error) {
      console.error('Error during sign out:', error);
      throw error;
    }
    
    console.log('User signed out successfully');
    return true;
  } catch (error) {
    console.error('Error in signOutAllUsers:', error);
    return false;
  }
};
