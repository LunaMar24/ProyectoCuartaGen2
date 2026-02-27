"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiUrl, getApiErrorMessage } from "@/lib/api";

const API_USERS = apiUrl("/users");

export default function EditarUsuarioPage() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [errorList, setErrorList] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
  });

  const validateForm = (values) => {
    const fe = {};
    const el = [];

    if (!values.nombre || values.nombre.trim().length < 2) {
      fe.nombre = ["El nombre debe tener al menos 2 caracteres."];
      el.push("El nombre debe tener al menos 2 caracteres.");
    }

    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!values.email || !emailRe.test(values.email)) {
      fe.email = ["Ingresa un correo electronico valido."];
      el.push("Ingresa un correo electronico valido.");
    }

    if (values.telefono && !/^\+?[0-9\s\-()]{7,}$/.test(values.telefono)) {
      fe.telefono = ["El telefono contiene un formato invalido."];
      el.push("El telefono contiene un formato invalido.");
    }

    return { ok: Object.keys(fe).length === 0, fe, el };
  };

  useEffect(() => {
    if (!id) return;
    const tk = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (!tk) {
      setError("No hay token de autenticacion");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    fetch(`${API_USERS}/${id}`, {
      method: "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const user = data?.data ?? data;
        if (!user) {
          setError("No se pudo obtener el usuario");
          return;
        }
        setForm({
          nombre: user?.nombre ?? "",
          email: user?.email ?? "",
          telefono: user?.telefono ?? "",
        });
      })
      .catch(() => setError("No se pudo obtener el usuario"))
      .finally(() => setLoading(false));
  }, [id]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setOk("");
    setErrorList([]);
    setFieldErrors({});

    const { ok: valid, fe, el } = validateForm(form);
    if (!valid) {
      setFieldErrors(fe);
      setErrorList(el);
      setSaving(false);
      return;
    }

    const tk = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
    if (!tk) {
      setSaving(false);
      setError("No hay token de autenticacion");
      return;
    }

    try {
      const res = await fetch(`${API_USERS}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${tk}` },
        body: JSON.stringify({
          nombre: form.nombre,
          email: form.email,
          telefono: form.telefono,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.success) {
        setOk("Usuario actualizado correctamente");
        setTimeout(() => router.push("/dashboard/usuarios"), 800);
      } else {
        setError(getApiErrorMessage(data, "No se pudo actualizar el usuario"));
        const arr = Array.isArray(data?.errors) ? data.errors : [];
        if (arr.length) {
          setErrorList(arr.map((item) => item.msg || item.message || JSON.stringify(item)));
          const byField = {};
          arr.forEach((item) => {
            const key = item.field || item.path || item.param || "";
            if (!key) return;
            if (!byField[key]) byField[key] = [];
            byField[key].push(item.msg || item.message || "Error");
          });
          setFieldErrors(byField);
        }
      }
    } catch (_) {
      setError("Error de conexion");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="max-w-xl bg-white/5 border border-white/10 rounded-lg p-6 text-slate-100">
      <h1 className="text-xl font-semibold mb-1">Editar usuario</h1>
      <p className="text-slate-300 text-sm mb-4">Actualiza la informacion del usuario.</p>

      {loading && <p className="text-slate-300 text-sm">Cargando...</p>}

      {!loading && Object.keys(fieldErrors).length === 0 && error && (
        <p className="text-rose-300 text-sm mb-3">{error}</p>
      )}
      {!loading && Object.keys(fieldErrors).length === 0 && errorList.length > 0 && (
        <ul className="mb-3 text-rose-300 text-xs list-disc pl-5 space-y-1">
          {errorList.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      )}
      {!loading && ok && <p className="text-emerald-300 text-sm mb-3">{ok}</p>}

      {!loading && (
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
            <label className="block text-sm text-slate-300 mb-1">Telefono</label>
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
              disabled={saving}
              className="inline-flex items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white"
            >
              {saving ? "Guardando..." : "Actualizar"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
