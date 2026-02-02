"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_BASE = "http://localhost:3000/api/v1";

export default function EditarPropietarioPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [errorList, setErrorList] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({ nombre: "", apellidos: "", cedula: "", telefono: "", correo: "" });

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token || !id) { setError("Falta token o id"); setLoading(false); return; }
    fetch(`${API_BASE}/propietarios/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const p = data?.data || data;
        setForm({
          nombre: p?.nombre ?? "",
          apellidos: p?.apellidos ?? "",
          cedula: p?.cedula ?? "",
          telefono: p?.telefono ?? "",
          correo: p?.correo ?? "",
        });
      })
      .catch(() => setError("No se pudo cargar el propietario"))
      .finally(() => setLoading(false));
  }, [id]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    // Confirmación antes de actualizar
    const okUpdate = confirm("¿Actualizar este propietario?");
    if (!okUpdate) return;
    setSaving(true);
    setOk(""); setError(""); setFieldErrors({}); setErrorList([]);

    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(`${API_BASE}/propietarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.success) {
        setOk("Propietario actualizado correctamente");
        setTimeout(() => router.push("/dashboard/propietarios"), 800);
      } else {
        setError(data?.message || "No se pudo actualizar el propietario");
        const arr = Array.isArray(data?.errors) ? data.errors : [];
        if (arr.length) {
          const byField = {};
          setErrorList(arr.map((e) => e.msg || e.message || JSON.stringify(e)));
          arr.forEach((e) => {
            const key = e.field || e.path || e.param || "";
            if (!key) return;
            if (!byField[key]) byField[key] = [];
            byField[key].push(e.msg || e.message || "Error");
          });
          setFieldErrors(byField);
        }
      }
    } catch (_) {
      setError("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="max-w-2xl bg-white/5 border border-white/10 rounded-lg p-6 text-slate-100">
      <h1 className="text-xl font-semibold mb-1">Editar propietario</h1>
      <p className="text-slate-300 text-sm mb-4">Actualiza la información del propietario.</p>

      {loading && <p className="text-slate-300 text-sm">Cargando...</p>}
      {!loading && error && <p className="text-rose-300 text-sm mb-3">{error}</p>}
      {!loading && ok && <p className="text-emerald-300 text-sm mb-3">{ok}</p>}

      {!loading && !error && (
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Nombre</label>
            <input name="nombre" value={form.nombre} onChange={onChange}
                   className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.nombre ? "border-red-500" : "border-slate-700"}`} />
            {fieldErrors.nombre && <p className="mt-1 text-xs text-rose-300">{fieldErrors.nombre[0]}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Apellidos</label>
            <input name="apellidos" value={form.apellidos} onChange={onChange}
                   className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.apellidos ? "border-red-500" : "border-slate-700"}`} />
            {fieldErrors.apellidos && <p className="mt-1 text-xs text-rose-300">{fieldErrors.apellidos[0]}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Cédula</label>
            <input name="cedula" value={form.cedula} onChange={onChange}
                   className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.cedula ? "border-red-500" : "border-slate-700"}`} />
            {fieldErrors.cedula && <p className="mt-1 text-xs text-rose-300">{fieldErrors.cedula[0]}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Teléfono</label>
            <input name="telefono" value={form.telefono} onChange={onChange}
                   className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.telefono ? "border-red-500" : "border-slate-700"}`} />
            {fieldErrors.telefono && <p className="mt-1 text-xs text-rose-300">{fieldErrors.telefono[0]}</p>}
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm text-slate-300 mb-1">Correo</label>
            <input type="email" name="correo" value={form.correo} onChange={onChange}
                   className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.correo ? "border-red-500" : "border-slate-700"}`} />
            {fieldErrors.correo && <p className="mt-1 text-xs text-rose-300">{fieldErrors.correo[0]}</p>}
          </div>

          <div className="sm:col-span-2 pt-2 flex items-center gap-2">
            <button type="button" onClick={() => router.push("/dashboard/propietarios")} className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/50">Cancelar</button>
            <button type="submit" disabled={saving}
                    className="inline-flex items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white">
              {saving ? "Guardando..." : "Actualizar"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
