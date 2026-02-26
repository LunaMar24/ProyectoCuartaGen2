import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { apiUrl } from '../../constants/api';
import { AppBackgroundColor } from '../../constants/theme';

const validateNewPassword = (newPassword: string) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
  if (newPassword.length < 8 || newPassword.length > 128) {
    return 'La contraseña debe tener entre 8 y 128 caracteres';
  }
  if (!passwordRegex.test(newPassword)) {
    return 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial';
  }
  return '';
};

export default function ChangePasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { token } = useAuth();

  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [ok, setOk] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const onChange = (name: 'currentPassword' | 'newPassword' | 'confirmPassword', value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async () => {
    setError('');
    setOk('');

    if (!token) {
      setError('No hay sesión activa.');
      return;
    }

    if (!form.currentPassword.trim()) {
      setError('Debes ingresar la contraseña actual.');
      return;
    }

    const passwordValidationMessage = validateNewPassword(form.newPassword);
    if (passwordValidationMessage) {
      setError(passwordValidationMessage);
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('La confirmación de contraseña no coincide.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(apiUrl('/auth/profile'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: form.currentPassword,
          newPassword: form.newPassword,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        const apiErrors = Array.isArray(payload?.errors) ? payload.errors : [];
        const apiMessage = apiErrors[0]?.msg || payload?.message || 'No se pudo cambiar la contraseña.';
        setError(apiMessage);
        return;
      }

      setOk('Contraseña actualizada correctamente.');
      setTimeout(() => {
        router.back();
      }, 700);
    } catch {
      setError('Error de conexión al cambiar contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Math.max(insets.top, 12)}
    >
      <ScrollView
        style={styles.scroll}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 12, 24) }]}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Cambiar contraseña</Text>
          <Text style={styles.hint}>Ingresa tu contraseña actual y luego define la nueva contraseña.</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {ok ? <Text style={styles.ok}>{ok}</Text> : null}

          <View style={styles.passwordFieldWrap}>
            <TextInput
              style={[styles.input, styles.inputWithToggle]}
              placeholder="Contraseña actual"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showCurrentPassword}
              value={form.currentPassword}
              onChangeText={(value) => onChange('currentPassword', value)}
            />
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowCurrentPassword((prev) => !prev)}
            >
              <Feather name={showCurrentPassword ? 'eye' : 'eye-off'} size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordFieldWrap}>
            <TextInput
              style={[styles.input, styles.inputWithToggle]}
              placeholder="Nueva contraseña"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showNewPassword}
              value={form.newPassword}
              onChangeText={(value) => onChange('newPassword', value)}
            />
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowNewPassword((prev) => !prev)}
            >
              <Feather name={showNewPassword ? 'eye' : 'eye-off'} size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordFieldWrap}>
            <TextInput
              style={[styles.input, styles.inputWithToggle]}
              placeholder="Confirmar nueva contraseña"
              placeholderTextColor="#94a3b8"
              secureTextEntry={!showConfirmPassword}
              value={form.confirmPassword}
              onChangeText={(value) => onChange('confirmPassword', value)}
            />
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={() => setShowConfirmPassword((prev) => !prev)}
            >
              <Feather name={showConfirmPassword ? 'eye' : 'eye-off'} size={18} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={[styles.buttonBase, styles.primaryButton]} onPress={onSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#f8fafc" /> : <Text style={styles.buttonLabel}>Guardar nueva contraseña</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonBase, styles.secondaryButton]}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.buttonLabel}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppBackgroundColor,
  },
  scroll: {
    flex: 1,
    backgroundColor: AppBackgroundColor,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: '#0b1220',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    gap: 12,
  },
  title: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
  },
  hint: {
    color: '#94a3b8',
    fontSize: 13,
  },
  input: {
    width: '100%',
    backgroundColor: '#111c2e',
    color: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
  },
  passwordFieldWrap: {
    position: 'relative',
  },
  inputWithToggle: {
    paddingRight: 52,
  },
  toggleButton: {
    position: 'absolute',
    right: 10,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  buttonBase: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#0e7490',
    borderWidth: 1,
    borderColor: '#22d3ee',
  },
  secondaryButton: {
    backgroundColor: '#334155',
  },
  buttonLabel: {
    color: '#f8fafc',
    fontWeight: '600',
    fontSize: 15,
  },
  error: {
    color: '#fda4af',
    fontSize: 13,
  },
  ok: {
    color: '#86efac',
    fontSize: 13,
  },
});
