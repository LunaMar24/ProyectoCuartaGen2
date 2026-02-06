"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { API_BASE } from "@/lib/api";
const API_H = `${API_BASE}/historiales`;

export default function HistorialesPage() {
  const searchParams = useSearchParams();
  // Normalizar el parámetro ?mascota soportando valores como "(5) Luna Vi" o "5"
  const extractMascotaId = (val) => {
    if (val === null || val === undefined) return "";
    const s = String(val).trim();
    let m = s.match(/^\(\s*(\d+)\s*\)/);
    if (m) return String(Number(m[1]));
    m = s.match(/^(\d+)/);
    if (m) return String(Number(m[1]));
    const n = Number(s);
    return Number.isFinite(n) && n > 0 ? String(n) : "";
  };
  const rawMascotaParam = searchParams?.get("mascota") || "";
  const initialMascota = useMemo(() => extractMascotaId(rawMascotaParam), [rawMascotaParam]);
  const mascotaLocked = useMemo(() => String(initialMascota).trim() !== "", [initialMascota]);
  const router = useRouter();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ mascota: initialMascota, motivo: "", diagnostico: "", fechaDesde: "", fechaHasta: "" });
  const [mascotaDisplay, setMascotaDisplay] = useState("");

  // Token se leerá justo antes de cada fetch para evitar condiciones de carrera

  const parsePagination = (data) => {
    const p = data?.pagination || data?.meta || data?.pageInfo || {};
    const page = p.page ?? p.currentPage ?? data?.page ?? 1;
    const per = p.limit ?? p.perPage ?? p.pageSize ?? data?.limit ?? limit;
    const totalPages = p.totalPages ?? p.pages ?? Math.max(1, Math.ceil((p.total ?? data?.total ?? items.length) / (per || 10)));
    const total = p.total ?? data?.total ?? items.length;
    return { page, limit: per, totalPages, total };
  };

  const toIsoIfDate = (val, endOfDay = false) => {
    if (!val) return undefined;
    // si viene en formato YYYY-MM-DD (date), convertir a ISO inicio/fin del día local
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const dt = new Date(`${val}T${endOfDay ? "23:59:59" : "00:00:00"}`);
      return dt.toISOString();
    }
    // si viene en formato datetime-local, convertir directo a ISO
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) {
      const dt = new Date(val);
      return dt.toISOString();
    }
    return val; // si ya es ISO u otro formato manejado por el backend
  };

  const fetchPage = (pg = 1, lm = limit, f = filters) => {
    const tk = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (!tk) { setError("No hay token de autenticación"); setLoading(false); return; }
    setLoading(true); setError("");

    // Asegurar que, si la mascota está bloqueada por contexto, enviemos el valor con el formato "(id) Nombre"
    const effectiveFilters = { ...(f || {}) };
    if (mascotaLocked) {
      const idStr = String(initialMascota || "").trim();
      effectiveFilters.mascota = (mascotaDisplay && mascotaDisplay.trim()) || (idStr ? `(${idStr})` : effectiveFilters.mascota);
    }

    const params = new URLSearchParams({ page: String(pg), limit: String(lm) });
    const hasFilters = Object.values(effectiveFilters || {}).some((v) => (typeof v === "string" ? v.trim() : v));
    const url = hasFilters ? `${API_H}/search?${params.toString()}` : `${API_H}?${params.toString()}`;
    const payload = hasFilters
      ? Object.entries(effectiveFilters || {}).reduce((acc, [k, v]) => {
          let val = typeof v === "string" ? v.trim() : v;
          if (!val) return acc;
          if (k === "fechaDesde") val = toIsoIfDate(val, false);
          if (k === "fechaHasta") val = toIsoIfDate(val, true);
          if (val) acc[k] = val;
          return acc;
        }, {})
      : undefined;

    fetch(url, {
      method: hasFilters ? "POST" : "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` },
      body: hasFilters ? JSON.stringify(payload) : undefined,
    })
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data ?? [];
        setItems(list);
        const p = parsePagination(data);
        setPagination(p);
        setPage(p.page || pg);
        setLimit(p.limit || lm);
      })
      .catch(() => setError("No se pudo obtener la lista de historiales"))
      .finally(() => setLoading(false));
  };

  // Cargar al abrir, pero si la mascota está bloqueada, esperar a tener el display listo para enviar "(ID) Nombre"
  useEffect(() => {
    if (mascotaLocked && !mascotaDisplay) return; // esperar a que cargue el nombre
    fetchPage(page, limit, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mascotaLocked, mascotaDisplay]);

  // Si cambia el query param ?mascota (por regresar desde crear/editar), sincronizar filtros y recargar
  useEffect(() => {
    const id = String(initialMascota || "").trim();
    const f = { ...filters, mascota: id };
    setFilters(f);
    // si está bloqueada, esperar a tener "(ID) Nombre" para que el backend reciba el texto completo
    if (mascotaLocked && !mascotaDisplay) return;
    fetchPage(1, limit, f);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMascota, mascotaDisplay, mascotaLocked]);

  // Refrescar automáticamente cuando la ventana recobra foco (p.ej., al volver de crear/editar)
  useEffect(() => {
    const onFocus = () => {
      const f = mascotaLocked ? { ...filters, mascota: initialMascota } : filters;
      fetchPage(1, limit, f);
    };
    if (typeof window !== "undefined") window.addEventListener("focus", onFocus);
    return () => { if (typeof window !== "undefined") window.removeEventListener("focus", onFocus); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mascotaLocked, initialMascota, limit, filters]);

  // Si viene mascota por query, obtener su nombre para mostrar "(id) Nombre" y bloquear edición
  useEffect(() => {
    const id = String(initialMascota || "").trim();
    if (!id) { setMascotaDisplay(""); return; }
    const tk = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (!tk) return;
    // Buscar el nombre de la mascota para mostrarlo
    fetch(`${API_BASE}/mascotas/${id}`, { method: "GET", headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` } })
      .then((r) => r.json())
      .then((data) => {
        const m = data?.data || data;
        const name = m?.nombre ?? "";
        setMascotaDisplay(`(${id}) ${name || ""}`.trim());
      })
      .catch(() => setMascotaDisplay(`(${id})`));
  }, [initialMascota]);

  const handleApplyFilters = (e) => {
    e?.preventDefault?.();
    const f = mascotaLocked ? { ...filters, mascota: initialMascota } : filters;
    fetchPage(1, limit, f);
  };
  const handleClearFilters = () => {
    const empty = { mascota: mascotaLocked ? initialMascota : "", motivo: "", diagnostico: "", fechaDesde: "", fechaHasta: "" };
    setFilters(empty); fetchPage(1, limit, empty);
  };

  const handleDelete = (id) => {
    if (!confirm("¿Eliminar este historial?")) return;
    {
      const tk = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      fetch(`${API_H}/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` } })
      .then((r) => r.json().catch(() => ({})))
      .then(() => setItems((prev) => prev.filter((u) => String(u.id ?? u._id) !== String(id))))
      .catch(() => alert("No se pudo eliminar el historial"));
    }
  };

  const canPrev = page > 1;
  const canNext = page < (pagination.totalPages || 1);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Historiales</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { const back = (typeof window !== "undefined" ? localStorage.getItem("lastMascotasURL") : null) || "/dashboard/mascotas"; router.push(back); }}
            className="inline-flex items-center gap-2 rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50"
          >
            Regresar
          </button>
          <Link href={mascotaLocked ? `/dashboard/historiales/crear?mascota=${encodeURIComponent(mascotaDisplay || (initialMascota ? `(${initialMascota})` : ""))}` : "/dashboard/historiales/crear"} className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Crear historial
          </Link>
        </div>
      </div>

      {/* Filtros */}
      <form onSubmit={handleApplyFilters} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <div>
            <label className="block text-xs text-slate-300 mb-1">Mascota</label>
            <input
              type="text"
              value={mascotaLocked ? (mascotaDisplay || (initialMascota ? `(${initialMascota})` : "")) : filters.mascota}
              onChange={(e) => setFilters((prev) => (mascotaLocked ? prev : { ...prev, mascota: e.target.value }))}
              placeholder={mascotaLocked ? "(id) Nombre" : "ID de mascota"}
              disabled={mascotaLocked}
              className={`w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 ${mascotaLocked ? "opacity-70 cursor-not-allowed" : ""}`}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Motivo</label>
            <input
              type="text"
              value={filters.motivo}
              onChange={(e) => setFilters((prev) => ({ ...prev, motivo: e.target.value }))}
              placeholder="Motivo"
              className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Diagnóstico</label>
            <input type="text" value={filters.diagnostico} onChange={(e) => setFilters((prev) => ({ ...prev, diagnostico: e.target.value }))}
                   placeholder="Diagnóstico" className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400" />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Desde</label>
            <input type="date" value={filters.fechaDesde} onChange={(e) => setFilters((prev) => ({ ...prev, fechaDesde: e.target.value }))}
                   className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100" />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Hasta</label>
            <input type="date" value={filters.fechaHasta} onChange={(e) => setFilters((prev) => ({ ...prev, fechaHasta: e.target.value }))}
                   className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100" />
          </div>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <button type="button" onClick={handleClearFilters} className="rounded-md border border-slate-600 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700/50">Limpiar</button>
          <button type="submit" className="inline-flex items-center gap-2 rounded-md bg-sky-600 hover:bg-sky-700 px-3 py-2 text-sm font-semibold text-white">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M4 4h16M4 10h10M4 16h7"/></svg>
            Aplicar filtros
          </button>
        </div>
      </form>

      <div className="bg-white/5 border border-white/10 rounded-lg overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-800/60 text-slate-300">
            <tr>
              <th className="text-left px-4 py-2">Mascota</th>
              <th className="text-left px-4 py-2">Fecha de atención</th>
              <th className="text-left px-4 py-2">Motivo</th>
              <th className="text-left px-4 py-2">Diagnóstico</th>
              <th className="px-4 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (<tr><td className="px-4 py-3 text-slate-300" colSpan={5}>Cargando...</td></tr>)}
            {!loading && error && (<tr><td className="px-4 py-3 text-rose-300" colSpan={5}>{error}</td></tr>)}
            {!loading && !error && items.length === 0 && (<tr><td className="px-4 py-3 text-slate-300" colSpan={5}>Sin historiales</td></tr>)}
            {!loading && !error && items.map((h) => {
              const id = h.id ?? h._id;
              const mascotaName = h.mascotaNombre ?? h.mascota?.nombre ?? h.mascota ?? "-";
              const fecha = h.fechaAtencion ? new Date(h.fechaAtencion) : null;
              const fechaFmt = fecha ? fecha.toLocaleString() : "-";
              return (
                <tr key={id} className="border-t border-white/10">
                  <td className="px-4 py-2">{mascotaName}</td>
                  <td className="px-4 py-2">{fechaFmt}</td>
                  <td className="px-4 py-2">{h.motivo || "-"}</td>
                  <td className="px-4 py-2">{h.diagnostico || "-"}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/historiales/${id}`} title="Modificar"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-700/60 text-sky-300 hover:text-sky-200">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M4 13.5V20h6.5l9-9a2.5 2.5 0 10-3.536-3.536l-9 9z" />
                        </svg>
                      </Link>
                      <button title="Eliminar" onClick={() => handleDelete(id)}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-700/60 text-rose-400 hover:text-rose-300">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a2 2 0 012-2h4a2 2 0 012 2m-8 0h10" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="flex items-center justify-between text-sm text-slate-300">
        <div>
          Página {pagination.page || page} de {pagination.totalPages || 1}
          {typeof pagination.total === "number" && (<span className="ml-2">• Total: {pagination.total}</span>)}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => canPrev && fetchPage(page - 1, limit, filters)} disabled={!canPrev}
                  className="rounded-md border border-slate-600 px-2 py-1 disabled:opacity-50">Anterior</button>
          <button onClick={() => canNext && fetchPage(page + 1, limit, filters)} disabled={!canNext}
                  className="rounded-md border border-slate-600 px-2 py-1 disabled:opacity-50">Siguiente</button>
          <select value={limit} onChange={(e) => { const v = Number(e.target.value) || 10; setLimit(v); fetchPage(1, v, filters); }}
                  className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1">
            {[5, 10, 20, 50].map((n) => (<option key={n} value={n}>{n}/página</option>))}
          </select>
        </div>
      </div>
    </section>
  );
}
