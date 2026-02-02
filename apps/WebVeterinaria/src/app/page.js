'use client';

// Importamos hooks de React y el enrutador de Next.js (app router)
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Componente principal de la pantalla de Login
export default function Login() {
  // Estados para guardar lo que escribe el usuario
  // email: guarda el email
  // password: guarda la contraseña
  // rememberMe: guarda si el usuario marcó "Recordarme"
  // errors: guarda mensajes de validación para mostrar al usuario
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({ email: "", password: "", general: "" });

  // Hook para redireccionar a otra página dentro de la app Next.js
  const router = useRouter();

  // Función que se ejecuta cuando el usuario envía el formulario
  const handleSubmit = (e) => {
    e.preventDefault();

    // Limpiamos mensajes previos
    setErrors({ email: "", password: "", general: "" });

    // Validación básica de campos vacíos
    const newErrors = { email: "", password: "", general: "" };
    if (!email.trim()) newErrors.email = "Por favor ingresa tu email.";
    if (!password.trim()) newErrors.password = "Por favor ingresa tu contraseña.";

    // Si hay errores, los mostramos y salimos sin continuar
    if (newErrors.email || newErrors.password) {
      setErrors(newErrors);
      return;
    }

    /*   // --- Simulación de autenticación ---
      // Aquí normalmente llamarías a tu API para autenticar al usuario.
      // Para la demostración, validamos contra un par de credenciales fijo.
      const MOCK_EMAIL = "marceadm@lunamar.com";
      const MOCK_PASS = "1234";
    
      if (email === MOCK_EMAIL && password === MOCK_PASS) {
          // Si el usuario marcó "Recordarme", guardamos un indicador en localStorage
          if (rememberMe) {
            // Guardamos el email como ejemplo; en producción guarda tokens seguros
            localStorage.setItem("rememberedUser", JSON.stringify({ email }));
          }
    
          // Redireccionamos a la página de la aplicación cuando el login es correcto.
          // Sugerencia de nombre de la ruta: "/dashboard" (crea /app/dashboard/page.js)
          router.push("/dashboard");
          return;
        }
    
        // Si las credenciales no coinciden, mostramos error general
        setErrors((prev) => ({ ...prev, general: "Credenciales inválidas. Verifica e inténtalo de nuevo." })); */

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, password })
    };

    console.log("Enviando solicitud de login con opciones:", options);

    fetch("http://localhost:3000/api/v1/auth/login", options)
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Si el usuario marcó "Recordarme", guardamos un indicador en localStorage
          if (rememberMe) {
            // Guardamos el email como ejemplo; en producción guarda tokens seguros
            localStorage.setItem("rememberedUser", JSON.stringify({ email }));
          }
          localStorage.setItem("authToken", data.data.token);

          // Redireccionamos a la página de la aplicación cuando el login es correcto.
          // Sugerencia de nombre de la ruta: "/dashboard" (crea /app/dashboard/page.js)
          router.push("/dashboard");
        } else {
          // Si las credenciales no coinciden, mostramos error general
          setErrors((prev) => ({ ...prev, general: "Credenciales inválidas. Verifica e inténtalo de nuevo." }));
        }
      })
      .catch(error => {
        console.error("Error en la solicitud de login:", error);
        setErrors((prev) => ({ ...prev, general: "Ocurrió un error. Por favor intenta más tarde." }))
      });
  }
  return (
    // Contenedor principal: centrado vertical/horizontal
    <div className="flex items-center justify-center min-h-screen p-4">
      {/* Formulario de login */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md"
        aria-label="Formulario de inicio de sesión"
      >
        {/* Título */}
        <h2 className="text-2xl font-bold mb-4 text-center text-blue-600">Iniciar sesión</h2>

        {/* Mensaje de error general (credenciales inválidas, etc.) */}
        {errors.general && <p className="mb-3 text-sm text-red-600">{errors.general}</p>}

        {/* Campo Email */}
        <div className="mb-4">
          <label htmlFor="email" className="block text-gray-700 mb-2">
            Correo electrónico
          </label>
          <input
            id="email"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`w-full px-3 py-2 text-gray-600 border rounded placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.email ? "border-red-500" : "border-gray-300"
              }`}
            placeholder="default@ejemplo.com"
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "email-error" : undefined}
            required
          />
          {/* Mensaje de validación específico para email */}
          {errors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600">
              {errors.email}
            </p>
          )}
        </div>

        {/* Campo Contraseña */}
        <div className="mb-4">
          <label htmlFor="password" className="block text-gray-700 mb-2">
            Contraseña
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-3 py-2 text-gray-600 border rounded placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 ${errors.password ? "border-red-500" : "border-gray-300"
                }`}
              placeholder="Tu contraseña"
              aria-invalid={errors.password ? "true" : "false"}
              aria-describedby={errors.password ? "password-error" : undefined}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              className="absolute inset-y-0 right-2 flex items-center px-2 text-gray-500 hover:text-gray-700"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                // ojo abierto (simple SVG)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 3C5 3 1.73 6.11.5 10c1.23 3.89 4.5 7 9.5 7s8.27-3.11 9.5-7C18.27 6.11 15 3 10 3zM10 15a5 5 0 110-10 5 5 0 010 10z" />
                </svg>
              ) : (
                // ojo cerrado (simple SVG)
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.58 10.58A3 3 0 0113.42 13.42" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.88 9.88A5 5 0 0119.92 12.42C18.69 16.31 15.42 19.42 10.42 19.42c-1.1 0-2.15-.18-3.12-.52" />
                </svg>
              )}
            </button>
          </div>
          {/* Mensaje de validación específico para contraseña */}
          {errors.password && (
            <p id="password-error" className="mt-1 text-sm text-red-600">
              {errors.password}
            </p>
          )}
        </div>

        {/* Checkbox Recordarme */}
        <div className="flex items-center mb-6">
          <input
            id="rememberMe"
            name="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="rememberMe" className="ml-2 text-gray-700">
            Recordarme
          </label>
        </div>

        {/* Botón enviar */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
        >
          Entrar
        </button>

      </form>
    </div>
  );
}
