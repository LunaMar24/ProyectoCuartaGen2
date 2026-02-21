"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { API_BASE, getApiErrorMessage } from "@/lib/api";
const API_PROPS = `${API_BASE}/propietarios`;

export default function PropietariosPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filters, setFilters] = useState({ nombre: "", apellidos: "", telefono: "", correo: "" });

  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("authToken") : null), []);

  const parsePagination = (data) => {
    // Soporta varias formas comunes de paginación
    const p = data?.pagination || data?.meta || data?.pageInfo || {};
    const page = p.page ?? p.currentPage ?? data?.page ?? 1;
    const per = p.limit ?? p.perPage ?? p.pageSize ?? data?.limit ?? limit;
    const totalPages = p.totalPages ?? p.pages ?? Math.max(1, Math.ceil((p.total ?? data?.total ?? items.length) / (per || 10)));
    const total = p.total ?? data?.total ?? items.length;
    return { page, limit: per, totalPages, total };
  };

  const fetchPage = (pg = 1, lm = limit, f = filters) => {
    if (!token) {
      setError("No hay token de autenticación");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(pg), limit: String(lm) });
    const hasFilters = Object.values(f || {}).some((v) => {
      const val = typeof v === "string" ? v.trim() : v;
      return !!val;
    });
    const url = hasFilters ? `${API_PROPS}/search?${params.toString()}` : `${API_PROPS}?${params.toString()}`;
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
      .catch(() => setError("No se pudo obtener la lista de propietarios"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPage(page, limit, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApplyFilters = (e) => {
    e?.preventDefault?.();
    // Siempre ir a la primera página al aplicar filtros
    fetchPage(1, limit, filters);
  };

  const handleClearFilters = () => {
    const empty = { nombre: "", apellidos: "", telefono: "", correo: "" };
    setFilters(empty);
    fetchPage(1, limit, empty);
  };

  const handleDelete = (id) => {
    if (!confirm("¿Eliminar este propietario?")) return;
    fetch(`${API_PROPS}/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json().catch(() => ({})))
      .then((data) => {
        if (data?.success) {
          setItems((prev) => prev.filter((u) => String(u.id ?? u._id) !== String(id)));
          return;
        }
        alert(getApiErrorMessage(data, "No se pudo eliminar el propietario"));
      })
      .catch(() => alert("No se pudo eliminar el propietario"));
  };

  const canPrev = page > 1;
  const canNext = page < (pagination.totalPages || 1);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Propietarios</h1>
        <Link
          href="/dashboard/propietarios/crear"
          className="inline-flex items-center gap-2 rounded-md bg-emerald-600 hover:bg-emerald-700 px-3 py-2 text-sm font-semibold text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4"/></svg>
          Crear propietario
        </Link>
      </div>

      {/* Filtros */}
      <form onSubmit={handleApplyFilters} className="bg-white/5 border border-white/10 rounded-lg p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-300 mb-1">Nombre</label>
            <input
              type="text"
              value={filters.nombre}
              onChange={(e) => setFilters((prev) => ({ ...prev, nombre: e.target.value }))}
              placeholder="Nombre"
              className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Apellidos</label>
            <input
              type="text"
              value={filters.apellidos}
              onChange={(e) => setFilters((prev) => ({ ...prev, apellidos: e.target.value }))}
              placeholder="Apellidos"
              className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Teléfono</label>
            <input
              type="text"
              value={filters.telefono}
              onChange={(e) => setFilters((prev) => ({ ...prev, telefono: e.target.value }))}
              placeholder="Teléfono"
              className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-300 mb-1">Correo</label>
            <input
              type="text"
              value={filters.correo}
              onChange={(e) => setFilters((prev) => ({ ...prev, correo: e.target.value }))}
              placeholder="Correo"
              className="w-full rounded-md bg-slate-800 border border-slate-600 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400"
            />
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
              <th className="text-left px-4 py-2">Apellidos</th>
              <th className="text-left px-4 py-2">Cédula</th>
              <th className="text-left px-4 py-2">Teléfono</th>
              <th className="text-left px-4 py-2">Correo</th>
              <th className="px-4 py-2 text-right">Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td className="px-4 py-3 text-slate-300" colSpan={6}>Cargando...</td></tr>
            )}
            {!loading && error && (
              <tr><td className="px-4 py-3 text-rose-300" colSpan={6}>{error}</td></tr>
            )}
            {!loading && !error && items.length === 0 && (
              <tr><td className="px-4 py-3 text-slate-300" colSpan={6}>Sin propietarios</td></tr>
            )}
            {!loading && !error && items.map((p) => {
              const id = p.id ?? p._id;
              return (
                <tr key={id} className="border-t border-white/10">
                  <td className="px-4 py-2">{p.nombre || "-"}</td>
                  <td className="px-4 py-2">{p.apellidos || "-"}</td>
                  <td className="px-4 py-2">{p.cedula || "-"}</td>
                  <td className="px-4 py-2">{p.telefono || "-"}</td>
                  <td className="px-4 py-2">{p.correo || "-"}</td>
                  <td className="px-4 py-2">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/dashboard/propietarios/${id}`}
                        title="Modificar"
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-700/60 text-sky-300 hover:text-sky-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M4 13.5V20h6.5l9-9a2.5 2.5 0 10-3.536-3.536l-9 9z" />
                        </svg>
                      </Link>
                      <button
                        title="Eliminar"
                        onClick={() => handleDelete(id)}
                        className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-700/60 text-rose-400 hover:text-rose-300"
                      >
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

      {/* Controles de paginación */}
      <div className="flex items-center justify-between text-sm text-slate-300">
        <div>
          Página {pagination.page || page} de {pagination.totalPages || 1}
          {typeof pagination.total === "number" && (
            <span className="ml-2">• Total: {pagination.total}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => canPrev && fetchPage(page - 1, limit, filters)}
            disabled={!canPrev}
            className="rounded-md border border-slate-600 px-2 py-1 disabled:opacity-50"
          >
            Anterior
          </button>
          <button
            onClick={() => canNext && fetchPage(page + 1, limit, filters)}
            disabled={!canNext}
            className="rounded-md border border-slate-600 px-2 py-1 disabled:opacity-50"
          >
            Siguiente
          </button>
          <select
            value={limit}
            onChange={(e) => {
              const v = Number(e.target.value) || 10;
              setLimit(v);
              fetchPage(1, v, filters);
            }}
            className="bg-slate-800 border border-slate-600 rounded-md px-2 py-1"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>{n}/página</option>
            ))}
          </select>
        </div>
      </div>
    </section>
  );
}
