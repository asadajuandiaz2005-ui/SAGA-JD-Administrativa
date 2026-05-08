import { useRef, useState } from "react";

import { useAlerts } from "@/Modules/Global/context/AlertContext";
import { z } from "zod";
import { CreateImagenSchema } from "../Schemas/SchemasEdiImagen";
import { useCreateImagen } from "../Hook/hookEdiImagen";

interface ImagenFormProps {
  onClose: () => void;
  refetch: () => void;
}

export default function ImagenForm({ onClose, refetch }: ImagenFormProps) {

  const { showSuccess, showError } = useAlerts();

  const [nombre, setNombre] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [_preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { mutateAsync, isPending } = useCreateImagen();
  const [nombreError, setNombreError] = useState("");
  const [isValid, setIsValid] = useState(false);

  //  Validar campo individual y formulario completo
  const validateField = (_field: "Nombre_Imagen", value: string) => {
    try {
      CreateImagenSchema.pick({ Nombre_Imagen: true }).parse({
        Nombre_Imagen: value.trim(),
      });
      setNombreError("");
    } catch (err) {
      if (err instanceof z.ZodError) {
        const msg = err.errors[0]?.message || "Error de validación.";
        setNombreError(msg);
      }
    }

    try {
      CreateImagenSchema.parse({
        Nombre_Imagen: value.trim(),
      });
      setIsValid(true);
    } catch {
      setIsValid(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    setFile(selected);
    if (selected) setPreview(URL.createObjectURL(selected));
  };

  //  Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      showError("Debe seleccionar una imagen antes de continuar.");
      return;
    }

    try {
      CreateImagenSchema.parse({
        Nombre_Imagen: nombre.trim(),
      });

      const formData = new FormData();
      formData.append("Nombre_Imagen", nombre.trim());
      formData.append("Imagen", file);

      await mutateAsync(formData);

      showSuccess("¡Imagen subida exitosamente!");
      setNombre("");
      setFile(null);
      setPreview(null);
      onClose();
      refetch();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const msg = error.errors[0]?.message || "Error de validación.";
        showError(msg);
      } else {
        showError("Hubo un problema al subir la imagen.");
        console.error(error);
      }
    }
  };

  return (
    <div className="fixed inset-0 backdrop-blur flex items-center justify-center z-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 space-y-2"
      >
        <h3 className="text-lg font-semibold text-gray-800">
          Subir nueva imagen
        </h3>

        {/* Campo de Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Nombre de la imagen
          </label>
          <input
            type="text"
            placeholder="Ejemplo: Tanque principal"
            value={nombre}
            onChange={(e) => {
              const v = e.target.value;
              setNombre(v);
              validateField("Nombre_Imagen", v);
            }}
            maxLength={50}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
            required
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {nombre.length}/50
          </div>
          {nombreError ? (
            <p className="text-xs text-red-500 mt-1">{nombreError}</p>
          ) : (
            <>
              {nombre.length === 50 && (
                <p className="text-xs text-red-500 mt-1">El título puede tener máximo 50 caracteres.</p>
              )}
              {nombre.length < 50 && (
                <p className="text-xs text-gray-400 mt-1">&nbsp;</p>
              )}
            </>
          )}
        </div>

        {/* Campo de Imagen */}
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Seleccionar imagen
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isPending}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isPending}
            className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-sky-300 bg-sky-50 hover:bg-sky-100 transition-colors cursor-pointer flex flex-col items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-8 h-8 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sky-600 font-medium">
              {file ? "Cambiar Archivo" : "Haz clic para seleccionar imagen"}
            </span>
            {file && (
              <span className="text-xs text-gray-600 truncate max-w-full">{file.name}</span>
            )}
          </button>
        </div>

        {/* Nota informativa */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs text-blue-700">
            <strong>Nota:</strong> La imagen se actualizará automáticamente en
            el sitio informativo después de subirla.
          </p>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-4">
          <button
            type="submit"
            className={`px-4 py-2 rounded-lg shadow-sm text-sm transition-colors ${isValid && file && !isPending
              ? "bg-blue-600 text-white hover:bg-blue-700"
              : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
            disabled={!isValid || !file || isPending}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                Subiendo...
              </span>
            ) : (
              "Subir Imagen"
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className={`px-4 py-2 rounded-lg shadow-sm text-sm transition-colors ${isPending
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}


