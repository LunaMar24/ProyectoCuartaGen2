"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiUrl } from "@/lib/api";

export default function CrearHistorialPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMascota = searchParams?.get("mascota") || "";
  const mascotaLocked = useMemo(() => String(initialMascota).trim() !== "", [initialMascota]);
  const [form, setForm] = useState({ mascota: "", fechaAtencion: "", motivo: "", diagnostico: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [errorList, setErrorList] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [mascotaDisplay, setMascotaDisplay] = useState("");

  const extractMascotaId = (val) => {
    if (val === null || val === undefined) return undefined;
    const s = String(val).trim();
    // patrón "(ID) Nombre" (admite espacios dentro de paréntesis)
    let m = s.match(/^\(\s*(\d+)\s*\)/);
    if (m) return Number(m[1]);
    // número al inicio
    m = s.match(/^(\d+)/);
    if (m) return Number(m[1]);
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  };

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const validate = (v) => {
    const fe = {}; const el = [];
    const mascotaNum = mascotaLocked ? extractMascotaId(initialMascota) : extractMascotaId(v.mascota);
    if (!Number.isFinite(mascotaNum) || mascotaNum <= 0) { fe.mascota = ["Ingrese un ID de mascota válido"]; el.push("Ingrese un ID de mascota válido"); }
    if (!v.fechaAtencion) { fe.fechaAtencion = ["Seleccione la fecha y hora de atención"]; el.push("Seleccione la fecha y hora de atención"); }
    if (!v.motivo || v.motivo.trim().length < 2) { fe.motivo = ["Ingrese un motivo válido"]; el.push("Ingrese un motivo válido"); }
    if (!v.diagnostico || v.diagnostico.trim().length < 2) { fe.diagnostico = ["Ingrese un diagnóstico válido"]; el.push("Ingrese un diagnóstico válido"); }
    return { ok: Object.keys(fe).length === 0, fe, el };
  };

  const toIsoFromDateTimeLocal = (s) => {
    if (!s) return undefined;
    const d = new Date(s);
    return d.toISOString();
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setOk(""); setErrorList([]); setFieldErrors({});

    const { ok: valid, fe, el } = validate(form);
    if (!valid) { setFieldErrors(fe); setErrorList(el); setLoading(false); return; }

    const token = localStorage.getItem("authToken");
    try {
      // Siempre extraer el ID para enviar y para redirigir
  const idToSend = mascotaLocked ? extractMascotaId(initialMascota) : extractMascotaId(form.mascota);
      const res = await fetch(apiUrl("/historiales"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          mascota: idToSend,
          fechaAtencion: toIsoFromDateTimeLocal(form.fechaAtencion),
          motivo: form.motivo.trim(),
          diagnostico: form.diagnostico.trim(),
        })
      });
      const data = await res.json().catch(() => ({}));
      if (data?.success) {
        setOk("Historial creado correctamente");
        setTimeout(() => {
          if (idToSend) router.push(`/dashboard/historiales?mascota=${idToSend}`);
          else router.push("/dashboard/historiales");
        }, 800);
      } else {
        setError(data?.message || "No se pudo crear el historial");
        const arr = Array.isArray(data?.errors) ? data.errors : [];
        if (arr.length) {
          const byField = {}; setErrorList(arr.map((e) => e.msg || e.message || JSON.stringify(e)));
          arr.forEach((e) => { const key = e.field || e.path || e.param || ""; if (!key) return; if (!byField[key]) byField[key] = []; byField[key].push(e.msg || e.message || "Error"); });
          setFieldErrors(byField);
        }
      }
    } catch (_) { setError("Error de conexión"); }
    finally { setLoading(false); }
  };

  // Si viene mascota por query, obtener su nombre para mostrar "(id) Nombre" y bloquear edición
  useEffect(() => {
    const id = String(initialMascota || "").trim();
    if (!id) {
      // Si no hay contexto de mascota, redirigir a Mascotas para forzar el flujo con selección previa
      router.push("/dashboard/mascotas");
      return;
    }
    setMascotaDisplay(id);
    setForm((f) => ({ ...f, mascota: id }));
  }, [initialMascota, router]);

  return (
    <section className="max-w-2xl bg-white/5 border border-white/10 rounded-lg p-6 text-slate-100">
      <h1 className="text-xl font-semibold mb-1">Crear historial</h1>
      <p className="text-slate-300 text-sm mb-4">Registra una nueva atención médica.</p>

      {Object.keys(fieldErrors).length === 0 && error && <p className="text-rose-300 text-sm mb-3">{error}</p>}
      {Object.keys(fieldErrors).length === 0 && errorList.length > 0 && (
        <ul className="mb-3 text-rose-300 text-xs list-disc pl-5 space-y-1">
          {errorList.map((m, i) => (<li key={i}>{m}</li>))}
        </ul>
      )}
      {ok && <p className="text-emerald-300 text-sm mb-3">{ok}</p>}

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="block text-sm text-slate-300 mb-1">Mascota</label>
     <input value={mascotaDisplay || (initialMascota ? `${initialMascota}` : "") } readOnly disabled
                 className={`w-full bg-slate-900/70 border rounded-md px-3 py-2 opacity-70 cursor-not-allowed ${fieldErrors.mascota ? "border-red-500" : "border-slate-700"}`} />
          {fieldErrors.mascota && <p className="mt-1 text-xs text-rose-300">{fieldErrors.mascota[0]}</p>}
        </div>
        <div>
          <label className="block text-sm text-slate-300 mb-1">Fecha y hora</label>
          <input type="datetime-local" name="fechaAtencion" value={form.fechaAtencion} onChange={onChange}
                 className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.fechaAtencion ? "border-red-500" : "border-slate-700"}`} />
          {fieldErrors.fechaAtencion && <p className="mt-1 text-xs text-rose-300">{fieldErrors.fechaAtencion[0]}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm text-slate-300 mb-1">Motivo</label>
          <input name="motivo" value={form.motivo} onChange={onChange}
                 className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.motivo ? "border-red-500" : "border-slate-700"}`} />
          {fieldErrors.motivo && <p className="mt-1 text-xs text-rose-300">{fieldErrors.motivo[0]}</p>}
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm text-slate-300 mb-1">Diagnóstico</label>
          <textarea name="diagnostico" value={form.diagnostico} onChange={onChange}
                    className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.diagnostico ? "border-red-500" : "border-slate-700"}`}></textarea>
          {fieldErrors.diagnostico && <p className="mt-1 text-xs text-rose-300">{fieldErrors.diagnostico[0]}</p>}
        </div>

        <div className="sm:col-span-2 pt-2 flex items-center gap-2">
          <button type="button" onClick={() => {
            const id = extractMascotaId(initialMascota);
            if (Number.isFinite(id) && id > 0) router.push(`/dashboard/historiales?mascota=${id}`);
            else router.push("/dashboard/historiales");
          }} className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/50">Cancelar</button>
          <button type="submit" disabled={loading}
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white">
            {loading ? "Guardando..." : "Crear"}
          </button>
        </div>
      </form>
    </section>
  );
}
