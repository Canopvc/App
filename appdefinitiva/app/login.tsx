import 'react-native-url-polyfill/auto';
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Session } from '@supabase/supabase-js';

export default function AuthScreen() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(undefined); // undefined = não carregado
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');



  // Carrega sessão e escuta mudanças
  useEffect(() => {
    let mounted = true;
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (mounted) setSession(data.session);
    };
    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Evita chamadas protegidas enquanto a sessão não está carregada
  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
if (error) {
  setError(error.message);
  setLoading(false);
  return;
}
if (data.session) {
  await AsyncStorage.setItem('authToken', data.session.access_token);
}
router.replace('/(tabs)'); // Redireciona para a tela principal após login
    } catch (e) {
      setError('Erro inesperado ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    await AsyncStorage.removeItem('authToken');

    setLoading(false);
  };

  // Redireciona automaticamente para a tela principal se já estiver logado
  useEffect(() => {
    if (session) {
      router.replace('/(tabs)');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (session === undefined) {
    // Sessão ainda não carregada
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!session) {
    // Usuário não logado
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Login</Text>
        <TextInput
          placeholder="Email"
          placeholderTextColor={'#5e5e5e'}
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Password"
          placeholderTextColor={'#5e5e5e'}
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Button title={loading ? 'Signing in...' : 'Login'} onPress={handleLogin} disabled={loading} />
        <Pressable onPress={() => router.push('/register')}>
          <Text style={styles.registerText}>Don't have an account? Sign up</Text>
        </Pressable>
        {!!error && <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>}
      </View>
    );
  }

  // Se já está logado, não renderiza nada (redirecionamento em andamento)
  return null;
}

const styles = StyleSheet.create({
  text: {
    fontSize: 13,
    paddingTop: 10,
    paddingLeft: 5,
    color: '#2AACF5',
  },
  container: {
    flex: 1,
    paddingTop: 215,
    paddingHorizontal: 20,
    backgroundColor: '#e7ecf0ff',
    borderRadius: 25,
    borderWidth: 2,
  },
  title: {
    fontSize: 28,
    marginBottom: 20,
    textAlign: 'left',
  },
  input: {
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    color: 'black',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 20,
    marginBottom: 10,
  },
  registerText: {
    color: '#2AACF5',
    marginTop: 18,
    fontSize: 15,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
