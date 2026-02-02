import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type UserDetailsScreenProps = {
  route: {
    params: {
      user: {
        id: string;
        nombre: string;
        email: string;
        telefono: string;
        fecha_creacion: string;
        fecha_actualizacion: string;
      };
    };
  };
};

export default function UserDetailsScreen({ route }: UserDetailsScreenProps) {
  const { user } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Bienvenid@ {user.nombre}!</Text>
      <Text style={styles.info}>Email: {user.email}</Text>
      <Text style={styles.info}>Teléfono: {user.telefono}</Text>
      <Text style={styles.info}>Usuario Desde: {new Date(user.fecha_creacion).toLocaleDateString()}</Text>
      <Text style={styles.info}>Última Actualización: {new Date(user.fecha_actualizacion).toLocaleDateString()}</Text>
    </View>
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
  info: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 8,
  },
});