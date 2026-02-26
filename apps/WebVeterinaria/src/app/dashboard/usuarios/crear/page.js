"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiUrl, getApiErrorMessage } from "@/lib/api";

export default function CrearUsuarioPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: "", email: "", telefono: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [errorList, setErrorList] = useState([]); // lista de mensajes del backend
  const [fieldErrors, setFieldErrors] = useState({}); // errores por campo { email: [..], password:[..] }

  // Validaciones simples en cliente para mejorar UX.
  const validateForm = (values) => {
    const fe = {};
    const el = [];

    // Nombre
    if (!values.nombre || values.nombre.trim().length < 2) {
      fe.nombre = ["El nombre debe tener al menos 2 caracteres."];
      el.push("El nombre debe tener al menos 2 caracteres.");
    }

    // Email
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!values.email || !emailRe.test(values.email)) {
      fe.email = ["Ingresa un correo electrónico válido."];
      el.push("Ingresa un correo electrónico válido.");
    }

    // Teléfono (opcional): si viene, validar formato básico
    if (values.telefono && !/^\+?[0-9\s\-()]{7,}$/.test(values.telefono)) {
      fe.telefono = ["El teléfono contiene un formato inválido."];
      el.push("El teléfono contiene un formato inválido.");
    }

    // Password
    if (!values.password || values.password.length < 8) {
      fe.password = ["La contraseña debe tener al menos 8 caracteres."];
      el.push("La contraseña debe tener al menos 8 caracteres.");
    }

    return { ok: Object.keys(fe).length === 0, fe, el };
  };

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOk("");
    setErrorList([]);
    setFieldErrors({});

    // Validación previa
    const { ok: valid, fe, el } = validateForm(form);
    if (!valid) {
      setFieldErrors(fe);
      setErrorList(el);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(apiUrl("/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tipo_Usuario: "A" }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.success) {
        setOk("Usuario creado correctamente");
        setTimeout(() => router.push("/dashboard/usuarios"), 800);
      } else {
        setError(getApiErrorMessage(data, "No se pudo crear el usuario"));
        // Procesar arreglo de errores si existe
        const arr = Array.isArray(data?.errors) ? data.errors : [];
        if (arr.length) {
          setErrorList(arr.map((e) => e.msg || e.message || JSON.stringify(e)));
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
      setLoading(false);
    }
  };

  return (
    <section className="max-w-xl bg-white/5 border border-white/10 rounded-lg p-6 text-slate-100">
      <h1 className="text-xl font-semibold mb-1">Crear usuario</h1>
      <p className="text-slate-300 text-sm mb-4">Registra un nuevo usuario del sistema.</p>

      {/* Si hay errores por campo, no mostramos errores globales arriba */}
      {Object.keys(fieldErrors).length === 0 && error && (
        <p className="text-rose-300 text-sm mb-3">{error}</p>
      )}
      {Object.keys(fieldErrors).length === 0 && errorList.length > 0 && (
        <ul className="mb-3 text-rose-300 text-xs list-disc pl-5 space-y-1">
          {errorList.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}
      {ok && <p className="text-emerald-300 text-sm mb-3">{ok}</p>}

      <form onSubmit={onSubmit} className="space-y-3">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Nombre</label>
          <input
            name="nombre"
            value={form.nombre}
            onChange={onChange}
            required
            aria-invalid={fieldErrors.nombre ? "true" : "false"}
            className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.nombre ? "border-red-500" : "border-slate-700"}`}
          />
          {fieldErrors.nombre && (
            <p className="mt-1 text-xs text-rose-300">{fieldErrors.nombre[0]}</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            required
            aria-invalid={fieldErrors.email ? "true" : "false"}
            className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.email ? "border-red-500" : "border-slate-700"}`}
          />
          {fieldErrors.email && (
            <p className="mt-1 text-xs text-rose-300">{fieldErrors.email[0]}</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Teléfono</label>
          <input
            name="telefono"
            value={form.telefono}
            onChange={onChange}
            aria-invalid={fieldErrors.telefono ? "true" : "false"}
            className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.telefono ? "border-red-500" : "border-slate-700"}`}
          />
          {fieldErrors.telefono && (
            <p className="mt-1 text-xs text-rose-300">{fieldErrors.telefono[0]}</p>
          )}
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Contraseña</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            required
            aria-invalid={fieldErrors.password ? "true" : "false"}
            className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.password ? "border-red-500" : "border-slate-700"}`}
          />
          {fieldErrors.password && (
            <p className="mt-1 text-xs text-rose-300">{fieldErrors.password[0]}</p>
          )}
        </div>
        <div className="pt-2 flex items-center gap-2">
          <button
            type="button"
            onClick={() => router.push("/dashboard/usuarios")}
            className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white"
          >
            {loading ? "Guardando..." : "Crear"}
          </button>
        </div>
      </form>
    </section>
  );
}
