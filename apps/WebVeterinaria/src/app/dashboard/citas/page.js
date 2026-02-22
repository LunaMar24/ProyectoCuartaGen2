"use client";

import { useEffect, useMemo, useState } from "react";
import { apiUrl, getApiErrorMessage } from "@/lib/api";

const STATUS_META = {
  P: {
    label: "Pendientes",
    legend: "Pendientes",
    chip: "border border-amber-400/40 bg-amber-500/20 text-amber-200",
  },
  F: {
    label: "Confirmadas",
    legend: "Confirmadas",
    chip: "border border-orange-400/40 bg-orange-500/20 text-orange-200",
  },
  C: {
    label: "Canceladas",
    legend: "Canceladas",
    chip: "border border-rose-400/40 bg-rose-500/20 text-rose-200 line-through",
  },
  T: {
    label: "Completada",
    legend: "Completada",
    chip: "border border-emerald-400/40 bg-emerald-500/20 text-emerald-200",
  },
  N: {
    label: "No Asistió",
    legend: "No Asistió",
    chip: "border border-sky-400/40 bg-sky-500/20 text-sky-200",
  },
};

const WEEK_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

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
        second: Number(matched[6] || 0),
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
    second: d.getSeconds(),
  };
};

const toDayKey = (dateValue) => {
  const parts = parseDateTimeParts(dateValue);
  if (!parts) return "";
  return `${parts.year}-${pad2(parts.month)}-${pad2(parts.day)}`;
};

const formatHour = (dateValue) => {
  const parts = parseDateTimeParts(dateValue);
  if (!parts) return "--:--";
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
};

const toSortableDateTimeNumber = (dateValue) => {
  const parts = parseDateTimeParts(dateValue);
  if (!parts) return Number.MAX_SAFE_INTEGER;

  return Number(
    `${parts.year}${pad2(parts.month)}${pad2(parts.day)}${pad2(parts.hour)}${pad2(parts.minute)}${pad2(parts.second)}`
  );
};

const getMonthName = (year, monthIndex) => {
  const dt = new Date(Date.UTC(year, monthIndex, 1));
  const raw = new Intl.DateTimeFormat("es-CR", {
    month: "long",
    timeZone: "UTC",
  }).format(dt);
  return raw.charAt(0).toUpperCase() + raw.slice(1);
};

const formatDayTitle = (dayKey) => {
  if (!dayKey) return "";
  const [year, month, day] = String(dayKey).split("-").map(Number);
  const dt = new Date(Date.UTC(year, (month || 1) - 1, day || 1));
  const raw = new Intl.DateTimeFormat("es-CR", {
    day: "numeric",
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
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [editingYear, setEditingYear] = useState(false);
  const [selectedDayKey, setSelectedDayKey] = useState("");
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
      const dayKey = toDayKey(cita?.fechaInicio);
      if (!dayKey) return;
      if (!grouped.has(dayKey)) grouped.set(dayKey, []);
      grouped.get(dayKey).push(cita);
    });

    grouped.forEach((list) => {
      list.sort((a, b) => toSortableDateTimeNumber(a.fechaInicio) - toSortableDateTimeNumber(b.fechaInicio));
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

  const monthName = useMemo(() => getMonthName(year, monthIndex), [monthIndex, year]);
  const monthOptions = useMemo(
    () => Array.from({ length: 12 }, (_, idx) => ({ index: idx, label: getMonthName(year, idx) })),
    [year]
  );

  const stateKeys = Object.keys(STATUS_META);
  const selectedDayList = selectedDayKey ? (citasByDay.get(selectedDayKey) || []) : [];

  useEffect(() => {
    if (selectedDayKey && selectedDayList.length === 0) {
      setSelectedDayKey("");
    }
  }, [selectedDayKey, selectedDayList.length]);

  useEffect(() => {
    if (!selectedDayKey) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setSelectedDayKey("");
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedDayKey]);

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
                {STATUS_META[code].label}
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 relative">
            <button
              type="button"
              onClick={() => {
                setShowMonthPicker((prev) => !prev);
                setEditingYear(false);
              }}
              className="text-lg font-semibold rounded-md border border-slate-600 px-3 py-1 hover:bg-slate-700/50"
            >
              {monthName}
            </button>
            {showMonthPicker && (
              <div className="absolute top-11 left-0 z-20 w-56 rounded-md border border-slate-700 bg-slate-800 p-2 grid grid-cols-3 gap-1">
                {monthOptions.map((option) => (
                  <button
                    key={option.index}
                    type="button"
                    onClick={() => {
                      setMonthIndex(option.index);
                      setShowMonthPicker(false);
                    }}
                    className={
                      (option.index === monthIndex ? "bg-slate-700 text-white" : "text-slate-200 hover:bg-slate-700/60") +
                      " rounded px-2 py-1 text-xs"
                    }
                  >
                    {option.label.slice(0, 3)}
                  </button>
                ))}
              </div>
            )}

            {editingYear ? (
              <input
                type="number"
                value={year}
                onChange={(e) => {
                  const nextYear = Number(e.target.value);
                  if (Number.isFinite(nextYear)) setYear(nextYear);
                }}
                onBlur={() => setEditingYear(false)}
                className="w-24 rounded-md bg-slate-800 border border-slate-600 px-2 py-1 text-sm text-slate-100"
              />
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingYear(true);
                  setShowMonthPicker(false);
                }}
                className="text-lg font-semibold rounded-md border border-slate-600 px-3 py-1 hover:bg-slate-700/50"
              >
                {year}
              </button>
            )}

            <div className="flex flex-wrap items-center gap-1 md:ml-2">
              {stateKeys.map((code) => (
                <span key={`legend-inline-${code}`} className={`rounded-full px-2 py-1 text-[11px] ${STATUS_META[code].chip}`}>
                  {STATUS_META[code].legend}
                </span>
              ))}
            </div>
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
                    {list.length > 2 ? (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {stateKeys.map((code) => {
                          const totalByState = list.filter((cita) => String(cita?.estado || "").toUpperCase() === code).length;
                          if (totalByState === 0) return null;
                          const status = STATUS_META[code];
                          return (
                            <button
                              key={`${cell.dayKey}-${code}`}
                              type="button"
                              onClick={() => setSelectedDayKey(cell.dayKey)}
                              title={`Ver detalle del día ${cell.day}`}
                              className={`h-7 rounded-full px-3 text-[11px] font-semibold ${status.chip}`}
                            >
                              {status.label}: {totalByState}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      list.map((cita) => {
                        const code = String(cita?.estado || "").toUpperCase();
                        const status = STATUS_META[code] || STATUS_META.P;
                        return (
                          <div key={cita.idCita} className={`rounded px-1.5 py-1 text-[11px] leading-tight ${status.chip}`}>
                            <p className="font-semibold">{formatHour(cita.fechaInicio)} · {status.label}</p>
                            <p className="truncate">{cita.mascotaNombre || "Mascota"}</p>
                            <p className="truncate">{cita.propietarioNombre || "Propietario"}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {selectedDayKey && selectedDayList.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Cerrar detalle"
            onClick={() => setSelectedDayKey("")}
            className="absolute inset-0 bg-black/60"
          />

          <div className="relative z-10 w-full max-w-2xl rounded-lg border border-white/10 bg-slate-900 p-4 space-y-3 max-h-[85vh] overflow-auto">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-300">Detalle del día</p>
                <h2 className="text-lg font-semibold">{formatDayTitle(selectedDayKey)}</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayKey("")}
                className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700/50"
              >
                Cerrar
              </button>
            </div>

            <div className="space-y-2">
              {selectedDayList.map((cita) => {
                const code = String(cita?.estado || "").toUpperCase();
                const status = STATUS_META[code] || STATUS_META.P;
                return (
                  <div key={`detalle-${cita.idCita}`} className={`rounded-md border px-3 py-2 text-sm ${status.chip}`}>
                      <p className="font-semibold">{formatHour(cita.fechaInicio)} - {formatHour(cita.fechaFin)} · {status.label}</p>
                    <p>Mascota: {cita?.mascotaNombre || "-"}</p>
                    <p>Propietario: {cita?.propietarioNombre || "-"}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
