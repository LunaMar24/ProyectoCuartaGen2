"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE = "http://localhost:3000/api/v1";

export default function CrearMascotaPage() {
  const router = useRouter();
  const [form, setForm] = useState({ nombre: "", especie: "", raza: "", edad: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [errorList, setErrorList] = useState([]);
  const [fieldErrors, setFieldErrors] = useState({});

  // Combobox de Propietario
  const [ownerQuery, setOwnerQuery] = useState("");
  const [ownerOptions, setOwnerOptions] = useState([]);
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState(null); // { id, label }
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

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  // Llamar al endpoint de búsqueda de propietarios en cada cambio
  const fetchOwners = async (raw) => {
    const q = (raw ?? "").trim();
    setOwnerOpen(true);
    if (!q) { setOwnerOptions([]); return; }
    const token = localStorage.getItem("authToken");
    setOwnerLoading(true);
    try {
      const res = await fetch(`${API_BASE}/mascotas/propietarios/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        // Backend espera campo "propietario" (no "cedula") para buscar por nombre o coincidencias pertinentes
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

  const validateForm = (v) => {
    const fe = {}; const el = [];
    if (!selectedOwner || !selectedOwner.id) { fe.propietario = ["Seleccione un propietario válido"]; el.push("Seleccione un propietario válido"); }
    if (!v.nombre || v.nombre.trim().length < 2) { fe.nombre = ["Ingrese un nombre válido"]; el.push("Ingrese un nombre válido"); }
  if (!v.especie || v.especie.trim().length < 2) { fe.especie = ["Ingrese una especie válida"]; el.push("Ingrese una especie válida"); }
  if (!v.raza || v.raza.trim().length < 2) { fe.raza = ["Ingrese una raza válida"]; el.push("Ingrese una raza válida"); }
    if (!v.edad || v.edad.trim().length < 1) { fe.edad = ["Ingrese la edad"]; el.push("Ingrese la edad"); }
    return { ok: Object.keys(fe).length === 0, fe, el };
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); setError(""); setOk(""); setErrorList([]); setFieldErrors({});

    const { ok: valid, fe, el } = validateForm(form);
    if (!valid) { setFieldErrors(fe); setErrorList(el); setLoading(false); return; }

    const token = localStorage.getItem("authToken");
    try {
      const res = await fetch(`${API_BASE}/mascotas`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ ...form, propietario: Number(selectedOwner?.id) })
      });
      const data = await res.json().catch(() => ({}));
      if (data?.success) {
        setOk("Mascota creada correctamente");
        setTimeout(() => router.push("/dashboard/mascotas"), 800);
      } else {
        const baseMsg = data?.message || "No se pudo crear la mascota";
        const extra = data?.error ? ` - ${data.error}` : "";
        setError(`${baseMsg}${extra}`);
        const arr = Array.isArray(data?.errors) ? data.errors : [];
        if (arr.length) {
          const byField = {};
          setErrorList(arr.map((e) => e.msg || e.message || JSON.stringify(e)));
          arr.forEach((e) => { const key = e.field || e.path || e.param || ""; if (!key) return; if (!byField[key]) byField[key] = []; byField[key].push(e.msg || e.message || "Error"); });
          setFieldErrors(byField);
        } else {
          // Si no hay errores por campo, no mostramos el detalle duplicado del "error" global
          setErrorList([]);
        }
      }
    } catch (_) { setError("Error de conexión"); }
    finally { setLoading(false); }
  };

  return (
    <section className="max-w-2xl bg-white/5 border border-white/10 rounded-lg p-6 text-slate-100">
      <h1 className="text-xl font-semibold mb-1">Crear mascota</h1>
      <p className="text-slate-300 text-sm mb-4">Registra una nueva mascota.</p>

      {Object.keys(fieldErrors).length === 0 && error && <p className="text-rose-300 text-sm mb-3">{error}</p>}
      {Object.keys(fieldErrors).length === 0 && errorList.length > 0 && (
        <ul className="mb-3 text-rose-300 text-xs list-disc pl-5 space-y-1">
          {errorList.map((m, i) => (<li key={i}>{m}</li>))}
        </ul>
      )}
      {ok && <p className="text-emerald-300 text-sm mb-3">{ok}</p>}

      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {/* Combobox de Propietario */}
        <div className="sm:col-span-2" ref={boxRef}>
          <label className="block text-sm text-slate-300 mb-1">Propietario</label>
          <div className={`relative`}>
            <input
              type="text"
              value={selectedOwner ? (selectedOwner.label ?? "") : ownerQuery}
              onChange={handleOwnerInputChange}
              onFocus={() => setOwnerOpen(true)}
              onKeyDown={(e) => { if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); setOwnerOpen(false); e.currentTarget.blur(); } }}
              placeholder="Buscar por nombre o cédula"
              className={`w-full bg-slate-800 border rounded-md px-3 py-2 ${fieldErrors.propietario ? "border-red-500" : "border-slate-700"}`}
            />
            {/* Lista de opciones */}
            {ownerOpen && (
              <div className="absolute z-50 mt-1 w-full rounded-md border border-white/10 bg-slate-800/95 backdrop-blur p-1 max-h-56 overflow-auto">
                {ownerLoading && <div className="px-3 py-2 text-sm text-slate-300">Buscando...</div>}
                {!ownerLoading && ownerOptions.length === 0 && (ownerQuery?.trim()?.length ? <div className="px-3 py-2 text-sm text-slate-300">Sin resultados</div> : <div className="px-3 py-2 text-sm text-slate-300">Escribe para buscar</div>)}
                {!ownerLoading && ownerOptions.map((o) => {
                  const id = o.id ?? o.idPropietario ?? o._id;
                  const label = o.label ?? o.text ?? o.propietario ?? o.nombre ?? "";
                  return (
                    <button key={String(id)} type="button"
                            onClick={() => { setSelectedOwner({ id, label }); setOwnerOpen(false); }}
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
          <button type="submit" disabled={loading}
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 px-4 py-2 text-sm font-semibold text-white">
            {loading ? "Guardando..." : "Crear"}
          </button>
        </div>
      </form>
    </section>
  );
}
