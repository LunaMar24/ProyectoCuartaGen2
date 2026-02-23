import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
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

type FormState = {
  nombre: string;
  apellidos: string;
  cedula: string;
  telefono: string;
  correo: string;
};

const FALLBACK = 'Sin registro';

const formatDate = (value?: string | null) => {
  if (!value) return FALLBACK;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? FALLBACK : parsed.toLocaleDateString();
};

const initialForm: FormState = {
  nombre: '',
  apellidos: '',
  cedula: '',
  telefono: '',
  correo: '',
};

export default function EditOwnerScreen() {
  const router = useRouter();
  const { token, user } = useAuth();
  const [propietario, setPropietario] = useState<Propietario | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    if (!propietario) return false;
    return Object.values(form).every((value) => value.trim().length > 0);
  }, [form, propietario]);

  const syncPropietario = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!token || !user?.email) {
        setError('No encontramos la sesión para editar al propietario.');
        setPropietario(null);
        setLoading(false);
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
          const message = payload?.message || 'No fue posible obtener la información.';
          throw new Error(message);
        }

        const candidatos = Array.isArray(payload.data) ? payload.data : [];
        const match =
          candidatos.find((item: Propietario) => {
            const correo = (item?.correo || '').toLowerCase();
            return correo === user.email.toLowerCase();
          }) || candidatos[0] || null;

        setPropietario(match ?? null);
        setForm({
          nombre: match?.nombre ?? '',
          apellidos: match?.apellidos ?? '',
          cedula: match?.cedula ?? '',
          telefono: match?.telefono ?? '',
          correo: match?.correo ?? user.email ?? '',
        });
        setError(match ? null : 'No encontramos un propietario ligado a este correo.');
      } catch (err) {
        setPropietario(null);
        setError(err instanceof Error ? err.message : 'Ocurrió un error inesperado.');
      } finally {
        setLoading(false);
      }
    },
    [token, user?.email]
  );

  useEffect(() => {
    syncPropietario();
  }, [syncPropietario]);

  const handleChange = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!token || !propietario) return;

    if (!canSubmit) {
      setError('Completa todos los campos obligatorios.');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const payloadBody = {
        nombre: form.nombre.trim(),
        apellidos: form.apellidos.trim(),
        cedula: form.cedula.trim(),
        telefono: form.telefono.trim(),
        correo: form.correo.trim(),
        usuarioId: propietario.usuarioId,
      };

      const response = await fetch(apiUrl(`/propietarios/${propietario.id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payloadBody),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        const message = payload?.message || 'No fue posible actualizar los datos.';
        throw new Error(message);
      }

      const updated: Propietario | null = payload.data ?? null;
      if (updated) {
        setPropietario(updated);
        setForm({
          nombre: updated.nombre ?? '',
          apellidos: updated.apellidos ?? '',
          cedula: updated.cedula ?? '',
          telefono: updated.telefono ?? '',
          correo: updated.correo ?? '',
        });
      }

      Alert.alert('Datos guardados', 'Actualizamos tu información correctamente.', [
        { text: 'Listo', onPress: () => router.back() },
      ]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Ocurrió un error inesperado.';
      setError(message);
      Alert.alert('No pudimos guardar', message);
    } finally {
      setSaving(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#22d3ee" size="large" />
          <Text style={styles.loadingText}>Cargando datos del propietario…</Text>
        </View>
      );
    }

    if (error && !propietario) {
      return (
        <View style={styles.feedbackBox}>
          <Text style={styles.feedbackTitle}>No pudimos cargar la información</Text>
          <Text style={styles.feedbackText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => syncPropietario()}>
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
            Todavía no encontramos un propietario para esta cuenta. Solicita soporte a la veterinaria.
          </Text>
        </View>
      );
    }

    return (
      <>
        <View style={styles.heroCard}>
          <Text style={styles.heroEyebrow}>Editar datos del propietario</Text>
          <Text style={styles.heroTitle}>{propietario.nombre || FALLBACK}</Text>
          <Text style={styles.heroSubtitle}>{propietario.correo || user?.email || FALLBACK}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Información principal</Text>
          <Text style={styles.cardParagraph}>
            Actualiza tus datos de contacto. Las fechas de auditoría permanecen de solo lectura.
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nombre</Text>
            <TextInput
              style={styles.input}
              value={form.nombre}
              onChangeText={(value) => handleChange('nombre', value)}
              placeholder="Nombre"
              placeholderTextColor="#94a3b8"
              editable={!saving}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Apellidos</Text>
            <TextInput
              style={styles.input}
              value={form.apellidos}
              onChangeText={(value) => handleChange('apellidos', value)}
              placeholder="Apellidos"
              placeholderTextColor="#94a3b8"
              editable={!saving}
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Cédula</Text>
            <TextInput
              style={styles.input}
              value={form.cedula}
              onChangeText={(value) => handleChange('cedula', value)}
              placeholder="Número de cédula"
              placeholderTextColor="#94a3b8"
              editable={!saving}
              autoCapitalize="characters"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Teléfono</Text>
            <TextInput
              style={styles.input}
              value={form.telefono}
              onChangeText={(value) => handleChange('telefono', value)}
              placeholder="Teléfono"
              placeholderTextColor="#94a3b8"
              editable={!saving}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={form.correo}
              onChangeText={(value) => handleChange('correo', value)}
              placeholder="Correo"
              placeholderTextColor="#94a3b8"
              editable={!saving}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          {error && propietario ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, styles.primaryButton, (!canSubmit || saving) && styles.disabledButton]}
            onPress={handleSubmit}
            disabled={!canSubmit || saving}
          >
            <Text style={[styles.buttonText, styles.buttonTextDark]}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.secondaryButton, saving && styles.disabledButton]}
            onPress={() => router.back()}
            disabled={saving}
          >
            <Text style={[styles.buttonText, styles.buttonTextLight]}>Cancelar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inlineCards}>
          <View style={styles.miniCard}>
            <Text style={styles.miniLabel}>Creado</Text>
            <Text style={styles.miniValue}>{formatDate(user?.fecha_creacion)}</Text>
            <Text style={styles.miniHint}>Fecha solo lectura</Text>
          </View>
          <View style={styles.miniCard}>
            <Text style={styles.miniLabel}>Actualizado</Text>
            <Text style={styles.miniValue}>{formatDate(user?.fecha_actualizacion)}</Text>
            <Text style={styles.miniHint}>Última auditoría</Text>
          </View>
        </View>
      </>
    );
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {renderContent()}
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
    gap: 6,
  },
  heroEyebrow: {
    color: '#38bdf8',
    textTransform: 'uppercase',
    fontSize: 12,
    letterSpacing: 1,
  },
  heroTitle: {
    color: '#f8fafc',
    fontSize: 26,
    fontWeight: '700',
  },
  heroSubtitle: {
    color: '#94a3b8',
    fontSize: 15,
    marginTop: 4,
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
    fontSize: 15,
    lineHeight: 20,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  input: {
    backgroundColor: '#111c2e',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f8fafc',
    fontSize: 16,
  },
  errorText: {
    color: '#f87171',
    fontSize: 14,
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#22d3ee',
  },
  secondaryButton: {
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#334155',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 16,
  },
  buttonTextDark: {
    color: '#02101b',
  },
  buttonTextLight: {
    color: '#f8fafc',
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
    gap: 4,
  },
  miniLabel: {
    color: '#94a3b8',
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  miniValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
  },
  miniHint: {
    color: '#64748b',
    fontSize: 12,
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
});
