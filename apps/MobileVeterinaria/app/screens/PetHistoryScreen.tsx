import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../constants/api';
import { AppBackgroundColor } from '../../constants/theme';

type Historial = {
  id: number;
  mascota?: string | number;
  fechaAtencion?: string;
  motivo?: string;
  diagnostico?: string;
  idCita?: number | null;
};

const FALLBACK = 'Sin registro';

const formatValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return FALLBACK;
  const asString = String(value).trim();
  return asString.length === 0 ? FALLBACK : asString;
};

const formatDate = (value?: string | null) => {
  if (!value) return FALLBACK;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? FALLBACK : parsed.toLocaleString();
};

export default function PetHistoryScreen() {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const params = useLocalSearchParams<{ petId?: string; petName?: string }>();

  const petId = Number(params?.petId || 0);
  const petName = typeof params?.petName === 'string' ? params.petName : 'Mascota';

  const [records, setRecords] = useState<Historial[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
      }
      setError(null);

      try {
        if (!token) throw new Error('No encontramos la sesión activa.');
        if (!petId) throw new Error('No pudimos identificar la mascota para consultar el historial.');

        const response = await fetch(apiUrl('/historiales/search'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mascota: petId }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          const message = payload?.message || 'No fue posible obtener el historial médico.';
          throw new Error(message);
        }

        const historiales = Array.isArray(payload.data) ? (payload.data as Historial[]) : [];
        setRecords(historiales);
      } catch (err) {
        setRecords([]);
        setError(err instanceof Error ? err.message : 'No fue posible cargar el historial médico.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, petId]
  );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useFocusEffect(
    useCallback(() => {
      loadHistory({ silent: true });
    }, [loadHistory])
  );

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory({ silent: true });
  };

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#22d3ee" size="large" />
          <Text style={styles.loadingText}>Cargando historial médico...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackTitle}>No pudimos cargar el historial</Text>
          <Text style={styles.feedbackText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => loadHistory()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!records.length) {
      return (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackTitle}>Sin registros</Text>
          <Text style={styles.feedbackText}>
            Esta mascota aún no tiene registros de historial médico.
          </Text>
        </View>
      );
    }

    return (
      <FlatList
        data={records}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22d3ee" />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.calloutRow}>
              <View style={[styles.calloutPill, item.idCita ? styles.calloutWithCita : styles.calloutNoCita]}>
                <Text style={styles.calloutText}>Atendido{item.idCita ? ' con Cita' : ' sin Cita'}</Text>
              </View>
            </View>
            <Text style={styles.cardTitle}>Atención: {formatDate(item.fechaAtencion)}</Text>
            <Text style={styles.label}>Motivo</Text>
            <Text style={styles.value}>{formatValue(item.motivo)}</Text>
            <Text style={styles.label}>Diagnóstico</Text>
            <Text style={styles.value}>{formatValue(item.diagnostico)}</Text>
          </View>
        )}
      />
    );
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.content, { paddingTop: Math.max(insets.top + 12, 24) }]}>
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Historial Médico</Text>
          <Text style={styles.headerSubtitle}>{petName}</Text>
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
  headerCard: {
    backgroundColor: '#0b1220',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
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
  card: {
    backgroundColor: '#0b1220',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  calloutRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  calloutPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  calloutWithCita: {
    backgroundColor: '#22d3ee22',
    borderColor: '#22d3ee',
  },
  calloutNoCita: {
    backgroundColor: '#33415544',
    borderColor: '#475569',
  },
  calloutText: {
    color: '#e2e8f0',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  value: {
    color: '#cbd5f5',
    fontSize: 14,
    lineHeight: 20,
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
