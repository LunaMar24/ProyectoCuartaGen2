import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { AppBackgroundColor } from '../../constants/theme';

export default function UserDetailsScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const formatTipoUsuario = (value?: string) => {
    if (!value) return '-';
    const normalized = String(value).trim();
    if (normalized.toUpperCase() === 'A') return 'Administrador';
    if (normalized.toUpperCase() === 'C') return 'Cliente';
    return normalized;
  };

  const getTipoColor = (value?: string) => {
    const normalized = String(value || '').trim().toUpperCase();
    if (normalized === 'A') return '#38bdf8';
    if (normalized === 'C') return '#34d399';
    return '#a3a3a3';
  };

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Error</Text>
        <Text style={styles.info}>No se encontraron los detalles del usuario.</Text>
        <TouchableOpacity style={[styles.buttonBase, styles.dangerButton]} onPress={logout}>
          <Text style={styles.buttonLabel}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>¡Bienvenid@ {user.nombre}!</Text>
      <Text style={styles.info}>Email: {user.email}</Text>
      <Text style={styles.info}>Teléfono: {user.telefono}</Text>
      <View style={styles.row}>
        <Text style={styles.info}>Tipo:</Text>
        <View style={[styles.badge, { borderColor: getTipoColor(user.tipo_Usuario) }]}
        >
          <View style={[styles.dot, { backgroundColor: getTipoColor(user.tipo_Usuario) }]} />
          <Text style={styles.badgeText}>{formatTipoUsuario(user.tipo_Usuario)}</Text>
        </View>
      </View>
      <Text style={styles.info}>
        Usuario Desde: {new Date(user.fecha_creacion).toLocaleDateString()}
      </Text>
      <Text style={styles.info}>
        Última Actualización: {new Date(user.fecha_actualizacion).toLocaleDateString()}
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.buttonBase, styles.primaryButton]}
          onPress={() => router.push('/screens/OwnerProfileScreen')}
        >
          <Text style={styles.buttonLabel}>Información del propietario</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonBase, styles.secondaryButton]}
          onPress={() => router.push('/screens/OwnerPetsScreen')}
        >
          <Text style={styles.buttonLabel}>Mascotas</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.buttonBase, styles.dangerButton]} onPress={logout}>
          <Text style={styles.buttonLabel}>Cerrar sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}


const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: AppBackgroundColor,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 999,
    backgroundColor: '#0f172a',
  },
  badgeText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 999,
    marginRight: 6,
  },
  actions: {
    width: '100%',
    marginTop: 16,
    gap: 12,
  },
  buttonBase: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#22d3ee',
  },
  secondaryButton: {
    backgroundColor: '#5bc478',
  },
  dangerButton: {
    backgroundColor: '#f43f5e',
  },
  buttonLabel: {
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 16,
  },
});