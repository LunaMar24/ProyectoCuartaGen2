const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

const apiUrl = (path = "") => {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${suffix}`;
};

const API_ERROR_MESSAGES = {
  EMAIL_ALREADY_EXISTS: "El correo ya está registrado.",
  EMAIL_ALREADY_EXISTS_OTHER_USER: "El correo ya está registrado en otro usuario.",
  EMAIL_ALREADY_EXISTS_USERS: "El correo ya está registrado.",
  EMAIL_ALREADY_EXISTS_PROPIETARIOS: "El correo ya está registrado.",
  CEDULA_ALREADY_EXISTS: "La cédula ya está registrada.",
  PROPIETARIO_NOT_FOUND: "El propietario no existe.",
  DUPLICATE_ENTRY: "Ya existe un registro con esos datos.",
  SP_VALIDATION_ERROR: "No se pudo completar la operación por una validación de datos.",
  USER_CREATE_ERROR: "No se pudo crear el usuario.",
  USER_UPDATE_ERROR: "No se pudo actualizar el usuario.",
  CLIENT_USER_DELETE_BLOCKED: "No puedes eliminar un usuario tipo cliente desde Usuarios, debes eliminar el cliente desde propietarios.",
};

const getApiErrorMessage = (data, fallback = "Ocurrió un error") => {
  const code = data?.code;
  const message = data?.message || data?.msg;

  if (code && API_ERROR_MESSAGES[code]) {
    return API_ERROR_MESSAGES[code];
  }

  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }

  return fallback;
};

export { API_BASE, apiUrl, getApiErrorMessage };
