"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { API_BASE } from "@/lib/api";
const API_PETS = `${API_BASE}/mascotas`;

export default function MascotasPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ nombre: "", especie: "", raza: "", edad: "", propietario: "" });

  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("authToken") : null), []);

  const parsePagination = (data) => {
    const p = data?.pagination || data?.meta || data?.pageInfo || {};
    const page = p.page ?? p.currentPage ?? data?.page ?? 1;
    const per = p.limit ?? p.perPage ?? p.pageSize ?? data?.limit ?? limit;
    const totalPages = p.totalPages ?? p.pages ?? Math.max(1, Math.ceil((p.total ?? data?.total ?? items.length) / (per || 10)));
    const total = p.total ?? data?.total ?? items.length;
    return { page, limit: per, totalPages, total };
  };

  const fetchPage = (pg = 1, lm = limit, f = filters) => {
    if (!token) { setError("No hay token de autenticación"); setLoading(false); return; }
    setLoading(true); setError("");

    const params = new URLSearchParams({ page: String(pg), limit: String(lm) });
    const hasFilters = Object.values(f || {}).some((v) => (typeof v === "string" ? v.trim() : v));
    const url = hasFilters ? `${API_PETS}/search?${params.toString()}` : `${API_PETS}?${params.toString()}`;
    const payload = hasFilters
      ? Object.entries(f || {}).reduce((acc, [k, v]) => {
          const val = typeof v === "string" ? v.trim() : v;
          if (val) acc[k] = val;
          return acc;
        }, {})
      : undefined;

    fetch(url, {
      method: hasFilters ? "POST" : "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
      .catch(() => setError("No se pudo obtener la lista de mascotas"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPage(page, limit, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = (e) => { e?.preventDefault?.(); fetchPage(1, limit, filters); };
  const handleClearFilters = () => { const empty = { nombre: "", especie: "", raza: "", edad: "", propietario: "" }; setFilters(empty); fetchPage(1, limit, empty); };

  const handleDelete = (id) => {
    if (!confirm("¿Eliminar esta mascota?")) return;
    fetch(`${API_PETS}/${id}`, { method: "DELETE", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } })
      .then((r) => r.json().catch(() => ({})))
      .then(() => setItems((prev) => prev.filter((u) => String(u.id ?? u._id) !== String(id))))
      .catch(() => alert("No se pudo eliminar la mascota"));
  };

  const canPrev = page > 1;
  const canNext = page < (pagination.totalPages || 1);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Mascotas</h1>
        <Link href="/dashboard/mascotas/crear" className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Crear mascota
        </Link>
      </div>

      {/* Filtros */}
      <form onSubmit={handleApplyFilters} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs text-slate-300 mb-1">Nombre</label>
            <input type="text" value={filters.nombre} onChange={(e) => setFilters((prev) => ({ ...prev, nombre: e.target.value }))}
                   placeholder="Nombre" className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400" />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Especie</label>
            <input type="text" value={filters.especie} onChange={(e) => setFilters((prev) => ({ ...prev, especie: e.target.value }))}
                   placeholder="Especie" className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400" />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Raza</label>
            <input type="text" value={filters.raza} onChange={(e) => setFilters((prev) => ({ ...prev, raza: e.target.value }))}
                   placeholder="Raza" className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400" />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Edad</label>
            <input type="text" value={filters.edad} onChange={(e) => setFilters((prev) => ({ ...prev, edad: e.target.value }))}
                   placeholder="Edad" className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400" />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Propietario</label>
            <input type="text" value={filters.propietario} onChange={(e) => setFilters((prev) => ({ ...prev, propietario: e.target.value }))}
                   placeholder="nombre (cédula)" className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400" />
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
              <th className="text-left px-4 py-2">Nombre</th>
              <th className="text-left px-4 py-2">Especie</th>
              <th className="text-left px-4 py-2">Raza</th>
              <th className="text-left px-4 py-2">Edad</th>
              <th className="text-left px-4 py-2">Propietario</th>
              <th className="px-4 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (<tr><td className="px-4 py-3 text-slate-300" colSpan={6}>Cargando...</td></tr>)}
            {!loading && error && (<tr><td className="px-4 py-3 text-rose-300" colSpan={6}>{error}</td></tr>)}
            {!loading && !error && items.length === 0 && (<tr><td className="px-4 py-3 text-slate-300" colSpan={6}>Sin mascotas</td></tr>)}
            {!loading && !error && items.map((m) => {
              const id = m.id ?? m._id;
              const propName = m.propietario?.nombre ?? m.propietarioNombre ?? m.propietario ?? "-";
              return (
                <tr key={id} className="border-t border-white/10">
                  <td className="px-4 py-2">{m.nombre || "-"}</td>
                  <td className="px-4 py-2">{m.especie || "-"}</td>
                  <td className="px-4 py-2">{m.raza || "-"}</td>
                  <td className="px-4 py-2">{m.edad || "-"}</td>
                  <td className="px-4 py-2">{propName}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      {/* Crear cita */}
                      <Link href={`/dashboard/mascotas/${id}/cita`} title="Crear cita"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-700/60 text-emerald-300 hover:text-emerald-200">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 2v4m8-4v4M3 10h18M6 6h12a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 13v4m-2-2h4" />
                        </svg>
                      </Link>
                      {/* Historial */}
                      <Link href={`/dashboard/mascotas/${id}/historial`} title="Historial"
                            onClick={() => { if (typeof window !== "undefined") { localStorage.setItem("lastMascotasURL", "/dashboard/mascotas"); } }}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-700/60 text-amber-300 hover:text-amber-200">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 4h6a2 2 0 012 2v12a2 2 0 01-2 2H9a2 2 0 01-2-2V6a2 2 0 012-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 8h6M9 12h6M9 16h4" />
                        </svg>
                      </Link>
                      {/* Editar */}
                      <Link href={`/dashboard/mascotas/${id}`} title="Modificar"
                            className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-700/60 text-sky-300 hover:text-sky-200">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M4 13.5V20h6.5l9-9a2.5 2.5 0 10-3.536-3.536l-9 9z" />
                        </svg>
                      </Link>
                      {/* Eliminar */}
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
