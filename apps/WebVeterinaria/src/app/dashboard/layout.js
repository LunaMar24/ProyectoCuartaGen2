"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiUrl } from "@/lib/api";

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  const [user, setUser] = useState({ nombre: "Usuario", email: "" });
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  // Determina si una ruta del menú está activa
  const isActive = (href) => pathname?.startsWith(href);

  // Logout centralizado para el layout
  const handleLogout = () => {
    const token = localStorage.getItem("authToken");
    // Limpia credenciales locales
    localStorage.removeItem("authToken");
    // Llama al endpoint de logout si existe (ignora errores)
    fetch(apiUrl("/auth/logout"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token ? `Bearer ${token}` : undefined,
      },
    }).finally(() => {
      router.push("/");
    });
  };

  // Cargar datos básicos del usuario para el topbar
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (!token || token === "undefined" || token.trim() === "") {
      // Sin token: redirige a login
      router.push("/");
      return;
    }

    const remembered = localStorage.getItem("rememberedUser");
    if (remembered) {
      try {
        const parsed = JSON.parse(remembered);
        setUser((u) => ({ ...u, email: parsed.email ?? u.email }));
      } catch {}
    }

    // Intentar obtener perfil para mostrar nombre/rol
    fetch(apiUrl("/auth/profile"), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data?.data) {
          const { nombre, email, tipo_Usuario } = data.data;
          if (String(tipo_Usuario || "").toUpperCase() === "C") {
            localStorage.removeItem("authToken");
            router.push("/");
            return;
          }
          setUser({ nombre: nombre || "Usuario", email: email || user.email });
        }
      })
      .finally(() => setLoading(false));
  }, [router]);

  // Cierra el sidebar móvil con la tecla Escape
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        setSidebarOpen(false);
        setUserMenuOpen(false);
      }
    };
    if (sidebarOpen) window.addEventListener("keydown", onKey);
    if (userMenuOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen, userMenuOpen]);

  // Cierra el menú del usuario si hace click fuera
  useEffect(() => {
    if (!userMenuOpen) return;
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [userMenuOpen]);

  const menuItems = useMemo(
    () => [
      // Ajustado: Dashboard -> Usuarios
      { href: "/dashboard/usuarios", label: "Usuarios" },
      { href: "/dashboard/propietarios", label: "Propietarios" },
      { href: "/dashboard/mascotas", label: "Mascotas" },
      { href: "/dashboard/citas", label: "Control Citas" },
    ],
    []
  );

  // Etiqueta de sección actual para mostrar al usuario dónde está
  const sectionLabel = useMemo(() => {
    const parts = (pathname || "").split("/");
    const i = parts.indexOf("dashboard");
    const key = i >= 0 ? parts[i + 1] || "" : "";
    const map = {
      usuarios: "Usuarios",
      propietarios: "Propietarios",
      mascotas: "Mascotas",
      citas: "Control Citas",
      historiales: "Historiales",
      profile: "Perfil",
      "": "Panel",
    };
    return map[key] || "Panel";
  }, [pathname]);

  return (
    <div className="min-h-screen w-full bg-slate-900 text-slate-100 flex">
      {/* Sidebar (Desktop) */}
      <aside className="hidden md:flex md:flex-col w-60 bg-slate-800 border-r border-slate-700">
        <div className="flex items-center gap-3 p-4 border-b border-slate-700">
          <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center ring-1 ring-emerald-400/50">
            <span className="text-emerald-300 font-bold">A</span>
          </div>
          <div>
            <p className="text-sm text-emerald-300">Bienvenido</p>
            <p className="text-xs text-slate-300 truncate max-w-[160px]">{user.nombre}</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                (isActive(item.href)
                  ? "bg-slate-700 text-white"
                  : "text-slate-300 hover:text-white hover:bg-slate-700/60") +
                " block rounded-md px-3 py-2 text-sm font-medium"
              }
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full inline-flex items-center justify-center rounded-md bg-rose-600 hover:bg-rose-700 px-3 py-2 text-sm font-semibold text-white"
          >
            Salir
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
  <header className="h-14 bg-slate-800/90 backdrop-blur border-b border-slate-700 flex items-center justify-between px-4 relative z-40">
          <div className="flex items-center gap-3">
            {/* Hamburger (solo móvil) */}
            <button
              type="button"
              aria-label="Abrir menú"
              className="md:hidden inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-slate-700/60 focus:outline-none focus:ring-2 focus:ring-emerald-400"
              onClick={() => setSidebarOpen(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M3 12h18M3 18h18" />
              </svg>
            </button>
            <Link href="/dashboard" className="text-slate-100 font-extrabold tracking-wide">
              VETERINARIA
            </Link>
            <span className="hidden sm:inline text-slate-400 text-sm">LunaMar</span>
            {/* Indicador de sección actual, a la derecha de 'LunaMar' */}
            <span className="ml-2 inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-500/10 text-emerald-300 text-xs px-2 py-0.5">
              {sectionLabel}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-slate-100 leading-4">
                {loading ? "Cargando..." : user.nombre}
              </p>
              <p className="text-xs text-slate-400 leading-4">{user.email}</p>
            </div>
            <Link
              href="/dashboard/profile"
              className="hidden sm:inline rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700"
            >
              Perfil
            </Link>
            <button
              onClick={handleLogout}
              className="hidden sm:inline rounded-md bg-rose-600 hover:bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white"
            >
              Logout
            </button>
            {/* Avatar desktop */}
            <div className="hidden sm:block h-8 w-8 rounded-full bg-slate-600 ring-2 ring-emerald-400/60" />

            {/* Avatar + menú móvil */}
            <div className="relative sm:hidden" ref={userMenuRef}>
              <button
                type="button"
                aria-label="Abrir menú de usuario"
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
                onClick={() => setUserMenuOpen((v) => !v)}
                className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-slate-600 ring-2 ring-emerald-400/60"
              />
              {userMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-44 z-[70] rounded-md border border-slate-700 bg-slate-800 shadow-lg py-1"
                >
                  <div className="px-3 py-2 text-xs text-slate-300">
                    {loading ? "Cargando..." : user.nombre}
                  </div>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      router.push("/dashboard/profile");
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-700 text-slate-200"
                    role="menuitem"
                  >
                    Perfil
                  </button>
                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-700 text-rose-300"
                    role="menuitem"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile off-canvas sidebar */}
        {sidebarOpen && (
          <div className="md:hidden fixed inset-0 z-40" aria-modal="true" role="dialog">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setSidebarOpen(false)}
            />
            {/* Panel */}
            <aside
              id="mobile-sidebar"
              className="absolute left-0 top-0 h-full w-64 bg-slate-800 border-r border-slate-700 p-3 shadow-xl"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/20 flex items-center justify-center ring-1 ring-emerald-400/50">
                    <span className="text-emerald-300 font-bold">A</span>
                  </div>
                  <span className="text-sm">Hola, {user.nombre}</span>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Cerrar menú"
                  className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-700/60"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <nav className="space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={
                      (isActive(item.href)
                        ? "bg-slate-700 text-white"
                        : "text-slate-300 hover:text-white hover:bg-slate-700/60") +
                      " block rounded-md px-3 py-2 text-sm font-medium"
                    }
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="pt-3 mt-3 border-t border-slate-700">
                <button
                  onClick={() => {
                    setSidebarOpen(false);
                    handleLogout();
                  }}
                  className="w-full inline-flex items-center justify-center rounded-md bg-rose-600 hover:bg-rose-700 px-3 py-2 text-sm font-semibold text-white"
                >
                  Salir
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {/* Content wrapper keeps children looking good even si vienen con su propio estilo */}
          <div className="min-h-[calc(100vh-3.5rem)] rounded-lg">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
