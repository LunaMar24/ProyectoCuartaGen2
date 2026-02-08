"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

export default function EditarMascotaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [ok, setOk] = useState("");
  const [errorList, setErrorList] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});
  const [form, setForm] = useState({ propietario: "", nombre: "", especie: "", raza: "", edad: "" });
  // Combobox propietario (búsqueda y selección)
  const [ownerQuery, setOwnerQuery] = useState("");
  const [ownerOptions, setOwnerOptions] = useState([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null); // { id, label }
  const [originalOwnerId, setOriginalOwnerId] = useState(null);
  const boxRef = useRef(null);
  // Cerrar lista al hacer clic fuera del combobox
  useEffect(() => {
    const onDocClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOwnerOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
  const token = localStorage.getItem("authToken");
  if (!token || !id) { setLoadError("Falta token o id"); setLoading(false); return; }
    fetch(apiUrl(`/mascotas/${id}`), {
      method: "GET",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const m = data?.data || data;
        // Resolver propietario id y label de forma robusta
        const propObj = (m && typeof m.propietario === "object" && m.propietario !== null) ? m.propietario : null;
        let propId = null;
        if (propObj) {
          propId = propObj.id ?? propObj.idPropietario ?? propObj._id ?? null;
        } else if (typeof m?.propietario === "number") {
          propId = m.propietario;
        }

        const displayLabelCandidates = [
          m?.propietarioLabel,
          m?.propietarioNombre,
          m?.propietarioText,
          m?.propietarioTexto,
          m?.propietarioDisplay,
          m?.propietarioDescripcion,
          m?.propietarioString,
        ];
        // Si viene objeto propietario, derivar label "Nombre (Cédula)" si es posible
        let labelFromObj = "";
        if (propObj) {
          const nombre = propObj.nombre ?? propObj.propietario ?? propObj.name ?? "";
          const cedula = propObj.cedula ?? propObj.cédula ?? propObj.identificacion ?? propObj.documento ?? propObj.dni ?? "";
          labelFromObj = nombre ? `${nombre}${cedula ? ` (${cedula})` : ""}` : "";
        }
        const propLabel = displayLabelCandidates.find(v => typeof v === "string" && v.trim().length > 0) || labelFromObj || (typeof m?.propietario === "string" ? m?.propietario : "");

        setForm({
          propietario: (typeof propId === "number" || typeof propId === "string") ? propId : "",
          nombre: m?.nombre ?? "",
          especie: m?.especie ?? "",
          raza: m?.raza ?? "",
          edad: m?.edad ?? "",
        });
        // Si ya tenemos id, seleccionarlo directamente. Si no, y hay label string, prefillear vía búsqueda.
        if (propId != null) {
          if (propLabel) { setSelectedOwner({ id: propId, label: propLabel }); setOwnerQuery(propLabel); }
          else { setOwnerQuery(String(propId)); }
          setOriginalOwnerId(propId);
        } else if (propLabel) {
          // No hay id, pero tenemos el texto "Nombre (Cédula)": simular búsqueda y selección.
          setOwnerQuery(propLabel);
          prefillOwnerByLabel(propLabel);
        }
      })
    .catch(() => setLoadError("No se pudo cargar la mascota"))
      .finally(() => setLoading(false));
  }, [id]);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Llamar al endpoint de búsqueda de propietarios en cada cambio (mismo patrón que Crear)
  const fetchOwners = async (raw) => {
    const q = (raw ?? "").trim();
    setOwnerOpen(true);
    if (!q) { setOwnerOptions([]); return; }
    const token = localStorage.getItem("authToken");
    setOwnerLoading(true);
    try {
      const res = await fetch(apiUrl("/mascotas/propietarios/search"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        // Backend espera campo "propietario" (no "cedula")
        body: JSON.stringify({ propietario: q })
      });
      const data = await res.json().catch(() => ({}));
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setOwnerOptions(list);
    } catch (_) {
      setOwnerOptions([]);
    } finally {
      setOwnerLoading(false);
    }
  };

  const handleOwnerInputChange = (e) => {
    const val = e.target.value;
    setSelectedOwner(null);
    setOwnerQuery(val);
    fetchOwners(val);
  };

  // Prefill: cuando GET /mascotas/{id} trae solo el texto del propietario,
  // buscamos con ese texto y seleccionamos una opción para obtener el id.
  const prefillOwnerByLabel = async (label) => {
    const q = (label ?? "").trim();
    if (!q) return;
    const token = localStorage.getItem("authToken");
    setOwnerLoading(true);
    try {
      const res = await fetch(apiUrl("/mascotas/propietarios/search"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ propietario: q })
      });
      const data = await res.json().catch(() => ({}));
      const list = Array.isArray(data) ? data : data?.data ?? [];
      setOwnerOptions(list);
      // Intentar match exacto por label; si no, tomar el primero.
      let pick = list.find((o) => {
        const l = o.label ?? o.text ?? o.propietario ?? o.nombre ?? "";
        return l === q;
      });
      if (!pick) pick = list[0];
      if (pick) {
        const oid = pick.id ?? pick.idPropietario ?? pick._id;
        const l = pick.label ?? pick.text ?? pick.propietario ?? pick.nombre ?? String(oid ?? q);
        setSelectedOwner({ id: oid, label: l });
        setOwnerQuery(l);
        setOriginalOwnerId(oid ?? null);
        setOwnerOpen(false);
      }
    } catch (_) {
      // noop
    } finally {
      setOwnerLoading(false);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const okUpdate = confirm("¿Actualizar esta mascota?");
    if (!okUpdate) return;

    setSaving(true); setOk(""); setError(""); setFieldErrors({}); setErrorList([]);

    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(`${API_BASE}/mascotas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...form,
          // Prioriza el propietario seleccionado, luego el original cargado, luego lo que haya en form
          propietario: (() => {
            const raw = selectedOwner?.id ?? originalOwnerId ?? (typeof form.propietario === "number" || typeof form.propietario === "string" ? form.propietario : undefined);
            if (raw === undefined || raw === null) return undefined;
            const n = typeof raw === "number" ? raw : Number(raw);
            return Number.isFinite(n) ? n : undefined;
          })(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.success) {
        setOk("Mascota actualizada correctamente");
        setTimeout(() => router.push("/dashboard/mascotas"), 800);
      } else {
        const baseMsg = data?.message || "No se pudo actualizar la mascota";
        const extra = data?.error ? ` - ${data.error}` : "";
        setError(`${baseMsg}${extra}`);
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
          } else {
            // Evitar duplicado: no agregar el error global como item de la lista
            setErrorList([]);
          }
      }
    } catch (_) { setError("Error de conexión"); }
    finally { setSaving(false); }
  };

  return (
    <section className="max-w-2xl bg-white/5 border border-white/10 rounded-lg p-6 text-slate-100">
      <h1 className="text-xl font-semibold mb-1">Editar mascota</h1>
      <p className="text-slate-300 text-sm mb-4">Actualiza la información de la mascota.</p>

      {loading && <p className="text-slate-300 text-sm">Cargando...</p>}
      {!loading && loadError && <p className="text-rose-300 text-sm mb-3">{loadError}</p>}
      {!loading && error && <p className="text-rose-300 text-sm mb-3">{error}</p>}
      {!loading && ok && <p className="text-emerald-300 text-sm mb-3">{ok}</p>}

      {!loading && !loadError && (
        <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Combobox de Propietario */}
          <div className="sm:col-span-2" ref={boxRef}>
            <label className="block text-sm text-slate-300 mb-1">Propietario</label>
            <div className="relative">
              <input
                type="text"
                value={selectedOwner ? (selectedOwner.label ?? "") : ownerQuery}
                onChange={handleOwnerInputChange}
                onFocus={() => setOwnerOpen(true)}
                onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setOwnerOpen(false); e.currentTarget.blur(); } }}
                placeholder="Buscar por nombre o cédula"
                className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.propietario ? "border-red-500" : "border-slate-700"}`}
              />
              {ownerOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border border-white/10 bg-slate-800/95 backdrop-blur p-1 max-h-56 overflow-auto">
                  {ownerLoading && <div className="px-3 py-2 text-sm text-slate-300">Buscando...</div>}
                  {!ownerLoading && ownerOptions.length === 0 && (ownerQuery?.trim()?.length ? <div className="px-3 py-2 text-sm text-slate-300">Sin resultados</div> : <div className="px-3 py-2 text-sm text-slate-300">Escribe para buscar</div>)}
                  {!ownerLoading && ownerOptions.map((o) => {
                    const oid = o.id ?? o.idPropietario ?? o._id;
                    const label = o.label ?? o.text ?? o.propietario ?? o.nombre ?? "";
                    return (
                      <button key={String(oid)} type="button" onClick={() => { setSelectedOwner({ id: oid, label }); setOwnerOpen(false); }}
                              className="w-full text-left px-3 py-2 rounded hover:bg-slate-700/60 text-slate-100">
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {fieldErrors.propietario && <p className="mt-1 text-xs text-rose-300">{fieldErrors.propietario[0]}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Nombre</label>
            <input name="nombre" value={form.nombre} onChange={onChange}
                   className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.nombre ? "border-red-500" : "border-slate-700"}`} />
            {fieldErrors.nombre && <p className="mt-1 text-xs text-rose-300">{fieldErrors.nombre[0]}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Especie</label>
            <input name="especie" value={form.especie} onChange={onChange}
                   className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.especie ? "border-red-500" : "border-slate-700"}`} />
            {fieldErrors.especie && <p className="mt-1 text-xs text-rose-300">{fieldErrors.especie[0]}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Raza</label>
            <input name="raza" value={form.raza} onChange={onChange}
                   className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.raza ? "border-red-500" : "border-slate-700"}`} />
            {fieldErrors.raza && <p className="mt-1 text-xs text-rose-300">{fieldErrors.raza[0]}</p>}
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Edad</label>
            <input name="edad" value={form.edad} onChange={onChange}
                   className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.edad ? "border-red-500" : "border-slate-700"}`} />
            {fieldErrors.edad && <p className="mt-1 text-xs text-rose-300">{fieldErrors.edad[0]}</p>}
          </div>

          <div className="sm:col-span-2 pt-2 flex items-center gap-2">
            <button type="button" onClick={() => router.push("/dashboard/mascotas")} className="rounded-md border border-slate-600 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/50">Cancelar</button>
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
