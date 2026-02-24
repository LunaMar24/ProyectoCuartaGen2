import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiUrl } from '../../constants/api';
import { AppBackgroundColor } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_TIMEOUT_MINUTES = 5;
const DEFAULT_DURATION_MINUTES = 30;
const WORKING_HOUR_START = 9;
const WORKING_HOUR_END = 17;

type ReservaEstado = {
  idReserva: number;
  mascotaId: number;
  usuarioId: number;
  fechaInicio: string;
  fechaFin: string;
  fechaExpiracion: string;
  segundosRestantes: number;
  activa: boolean;
  debeReiniciarFlujo: boolean;
};

const formatSecondsAsMMSS = (seconds: number) => {
  const safe = Math.max(Number(seconds || 0), 0);
  const mm = String(Math.floor(safe / 60)).padStart(2, '0');
  const ss = String(safe % 60).padStart(2, '0');
  return `${mm}:${ss}`;
};

const toDateInputValue = (dateInput: Date | string) => {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const formatHourOptionLabel = (hour24: number) => {
  const period = hour24 >= 12 ? 'pm' : 'am';
  const hour12 = hour24 % 12 || 12;
  return `${hour12} ${period}`;
};

const buildSlots = (intervalMinutes: number, durationMinutes: number) => {
  const slots: Array<{ hour: number; minute: number }> = [];
  const startTotal = WORKING_HOUR_START * 60;
  const endTotal = WORKING_HOUR_END * 60;
  const interval = Math.max(Number(intervalMinutes) || 1, 1);
  const duration = Math.max(Number(durationMinutes) || interval, 1);
  const latestStartByDuration = endTotal - duration;
  const latestStartByBusinessRule = endTotal - DEFAULT_DURATION_MINUTES;
  const latestStart = Math.min(latestStartByDuration, latestStartByBusinessRule);

  for (let current = startTotal; current <= latestStart; current += interval) {
    slots.push({ hour: Math.floor(current / 60), minute: current % 60 });
  }

  return slots;
};

const buildIsoRange = (dateText: string, hourText: string, minuteText: string, durationMinutes: number) => {
  const [year, month, day] = dateText.split('-').map(Number);
  const hour = Number(hourText);
  const minute = Number(minuteText);

  const startUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const endUtcMs = startUtcMs + durationMinutes * 60 * 1000;

  return {
    fechaInicio: new Date(startUtcMs).toISOString(),
    fechaFin: new Date(endUtcMs).toISOString(),
    startMinutes: hour * 60 + minute,
    endMinutes: hour * 60 + minute + durationMinutes,
  };
};

export default function PetAppointmentScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { token } = useAuth();
  const params = useLocalSearchParams<{ petId?: string; petName?: string }>();

  const petId = Number(params?.petId || 0);
  const petName = typeof params?.petName === 'string' ? params.petName : 'Mascota';

  const now = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + DEFAULT_DURATION_MINUTES);
    d.setSeconds(0);
    d.setMilliseconds(0);
    const roundedMinute = Math.floor(d.getMinutes() / DEFAULT_DURATION_MINUTES) * DEFAULT_DURATION_MINUTES;
    d.setMinutes(roundedMinute);
    return d;
  }, []);

  const [fechaInicioDate, setFechaInicioDate] = useState(toDateInputValue(now));
  const [horaInicio, setHoraInicio] = useState(String(Math.max(WORKING_HOUR_START, Math.min(now.getHours(), WORKING_HOUR_END - 1))));
  const [minutoInicio, setMinutoInicio] = useState(String(now.getMinutes()).padStart(2, '0'));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [notas, setNotas] = useState('');

  const [reserva, setReserva] = useState<ReservaEstado | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [reserving, setReserving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const selectedDate = useMemo(() => {
    const [year, month, day] = fechaInicioDate.split('-').map(Number);
    const date = new Date();
    date.setFullYear(year || now.getFullYear(), (month || now.getMonth() + 1) - 1, day || now.getDate());
    date.setHours(0, 0, 0, 0);
    return date;
  }, [fechaInicioDate, now]);

  const allowedSlots = useMemo(
    () => buildSlots(DEFAULT_DURATION_MINUTES, DEFAULT_DURATION_MINUTES),
    []
  );

  const hourOptions = useMemo(() => {
    const uniq = [...new Set(allowedSlots.map((slot) => slot.hour))];
    return uniq.map((hour) => ({ value: String(hour), label: formatHourOptionLabel(hour) }));
  }, [allowedSlots]);

  const minuteOptions = useMemo(() => {
    const selectedHour = Number(horaInicio);
    const uniq = [
      ...new Set(
        allowedSlots
          .filter((slot) => slot.hour === selectedHour)
          .map((slot) => String(slot.minute).padStart(2, '0'))
      ),
    ];
    return uniq;
  }, [allowedSlots, horaInicio]);

  const clearPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  useEffect(() => {
    return () => clearPolling();
  }, []);

  useEffect(() => {
    if (hourOptions.length === 0) return;
    const hourExists = hourOptions.some((option) => option.value === String(horaInicio));
    const nextHour = hourExists ? String(horaInicio) : hourOptions[0].value;
    const minuteExists = minuteOptions.includes(String(minutoInicio).padStart(2, '0'));
    const nextMinute = minuteExists ? String(minutoInicio).padStart(2, '0') : (minuteOptions[0] || '00');

    if (String(horaInicio) !== nextHour) {
      setHoraInicio(nextHour);
    }
    if (String(minutoInicio).padStart(2, '0') !== nextMinute) {
      setMinutoInicio(nextMinute);
    }
  }, [hourOptions, minuteOptions, horaInicio, minutoInicio]);

  const onDateChange = (_event: DateTimePickerEvent, pickedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    if (!pickedDate) return;
    setFechaInicioDate(toDateInputValue(pickedDate));
  };

  const fetchReservaEstado = async (idReserva: number, withLoading = false) => {
    if (!token || !idReserva) return;
    if (withLoading) setLoadingStatus(true);

    try {
      const response = await fetch(apiUrl(`/citas/reservas/${idReserva}/estado`), {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        setError(payload?.message || 'No se pudo verificar el estado de la reserva.');
        return;
      }

      const estado = payload.data as ReservaEstado;
      setReserva(estado);

      if (!estado?.activa || estado?.debeReiniciarFlujo) {
        clearPolling();
        setError('La reserva expiró. Debes volver a reservar para continuar.');
      }
    } catch {
      setError('No se pudo consultar el estado de la reserva.');
    } finally {
      if (withLoading) setLoadingStatus(false);
    }
  };

  const onReservar = async () => {
    setError(null);
    setOk(null);

    if (!token) {
      setError('No hay sesión activa.');
      return;
    }

    if (!petId) {
      setError('No se pudo identificar la mascota.');
      return;
    }

    const duracion = DEFAULT_DURATION_MINUTES;
    const timeout = DEFAULT_TIMEOUT_MINUTES;

    if (!fechaInicioDate) {
      setError('Debes seleccionar la fecha de inicio.');
      return;
    }

    const hour = Number(horaInicio);
    const minute = Number(minutoInicio);
    if (!Number.isFinite(hour) || !Number.isFinite(minute)) {
      setError('Hora/minuto inválidos.');
      return;
    }

    const { fechaInicio, fechaFin, endMinutes } = buildIsoRange(fechaInicioDate, horaInicio, minutoInicio, duracion);
    if (hour < WORKING_HOUR_START || endMinutes > WORKING_HOUR_END * 60) {
      setError('La cita debe estar dentro del horario de 9:00 a 17:00.');
      return;
    }

    setReserving(true);
    try {
      const response = await fetch(apiUrl('/citas/reservar'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mascotaId: petId,
          fechaInicio,
          fechaFin,
          timeoutMinutos: timeout,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        setError(payload?.message || 'No se pudo reservar la cita.');
        return;
      }

      const nextReserva = (payload?.reserva || null) as ReservaEstado | null;
      setReserva(nextReserva);
      setOk('Reserva creada. Completa motivo/notas y confirma antes de que expire.');

      clearPolling();
      if (nextReserva?.idReserva) {
        pollRef.current = setInterval(() => {
          fetchReservaEstado(nextReserva.idReserva, false);
        }, 5000);
      }
    } catch {
      setError('No se pudo reservar la cita.');
    } finally {
      setReserving(false);
    }
  };

  const onConfirmar = async () => {
    setError(null);
    setOk(null);

    if (!token) {
      setError('No hay sesión activa.');
      return;
    }

    if (!reserva?.idReserva || !reserva?.activa || reserva?.debeReiniciarFlujo) {
      setError('No hay una reserva activa para confirmar.');
      return;
    }

    if (!motivo.trim()) {
      setError('El motivo es requerido para confirmar la cita.');
      return;
    }

    setConfirming(true);
    try {
      const response = await fetch(apiUrl('/citas/confirmar'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idReserva: reserva.idReserva,
          motivo: motivo.trim(),
          notas: notas.trim(),
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.success) {
        setError(payload?.message || 'No se pudo confirmar la cita.');
        if (payload?.code === 'RESERVATION_EXPIRED') {
          clearPolling();
          setReserva((prev) => (prev ? { ...prev, activa: false, debeReiniciarFlujo: true, segundosRestantes: 0 } : prev));
        }
        return;
      }

      clearPolling();
      setOk('Cita creada correctamente.');
      setTimeout(() => {
        router.back();
      }, 700);
    } catch {
      setError('No se pudo confirmar la cita.');
    } finally {
      setConfirming(false);
    }
  };

  const onRefreshEstado = async () => {
    if (!reserva?.idReserva) return;
    setError(null);
    await fetchReservaEstado(reserva.idReserva, true);
  };

  const contador = formatSecondsAsMMSS(reserva?.segundosRestantes || 0);
  const reservaActiva = !!(reserva?.activa && !reserva?.debeReiniciarFlujo);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: Math.max(insets.top + 12, 24) }]}
    >
      <View style={styles.petCard}>
        <Text style={styles.sectionTitle}>Crear cita</Text>
        <Text style={styles.sectionSubtitle}>Mascota: {petName}</Text>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}
      {ok ? <Text style={styles.okText}>{ok}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Reserva temporal</Text>
        <Text style={styles.noteText}>Horario de atención: 9:00 a.m. a 5:00 p.m.</Text>

        <Text style={styles.label}>Fecha</Text>
        <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
          <Text style={styles.dateSelectorText}>{fechaInicioDate}</Text>
        </TouchableOpacity>
        {showDatePicker ? (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        ) : null}

        <View style={styles.inlineFields}>
          <View style={styles.inlineCol}>
            <Text style={styles.label}>Hora inicio</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={horaInicio}
                onValueChange={(value) => setHoraInicio(String(value))}
                style={styles.picker}
                dropdownIconColor="#cbd5f5"
              >
                {hourOptions.map((option) => (
                  <Picker.Item key={option.value} label={option.label} value={option.value} color="#f8fafc" />
                ))}
              </Picker>
            </View>
          </View>
          <View style={styles.inlineCol}>
            <Text style={styles.label}>Minuto</Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={String(minutoInicio).padStart(2, '0')}
                onValueChange={(value) => setMinutoInicio(String(value).padStart(2, '0'))}
                style={styles.picker}
                dropdownIconColor="#cbd5f5"
              >
                {minuteOptions.map((minute) => (
                  <Picker.Item key={minute} label={minute} value={minute} color="#f8fafc" />
                ))}
              </Picker>
            </View>
          </View>
        </View>

        <Text style={styles.fixedInfo}>Duración fija: {DEFAULT_DURATION_MINUTES} minutos</Text>

        <TouchableOpacity style={styles.primaryBtn} onPress={onReservar} disabled={reserving || confirming}>
          <Text style={styles.primaryBtnText}>{reserving ? 'Reservando...' : 'Reservar espacio'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <View style={styles.statusHeader}>
          <Text style={styles.cardTitle}>Estado de reserva</Text>
          <TouchableOpacity style={styles.secondaryBtn} onPress={onRefreshEstado} disabled={!reserva?.idReserva || loadingStatus}>
            <Text style={styles.secondaryBtnText}>{loadingStatus ? 'Actualizando...' : 'Actualizar'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statusRow}>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>Tiempo restante</Text>
            <Text style={[styles.statusValue, reservaActiva ? styles.activeText : styles.expiredText]}>{contador}</Text>
          </View>
          <View style={styles.statusBox}>
            <Text style={styles.statusLabel}>Estado</Text>
            <Text style={[styles.statusValue, reservaActiva ? styles.activeText : styles.expiredText]}>
              {reservaActiva ? 'Activa' : 'Expirada'}
            </Text>
          </View>
        </View>

        <Text style={styles.label}>Motivo</Text>
        <TextInput
          style={styles.input}
          value={motivo}
          onChangeText={setMotivo}
          placeholder="Consulta general"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Notas</Text>
        <TextInput
          style={[styles.input, styles.notesInput]}
          value={notas}
          onChangeText={setNotas}
          placeholder="Notas adicionales"
          placeholderTextColor="#94a3b8"
          multiline
        />

        <TouchableOpacity
          style={[styles.confirmBtn, !reservaActiva ? styles.disabledBtn : null]}
          onPress={onConfirmar}
          disabled={!reservaActiva || confirming || reserving}
        >
          <Text style={styles.confirmBtnText}>{confirming ? 'Confirmando...' : 'Confirmar cita'}</Text>
        </TouchableOpacity>
      </View>

      {(reserving || confirming) ? (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color="#22d3ee" />
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: AppBackgroundColor,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  petCard: {
    backgroundColor: '#0b1220',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  sectionTitle: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#94a3b8',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#0b1220',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  noteText: {
    color: '#94a3b8',
    fontSize: 12,
  },
  label: {
    color: '#cbd5f5',
    fontSize: 13,
    marginTop: 4,
  },
  input: {
    backgroundColor: '#111c2e',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    color: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  dateSelector: {
    backgroundColor: '#111c2e',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  dateSelectorText: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
  },
  pickerWrap: {
    backgroundColor: '#111c2e',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    color: '#f8fafc',
    height: 48,
  },
  fixedInfo: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  notesInput: {
    minHeight: 86,
    textAlignVertical: 'top',
  },
  inlineFields: {
    flexDirection: 'row',
    gap: 10,
  },
  inlineCol: {
    flex: 1,
    gap: 4,
  },
  primaryBtn: {
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: '#0e7490',
    borderWidth: 1,
    borderColor: '#22d3ee',
    paddingVertical: 10,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: '#cffafe',
    fontWeight: '700',
    fontSize: 14,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondaryBtn: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  secondaryBtnText: {
    color: '#cbd5f5',
    fontSize: 12,
    fontWeight: '600',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statusBox: {
    flex: 1,
    backgroundColor: '#111c2e',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
    gap: 4,
  },
  statusLabel: {
    color: '#94a3b8',
    fontSize: 12,
  },
  statusValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  activeText: {
    color: '#34d399',
  },
  expiredText: {
    color: '#f87171',
  },
  confirmBtn: {
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: '#059669',
    borderWidth: 1,
    borderColor: '#34d399',
    paddingVertical: 10,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.55,
  },
  confirmBtnText: {
    color: '#ecfdf5',
    fontWeight: '700',
    fontSize: 14,
  },
  errorText: {
    color: '#fda4af',
    fontSize: 13,
  },
  okText: {
    color: '#86efac',
    fontSize: 13,
  },
  loadingOverlay: {
    alignItems: 'center',
    paddingVertical: 6,
  },
});
