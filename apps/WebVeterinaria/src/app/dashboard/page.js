"use client";


import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    // Hook para guardar el perfil del usuario y posibles errores
    const [profile, setProfile] = useState(null); // Guardará los datos del usuario
    const [error, setError] = useState(null);     // Mensaje de error (si ocurre)

    // Hook para redireccionar a otra página dentro de la app Next.js
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("authToken"); // 1️⃣ Recuperamos el token
        if (!token || token === "undefined" || token.trim() === "") {
            setError("No se encontró token. Por favor inicia sesión nuevamente.");
            return;
        }

        const url = "http://localhost:3000/api/v1/auth/profile";
        const options = {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        };

        // Hook para obtener el perfil del usuario
        // 2️⃣ Llamada al backend para obtener el perfil
        fetch(url, options)
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    setProfile(data.data); // Guardamos la información del usuario
                } else {
                    setError(data.message || "No se pudo obtener el perfil.");
                }
            })
            .catch(err => {
                console.error("Error al obtener el perfil:", err);
                setError("Error de conexión con el servidor.");
            });
    }, []);


    const handleLogout = () => {
        // 1️⃣ Limpiamos localStorage
        localStorage.removeItem("authToken");
        localStorage.removeItem("userEmail");

        // 2️⃣ Llamar a tu endpoint de logout
        fetch("http://localhost:3000/api/v1/auth/logout", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("authToken")
            }
        }).finally(() => {
            router.push("/"); // Redirige al login
        });

    };

    return (
        <main className="wrap">
            <div className="card" role="main" aria-label="Pantalla de bienvenida">
                {error && <p style={{ color: "red" }}>{error}</p>}

                {!profile && !error && <p style={{ color: "#ccc" }}>Cargando perfil...</p>}

                {profile && (
                    <>
                        <h1 className="title">¡Bienvenid@, {profile.nombre}!</h1>

                        {/* Datos del usuario (formato responsive) */}
                        <div className="details">
                            <p className="subtitle"><span className="label">Email:</span> {profile.email}</p>
                            <p className="subtitle"><span className="label">Teléfono:</span> {profile.telefono}</p>
                            <p className="subtitle"><span className="label">Usuario desde:</span> {new Date(profile.fecha_creacion).toLocaleDateString()}</p>
                        </div>

                        {/* 🔹 Botón de Logout */}
                        <button onClick={handleLogout} className="logout-btn">
                            Cerrar sesión
                        </button>
                    </>
                )}
            </div>

            <style jsx>{`
                .wrap {
                    min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(1200px 600px at 10% 10%, #4c449cee, transparent),
                      radial-gradient(900px 500px at 90% 90%, rgba(47, 146, 113, 0.08), transparent),
                      linear-gradient(180deg, #0f172a 0%, #131d4dff 100%);
          padding: 24px;
          box-sizing: border-box;
        }

        .card {
          text-align: center;
          padding: 48px 64px;
          border-radius: 20px;
          backdrop-filter: blur(6px) saturate(120%);
          -webkit-backdrop-filter: blur(6px) saturate(120%);
          background: linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
          box-shadow: 0 8px 30px rgba(2,6,23,0.6), inset 0 1px 0 rgba(255,255,255,0.02);
          transform: translateY(0);
          animation: float 6s ease-in-out infinite;
          max-width: 920px;
          width: 100%;
        }

        .title {
          margin: 0;
          font-weight: 800;
          line-height: 1;
          letter-spacing: -0.02em;
          font-size: clamp(40px, 8vw, 96px);
          background: linear-gradient(90deg, #7c3aed 0%, #06b6d4 40%, #10b981 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          text-shadow: 0 6px 30px rgba(124,58,237,0.12);
          filter: drop-shadow(0 12px 40px rgba(2,6,23,0.6));
          margin-bottom: 12px;
          transition: transform 240ms ease;
        }

                .subtitle {
          margin: 0;
          color: rgba(255,255,255,0.8);
          font-size: clamp(14px, 2.4vw, 18px);
          opacity: 0.95;
        }

                .details { 
                    margin-top: 12px; 
                    display: grid; 
                    grid-template-columns: 1fr; 
                    row-gap: 6px;
                    word-break: break-word;
                }

                .label { 
                    color: rgba(255,255,255,0.7); 
                    margin-right: 6px; 
                    font-weight: 600; 
                }

        .logout-btn {
          margin-top: 20px;
          padding: 10px 20px;
          background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.3s ease;
        }

        .logout-btn:hover {
          background: linear-gradient(90deg, #dc2626 0%, #b91c1c 100%);
        }

                @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-50px); }
          100% { transform: translateY(0px); }
        }
                @keyframes floatSm {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                    100% { transform: translateY(0px); }
                }

                /* Ajustes para pantallas móviles */
                @media (max-width: 640px) {
                    .wrap {
                        min-height: auto; /* el contenedor padre ya maneja la altura */
                        align-items: flex-start;
                        padding: 16px;
                    }
                                .card {
                                    padding: 20px 16px;
                                    /* Mantener animación en móvil pero con menor amplitud */
                                    animation: floatSm 6s ease-in-out infinite;
                                }
                    .title {
                        font-size: clamp(28px, 9vw, 40px);
                        margin-bottom: 8px;
                    }
                    .subtitle {
                        font-size: 14px;
                    }
                    .logout-btn {
                        width: 100%;
                        padding: 10px 14px;
                        margin-top: 14px;
                    }
                }
        
                        /* Respeta la preferencia del usuario para reducir movimiento */
                        @media (prefers-reduced-motion: reduce) {
                            .card { animation: none !important; transform: none !important; }
                        }
      `}</style>
        </main>
    );
}