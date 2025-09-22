import 'react-native-url-polyfill/auto';
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    setError('');
    setIsLoading(true);
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      
      if (error) throw error;
      
      // The onAuthStateChange listener in _layout.tsx will handle the navigation
    } catch (error: any) {
      console.error('Erro no login:', error);
      setError(error.message || 'Erro ao fazer login. Verifique suas credenciais.');
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    router.push('/register');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        placeholder="Email"
        placeholderTextColor="#5e5e5e"
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#5e5e5e"
        style={styles.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button 
        title={isLoading ? 'Entrando...' : 'Entrar'} 
        onPress={handleLogin} 
        disabled={isLoading} 
      />
      <Pressable onPress={handleRegister} style={{ marginTop: 16 }}>
        <Text style={styles.registerText}>Não tem uma conta? Cadastre-se</Text>
      </Pressable>
      {!!error && <Text style={{ color: 'red', marginTop: 10 }}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
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
  registerText: {
    color: '#2AACF5',
    marginTop: 18,
    fontSize: 15,
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
});
