export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE || "http://10.0.2.2:3000/api/v1";

export const apiUrl = (path: string) => {
  if (!path) return API_BASE_URL;
  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
};
