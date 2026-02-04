import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function UserDetailsScreen() {
  const { user, logout } = useAuth();


  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Error</Text>
        <Text style={styles.info}>No se encontraron los detalles del usuario.</Text>
        <Button title="Cerrar sesión" onPress={logout} color="#f43f5e" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>¡Bienvenid@ {user.nombre}!</Text>
      <Text style={styles.info}>Email: {user.email}</Text>
      <Text style={styles.info}>Teléfono: {user.telefono}</Text>
      <Text style={styles.info}>
        Usuario Desde: {new Date(user.fecha_creacion).toLocaleDateString()}
      </Text>
      <Text style={styles.info}>
        Última Actualización: {new Date(user.fecha_actualizacion).toLocaleDateString()}
      </Text>
      <Button title="Cerrar sesión" onPress={logout} color="#f43f5e" />
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  info: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
});