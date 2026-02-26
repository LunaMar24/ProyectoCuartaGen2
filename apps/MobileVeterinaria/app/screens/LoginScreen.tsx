import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { apiUrl } from '../../constants/api';
import { AppBackgroundColor } from '../../constants/theme';

type LoginScreenProps = {
    onLogin: (token: string, user: any) => void;
};

export default function LoginScreen({ onLogin }: LoginScreenProps) {
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const onChange = (name: string, value: string) => {
        setForm((f) => ({ ...f, [name]: value }));
    };

    const onSubmit = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch(apiUrl('/auth/login'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            const data = await res.json();
            if (data?.success && data.data.token) {
                const rawUser = data?.data?.user || {};
                const tipoUsuario = rawUser.tipo_Usuario ?? rawUser.tipo_usuario ?? rawUser.tipoUsuario;
                if (String(tipoUsuario || '').toUpperCase() !== 'C') {
                    setError('Usuario no valido');
                    return;
                }
                const { tipo_usuario, tipoUsuario: tipoUsuarioLegacy, ...restUser } = rawUser;
                const normalizedUser = { ...restUser, tipo_Usuario: tipoUsuario };
                await AsyncStorage.setItem('authToken', data.data.token);
                await AsyncStorage.setItem('authUser', JSON.stringify(normalizedUser));
                onLogin(data.data.token, normalizedUser);
                router.replace('/screens/UserDetailsScreen');
            } else {
                setError('Usuario no valido');
            }
        } catch (e) {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            <View style={styles.brand}>
                <Text style={styles.brandTitle}>VETERINARIA</Text>
                <Text style={styles.brandSubtitle}>LunaMar</Text>
            </View>
            <View style={styles.form}>
                <Text style={styles.title}>Iniciar sesión</Text>
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    value={form.email}
                    onChangeText={(v) => onChange('email', v)}
                />
                <View style={styles.passwordFieldWrap}>
                    <TextInput
                        style={[styles.input, styles.inputWithToggle]}
                        placeholder="Contraseña"
                        placeholderTextColor="#94a3b8"
                        secureTextEntry={!showPassword}
                        value={form.password}
                        onChangeText={(v) => onChange('password', v)}
                    />
                    <TouchableOpacity style={styles.toggleButton} onPress={() => setShowPassword((prev) => !prev)}>
                        <Feather name={showPassword ? 'eye' : 'eye-off'} size={18} color="#94a3b8" />
                    </TouchableOpacity>
                </View>
                <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
                    <Text style={styles.buttonText}>{loading ? 'Ingresando...' : 'Ingresar'}</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: AppBackgroundColor,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24,
    },
    form: {
        width: '100%',
        backgroundColor: '#0f172a',
        borderRadius: 28,
        borderWidth: 1,
        borderColor: '#1f2937',
        padding: 24,
        gap: 12,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 12 },
        elevation: 10,
    },
    brand: {
        position: 'absolute',
        top: 168,
        left: 24,
        right: 24,
        alignItems: 'center',
    },
    brandTitle: {
        color: '#22d3ee',
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: 4,
    },
    brandSubtitle: {
        color: '#22d3ee',
        fontSize: 18,
        marginTop: 4,
        letterSpacing: 2,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#f8fafc',
        marginBottom: 4,
    },
    input: {
        width: '100%',
        backgroundColor: '#111c2e',
        color: '#f8fafc',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#1e293b',
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
    button: {
        backgroundColor: '#22d3ee',
        borderRadius: 999,
        paddingVertical: 14,
        paddingHorizontal: 32,
        alignItems: 'center',
        marginTop: 6,
    },
    buttonText: {
        color: '#02101b',
        fontWeight: '600',
        fontSize: 16,
    },
    error: {
        color: '#f87171',
        marginBottom: 4,
        fontSize: 14,
    },
});