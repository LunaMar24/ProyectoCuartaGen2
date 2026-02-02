"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_BASE = "http://localhost:3000/api/v1";

export default function EditarHistorialPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [errorList, setErrorList] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({ mascota: "", fechaAtencion: "", motivo: "", diagnostico: "" });
  const [mascotaId, setMascotaId] = useState("");
  const [mascotaDisplay, setMascotaDisplay] = useState("");

  const extractMascotaId = (val) => {
    if (val === null || val === undefined) return undefined;
    const s = String(val).trim();
    let m = s.match(/^\(\s*(\d+)\s*\)/);
    if (m) return Number(m[1]);
    m = s.match(/^(\d+)/);
    if (m) return Number(m[1]);
    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  };

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const toLocalDateTimeValue = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    const yyyy = d.getFullYear(); const mm = pad(d.getMonth() + 1); const dd = pad(d.getDate());
    const hh = pad(d.getHours()); const mi = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  };

  const toIsoFromDateTimeLocal = (s) => {
    if (!s) return undefined;
    const d = new Date(s);
    return d.toISOString();
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token || !id) { setError("Falta token o id"); setLoading(false); return; }
    fetch(`${API_BASE}/historiales/${id}`, { method: "GET", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        const h = data?.data || data;
        const mId = h?.mascota?.id ?? h?.mascota ?? "";
        const mName = h?.mascota?.nombre ?? "";
        setForm({
          mascota: mId,
          fechaAtencion: toLocalDateTimeValue(h?.fechaAtencion),
          motivo: h?.motivo ?? "",
          diagnostico: h?.diagnostico ?? "",
        });
        setMascotaId(String(mId || ""));
        if (mId) {
          if (mName) setMascotaDisplay(`${mId}`.trim());
          else {
            // obtener nombre de la mascota si no vino en la respuesta
            fetch(`${API_BASE}/mascotas/${mId}`, { method: "GET", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` } })
              .then((r2) => r2.json())
              .then((d2) => {
                const m = d2?.data || d2; const name = m?.nombre ?? "";
                setMascotaDisplay(`${mId}`.trim());
              })
              .catch(() => setMascotaDisplay(`${mId}`));
          }
        }
      })
      .catch(() => setError("No se pudo cargar el historial"))
      .finally(() => setLoading(false));
  }, [id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    const okUpdate = confirm("¿Actualizar este historial?");
    if (!okUpdate) return;

    setSaving(true); setOk(""); setError(""); setFieldErrors({}); setErrorList([]);

    const token = localStorage.getItem("authToken");
    try {
      // asegurar ID de mascota incluso si tenemos el valor formateado "(ID) Nombre"
      const idToSend = (mascotaId && Number(mascotaId)) || extractMascotaId(mascotaDisplay) || extractMascotaId(form.mascota);
      const res = await fetch(`${API_BASE}/historiales/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          mascota: idToSend || undefined,
          fechaAtencion: toIsoFromDateTimeLocal(form.fechaAtencion),
          motivo: (form.motivo || "").trim(),
          diagnostico: (form.diagnostico || "").trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.success) {
        setOk("Historial actualizado correctamente");
        const idToSend = (mascotaId && Number(mascotaId)) || extractMascotaId(mascotaDisplay) || extractMascotaId(form.mascota);
        setTimeout(() => {
          if (mascotaId) router.push(`/dashboard/historiales?mascota=${idToSend}`);
          else router.push("/dashboard/historiales");
        }, 800);
      } else {
        setError(data?.message || "No se pudo actualizar el historial");
        const arr = Array.isArray(data?.errors) ? data.errors : [];
        if (arr.length) {
          const byField = {};
          setErrorList(arr.map((e) => e.msg || e.message || JSON.stringify(e)));
          arr.forEach((e) => { const key = e.field || e.path || e.param || ""; if (!key) return; if (!byField[key]) byField[key] = []; byField[key].push(e.msg || e.message || "Error"); });
          setFieldErrors(byField);
        }
      }
    } catch (_) { setError("Error de conexión"); }
    finally { setSaving(false); }
  };

  return (
    <section className="max-w-2xl bg-white/5 border border-white/10 rounded-lg p-6 text-slate-100">
      <h1 className="text-xl font-semibold mb-1">Editar historial</h1>
      <p className="text-slate-300 text-sm mb-4">Actualiza la atención registrada.</p>

      {loading && <p className="text-slate-300 text-sm">Cargando...</p>}
      {!loading && error && <p className="text-rose-300 text-sm mb-3">{error}</p>}
      {!loading && ok && <p className="text-emerald-300 text-sm mb-3">{ok}</p>}

      {!loading && !error && (
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Mascota</label>
            <input value={mascotaDisplay || (mascotaId ? `${mascotaId}` : "") } readOnly disabled
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
              const idBack = (mascotaId && Number(mascotaId)) || extractMascotaId(mascotaDisplay) || extractMascotaId(form.mascota);
              if (idBack) router.push(`/dashboard/historiales?mascota=${idBack}`);
              else router.push("/dashboard/historiales");
            }} className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/50">Cancelar</button>
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
