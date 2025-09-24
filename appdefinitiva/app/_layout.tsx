import { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { supabase } from "../lib/supabase";
import { View, ActivityIndicator, useColorScheme } from "react-native";
import { Provider as PaperProvider, useTheme } from 'react-native-paper';
import { getAppTheme } from "../lib/theme";

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();
  const scheme = useColorScheme();

  useEffect(() => {
    // Check initial auth state
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // User is signed in
        // Allow tabs and workout detail routes
        if (segments[0] !== '(tabs)' && segments[0] !== 'workout') {
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
        // Allow tabs and workout detail routes
        if (segments[0] !== '(tabs)' && segments[0] !== 'workout') {
          router.replace('/(tabs)');
        }
      } else if (event === 'SIGNED_OUT') {
        router.replace('/login');
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, [segments]);

  const theme = getAppTheme(scheme);

  if (isLoading) {
    return (
      <PaperProvider theme={theme}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
          <ActivityIndicator size="large" />
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <Slot />
    </PaperProvider>
  );
}
