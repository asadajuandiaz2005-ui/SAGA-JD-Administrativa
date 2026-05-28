import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getImagenes,
  getImagenById,
  createImagen,
  updateImagen,
  deleteImagen,
  toggleVisibilidadImagen,
} from "../Services/ServiceEdiImagen";
import type { Imagen } from "../Models/ModelsEdiImagen";
import { useAlerts } from "@/Modules/Global/context/AlertContext";







//
//  Obtener todas las imágenes
//
export function useGetImagenes() {
  return useQuery<Imagen[], Error>({
    queryKey: ["imagenes"],
    queryFn: getImagenes,
  });
}

//
//  Obtener una imagen por ID
//
export function useGetImagenById(id: number) {
  return useQuery<Imagen, Error>({
    queryKey: ["imagen", id],
    queryFn: () => getImagenById(id),
    enabled: !!id, // Solo se ejecuta si existe un ID válido
  });
}

//
// Crear una nueva imagen
//
export function useCreateImagen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) => createImagen(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imagenes"] });
    },
    onError: (error) => {
      console.error("Error al crear la imagen:", error);
    },
  });
}

//
// Actualizar una imagen existente
//
export function useUpdateImagen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      formData,
    }: {
      id: number;
      formData: FormData;
    }) => updateImagen(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imagenes"] });
    },
    onError: (error) => {
      console.error("Error al actualizar la imagen:", error);
    },
  });
}

//
// Alternar visibilidad de una imagen
//
export function useToggleVisibilidadImagen() {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useAlerts();

  return useMutation({
    mutationFn: (id: number) => toggleVisibilidadImagen(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imagenes"] });
      showSuccess("Visibilidad actualizada", "La visibilidad de la imagen se ha actualizado exitosamente");
    },
    onError: (error) => {
      console.error("Error al actualizar la visibilidad de la imagen:", error);
      showError("Error", "No se pudo actualizar la visibilidad de la imagen");
    },
  });
}

//
// Eliminar una imagen
//
export function useDeleteImagen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => deleteImagen(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["imagenes"] });
    },
    onError: (error) => {
      console.error("Error al eliminar la imagen:", error);
    },
  });
}
