import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../constants/api';
import { AppBackgroundColor } from '../../constants/theme';

type Propietario = {
  id: number;
  correo?: string;
};

type Mascota = {
  id: number;
  nombre?: string;
  especie?: string;
  raza?: string;
  edad?: string | number;
};

const FALLBACK = 'Sin registro';

const formatValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return FALLBACK;
  const asString = String(value).trim();
  return asString.length === 0 ? FALLBACK : asString;
};

export default function OwnerPetsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token, user } = useAuth();
  const [ownerId, setOwnerId] = useState<number | null>(null);
  const [pets, setPets] = useState<Mascota[]>([]);
  const [searchName, setSearchName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOwnerByUser = useCallback(async () => {
    if (!token || !user?.email) {
      throw new Error('No encontramos la sesión para obtener el propietario.');
    }

    const response = await fetch(apiUrl('/propietarios/search'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ correo: user.email }),
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      const message = payload?.message || 'No fue posible recuperar al propietario.';
      throw new Error(message);
    }

    const candidatos: Propietario[] = Array.isArray(payload.data)
      ? (payload.data as Propietario[])
      : [];

    const match =
      candidatos.find((item) => (item?.correo || '').toLowerCase() === user.email.toLowerCase()) ||
      candidatos[0] ||
      null;

    if (!match?.id) {
      throw new Error('No encontramos un propietario ligado a este usuario.');
    }

    return match.id;
  }, [token, user?.email]);

  const fetchPets = useCallback(
    async (propId: number, nameFilter?: string) => {
      const nombre = (nameFilter || '').trim();

      const response = await fetch(apiUrl('/mascotas/search'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          propietario: propId,
          ...(nombre ? { nombre } : {}),
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        const message = payload?.message || 'No fue posible obtener las mascotas.';
        throw new Error(message);
      }

      return Array.isArray(payload.data) ? (payload.data as Mascota[]) : [];
    },
    [token]
  );

  const loadPets = useCallback(
    async (options?: { silent?: boolean; forceOwnerId?: number; searchTerm?: string }) => {
      const isSilent = options?.silent ?? false;
      const shouldSearch = typeof options?.searchTerm === 'string';

      if (shouldSearch) {
        setSearching(true);
      } else if (!isSilent) {
        setLoading(true);
      }

      setError(null);

      try {
        const resolvedOwnerId = options?.forceOwnerId ?? ownerId ?? (await fetchOwnerByUser());
        setOwnerId(resolvedOwnerId);

        const mascotas = await fetchPets(resolvedOwnerId, options?.searchTerm ?? '');
        setPets(mascotas);
      } catch (err) {
        setPets([]);
        setError(err instanceof Error ? err.message : 'No fue posible cargar las mascotas.');
      } finally {
        setLoading(false);
        setRefreshing(false);
        setSearching(false);
      }
    },
    [fetchOwnerByUser, fetchPets, ownerId]
  );

  useEffect(() => {
    loadPets();
  }, [loadPets]);

  useFocusEffect(
    useCallback(() => {
      loadPets({ silent: true, searchTerm: searchName });
    }, [loadPets, searchName])
  );

  useEffect(() => {
    if (!ownerId) return;

    const timeout = setTimeout(() => {
      loadPets({ silent: true, forceOwnerId: ownerId, searchTerm: searchName });
    }, 300);

    return () => clearTimeout(timeout);
  }, [ownerId, searchName, loadPets]);

  const onRefresh = () => {
    setRefreshing(true);
    loadPets({ silent: true, searchTerm: searchName });
  };

  const clearSearch = () => {
    setSearchName('');
  };

  const handleSchedulePress = (pet: Mascota) => {
    router.push({
      pathname: '/screens/PetAppointmentScreen',
      params: {
        petId: String(pet.id),
        petName: formatValue(pet.nombre),
      },
    });
  };

  const handleHistoryPress = (pet: Mascota) => {
    router.push({
      pathname: '/screens/PetHistoryScreen',
      params: {
        petId: String(pet.id),
        petName: formatValue(pet.nombre),
      },
    });
  };

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#22d3ee" size="large" />
          <Text style={styles.loadingText}>Cargando mascotas...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackTitle}>No pudimos cargar las mascotas</Text>
          <Text style={styles.feedbackText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadPets()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!pets.length) {
      return (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackTitle}>Sin mascotas registradas</Text>
          <Text style={styles.feedbackText}>
            No encontramos mascotas asociadas con el criterio actual.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={pets}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        onRefresh={onRefresh}
        refreshing={refreshing}
        renderItem={({ item: pet }) => (
          <View style={styles.petCard}>
            <Text style={styles.petName}>{formatValue(pet.nombre)}</Text>
            <Text style={styles.petMeta}>Especie: {formatValue(pet.especie)}</Text>
            <Text style={styles.petMeta}>Raza: {formatValue(pet.raza)}</Text>
            <Text style={styles.petMeta}>Edad: {formatValue(pet.edad)}</Text>
            <View style={styles.petActionsRow}>
              <TouchableOpacity style={styles.petActionPrimary} onPress={() => handleSchedulePress(pet)}>
                <Text style={styles.petActionPrimaryText}>Agendar Cita</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.petActionSecondary} onPress={() => handleHistoryPress(pet)}>
                <Text style={styles.petActionSecondaryText}>Ver Historial</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    );
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.content, { paddingTop: Math.max(insets.top + 12, 24) }]}>
        <View style={styles.searchCard}>
          <Text style={styles.searchLabel}>Buscar por nombre</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={searchName}
              onChangeText={setSearchName}
              placeholder="Ej. Firulais"
              placeholderTextColor="#64748b"
              returnKeyType="search"
            />
            {searching ? (
              <View style={styles.searchingDot}>
                <ActivityIndicator color="#22d3ee" size="small" />
              </View>
            ) : null}
            {searchName.trim().length > 0 ? (
              <TouchableOpacity style={styles.clearIconButton} onPress={clearSearch}>
                <Text style={styles.clearIconText}>×</Text>
              </TouchableOpacity>
            ) : null}
          </View>
          <Text style={styles.inlineHint}>
            {searchName.trim().length > 0
              ? `Filtrando por: ${searchName.trim()}`
              : 'Mostrando todas las mascotas'}
          </Text>
        </View>

        <View style={styles.resultsArea}>{renderBody()}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppBackgroundColor,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 12,
  },
  searchCard: {
    backgroundColor: '#0b1220',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  searchLabel: {
    color: '#cbd5f5',
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  input: {
    backgroundColor: '#111c2e',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    color: '#f8fafc',
    paddingHorizontal: 14,
    paddingVertical: 10,
    paddingRight: 74,
    fontSize: 15,
  },
  clearIconButton: {
    position: 'absolute',
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e293b',
  },
  clearIconText: {
    color: '#cbd5f5',
    fontSize: 16,
    lineHeight: 18,
    fontWeight: '700',
  },
  searchingDot: {
    position: 'absolute',
    right: 42,
  },
  inlineHint: {
    color: '#94a3b8',
    fontSize: 12,
    minHeight: 18,
  },
  resultsArea: {
    flex: 1,
    minHeight: 200,
    backgroundColor: '#111c2e',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 10,
    overflow: 'hidden',
  },
  listContent: {
    gap: 12,
    paddingBottom: 16,
  },
  petCard: {
    backgroundColor: '#0b1220',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  petName: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  petMeta: {
    color: '#cbd5f5',
    fontSize: 14,
  },
  petActionsRow: {
    marginTop: 8,
    flexDirection: 'row',
    gap: 8,
  },
  petActionPrimary: {
    flex: 1,
    backgroundColor: '#22d3ee22',
    borderWidth: 1,
    borderColor: '#22d3ee',
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
  },
  petActionPrimaryText: {
    color: '#22d3ee',
    fontSize: 12,
    fontWeight: '700',
  },
  petActionSecondary: {
    flex: 1,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 999,
    paddingVertical: 8,
    alignItems: 'center',
  },
  petActionSecondaryText: {
    color: '#cbd5f5',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    color: '#cbd5f5',
    fontSize: 15,
  },
  feedbackBox: {
    backgroundColor: '#1e1b4b',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#312e81',
    gap: 10,
  },
  feedbackTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
  },
  feedbackText: {
    color: '#c7d2fe',
    fontSize: 15,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#22d3ee',
  },
  retryText: {
    color: '#22d3ee',
    fontWeight: '600',
  },
});
