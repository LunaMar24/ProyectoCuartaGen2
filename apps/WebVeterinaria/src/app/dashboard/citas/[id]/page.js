"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiUrl, getApiErrorMessage } from "@/lib/api";

const STATUS_META = {
  P: {
    label: "Pendiente",
    chip: "border border-amber-400/40 bg-amber-500/20 text-amber-200",
  },
  F: {
    label: "Confirmada",
    chip: "border border-emerald-400/40 bg-emerald-500/20 text-emerald-200",
  },
  C: {
    label: "Cancelada",
    chip: "border border-rose-400/40 bg-rose-500/20 text-rose-200",
  },
  T: {
    label: "Completada",
    chip: "border border-sky-400/40 bg-sky-500/20 text-sky-200",
  },
  N: {
    label: "No Asistió",
    chip: "border border-orange-400/40 bg-orange-500/20 text-orange-200",
  },
};

const pad2 = (value) => String(value).padStart(2, "0");

const parseDateTimeParts = (dateValue) => {
  if (!dateValue) return null;

  if (typeof dateValue === "string") {
    const normalized = dateValue.trim().replace("T", " ");
    const matched = normalized.match(/^(\d{4})-(\d{1,2})-(\d{1,2})\s(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (matched) {
      return {
        year: Number(matched[1]),
        month: Number(matched[2]),
        day: Number(matched[3]),
        hour: Number(matched[4]),
        minute: Number(matched[5]),
      };
    }
  }

  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return null;
  return {
    year: d.getFullYear(),
    month: d.getMonth() + 1,
    day: d.getDate(),
    hour: d.getHours(),
    minute: d.getMinutes(),
  };
};

const formatDate = (dateValue) => {
  const parts = parseDateTimeParts(dateValue);
  if (!parts) return "-";
  return `${pad2(parts.day)}/${pad2(parts.month)}/${parts.year}`;
};

const formatDuration = (startDateValue, endDateValue) => {
  const start = parseDateTimeParts(startDateValue);
  const end = parseDateTimeParts(endDateValue);
  if (!start || !end) return "-";

  const startDate = new Date(start.year, start.month - 1, start.day, start.hour, start.minute, 0, 0);
  const endDate = new Date(end.year, end.month - 1, end.day, end.hour, end.minute, 0, 0);
  const diffMs = endDate.getTime() - startDate.getTime();
  if (!Number.isFinite(diffMs) || diffMs <= 0) return "-";

  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) return `${totalMinutes} min`;
  if (minutes === 0) return `${hours} h`;
  return `${hours} h ${minutes} min`;
};

export default function CitaDetallePage() {
  const router = useRouter();
  const params = useParams();
  const citaId = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [historialLoading, setHistorialLoading] = useState(false);

  const [cita, setCita] = useState(null);
  const [mascota, setMascota] = useState(null);
  const [propietario, setPropietario] = useState(null);

  const token = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("authToken") : null),
    []
  );

  useEffect(() => {
    const fetchDetail = async () => {
      if (!token) {
        setError("No hay token de autenticación");
        setLoading(false);
        return;
      }

      if (!Number.isInteger(citaId) || citaId <= 0) {
        setError("ID de cita inválido");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const citaRes = await fetch(apiUrl(`/citas/${citaId}`), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        const citaData = await citaRes.json().catch(() => ({}));
        if (!citaRes.ok || !citaData?.success || !citaData?.data) {
          setError(getApiErrorMessage(citaData, "No se pudo cargar la cita"));
          return;
        }

        const citaPayload = citaData.data;
        setCita(citaPayload);

        const [mascotaRes, propietarioRes] = await Promise.all([
          fetch(apiUrl(`/mascotas/${citaPayload.mascotaId}`), {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
          fetch(apiUrl(`/propietarios/${citaPayload.propietarioId}`), {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }),
        ]);

        const mascotaData = await mascotaRes.json().catch(() => ({}));
        if (mascotaRes.ok && mascotaData?.success && mascotaData?.data) {
          setMascota(mascotaData.data);
        }

        const propietarioData = await propietarioRes.json().catch(() => ({}));
        if (propietarioRes.ok && propietarioData?.success && propietarioData?.data) {
          setPropietario(propietarioData.data);
        }
      } catch {
        setError("No se pudo cargar el detalle de la cita");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [citaId, token]);

  const handleCancelar = async () => {
    if (!token || !cita?.idCita) return;
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl(`/citas/${cita.idCita}/cancelar`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setError(getApiErrorMessage(data, "No se pudo cancelar la cita"));
        return;
      }
      router.push("/dashboard/citas");
    } catch {
      setError("No se pudo cancelar la cita");
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmar = async () => {
    if (!token || !cita?.idCita) return;
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl(`/citas/${cita.idCita}/confirmar`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setError(getApiErrorMessage(data, "No se pudo confirmar la cita"));
        return;
      }
      router.push("/dashboard/citas");
    } catch {
      setError("No se pudo confirmar la cita");
    } finally {
      setActionLoading(false);
    }
  };

  const handleNoAsistio = async () => {
    if (!token || !cita?.idCita) return;
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(apiUrl(`/citas/${cita.idCita}/no-asistio`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setError(getApiErrorMessage(data, "No se pudo marcar la cita como no asistió"));
        return;
      }
      router.push("/dashboard/citas");
    } catch {
      setError("No se pudo marcar la cita como no asistió");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAtender = () => {
    if (!cita?.idCita || !cita?.mascotaId) return;
    const params = new URLSearchParams({
      mascota: String(cita.mascotaId),
      idCita: String(cita.idCita),
    });
    const motivoCita = String(cita?.motivo || "").trim();
    if (motivoCita) params.set("motivo", motivoCita);
    router.push(`/dashboard/historiales/crear?${params.toString()}`);
  };

  const handleVerHistorialAsociado = async () => {
    if (!token || !cita?.idCita) return;

    setHistorialLoading(true);
    setError("");

    try {
      const res = await fetch(apiUrl(`/historiales/cita/${cita.idCita}`), {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success || !data?.data?.id) {
        setError(getApiErrorMessage(data, "No se encontró historial asociado a esta cita"));
        return;
      }

      router.push(`/dashboard/historiales/${data.data.id}`);
    } catch {
      setError("No se pudo obtener el historial asociado");
    } finally {
      setHistorialLoading(false);
    }
  };

  const openConfirmModal = (actionType) => {
    if (actionLoading) return;

    const configByType = {
      confirmar: {
        title: "Confirmar cita",
        message: "¿Deseas confirmar esta cita?",
      },
      cancelar: {
        title: "Cancelar cita",
        message: "¿Deseas cancelar esta cita?",
      },
      noAsistio: {
        title: "Marcar No Asistió",
        message: "¿Deseas marcar esta cita como No Asistió?",
      },
    };

    const config = configByType[actionType];
    if (!config) return;

    setConfirmAction({ actionType, ...config });
  };

  const closeConfirmModal = () => {
    if (actionLoading) return;
    setConfirmAction(null);
  };

  const executeConfirmedAction = async () => {
    if (!confirmAction?.actionType) return;

    if (confirmAction.actionType === "confirmar") {
      await handleConfirmar();
      setConfirmAction(null);
      return;
    }

    if (confirmAction.actionType === "cancelar") {
      await handleCancelar();
      setConfirmAction(null);
      return;
    }

    if (confirmAction.actionType === "noAsistio") {
      await handleNoAsistio();
      setConfirmAction(null);
    }
  };

  return (
    <section className="max-w-4xl space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">Detalle de cita</h1>
          <p className="text-sm text-slate-300">Información de la cita, propietario y mascota.</p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/dashboard/citas")}
          className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50"
        >
          Regresar
        </button>
      </div>

      {loading && <p className="text-sm text-slate-300">Cargando detalle...</p>}
      {!loading && error && <p className="text-sm text-rose-300">{error}</p>}

      {!loading && !error && cita && (
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 text-sm">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-base">Cita</h2>
              <span className={`rounded-md px-2 py-1 text-xs font-semibold ${(STATUS_META[cita.estado] || STATUS_META.P).chip}`}>
                {(STATUS_META[cita.estado] || STATUS_META.P).label}
              </span>
            </div>

            <div className="rounded-md border border-slate-700 bg-slate-900/40 p-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              <p><span className="text-slate-400">Fecha:</span> {formatDate(cita.fechaInicio)}</p>
              <p><span className="text-slate-400">Duración:</span> {formatDuration(cita.fechaInicio, cita.fechaFin)}</p>
            </div>

            <p><span className="text-slate-400">Motivo:</span> {cita.motivo || "-"}</p>
            <p><span className="text-slate-400">Notas:</span> {cita.notas || "-"}</p>

            {String(cita.estado || "").toUpperCase() === "P" && (
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openConfirmModal("confirmar")}
                  disabled={actionLoading}
                  className="rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-3 py-2 text-sm font-semibold text-white"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => openConfirmModal("cancelar")}
                  disabled={actionLoading}
                  className="rounded-md bg-rose-600 hover:bg-rose-700 disabled:opacity-60 px-3 py-2 text-sm font-semibold text-white"
                >
                  Cancelar
                </button>
              </div>
            )}

            {String(cita.estado || "").toUpperCase() === "F" && (
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openConfirmModal("cancelar")}
                  disabled={actionLoading}
                  className="rounded-md bg-rose-600 hover:bg-rose-700 disabled:opacity-60 px-3 py-2 text-sm font-semibold text-white"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAtender}
                  disabled={actionLoading}
                  className="rounded-md bg-sky-600 hover:bg-sky-700 disabled:opacity-60 px-3 py-2 text-sm font-semibold text-white"
                >
                  Atender
                </button>
                <button
                  type="button"
                  onClick={() => openConfirmModal("noAsistio")}
                  disabled={actionLoading}
                  className="rounded-md bg-orange-600 hover:bg-orange-700 disabled:opacity-60 px-3 py-2 text-sm font-semibold text-white"
                >
                  No Asistió
                </button>
              </div>
            )}

            {String(cita.estado || "").toUpperCase() === "T" && (
              <div className="pt-2 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleVerHistorialAsociado}
                  disabled={historialLoading}
                  className="rounded-md bg-sky-600 hover:bg-sky-700 disabled:opacity-60 px-3 py-2 text-sm font-semibold text-white"
                >
                  {historialLoading ? "Buscando historial..." : "Ver historial asociado"}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 text-sm">
              <h2 className="font-semibold text-base">Propietario</h2>
              <p><span className="text-slate-400">Nombre:</span> {propietario ? `${propietario.nombre || ""} ${propietario.apellidos || ""}`.trim() || "-" : (cita.propietarioNombre || "-")}</p>
              <p><span className="text-slate-400">Teléfono:</span> {propietario?.telefono || "-"}</p>
              <p><span className="text-slate-400">Correo:</span> {propietario?.correo || "-"}</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 text-sm">
              <h2 className="font-semibold text-base">Mascota</h2>
              <p><span className="text-slate-400">Nombre:</span> {mascota?.nombre || cita.mascotaNombre || "-"}</p>
              <p><span className="text-slate-400">Raza:</span> {mascota?.raza || "-"}</p>
              <p><span className="text-slate-400">Especie:</span> {mascota?.especie || "-"}</p>
              <p><span className="text-slate-400">Edad:</span> {mascota?.edad || "-"}</p>
            </div>
          </div>
        </div>
      )}

      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar confirmación"
            onClick={closeConfirmModal}
            className="absolute inset-0 bg-black/60"
          />

          <div className="relative z-10 w-full max-w-md rounded-lg border border-white/10 bg-slate-900 p-4 space-y-3">
            <h3 className="text-base font-semibold">{confirmAction.title}</h3>
            <p className="text-sm text-slate-300">{confirmAction.message}</p>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={closeConfirmModal}
                disabled={actionLoading}
                className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50 disabled:opacity-60"
              >
                No
              </button>
              <button
                type="button"
                onClick={executeConfirmedAction}
                disabled={actionLoading}
                className="rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-3 py-2 text-sm font-semibold text-white"
              >
                {actionLoading ? "Procesando..." : "Sí"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
