"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl, getApiErrorMessage } from "@/lib/api";

export default function CrearPropietarioPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: "", apellidos: "", cedula: "", telefono: "", correo: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [errorList, setErrorList] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validateForm = (v) => {
    const fe = {};
    const el = [];
    if (!v.nombre || v.nombre.trim().length < 2) { fe.nombre = ["Ingrese un nombre válido"]; el.push("Ingrese un nombre válido"); }
    if (!v.apellidos || v.apellidos.trim().length < 2) { fe.apellidos = ["Ingrese apellidos válidos"]; el.push("Ingrese apellidos válidos"); }
    if (!v.cedula || v.cedula.trim().length < 2) { fe.cedula = ["Ingrese una cédula válida"]; el.push("Ingrese una cédula válida"); }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!v.correo || !emailRe.test(v.correo)) { fe.correo = ["Ingrese un correo válido"]; el.push("Ingrese un correo válido"); }
    if (v.telefono && !/^\+?[0-9\s\-()]{7,}$/.test(v.telefono)) { fe.telefono = ["Teléfono inválido"]; el.push("Teléfono inválido"); }
    return { ok: Object.keys(fe).length === 0, fe, el };
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");
    setErrorList([]);
    setFieldErrors({});

    const { ok: valid, fe, el } = validateForm(form);
    if (!valid) { setFieldErrors(fe); setErrorList(el); setLoading(false); return; }

    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(apiUrl("/propietarios"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.success) {
        setOk("Propietario creado correctamente");
        setTimeout(() => router.push("/dashboard/propietarios"), 800);
      } else {
        setError(getApiErrorMessage(data, "No se pudo crear el propietario"));
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
      setLoading(false);
    }
  };

  return (
    <section className="max-w-2xl bg-white/5 border border-white/10 rounded-lg p-6 text-slate-100">
      <h1 className="text-xl font-semibold mb-1">Crear propietario</h1>
      <p className="text-slate-300 text-sm mb-4">Registra un nuevo propietario.</p>

      {Object.keys(fieldErrors).length === 0 && error && <p className="text-rose-300 text-sm mb-3">{error}</p>}
      {Object.keys(fieldErrors).length === 0 && errorList.length > 0 && (
        <ul className="mb-3 text-rose-300 text-xs list-disc pl-5 space-y-1">
          {errorList.map((m, i) => (<li key={i}>{m}</li>))}
        </ul>
      )}
      {ok && <p className="text-emerald-300 text-sm mb-3">{ok}</p>}

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
          <button type="submit" disabled={loading}
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white">
            {loading ? "Guardando..." : "Crear"}
          </button>
        </div>
      </form>
    </section>
  );
}
