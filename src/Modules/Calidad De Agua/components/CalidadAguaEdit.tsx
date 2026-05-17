import { useState, useEffect } from "react";
import { useUpdateCalidadAgua } from "../Hook/HookCalidadAgua";
import { CalidadAguaSchema } from "../schemas/CalidadDeAgua";
import { FaFilePdf, FaTimes } from "react-icons/fa";
import { useAlerts } from "@/Modules/Global/context/AlertContext";
import type { ArchivoCalidadAgua } from "../Models/CalidadDeAgua";
import {
    AlertDialog,
    AlertDialogTrigger,
    AlertDialogContent,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogHeader,
    AlertDialogFooter
} from "@/Modules/Global/components/Sidebar/ui/alert-dialog";

interface CalidadAguaEditProps {
    archivo: ArchivoCalidadAgua;
    onClose: () => void;
    refetch: () => void;
}

export default function CalidadAguaEdit({ archivo, onClose, refetch }: CalidadAguaEditProps) {
    const updateCalidadAguaMutation = useUpdateCalidadAgua();
    const { showSuccess, showError } = useAlerts();

    const [titulo, setTitulo] = useState(archivo.Titulo || "");
    const [descripcion, setDescripcion] = useState(archivo.Descripcion || "");
    const [file, setFile] = useState<File | null>(null);
    const [tituloError, setTituloError] = useState("");
    const [descripcionError, setDescripcionError] = useState("");
    const [fileError, setFileError] = useState("");
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    useEffect(() => {
        setTitulo(archivo.Titulo || "");
        setDescripcion(archivo.Descripcion || "");
        setTituloError("");
        setDescripcionError("");
        setFileError("");
        setFile(null);
    }, [archivo]);

    const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setTitulo(value);
        if (value.trim().length < 5) {
            setTituloError("El título debe tener al menos 5 caracteres.");
        } else if (value.length > 100) {
            setTituloError("El título no puede exceder los 100 caracteres.");
        } else {
            setTituloError("");
        }
    };

    const handleDescripcionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value || "";
        setDescripcion(value);
        if (value.trim().length < 10) {
            setDescripcionError("La descripción debe tener al menos 10 caracteres.");
        } else if (value.length > 200) {
            setDescripcionError("La descripción no puede exceder los 200 caracteres.");
        } else {
            setDescripcionError("");
        }
    };

    const validateFields = () => {
        const tituloLength = titulo.trim().length;
        const descripcionLength = descripcion.trim().length;

        let hasErrors = false;

        if (tituloLength < 5) {
            setTituloError("El título debe tener al menos 5 caracteres.");
            hasErrors = true;
        } else {
            setTituloError("");
        }

        if (descripcionLength < 10) {
            setDescripcionError("La descripción debe tener al menos 10 caracteres.");
            hasErrors = true;
        } else {
            setDescripcionError("");
        }

        return !hasErrors;
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) {
            e.preventDefault();
        }

        if (!validateFields()) {
            showError(
                descripcion.trim().length < 10
                    ? 'La descripción debe tener al menos 10 caracteres.'
                    : 'El título debe tener al menos 5 caracteres.'
            );
            return;
        }

        try {
            CalidadAguaSchema.parse({
                Titulo: titulo.trim(),
                Descripcion: descripcion.trim(),
            });

            const formData = new FormData();
            formData.append("Titulo", titulo.trim());
            formData.append("Descripcion", descripcion.trim());
            if (file) {
                formData.append("Archivo_Calidad_Agua", file);
            }

            await updateCalidadAguaMutation.mutateAsync({ id: archivo.Id_Calidad_Agua, formData });

            showSuccess("¡Registro actualizado con éxito!");
            refetch();
            onClose();
        } catch (error: any) {
            if (error?.issues) {
                showError(error.issues[0]?.message || "Error de validación");
            } else {
                console.error("Error inesperado:", error);
                const errorMessage = error.response?.data?.message || "Hubo un problema al actualizar el registro.";
                showError(errorMessage);
            }
        }
    };

    return (
        <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md bg-white rounded-lg shadow-lg flex flex-col overflow-hidden max-h-[90vh]"
            >
                <div className="sticky top-0 bg-white p-6 border-b border-gray-200 z-10">
                    <h3 className="text-lg font-semibold text-gray-800">Editar Registro</h3>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-180px)] scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
                    {/* Campo de Título */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Título</label>
                        <input
                            type="text"
                            placeholder="Título"
                            value={titulo}
                            onChange={handleTituloChange}
                            maxLength={100}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm break-words"
                            style={{ whiteSpace: "normal", overflowWrap: "break-word" }}
                            required
                        />
                        <div className="text-right text-xs text-gray-500 mt-1">
                            {titulo.length}/100
                        </div>
                        {tituloError && <p className="text-xs text-red-500 mt-1">{tituloError}</p>}
                        {!tituloError && titulo.length === 100 && (
                            <p className="text-xs text-red-500 mt-1">El título puede tener máximo 100 caracteres.</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea
                            placeholder="Descripción"
                            value={descripcion}
                            onChange={handleDescripcionChange}
                            maxLength={200}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm break-words scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 scrollbar-rounded"
                            style={{ whiteSpace: "normal", overflowWrap: "break-word" }}
                            rows={3}
                            required
                        />
                        <div className="text-right text-xs text-gray-500 mt-1">
                            {(descripcion || "").length}/200
                        </div>
                        {descripcionError && <p className="text-xs text-red-500 mt-1">{descripcionError}</p>}
                        {!descripcionError && descripcion.length === 200 && (
                            <p className="text-xs text-red-500 mt-1">La descripción puede tener máximo 200 caracteres.</p>
                        )}
                    </div>

                   

                    {/* Campo de Archivos PDF (opcional para reemplazar) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                           Opcional reemplzar el Archivo PDF
                        </label>

                        {/* Botón para seleccionar archivo */}
                        <div className="relative">
                            <input
                                id="archivo"
                                type="file"
                                accept="application/pdf"
                                onChange={(e) => {
                                    const selectedFile = e.target.files?.[0];
                                    if (selectedFile) {
                                        const MAX_SIZE_MB = 20;
                                        const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;
                                        if (selectedFile.size > MAX_SIZE_BYTES) {
                                            setFileError(`El archivo no debe superar los ${MAX_SIZE_MB} MB.`);
                                            setFile(null);
                                        } else {
                                            setFileError("");
                                            setFile(selectedFile);
                                        }
                                    } else {
                                        setFile(null);
                                    }
                                    e.target.value = '';
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <button
                                type="button"
                                className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-sky-300 bg-sky-50 hover:bg-sky-100 transition-colors cursor-pointer flex flex-col items-center gap-2"
                            >
                                <svg className="size-8 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-sky-600 font-medium">
                                    {file ? "Cambiar Archivo" : "Seleccionar Archivo PDF"}
                                </span>
                               
                            </button>
                        </div>

                        {/* Archivo seleccionado */}
                        {file && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        Nuevo archivo seleccionado
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-xs bg-white p-2 rounded border">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <FaFilePdf className="size-4 text-red-500 flex-shrink-0" />
                                        <span className="truncate">{file.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <span className="text-gray-500">
                                            {(file.size / 1024 / 1024).toFixed(1)} MB
                                        </span>
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFile(null);
                                                setFileError("");
                                            }}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                                        >
                                            <FaTimes className="size-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {fileError && (
                            <p className="text-xs text-red-500 mt-2">{fileError}</p>
                        )}
                    </div>
                </div>

                <div className="sticky bottom-0 flex justify-end gap-4 p-6 border-t border-gray-200 bg-white z-10">
                    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                        <AlertDialogTrigger asChild>
                            <button
                                type="button"
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm text-sm"
                                disabled={updateCalidadAguaMutation.status === "pending" || !!tituloError || !!descripcionError}
                            >
                                {updateCalidadAguaMutation.status === "pending"
                                    ? "Actualizando…"
                                    : "Actualizar Registro"}
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmar actualización?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    ¿Estás seguro de que deseas actualizar este registro de calidad de agua? Esta acción modificará la información existente.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                               
                                <AlertDialogAction
                                    onClick={() => {
                                        setShowConfirmDialog(false);
                                        handleSubmit();
                                    }}
                                >
                                    Confirmar
                                </AlertDialogAction>
                                 <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 shadow-sm text-sm"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}