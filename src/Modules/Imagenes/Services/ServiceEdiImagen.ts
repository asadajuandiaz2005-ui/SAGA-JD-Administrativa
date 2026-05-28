import apiAuth from "@/Api/apiAuth";
import type { Imagen } from "../Models/ModelsEdiImagen";

// Obtener todas las imágenes
export const getImagenes = async (): Promise<Imagen[]> => {
  const res = await apiAuth.get("/imagenes");
  return res.data;
};

//  Obtener una imagen por ID
export const getImagenById = async (id: number): Promise<Imagen> => {
  const res = await apiAuth.get(`/imagenes/${id}`);
  return res.data;
};

//  Crear una nueva imagen
export const createImagen = async (formData: FormData): Promise<Imagen> => {
  const res = await apiAuth.post("/imagenes", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// Actualizar una imagen existente
export const updateImagen = async (id: number, formData: FormData): Promise<Imagen> => {
  const res = await apiAuth.put(`/imagenes/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

// Alternar visibilidad de una imagen
export const toggleVisibilidadImagen = async (id: number): Promise<Imagen> => {
  const res = await apiAuth.patch(`/imagenes/${id}/visibilidad`);
  return res.data;
};

// Eliminar una imagen
export const deleteImagen = async (id: number): Promise<void> => {
  try {
    const res = await apiAuth.delete(`/imagenes/${id}`);
    if (res.status !== 200 && res.status !== 204) {
      throw new Error("Error al eliminar la imagen en el backend.");
    }
  } catch (error) {
    console.error("Error al eliminar la imagen:", error);
    throw new Error("Error al eliminar la imagen.");
  }
};
