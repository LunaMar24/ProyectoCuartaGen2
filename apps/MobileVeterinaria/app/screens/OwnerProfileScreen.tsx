import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
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
  nombre: string;
  apellidos: string;
  cedula: string;
  telefono: string;
  correo: string;
  usuarioId?: number;
};

type InfoRowProps = {
  label: string;
  value?: string | number | null;
};

const FALLBACK = 'Sin registro';

const formatDate = (value?: string | null) => {
  if (!value) return FALLBACK;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? FALLBACK : parsed.toLocaleDateString();
};

const formatValue = (value?: string | number | null) => {
  if (value === null || value === undefined) return FALLBACK;
  const asString = String(value).trim();
  return asString.length === 0 ? FALLBACK : asString;
};

const InfoRow = ({ label, value }: InfoRowProps) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{formatValue(value)}</Text>
  </View>
);

export default function OwnerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token, user } = useAuth();
  const [propietario, setPropietario] = useState<Propietario | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [petsCount, setPetsCount] = useState<number | null>(null);
  const [petsLoading, setPetsLoading] = useState(false);
  const [petsError, setPetsError] = useState<string | null>(null);

  const handleEditPress = useCallback(() => {
    router.push('/screens/EditOwnerScreen');
  }, [router]);

  const fetchPetCount = useCallback(
    async (propId?: number | null) => {
      if (!token || !propId) {
        setPetsCount(null);
        setPetsError(null);
        setPetsLoading(false);
        return;
      }

      setPetsLoading(true);
      setPetsError(null);

      try {
        const response = await fetch(apiUrl('/mascotas/search'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ propietario: propId }),
        });

        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.success) {
          const message = payload?.message || 'No fue posible obtener las mascotas.';
          throw new Error(message);
        }

        const mascotas = Array.isArray(payload.data) ? payload.data : [];
        setPetsCount(mascotas.length);
      } catch (err) {
        setPetsCount(null);
        setPetsError(err instanceof Error ? err.message : 'No pudimos contar las mascotas.');
      } finally {
        setPetsLoading(false);
      }
    },
    [token]
  );

  const fetchPropietario = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!token || !user?.email) {
        setError('No encontramos la sesión para obtener el propietario.');
        setPropietario(null);
        setLoading(false);
        setRefreshing(false);
        setPetsCount(null);
        return;
      }

      if (!options?.silent) {
        setLoading(true);
      }

      try {
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
        const match = candidatos.find((item: Propietario) => {
          const correo = (item?.correo || '').toLowerCase();
          return correo === user.email.toLowerCase();
        }) || candidatos[0] || null;

        setPropietario(match ?? null);
        setError(match ? null : 'No encontramos un propietario ligado a este correo.');
        await fetchPetCount(match?.id ?? null);
      } catch (err) {
        setPropietario(null);
        setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
        setPetsCount(null);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [token, user?.email, fetchPetCount]
  );

  useEffect(() => {
    fetchPropietario();
  }, [fetchPropietario]);

  useFocusEffect(
    useCallback(() => {
      fetchPropietario({ silent: true });
    }, [fetchPropietario])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchPropietario({ silent: true });
  };

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#22d3ee" size="large" />
          <Text style={styles.loadingText}>Sincronizando con la veterinaria...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackTitle}>No pudimos cargar la información</Text>
          <Text style={styles.feedbackText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchPropietario()}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!propietario) {
      return (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackTitle}>Sin propietario vinculado</Text>
          <Text style={styles.feedbackText}>
            Aún no existe un registro de propietario relacionado con este correo. Inténtalo más tarde o
            comunícate con la veterinaria.
          </Text>
        </View>
      );
    }

    const nombreCompleto = `${propietario.nombre} ${propietario.apellidos}`.trim();

    return (
      <>
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Propietario asignado</Text>
          <Text style={styles.heroTitle}>{formatValue(nombreCompleto)}</Text>
          <Text style={styles.heroSubtitle}>{user?.email}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contacto directo</Text>
          <InfoRow label="Correo" value={propietario.correo || user?.email} />
          <InfoRow label="Teléfono" value={propietario.telefono} />
          <InfoRow label="Cédula" value={propietario.cedula} />
          <TouchableOpacity style={styles.editButton} onPress={handleEditPress}>
            <Text style={styles.editButtonText}>Editar datos</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mascotas registradas</Text>
          <Text style={styles.cardParagraph}>
            Número total de mascotas asociadas a este propietario dentro de la clínica.
          </Text>
          <View style={styles.petCountBox}>
            {petsLoading ? (
              <ActivityIndicator color="#22d3ee" />
            ) : (
              <>
                <Text style={styles.petCountValue}>
                  {petsCount === null ? FALLBACK : petsCount}
                </Text>
                <Text style={styles.petCountHint}>Sincronizado con veterinaria</Text>
              </>
            )}
          </View>
          {petsError ? <Text style={styles.petCountError}>{petsError}</Text> : null}
        </View>

        <View style={styles.inlineCards}>
          <View style={styles.miniCard}>
            <Text style={styles.miniLabel}>Creado</Text>
            <Text style={styles.miniValue}>{formatDate(user?.fecha_creacion)}</Text>
            <Text style={styles.miniHint}>Fecha del usuario</Text>
          </View>
          <View style={styles.miniCard}>
            <Text style={styles.miniLabel}>Actualizado</Text>
            <Text style={styles.miniValue}>{formatDate(user?.fecha_actualizacion)}</Text>
            <Text style={styles.miniHint}>Último cambio</Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 12, 24) }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#22d3ee" />}
    >
      {renderBody()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppBackgroundColor,
  },
  content: {
    padding: 24,
    gap: 16,
  },
  heroCard: {
    padding: 24,
    borderRadius: 24,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  heroEyebrow: {
    color: '#38bdf8',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: '#94a3b8',
    marginTop: 8,
    fontSize: 16,
  },
  card: {
    backgroundColor: '#0b1220',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 12,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '600',
  },
  cardParagraph: {
    color: '#cbd5f5',
    fontSize: 14,
    lineHeight: 20,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  infoLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  infoValue: {
    color: '#f1f5f9',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
  inlineCards: {
    flexDirection: 'row',
    gap: 12,
  },
  miniCard: {
    flex: 1,
    backgroundColor: '#111c2e',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  miniLabel: {
    color: '#94a3b8',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  miniValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 4,
  },
  miniHint: {
    color: '#64748b',
    marginTop: 8,
    fontSize: 12,
  },
  petCountBox: {
    marginTop: 8,
    backgroundColor: '#111c2e',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 18,
    alignItems: 'center',
    gap: 6,
  },
  petCountValue: {
    color: '#f8fafc',
    fontSize: 32,
    fontWeight: '700',
  },
  petCountHint: {
    color: '#94a3b8',
    fontSize: 14,
  },
  petCountError: {
    color: '#f87171',
    fontSize: 13,
    marginTop: 6,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  loadingText: {
    color: '#cbd5f5',
    fontSize: 15,
  },
  feedbackBox: {
    backgroundColor: '#1e1b4b',
    borderRadius: 20,
    padding: 24,
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
  editButton: {
    marginTop: 8,
    backgroundColor: '#22d3ee22',
    borderWidth: 1,
    borderColor: '#22d3ee',
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
  },
  editButtonText: {
    color: '#22d3ee',
    fontWeight: '600',
    fontSize: 15,
  },
});
