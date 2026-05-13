import { useState, useEffect } from "react";
import { z } from "zod";
import { useAlerts } from "@/Modules/Global/context/AlertContext";
import type { Imagen } from "../Models/ModelsEdiImagen";
import { UpdateImagenSchema } from "../Schemas/SchemasEdiImagen";
import { updateImagen } from "../Services/ServiceEdiImagen";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/Modules/Global/components/Sidebar/ui/alert-dialog";

interface ImagenFormEditProps {
  onClose: () => void;
  refetch: () => void;
  imagen: Imagen;
}

export default function ImagenFormEdit({ onClose, refetch, imagen }: ImagenFormEditProps) {
  const { showSuccess, showError } = useAlerts();

  const [nombre, setNombre] = useState(imagen.Nombre_Imagen || "");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(imagen.Imagen || "");
  const [nombreError, setNombreError] = useState("");
  const [isValid, setIsValid] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    setNombre(imagen.Nombre_Imagen || "");
    setPreview(imagen.Imagen || "");
    setFile(null);
    setNombreError("");
    validateAll();
  }, [imagen]);

  const validateAll = () => {
    const result = UpdateImagenSchema.safeParse({
      Nombre_Imagen: nombre.trim(),
      Imagen: file ?? undefined, // Cambiado a undefined si no hay archivo nuevo
    });
    setIsValid(result.success);
    setNombreError(result.success ? "" : result.error.errors[0]?.message || "");
  };

  const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNombre(value);
    const result = UpdateImagenSchema.pick({ Nombre_Imagen: true }).safeParse({
      Nombre_Imagen: value.trim(),
    });
    if (result.success) {
      setNombreError("");
      validateAll();
    } else {
      setNombreError(result.error.errors[0]?.message || "Error de validación.");
      setIsValid(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) {
      setPreview(URL.createObjectURL(selected));
    }
    validateAll();
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (isSubmitting) return; // Prevenir doble submit

    setIsSubmitting(true);

    try {
      UpdateImagenSchema.parse({
        Nombre_Imagen: nombre.trim(),
        Imagen: file ?? undefined, // Cambiado a undefined si no hay archivo nuevo
      });

      const formData = new FormData();
      formData.append("Nombre_Imagen", nombre.trim());
      if (file) formData.append("Imagen", file);

      await updateImagen(imagen.Id_Imagen, formData);

      showSuccess("Imagen actualizada correctamente.");
      refetch();
      onClose();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = error.errors[0]?.message || "Error de validación.";
        setNombreError(msg);
        showError(msg);
      } else {
        console.error(error);
        showError("Error al actualizar la imagen.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Editar Imagen</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <div className="w-5 h-5 text-gray-500 flex items-center justify-center">✕</div>
          </button>
        </div>

        {/* Contenido del formulario */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 scrollbar-rounded">
          <form
            id="edit-imagen-form"
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Campo nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la imagen *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={handleNombreChange}
                maxLength={50}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                required
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {nombre.length}/50
              </div>
              {nombreError && (
                <p className="text-xs text-red-500 mt-1">{nombreError}</p>
              )}
              {!nombreError && nombre.length === 50 && (
                <p className="text-xs text-red-500 mt-1">El título puede tener máximo 50 caracteres.</p>
              )}
            </div>

            {/* Campo imagen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cambiar imagen <span className="text-gray-500 font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors">
                  <span className="text-gray-700 text-sm">
                    {file ? file.name : "Seleccionar nueva imagen..."}
                  </span>
                  <span className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
                    Seleccionar imagen
                  </span>
                </div>
              </div>

            </div>

            {/* Preview de la imagen */}
            {preview && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vista previa
                </label>
                <div className="border border-gray-300 rounded-lg p-2 bg-gray-50">
                  <img
                    src={preview}
                    alt="Preview"
                    className="max-w-full h-auto max-h-64 mx-auto rounded"
                  />
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Botones de acción - Fuera del form */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                disabled={!isValid || isSubmitting}
                className={`px-4 py-2 rounded-lg shadow-sm text-sm transition-colors ${
                  isValid && !isSubmitting
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-600 cursor-not-allowed"
                }`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    Guardando...
                  </span>
                ) : (
                  "Guardar Cambios"
                )}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  <span>¿Guardar cambios?</span>
                </AlertDialogTitle>
                <AlertDialogDescription>
                  <span>¿Estás seguro de que deseas actualizar la imagen "{nombre.length > 25 ? `${nombre.slice(0, 25)}...` : nombre}"?</span>
                  <br />
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction
                  onClick={() => {
                    setShowConfirmDialog(false);
                    handleSubmit();
                  }}
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? 'Guardando...' : 'Guardar'}</span>
                </AlertDialogAction>
                <AlertDialogCancel disabled={isSubmitting}>
                  <span>Cancelar</span>
                </AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-lg shadow-sm text-sm transition-colors ${isSubmitting
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}