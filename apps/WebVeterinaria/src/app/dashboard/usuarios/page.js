"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_BASE, getApiErrorMessage } from "@/lib/api";

// Endpoints REST de usuarios:
//  - GET    API_BASE + /users           -> lista paginada
//  - POST   API_BASE + /users/search    -> búsqueda por campos
//  - DELETE API_BASE + /users/:id       -> eliminar usuario
const API_USERS = `${API_BASE}/users`;

export default function UsuariosListPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Paginación y filtros
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ nombre: "", email: "", telefono: "", fechaDesde: "", fechaHasta: "" });

  // Utilidad: convertir fechas date/datetime-local a ISO; start/end of day
  const toIsoIfDate = (val, endOfDay = false) => {
    if (!val) return undefined;
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const d = new Date(`${val}T${endOfDay ? "23:59:59" : "00:00:00"}`);
      return d.toISOString();
    }
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(val)) {
      const d = new Date(val);
      return d.toISOString();
    }
    return val;
  };

  const parsePagination = (data) => {
    const p = data?.pagination || data?.meta || data?.pageInfo || {};
    const current = p.page ?? p.currentPage ?? data?.page ?? 1;
    const per = p.limit ?? p.perPage ?? p.pageSize ?? data?.limit ?? limit;
    const totalPages = p.totalPages ?? p.pages ?? Math.max(1, Math.ceil((p.total ?? data?.total ?? items.length) / (per || 10)));
    const total = p.total ?? data?.total ?? items.length;
    return { page: current, limit: per, totalPages, total };
  };

  const formatTipoUsuario = (value) => {
    if (!value) return "-";
    const normalized = String(value).trim();
    if (normalized.toUpperCase() === "A") return "Administrador";
    if (normalized.toUpperCase() === "C") return "Cliente";
    return normalized;
  };

  const fetchPage = (pg = 1, lm = limit, f = filters) => {
    const tk = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (!tk) { setError("No hay token de autenticación"); setLoading(false); return; }
    setLoading(true); setError("");

    const params = new URLSearchParams({ page: String(pg), limit: String(lm) });
    const hasFilters = Object.values(f || {}).some((v) => (typeof v === "string" ? v.trim() : v));
    const url = hasFilters ? `${API_USERS}/search?${params.toString()}` : `${API_USERS}?${params.toString()}`;
    const payload = hasFilters
      ? Object.entries(f || {}).reduce((acc, [k, v]) => {
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
      .catch(() => setError("No se pudo obtener la lista de usuarios"))
      .finally(() => setLoading(false));
  };

  // Carga inicial
  useEffect(() => { fetchPage(page, limit, filters); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);

  const handleDelete = (id) => {
    if (!confirm("¿Eliminar este usuario?")) return;
    const tk = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    fetch(`${API_USERS}/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` },
    })
      .then((r) => r.json().catch(() => ({})))
      .then((data) => {
        if (data?.success) {
          setItems((prev) => prev.filter((u) => String(u.id ?? u._id) !== String(id)));
          return;
        }
        alert(getApiErrorMessage(data, "No se pudo eliminar el usuario"));
      })
      .catch(() => alert("No se pudo eliminar el usuario"));
  };

  const handleApplyFilters = (e) => { e?.preventDefault?.(); fetchPage(1, limit, filters); };
  const handleClearFilters = () => { const empty = { nombre: "", email: "", telefono: "", fechaDesde: "", fechaHasta: "" }; setFilters(empty); fetchPage(1, limit, empty); };

  const canPrev = page > 1;
  const canNext = page < (pagination.totalPages || 1);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Usuarios</h1>
        <Link href="/dashboard/usuarios/crear" className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-sm font-semibold text-white">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Crear usuario
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
            <label className="block text-xs text-slate-300 mb-1">Email</label>
            <input type="text" value={filters.email} onChange={(e) => setFilters((prev) => ({ ...prev, email: e.target.value }))}
                   placeholder="correo@dominio" className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400" />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Teléfono</label>
            <input type="text" value={filters.telefono} onChange={(e) => setFilters((prev) => ({ ...prev, telefono: e.target.value }))}
                   placeholder="Teléfono" className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400" />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Creado desde</label>
            <input type="date" value={filters.fechaDesde} onChange={(e) => setFilters((prev) => ({ ...prev, fechaDesde: e.target.value }))}
                   className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100" />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Creado hasta</label>
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
              <th className="text-left px-4 py-2">Nombre</th>
              <th className="text-left px-4 py-2">Email</th>
              <th className="text-left px-4 py-2">Teléfono</th>
              <th className="text-left px-4 py-2">Tipo</th>
              <th className="text-left px-4 py-2">Creación</th>
              <th className="px-4 py-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading && (<tr><td className="px-4 py-3 text-slate-300" colSpan={6}>Cargando...</td></tr>)}
            {!loading && error && (<tr><td className="px-4 py-3 text-rose-300" colSpan={6}>{error}</td></tr>)}
            {!loading && !error && items.length === 0 && (<tr><td className="px-4 py-3 text-slate-300" colSpan={6}>Sin usuarios</td></tr>)}
            {!loading && !error && items.map((u) => {
              const id = u.id ?? u._id;
              const created = u.fecha_creacion || u.createdAt || u.fechaCreacion;
              const tipo = u.tipo_Usuario;
              return (
                <tr key={id} className="border-t border-white/10">
                  <td className="px-4 py-2">{u.nombre || u.name || "-"}</td>
                  <td className="px-4 py-2">{u.email || "-"}</td>
                  <td className="px-4 py-2">{u.telefono || u.phone || "-"}</td>
                  <td className="px-4 py-2">{formatTipoUsuario(tipo)}</td>
                  <td className="px-4 py-2">{created ? new Date(created).toLocaleString() : "-"}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <Link
                        title="Editar"
                        href={`/dashboard/usuarios/${id}`}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-700/60 text-sky-400 hover:text-sky-300"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 3.487a2.1 2.1 0 0 1 2.97 2.97L7.125 19.165 3 20l.835-4.125 13.027-12.388z" />
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
