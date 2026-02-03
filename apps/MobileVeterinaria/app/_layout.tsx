import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, ActivityIndicator, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/use-color-scheme';
import UserDetailsScreen from './screens/UserDetailsScreen';
// import { useNavigation } from '@react-navigation/native';
import { useRouter } from 'expo-router';

export const unstable_settings = {
  anchor: '(tabs)',
};

type LoginScreenProps = {
  onLogin: (token: string, user: any) => void;
};

function LoginScreen({ onLogin }: LoginScreenProps) {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (name: string, value: string) => {
    setForm((f) => ({ ...f, [name]: value }));
  };

  const onSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('http://10.0.2.2:3000/api/v1/auth/login', { //Conexion a API Localhost
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data?.success && data.data.token) {
        await AsyncStorage.setItem('authToken', data.data.token);
        onLogin(data.data.token, data.data.user);
        setError('Credenciales correctas');
        //router.push({ pathname: '/screens/UserDetailsScreen', params: { user: data.data.user } });
      } else {
        setError(data?.message || 'Credenciales incorrectas');
      }
    } catch (e) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Iniciar sesión</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TextInput
        style={styles.input}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={form.email}
        onChangeText={(v) => onChange('email', v)}
      />
      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        secureTextEntry
        value={form.password}
        onChangeText={(v) => onChange('password', v)}
      />
      <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Ingresando...' : 'Ingresar'}</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('authToken').then((t) => {
      setToken(t);
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!token) {
    return <LoginScreen onLogin={(t, u) => { setToken(t); setUser(u); }} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        {/* <Stack.Screen name="screens/UserDetailsScreen" options={{ title: 'Detalles del Usuario' }} /> */}
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181b',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    backgroundColor: '#27272a',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#52525b',
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  error: {
    color: '#f43f5e',
    marginBottom: 12,
    fontSize: 14,
  },
  info: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
});
