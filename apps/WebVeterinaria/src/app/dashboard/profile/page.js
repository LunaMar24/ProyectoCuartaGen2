"use client";

import { useEffect, useState } from "react";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [ok, setOk] = useState("");
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "" });
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token) {
      setError("No hay sesión activa");
      return;
    }

    fetch("http://localhost:3000/api/v1/auth/profile", {
      method: "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success) {
          setProfile(data.data);
          setForm({
            nombre: data.data?.nombre ?? "",
            email: data.data?.email ?? "",
            telefono: data.data?.telefono ?? "",
          });
        }
        else setError(data?.message || "No se pudo obtener el perfil");
      })
      .catch(() => setError("Error de conexión"));
  }, []);

  // Ocultar el mensaje de éxito después de 8 segundos
  useEffect(() => {
    if (!ok) return;
    const t = setTimeout(() => setOk(""), 8000);
    return () => clearTimeout(t);
  }, [ok]);

  const onChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setOk("");
    setError("");
    setFieldErrors({});

    const token = localStorage.getItem("authToken");
    if (!token) {
      setSaving(false);
      setError("No hay sesión activa");
      return;
    }

    // PUT al mismo recurso /auth/profile para actualizar datos básicos
    try {
      const res = await fetch("http://localhost:3000/api/v1/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.success) {
        const updated = data.data ?? form;
        setProfile((prev) => ({ ...prev, ...updated }));
        setForm((f) => ({ ...f, ...updated }));
        setOk("Perfil actualizado correctamente");
      } else {
        setError(data?.message || "No se pudo actualizar el perfil");
        const arr = Array.isArray(data?.errors) ? data.errors : [];
        if (arr.length) {
          const byField = {};
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <section className="lg:col-span-2 bg-white/5 border border-white/10 rounded-lg p-6 text-slate-100">
        <h1 className="text-xl font-semibold mb-1">Perfil</h1>
        <p className="text-slate-300 text-sm mb-4">Visualiza la información del usuario.</p>

        {error && <p className="text-rose-400 text-sm mb-4">{error}</p>}
        {ok && <p className="text-emerald-300 text-sm mb-4">{ok}</p>}
        {!profile && !error && <p className="text-slate-300 text-sm">Cargando...</p>}

        {profile && (
          <form onSubmit={onSubmit} className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-3 items-center">
              <label className="col-span-1 text-slate-300">Nombre:</label>
              <div className="col-span-2">
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={onChange}
                  className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.nombre ? "border-red-500" : "border-slate-700"}`}
                />
                {fieldErrors.nombre && (
                  <p className="mt-1 text-xs text-rose-300">{fieldErrors.nombre[0]}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 items-center">
              <label className="col-span-1 text-slate-300">Email:</label>
              <div className="col-span-2">
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={onChange}
                  className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.email ? "border-red-500" : "border-slate-700"}`}
                />
                {fieldErrors.email && (
                  <p className="mt-1 text-xs text-rose-300">{fieldErrors.email[0]}</p>
                )}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 items-center">
              <label className="col-span-1 text-slate-300">Teléfono:</label>
              <div className="col-span-2">
                <input
                  name="telefono"
                  value={form.telefono}
                  onChange={onChange}
                  className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.telefono ? "border-red-500" : "border-slate-700"}`}
                />
                {fieldErrors.telefono && (
                  <p className="mt-1 text-xs text-rose-300">{fieldErrors.telefono[0]}</p>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white"
              >
                {saving ? "Guardando..." : "Actualizar"}
              </button>
            </div>
          </form>
        )}
      </section>

      <aside className="bg-white/5 border border-white/10 rounded-lg p-6 text-slate-100">
        <div className="w-24 h-24 rounded-full bg-slate-700 mx-auto mb-4 ring-2 ring-emerald-400/60" />
        <div className="space-y-2 text-sm">
          <p><span className="text-slate-400">Nombre:</span> {form.nombre || "-"}</p>
          <p><span className="text-slate-400">Email:</span> {form.email || "-"}</p>
          <p><span className="text-slate-400">Teléfono:</span> {form.telefono || "-"}</p>
        </div>
      </aside>
    </div>
  );
}
