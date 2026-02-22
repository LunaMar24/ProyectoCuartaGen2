"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiUrl, getApiErrorMessage } from "@/lib/api";

const DEFAULT_TIMEOUT_MINUTES = 5;
const DEFAULT_DURATION_MINUTES = 30;
const WORKING_HOUR_START = 9;
const WORKING_HOUR_END = 17;
const RESERVATION_STATUS_NOTE = `Tiempo máximo para poder reservar: ${DEFAULT_TIMEOUT_MINUTES} minutos. El tiempo restante se actualiza cada 5 segundos.`;

const formatHourLabel = (hour24) => {
  const period = hour24 >= 12 ? "p.m." : "a.m.";
  const hour12 = hour24 % 12 || 12;
  return `${hour12}:00 ${period}`;
};

const formatHourOptionLabel = (hour24) => {
  const period = hour24 >= 12 ? "pm" : "am";
  const hour12 = hour24 % 12 || 12;
  return `${hour12} ${period}`;
};

const WORKING_HOURS_NOTE = `Horario de atención: ${formatHourLabel(WORKING_HOUR_START)} a ${formatHourLabel(WORKING_HOUR_END)}.`;

const formatSecondsAsMMSS = (seconds) => {
  const safe = Math.max(Number(seconds || 0), 0);
  const mm = String(Math.floor(safe / 60)).padStart(2, "0");
  const ss = String(safe % 60).padStart(2, "0");
  return `${mm}:${ss}`;
};

const toDateInputValue = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const buildSlots = (intervalMinutes, durationMinutes) => {
  const slots = [];
  const startTotal = WORKING_HOUR_START * 60;
  const endTotal = WORKING_HOUR_END * 60;
  const interval = Math.max(Number(intervalMinutes) || 1, 1);
  const duration = Math.max(Number(durationMinutes) || interval, 1);
  const latestStartByDuration = endTotal - duration;
  const latestStartByBusinessRule = endTotal - DEFAULT_DURATION_MINUTES;
  const latestStart = Math.min(latestStartByDuration, latestStartByBusinessRule);

  for (let current = startTotal; current <= latestStart; current += interval) {
    slots.push({
      hour: Math.floor(current / 60),
      minute: current % 60,
    });
  }

  return slots;
};

export default function CrearCitaMascotaPage() {
  const router = useRouter();
  const params = useParams();
  const mascotaId = Number(params?.id);

  const [loadingPet, setLoadingPet] = useState(true);
  const [petError, setPetError] = useState("");
  const [pet, setPet] = useState(null);

  const [reserving, setReserving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const [form, setForm] = useState(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + DEFAULT_DURATION_MINUTES);
    now.setSeconds(0);
    now.setMilliseconds(0);

    const roundedMinute = Math.floor(now.getMinutes() / DEFAULT_DURATION_MINUTES) * DEFAULT_DURATION_MINUTES;

    return {
      fechaInicioDate: toDateInputValue(now),
      horaInicio: String(Math.max(WORKING_HOUR_START, Math.min(now.getHours(), WORKING_HOUR_END - 1))),
      minutoInicio: String(roundedMinute).padStart(2, "0"),
      duracionMinutos: DEFAULT_DURATION_MINUTES,
      motivo: "",
      notas: "",
      timeoutMinutos: DEFAULT_TIMEOUT_MINUTES,
    };
  });

  const [reserva, setReserva] = useState(null);
  const pollRef = useRef(null);

  const token = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("authToken") : null),
    []
  );

  const clearPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const allowedSlots = useMemo(
    () => buildSlots(DEFAULT_DURATION_MINUTES, Number(form.duracionMinutos || DEFAULT_DURATION_MINUTES)),
    [form.duracionMinutos]
  );

  const hourOptions = useMemo(() => {
    const uniq = [...new Set(allowedSlots.map((slot) => slot.hour))];
    return uniq.map((hour) => ({ value: String(hour), label: formatHourOptionLabel(hour) }));
  }, [allowedSlots]);

  const minuteOptions = useMemo(() => {
    const selectedHour = Number(form.horaInicio);
    const uniq = [...new Set(
      allowedSlots
        .filter((slot) => slot.hour === selectedHour)
        .map((slot) => slot.minute)
    )];
    return uniq.map((minute) => ({ value: String(minute).padStart(2, "0"), label: String(minute).padStart(2, "0") }));
  }, [allowedSlots, form.horaInicio]);

  useEffect(() => {
    if (hourOptions.length === 0) return;
    const hourExists = hourOptions.some((option) => option.value === String(form.horaInicio));
    const nextHour = hourExists ? String(form.horaInicio) : hourOptions[0].value;

    const minutesForHour = [...new Set(
      allowedSlots
        .filter((slot) => String(slot.hour) === String(nextHour))
        .map((slot) => String(slot.minute).padStart(2, "0"))
    )];
    const minuteExists = minutesForHour.includes(String(form.minutoInicio).padStart(2, "0"));
    const nextMinute = minuteExists ? String(form.minutoInicio).padStart(2, "0") : (minutesForHour[0] || "00");

    if (String(form.horaInicio) !== nextHour || String(form.minutoInicio).padStart(2, "0") !== nextMinute) {
      setForm((prev) => ({ ...prev, horaInicio: nextHour, minutoInicio: nextMinute }));
    }
  }, [hourOptions, allowedSlots, form.horaInicio, form.minutoInicio]);

  const fetchReservaEstado = async (idReserva, withLoading = false) => {
    if (!token || !idReserva) return;
    if (withLoading) setLoadingStatus(true);

    try {
      const res = await fetch(apiUrl(`/citas/reservas/${idReserva}/estado`), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        const msg = getApiErrorMessage(data, "No se pudo verificar la reserva");
        setError(msg);
        return;
      }

      const estado = data?.data;
      setReserva(estado);

      if (!estado?.activa || estado?.debeReiniciarFlujo) {
        clearPolling();
        setError("La reserva expiró. Debes volver a reservar para continuar.");
      }
    } catch {
      setError("No se pudo consultar el estado de la reserva");
    } finally {
      if (withLoading) setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (!token) {
      setPetError("No hay token de autenticación");
      setLoadingPet(false);
      return;
    }

    if (!Number.isInteger(mascotaId) || mascotaId <= 0) {
      setPetError("ID de mascota inválido");
      setLoadingPet(false);
      return;
    }

    fetch(apiUrl(`/mascotas/${mascotaId}`), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json().catch(() => ({})))
      .then((data) => {
        if (!data?.success || !data?.data) {
          setPetError(getApiErrorMessage(data, "No se pudo cargar la mascota"));
          return;
        }
        setPet(data.data);
      })
      .catch(() => setPetError("No se pudo cargar la mascota"))
      .finally(() => setLoadingPet(false));
  }, [mascotaId, token]);

  useEffect(() => {
    return () => clearPolling();
  }, []);

  const onReserve = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");

    if (!token) {
      setError("No hay token de autenticación");
      return;
    }

    if (!form.fechaInicioDate) {
      setError("Debes seleccionar la fecha de inicio");
      return;
    }

    const duracion = Number(form.duracionMinutos || 0);
    if (!Number.isFinite(duracion) || duracion <= 0) {
      setError("La duración debe ser mayor a 0 minutos");
      return;
    }

    if (!form.horaInicio || form.minutoInicio === undefined || form.minutoInicio === null || form.minutoInicio === "") {
      setError("Debes seleccionar la hora y minutos de inicio");
      return;
    }

    const [year, month, day] = form.fechaInicioDate.split("-").map(Number);
    const hour = Number(form.horaInicio);
    const minute = Number(form.minutoInicio);
    const startMinutes = hour * 60 + minute;
    const endMinutes = startMinutes + duracion;
    const workingEndMinutes = WORKING_HOUR_END * 60;

    if (endMinutes > workingEndMinutes) {
      setError(`La cita no puede terminar después de las ${formatHourLabel(WORKING_HOUR_END)}`);
      return;
    }

    const startUtcMs = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
    if (Number.isNaN(startUtcMs)) {
      setError("La fecha u hora seleccionada es inválida");
      return;
    }

    const endUtcMs = startUtcMs + duracion * 60 * 1000;
    const fechaInicioIso = new Date(startUtcMs).toISOString();
    const fechaFinIso = new Date(endUtcMs).toISOString();

    setReserving(true);
    try {
      const response = await fetch(apiUrl("/citas/reservar"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mascotaId,
          fechaInicio: fechaInicioIso,
          fechaFin: fechaFinIso,
          timeoutMinutos: Number(form.timeoutMinutos || DEFAULT_TIMEOUT_MINUTES),
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        setError(getApiErrorMessage(data, "No se pudo reservar la cita"));
        return;
      }

      const nextReserva = data?.reserva || { idReserva: data?.idReserva };
      setReserva(nextReserva);
      setOk("Reserva creada. Completa motivo/notas y confirma antes de que expire.");

      clearPolling();
      if (nextReserva?.idReserva) {
        pollRef.current = setInterval(() => {
          fetchReservaEstado(nextReserva.idReserva, false);
        }, 5000);
      }
    } catch {
      setError("No se pudo reservar la cita");
    } finally {
      setReserving(false);
    }
  };

  const onRefreshStatus = async () => {
    if (!reserva?.idReserva) return;
    setError("");
    await fetchReservaEstado(reserva.idReserva, true);
  };

  const onConfirm = async () => {
    setError("");
    setOk("");

    if (!token) {
      setError("No hay token de autenticación");
      return;
    }

    if (!reserva?.idReserva || !reserva?.activa) {
      setError("No hay una reserva activa para confirmar");
      return;
    }

    if (!form.motivo || form.motivo.trim().length === 0) {
      setError("El motivo es requerido para confirmar la cita");
      return;
    }

    setConfirming(true);
    try {
      const response = await fetch(apiUrl("/citas/confirmar"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idReserva: reserva.idReserva,
          motivo: form.motivo.trim(),
          notas: form.notas?.trim() || "",
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.success) {
        setError(getApiErrorMessage(data, "No se pudo confirmar la cita"));
        if (data?.code === "RESERVATION_EXPIRED") {
          clearPolling();
          setReserva((prev) => (prev ? { ...prev, activa: false, debeReiniciarFlujo: true, segundosRestantes: 0 } : prev));
        }
        return;
      }

      clearPolling();
      setOk("Cita creada correctamente");
      setTimeout(() => router.push("/dashboard/mascotas"), 800);
    } catch {
      setError("No se pudo confirmar la cita");
    } finally {
      setConfirming(false);
    }
  };

  const handleInput = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const contador = formatSecondsAsMMSS(reserva?.segundosRestantes || 0);
  const reservaActiva = !!(reserva?.activa && !reserva?.debeReiniciarFlujo);

  return (
    <section className="max-w-3xl bg-white/5 border border-white/10 rounded-lg p-6 text-slate-100 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Crear cita</h1>
          <p className="text-slate-300 text-sm">Define y confirma una cita para la mascota seleccionada.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/mascotas")}
          className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50"
        >
          Regresar
        </button>
      </div>

      {loadingPet && <p className="text-slate-300 text-sm">Cargando mascota...</p>}
      {!loadingPet && petError && <p className="text-rose-300 text-sm">{petError}</p>}

      {!loadingPet && !petError && (
        <>
          <div className="rounded-lg border border-white/10 bg-slate-800/40 p-3 text-sm">
            <p>
              <span className="text-slate-400">Mascota:</span> {pet?.nombre || "-"}
            </p>
            <p>
              <span className="text-slate-400">Propietario:</span> {pet?.propietario || "-"}
            </p>
          </div>

          {error && <p className="text-rose-300 text-sm">{error}</p>}
          {ok && <p className="text-emerald-300 text-sm">{ok}</p>}

          <form onSubmit={onReserve} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-3">
              <p className="text-xs text-slate-300">{WORKING_HOURS_NOTE}</p>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-slate-300 mb-1">Fecha inicio</label>
              <input
                type="date"
                name="fechaInicioDate"
                value={form.fechaInicioDate}
                onChange={handleInput}
                className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Hora inicio</label>
              <select
                name="horaInicio"
                value={form.horaInicio}
                onChange={handleInput}
                className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100"
              >
                {hourOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Minutos</label>
              <select
                name="minutoInicio"
                value={String(form.minutoInicio).padStart(2, "0")}
                onChange={handleInput}
                className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100"
              >
                {minuteOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-300 mb-1">Duración (min)</label>
              <input
                type="number"
                min="1"
                step="1"
                name="duracionMinutos"
                value={form.duracionMinutos}
                onChange={handleInput}
                className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100"
              />
            </div>
            <div className="md:col-span-4 flex justify-end">
              <button
                type="submit"
                disabled={reserving || confirming}
                className="inline-flex items-center gap-2 rounded-md bg-sky-600 hover:bg-sky-700 disabled:opacity-60 px-3 py-2 text-sm font-semibold text-white"
              >
                {reserving ? "Reservando..." : "Reservar espacio"}
              </button>
            </div>
          </form>

          <div className="rounded-lg border border-white/10 bg-slate-800/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Estado de reserva</p>
                <p className="text-xs text-slate-400">{RESERVATION_STATUS_NOTE}</p>
              </div>
              <button
                type="button"
                onClick={onRefreshStatus}
                disabled={!reserva?.idReserva || loadingStatus}
                className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-200 disabled:opacity-50"
              >
                {loadingStatus ? "Actualizando..." : "Actualizar"}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-slate-900/40 border border-white/10 p-3">
                <p className="text-slate-400 text-xs">Tiempo restante</p>
                <p className={reservaActiva ? "text-emerald-300" : "text-rose-300"}>{contador}</p>
              </div>
              <div className="rounded-md bg-slate-900/40 border border-white/10 p-3">
                <p className="text-slate-400 text-xs">Estado</p>
                <p className={reservaActiva ? "text-emerald-300" : "text-rose-300"}>{reservaActiva ? "Activa" : "Expirada"}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">Motivo</label>
                <input
                  type="text"
                  name="motivo"
                  value={form.motivo}
                  onChange={handleInput}
                  placeholder="Consulta general"
                  className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-300 mb-1">Notas</label>
                <textarea
                  name="notas"
                  rows={3}
                  value={form.notas}
                  onChange={handleInput}
                  placeholder="Notas adicionales"
                  className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={onConfirm}
                disabled={!reservaActiva || confirming || reserving}
                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-3 py-2 text-sm font-semibold text-white"
              >
                {confirming ? "Confirmando..." : "Confirmar cita"}
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
