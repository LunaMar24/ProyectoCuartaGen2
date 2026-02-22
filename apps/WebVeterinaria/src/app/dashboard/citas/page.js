"use client";

import { useEffect, useMemo, useState } from "react";
import { apiUrl, getApiErrorMessage } from "@/lib/api";

const STATUS_META = {
  P: {
    label: "Pendientes",
    legend: "Amarillo: Pendientes (P)",
    chip: "border border-amber-400/40 bg-amber-500/20 text-amber-200",
  },
  F: {
    label: "Confirmadas",
    legend: "Anaranjadas: Confirmadas (F)",
    chip: "border border-orange-400/40 bg-orange-500/20 text-orange-200",
  },
  C: {
    label: "Canceladas",
    legend: "Rojas y Tachadas: Canceladas (C)",
    chip: "border border-rose-400/40 bg-rose-500/20 text-rose-200 line-through",
  },
  T: {
    label: "Completada",
    legend: "Verdes: Completada (T)",
    chip: "border border-emerald-400/40 bg-emerald-500/20 text-emerald-200",
  },
  N: {
    label: "No Asistió",
    legend: "Azul: No Asistió (N)",
    chip: "border border-sky-400/40 bg-sky-500/20 text-sky-200",
  },
};

const WEEK_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const pad2 = (value) => String(value).padStart(2, "0");

const toDayKeyUtc = (dateValue) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "";
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
};

const formatHourUtc = (dateValue) => {
  const d = new Date(dateValue);
  if (Number.isNaN(d.getTime())) return "--:--";
  return `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}`;
};

const getMonthTitle = (year, monthIndex) => {
  const dt = new Date(Date.UTC(year, monthIndex, 1));
  const raw = new Intl.DateTimeFormat("es-CR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(dt);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

const readPagination = (payload) => {
  const pagination = payload?.pagination || {};
  const currentPage = Number(pagination.currentPage || 1);
  const totalPages = Number(pagination.totalPages || 1);
  return {
    currentPage: Number.isFinite(currentPage) && currentPage > 0 ? currentPage : 1,
    totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1,
  };
};

export default function ControlCitasPage() {
  const today = useMemo(() => new Date(), []);
  const [year, setYear] = useState(today.getUTCFullYear());
  const [monthIndex, setMonthIndex] = useState(today.getUTCMonth());
  const [allCitas, setAllCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [mascotaFilter, setMascotaFilter] = useState("");
  const [propietarioFilter, setPropietarioFilter] = useState("");
  const [selectedStates, setSelectedStates] = useState(() => ({ P: true, F: true, C: true, T: true, N: true }));

  const token = useMemo(
    () => (typeof window !== "undefined" ? localStorage.getItem("authToken") : null),
    []
  );

  useEffect(() => {
    const fetchMonthCitas = async () => {
      if (!token) {
        setError("No hay token de autenticación");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const fromIso = new Date(Date.UTC(year, monthIndex, 1, 0, 0, 0, 0)).toISOString();
      const toIso = new Date(Date.UTC(year, monthIndex + 1, 1, 0, 0, 0, 0)).toISOString();

      try {
        const collected = [];
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages) {
          const params = new URLSearchParams({
            fechaDesde: fromIso,
            fechaHasta: toIso,
            page: String(page),
            limit: "100",
          });

          const response = await fetch(apiUrl(`/citas?${params.toString()}`), {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          });

          const payload = await response.json().catch(() => ({}));
          if (!response.ok || !payload?.success) {
            setError(getApiErrorMessage(payload, "No se pudieron cargar las citas"));
            setAllCitas([]);
            return;
          }

          const pageData = Array.isArray(payload?.data) ? payload.data : [];
          collected.push(...pageData);

          const parsed = readPagination(payload);
          totalPages = parsed.totalPages;
          page += 1;
        }

        setAllCitas(collected);
      } catch {
        setError("No se pudieron cargar las citas");
        setAllCitas([]);
      } finally {
        setLoading(false);
      }
    };

    fetchMonthCitas();
  }, [monthIndex, token, year]);

  const visibleCitas = useMemo(() => {
    const mascotaText = mascotaFilter.trim().toLowerCase();
    const propietarioText = propietarioFilter.trim().toLowerCase();

    return allCitas.filter((cita) => {
      const estado = String(cita?.estado || "").toUpperCase();
      if (!selectedStates[estado]) return false;

      const mascotaNombre = String(cita?.mascotaNombre || "").toLowerCase();
      const propietarioNombre = String(cita?.propietarioNombre || "").toLowerCase();

      if (mascotaText && !mascotaNombre.includes(mascotaText)) return false;
      if (propietarioText && !propietarioNombre.includes(propietarioText)) return false;

      return true;
    });
  }, [allCitas, mascotaFilter, propietarioFilter, selectedStates]);

  const citasByDay = useMemo(() => {
    const grouped = new Map();
    visibleCitas.forEach((cita) => {
      const dayKey = toDayKeyUtc(cita?.fechaInicio);
      if (!dayKey) return;
      if (!grouped.has(dayKey)) grouped.set(dayKey, []);
      grouped.get(dayKey).push(cita);
    });

    grouped.forEach((list) => {
      list.sort((a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime());
    });

    return grouped;
  }, [visibleCitas]);

  const monthCells = useMemo(() => {
    const firstDay = new Date(Date.UTC(year, monthIndex, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();

    const cells = [];
    for (let i = 0; i < firstDay; i += 1) {
      cells.push({ key: `empty-start-${i}`, empty: true });
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dayKey = `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;
      cells.push({ key: dayKey, day, dayKey, empty: false });
    }

    while (cells.length % 7 !== 0) {
      cells.push({ key: `empty-end-${cells.length}`, empty: true });
    }

    return cells;
  }, [monthIndex, year]);

  const monthTitle = useMemo(() => getMonthTitle(year, monthIndex), [monthIndex, year]);

  const goPrevMonth = () => {
    if (monthIndex === 0) {
      setMonthIndex(11);
      setYear((prev) => prev - 1);
      return;
    }
    setMonthIndex((prev) => prev - 1);
  };

  const goNextMonth = () => {
    if (monthIndex === 11) {
      setMonthIndex(0);
      setYear((prev) => prev + 1);
      return;
    }
    setMonthIndex((prev) => prev + 1);
  };

  const stateKeys = Object.keys(STATUS_META);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Control Citas</h1>
          <p className="text-sm text-slate-300">Vista calendario con filtros por estado, mascota y propietario.</p>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-slate-300 mb-1">Filtrar por mascota</label>
            <input
              type="text"
              value={mascotaFilter}
              onChange={(e) => setMascotaFilter(e.target.value)}
              placeholder="Nombre de mascota"
              className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Filtrar por propietario</label>
            <input
              type="text"
              value={propietarioFilter}
              onChange={(e) => setPropietarioFilter(e.target.value)}
              placeholder="Nombre de propietario"
              className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div>
          <p className="text-xs text-slate-300 mb-2">Estados a visualizar</p>
          <div className="flex flex-wrap gap-2">
            {stateKeys.map((code) => (
              <label key={code} className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-200">
                <input
                  type="checkbox"
                  checked={!!selectedStates[code]}
                  onChange={(e) => setSelectedStates((prev) => ({ ...prev, [code]: e.target.checked }))}
                  className="accent-sky-500"
                />
                {STATUS_META[code].label} ({code})
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-4">
        <p className="text-sm font-semibold mb-2">Leyenda</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs text-slate-200">
          {stateKeys.map((code) => (
            <div key={code} className={`rounded-md px-2 py-1 ${STATUS_META[code].chip}`}>
              {STATUS_META[code].legend}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-lg font-semibold">{monthTitle}</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setYear((prev) => prev - 1)}
              className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700/50"
            >
              Año -1
            </button>
            <button
              type="button"
              onClick={goPrevMonth}
              className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700/50"
            >
              Mes -1
            </button>
            <button
              type="button"
              onClick={goNextMonth}
              className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700/50"
            >
              Mes +1
            </button>
            <button
              type="button"
              onClick={() => setYear((prev) => prev + 1)}
              className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700/50"
            >
              Año +1
            </button>
          </div>
        </div>

        {loading && <p className="text-sm text-slate-300">Cargando citas...</p>}
        {!loading && error && <p className="text-sm text-rose-300">{error}</p>}

        {!loading && !error && (
          <div className="space-y-2">
            <div className="grid grid-cols-7 gap-2">
              {WEEK_DAYS.map((day) => (
                <div key={day} className="rounded-md bg-slate-800/80 border border-slate-700 px-2 py-1 text-xs text-slate-200 text-center">
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
              {monthCells.map((cell) => {
                if (cell.empty) {
                  return <div key={cell.key} className="hidden md:block rounded-md border border-transparent min-h-28" />;
                }

                const list = citasByDay.get(cell.dayKey) || [];

                return (
                  <div key={cell.key} className="rounded-md border border-slate-700 bg-slate-900/30 min-h-28 p-2 space-y-1">
                    <p className="text-xs text-slate-300 font-semibold">{cell.day}</p>
                    {list.length === 0 && <p className="text-[11px] text-slate-500">Sin citas</p>}
                    {list.map((cita) => {
                      const code = String(cita?.estado || "").toUpperCase();
                      const status = STATUS_META[code] || STATUS_META.P;
                      return (
                        <div key={cita.idCita} className={`rounded px-1.5 py-1 text-[11px] leading-tight ${status.chip}`}>
                          <p className="font-semibold">{formatHourUtc(cita.fechaInicio)} · {code}</p>
                          <p className="truncate">{cita.mascotaNombre || "Mascota"}</p>
                          <p className="truncate">{cita.propietarioNombre || "Propietario"}</p>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
