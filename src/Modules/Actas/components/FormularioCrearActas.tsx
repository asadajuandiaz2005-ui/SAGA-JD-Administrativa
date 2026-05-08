import { useState, useEffect } from "react";
import { useCreateActa } from "../Hook/hookActas";
import { FaFilePdf, FaTimes } from "react-icons/fa";
import { Alert } from '@/Modules/Global/components/Alert/ui/Alert';

interface FormularioCrearActasProps {
    onClose: () => void;
    refetch: () => void;
}

export default function FormularioCrearActas({ onClose, refetch }: FormularioCrearActasProps) {
    const createActaMutation = useCreateActa();

    const [titulo, setTitulo] = useState("");
    const [descripcion, setDescripcion] = useState("");
    const [files, setFiles] = useState<File[]>([]);
    const [tituloError, setTituloError] = useState("");
    const [descripcionError, setDescripcionError] = useState("");
    const [notification, setNotification] = useState<{
        type: 'success' | 'error' | 'info';
        title: string;
        description?: string;
    } | null>(null);

    useEffect(() => {
        if (!notification) return;
        const t = setTimeout(() => setNotification(null), 3500);
        return () => clearTimeout(t);
    }, [notification]);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateFields()) {
            setNotification({
                type: 'error',
                title: 'Corrige los campos del formulario.',
                description: descripcion.trim().length < 10
                    ? 'La descripción debe tener al menos 10 caracteres.'
                    : 'El título debe tener al menos 5 caracteres.',
            });
            return;
        }

        if (files.length === 0) {
            setNotification({ type: 'error', title: 'Debe seleccionar al menos un archivo válido.' });
            return;
        }

        const formData = new FormData();
        formData.append("Titulo", titulo.trim());
        formData.append("Descripcion", descripcion.trim());
        files.forEach((file) => {
            formData.append("Archivo", file);
        });

        createActaMutation.mutate(formData, {
            onSuccess: () => {
                setTitulo("");
                setDescripcion("");
                setFiles([]);
                refetch();
                setNotification({ type: 'success', title: 'Acta creada con éxito.' });
               
                setTimeout(() => onClose(), 500);
            },
            onError: (error: any) => {
                console.error("Error al crear el acta:", error);
                const errorMessage = error.response?.data?.message || 'Hubo un problema al crear el acta.';
                setNotification({ type: 'error', title: errorMessage });
            },
        });
    };

    return (
    <>
        {notification && (
            <div className="fixed top-4 right-4 z-[200]">
                <Alert
                    type={notification.type === 'success' ? 'success' : (notification.type === 'error' ? 'error' : 'info')}
                    title={notification.title}
                    description={notification.description}
                    onClose={() => setNotification(null)}
                />
            </div>
        )}

        <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Crear Acta</h3>

                    <form
                        id="crear-acta-form"
                        onSubmit={handleSubmit}
                        className="space-y-4"
                    >
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
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm break-words"
                                style={{ whiteSpace: "normal", overflowWrap: "break-word" }}
                                rows={3}
                                required
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

                        {/* Campo de Archivos */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Archivos PDF</label>
                            
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
                                        Haz clic para elegir archivos PDF 
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
                                            Eliminar todos
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
                    </form>
                </div>

                {/* Botones de acción - Fuera del form */}
                <div className="sticky bottom-0 flex justify-end gap-3 p-6 border-t bg-gray-50 z-10">
                    <button
                        type="submit"
                        form="crear-acta-form"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        disabled={createActaMutation.isPending}
                    >
                        {createActaMutation.isPending ? "Subiendo..." : "Subir Acta"}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    </>
    );
}