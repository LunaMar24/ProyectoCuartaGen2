"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function HistorialMascotaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;

  useEffect(() => {
    if (id) {
      if (typeof window !== "undefined" && !localStorage.getItem("lastMascotasURL")) {
        localStorage.setItem("lastMascotasURL", "/dashboard/mascotas");
      }
      router.replace(`/dashboard/historiales?mascota=${id}`);
    }
  }, [id, router]);

  return null;
}
