import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { AppBackgroundColor } from '@/constants/theme';
import { AuthContext, User } from '../context/AuthContext';
import LoginScreen from './screens/LoginScreen';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('authUser');

      if (storedToken) setToken(storedToken);
      if (storedUser) setUser(JSON.parse(storedUser));

      setChecking(false);
    };
    
    restoreSession();
  }, []);

  const login = (t: string, u: User) => {
    setToken(t);
    setUser(u);
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['authToken', 'authUser']);
    setToken(null);
    setUser(null);
  };

  if (checking) {
    return (
      <View style={[styles.container, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!token) {
    return <LoginScreen onLogin={login} />;
  }

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="screens/UserDetailsScreen" options={{ title: 'Detalles del Usuario' }} />
          <Stack.Screen
            name="screens/OwnerProfileScreen"
            options={{
              title: 'Propietario',
            }}
          />
          <Stack.Screen name="screens/OwnerPetsScreen" options={{ title: 'Mis mascotas' }} />
          <Stack.Screen name="screens/PetAppointmentScreen" options={{ title: 'Crear cita' }} />
          <Stack.Screen name="screens/PetHistoryScreen" options={{ title: 'Historial Médico' }} />
          <Stack.Screen name="screens/EditOwnerScreen" options={{ title: 'Editar propietario' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AuthContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppBackgroundColor,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
});
