import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { apiUrl } from '../../constants/api';

type LoginScreenProps = {
    onLogin: (token: string, user: any) => void;
};

export default function LoginScreen({ onLogin }: LoginScreenProps) {
    const router = useRouter();
    const [form, setForm] = useState({ email: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

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
            <Text style={styles.title}>Iniciar sesión</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TextInput
                style={styles.input}
                placeholder="Email"
                autoCapitalize="none"
                keyboardType="email-address"
                value={form.email}
                onChangeText={(v) => onChange('email', v)}
            />
            <TextInput
                style={styles.input}
                placeholder="Contraseña"
                secureTextEntry
                value={form.password}
                onChangeText={(v) => onChange('password', v)}
            />
            <TouchableOpacity style={styles.button} onPress={onSubmit} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Ingresando...' : 'Ingresar'}</Text>
            </TouchableOpacity>
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
    input: {
        width: '100%',
        backgroundColor: '#27272a',
        color: '#fff',
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#52525b',
    },
    button: {
        backgroundColor: '#10b981',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 32,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    error: {
        color: '#f43f5e',
        marginBottom: 12,
        fontSize: 14,
    },
});