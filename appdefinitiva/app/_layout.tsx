import { useEffect, useState, useCallback } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { supabase } from "../lib/supabase";
import { View, ActivityIndicator } from "react-native";

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // User is signed in
        if (segments[0] !== '(tabs)') {
          router.replace('/(tabs)');
        }
      } else {
        // No session: go to login on initial load
        if (segments[0] !== 'login' && segments[0] !== 'register') {
          router.replace('/login');
        }
      }
      setIsLoading(false);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        router.replace('/(tabs)');
      } else if (event === 'SIGNED_OUT') {
        router.replace('/login');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <Slot />;
}
