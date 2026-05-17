import { useState, useEffect } from "react";
import { useUpdateActa, useDeleteArchivoActa } from "../Hook/hookActas";
import { FaFilePdf, FaTimes } from "react-icons/fa";
import { useAlerts } from "@/Modules/Global/context/AlertContext";
import type { Acta, ArchivoActa } from "../Models/ActasModels";
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

interface ActasEditProps {
    acta: Acta;
    onClose: () => void; // Función para cerrar el modal
    refetch: () => void; // Función para refrescar la tabla
}

export default function ActasEdit({ acta, onClose, refetch }: ActasEditProps) {
    const updateActaMutation = useUpdateActa();
    const deleteArchivoMutation = useDeleteArchivoActa();
    const { showSuccess, showError } = useAlerts();

    const [titulo, setTitulo] = useState(acta.Titulo);
    const [descripcion, setDescripcion] = useState(acta.Descripcion);
    const [files, setFiles] = useState<File[]>([]);
    const [existingFiles, setExistingFiles] = useState<ArchivoActa[]>(acta.Archivos ?? []);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [tituloError, setTituloError] = useState(""); // Validación de título
    const [descripcionError, setDescripcionError] = useState(""); // Validación de descripción
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);

    // Pre-cargar los valores del acta cuando se monta el componente
    useEffect(() => {
        setTitulo(acta.Titulo);
        setDescripcion(acta.Descripcion);
        setExistingFiles(acta.Archivos ?? []);
    }, [acta]);

    const handleDeleteArchivoExistente = (idArchivo: number) => {
        setDeletingId(idArchivo);
        deleteArchivoMutation.mutate({ idActa: acta.Id_Acta, idArchivo }, {
            onSuccess: () => {
                setExistingFiles(prev => prev.filter(f => f.Id_Archivo_Acta !== idArchivo));
                showSuccess('Archivo eliminado correctamente.');
                setDeletingId(null);
            },
            onError: (error: any) => {
                const errorMessage = error.response?.data?.message || 'No se pudo eliminar el archivo.';
                showError(errorMessage);
                setDeletingId(null);
            },
        });
    };

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
        const value = e.target.value;
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

        const formData = new FormData();
        formData.append("Titulo", titulo.trim());
        formData.append("Descripcion", descripcion.trim());

        // Solo agregar archivos si se seleccionaron nuevos
        if (files.length > 0) {
            files.forEach((file) => {
                formData.append("Archivo", file);
            });
        }

        updateActaMutation.mutate(
            { id: acta.Id_Acta, formData },
            {
                onSuccess: () => {
                    refetch(); // Refresca la tabla para mostrar los cambios
                    showSuccess('¡Acta actualizada con éxito!');
                    setTimeout(() => onClose(), 500); // Oculta el modal después de actualizar el acta
                },
                onError: (error: any) => {
                    console.error("Error al actualizar el acta:", error);
                    const errorMessage = error.response?.data?.message || 'Hubo un problema al actualizar el acta.';
                    showError(errorMessage);
                },
            }
        );
    };

    return (
        <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50">
            <form
                onSubmit={handleSubmit}
                className="w-full max-w-md bg-white rounded-lg shadow-lg flex flex-col overflow-hidden max-h-[90vh]"
            >
                <div className="sticky top-0 bg-white p-6 border-b border-gray-200 z-10">
                    <h3 className="text-lg font-semibold text-gray-800">Editar Acta</h3>
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
                        />
                        <div className="text-right text-xs text-gray-500 mt-1">
                            {titulo.length}/100
                        </div>
                        {tituloError && (
                            <p className="text-xs text-red-500 mt-1">{tituloError}</p>
                        )}
                        {!tituloError && titulo.length === 100 && (
                            <p className="text-xs text-red-500 mt-1">El título puede tener máximo 100 caracteres.</p>
                        )}
                    </div>

                    {/* Campo de Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea
                            placeholder="Descripción"
                            value={descripcion}
                            onChange={handleDescripcionChange}
                            maxLength={200}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm break-words scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100"
                            style={{ whiteSpace: "normal", overflowWrap: "break-word" }}
                            rows={3}
                        />
                        <div className="text-right text-xs text-gray-500 mt-1">
                            {descripcion.length}/200
                        </div>
                        {descripcionError && (
                            <p className="text-xs text-red-500 mt-1">{descripcionError}</p>
                        )}
                        {!descripcionError && descripcion.length === 200 && (
                            <p className="text-xs text-red-500 mt-1">La descripción puede tener máximo 200 caracteres.</p>
                        )}
                    </div>

                    {/* Archivos existentes del acta */}
                    {existingFiles.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Archivos actuales
                            </label>
                            <div className="space-y-1">
                                {existingFiles.map((archivo) => {
                                    const segmentoFinal = archivo.Url_Archivo.split('/').pop();
                                    const nombreArchivo = segmentoFinal
                                        ? decodeURIComponent(segmentoFinal.split('?')[0].split('#')[0])
                                        : `Archivo ${archivo.Id_Archivo_Acta}`;
                                    const eliMinando = deletingId === archivo.Id_Archivo_Acta;
                                    return (
                                        <div
                                            key={archivo.Id_Archivo_Acta}
                                            className="flex items-center justify-between text-xs bg-red-50 border border-red-200 p-2 rounded"
                                        >
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <FaFilePdf className="w-4 h-4 text-red-500 flex-shrink-0" />
                                                <a
                                                    href={archivo.Url_Archivo}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="truncate text-blue-600 hover:underline"
                                                    title={nombreArchivo}
                                                >
                                                    {nombreArchivo}
                                                </a>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteArchivoExistente(archivo.Id_Archivo_Acta)}
                                                disabled={eliMinando}
                                                className="text-red-500 hover:text-red-700 hover:bg-red-100 p-1 rounded flex-shrink-0 disabled:opacity-50"
                                                title="Eliminar archivo"
                                            >
                                                {eliMinando ? (
                                                    <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                    </svg>
                                                ) : (
                                                    <FaTimes className="w-3 h-3" />
                                                )}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Campo de Archivos (opcional para edición) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Agregar nuevos archivos PDF
                        </label>

                        {/* Botón para seleccionar múltiples archivos */}
                        <div className="relative">
                            <input
                                id="archivos"
                                type="file"
                                accept="application/pdf"
                                multiple
                                onChange={(e) => {
                                    const selectedFiles = e.target.files ? Array.from(e.target.files) : [];
                                    if (selectedFiles.length > 0) {
                                        // Agregar nuevos archivos a los existentes, evitando duplicados
                                        setFiles(prevFiles => {
                                            const newFiles = [...prevFiles];
                                            selectedFiles.forEach(newFile => {
                                                const isDuplicate = newFiles.some(existingFile =>
                                                    existingFile.name === newFile.name &&
                                                    existingFile.size === newFile.size
                                                );
                                                if (!isDuplicate) {
                                                    newFiles.push(newFile);
                                                }
                                            });
                                            return newFiles;
                                        });
                                    }
                                    // Limpiar el input para poder seleccionar los mismos archivos otra vez
                                    e.target.value = '';
                                }}
                                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                            />
                            <button
                                type="button"
                                className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-sky-300 bg-sky-50 hover:bg-sky-100 transition-colors cursor-pointer flex flex-col items-center gap-2"
                            >
                                <svg className="w-8 h-8 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="text-sky-600 font-medium">
                                    {files.length > 0 ? "Agregar Más Archivos" : "Seleccionar Archivos PDF"}
                                </span>
                                <span className="text-xs text-gray-500">
                                    Opcional - Solo si deseas reemplazar archivos
                                </span>
                            </button>
                        </div>

                        {/* Lista de archivos seleccionados */}
                        {files.length > 0 && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-700">
                                        {files.length} archivo{files.length > 1 ? 's' : ''} seleccionado{files.length > 1 ? 's' : ''}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => setFiles([])}
                                        className="text-xs text-red-600 hover:text-red-800"
                                    >
                                        Eliminar todos los archivos
                                    </button>
                                </div>
                                <div className="space-y-1 max-h-32 overflow-y-auto">
                                    {files.map((file, index) => (
                                        <div key={index} className="flex items-center justify-between text-xs bg-white p-2 rounded border">
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                <FaFilePdf className="w-4 h-4 text-red-500 flex-shrink-0" />
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
                                                        setFiles(prevFiles => prevFiles.filter((_, i) => i !== index));
                                                    }}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded"
                                                >
                                                    <FaTimes className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="sticky bottom-0 flex justify-end gap-4 p-6 border-t border-gray-200 bg-white z-10">
                    <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                        <AlertDialogTrigger asChild>
                            <button
                                type="button"
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm text-sm"
                                disabled={updateActaMutation.isPending || !!tituloError || !!descripcionError}
                            >
                                {updateActaMutation.isPending ? "Actualizando..." : "Actualizar Acta"}
                            </button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmar actualización?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    ¿Estás seguro de que deseas actualizar esta acta? Esta acción modificará la información existente.
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
                        onClick={onClose} // Oculta el modal
                        className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300 shadow-sm text-sm"
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
}