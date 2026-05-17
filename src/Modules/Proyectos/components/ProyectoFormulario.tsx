import { useRef, useState } from "react";
import { useCreateProyecto } from "../Hook/HookProyecto";
import { z } from "zod";
import { ProyectoSchema } from "../schemas/Proyecto";

interface FormularioProyectoProps {
    id: number;
    tituloInicial?: string;
    descripcionInicial?: string;
    onClose: () => void;
    refetch: () => void;
}

// Componente Toast
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
    return (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${type === 'success' ? 'bg-green-700' : 'bg-red-700'
            } text-white min-w-[300px] max-w-md animate-slideIn`}>
            <div className="flex items-center gap-2 flex-1">
                {type === 'success' ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                )}
                <span className="text-sm font-medium">{message}</span>
            </div>
            <button
                onClick={onClose}
                className="text-white hover:bg-white/10 rounded-full p-1 transition-colors"
            >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
            </button>
        </div>
    );
}

export default function FormularioProyecto({
    tituloInicial = "",
    descripcionInicial = "",
    onClose,
    refetch,
}: Readonly<FormularioProyectoProps>) {

    const createProyectoMutation = useCreateProyecto();

    const [titulo, setTitulo] = useState(tituloInicial);
    const [descripcion, setDescripcion] = useState(descripcionInicial);
    const [imagen, setImagen] = useState<File | null>(null);
    const [_preview, setPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const [errors, setErrors] = useState<{
        Titulo?: string;
        Descripcion?: string;
        Imagen_Url?: string;
    }>({});

    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Función para mostrar toast
    const showToast = (message: string, type: 'success' | 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 5000);
    };

    // Validar título usando Zod
    const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setTitulo(value);

        try {
            ProyectoSchema.shape.Titulo.parse(value);
            setErrors(prev => ({ ...prev, Titulo: undefined }));
        } catch (error) {
            if (error instanceof z.ZodError) {
                setErrors(prev => ({ ...prev, Titulo: error.errors[0].message }));
            }
        }
    };

    // Validar descripción usando Zod
    const handleDescripcionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setDescripcion(value);

        try {
            ProyectoSchema.shape.Descripcion.parse(value);
            setErrors(prev => ({ ...prev, Descripcion: undefined }));
        } catch (error) {
            if (error instanceof z.ZodError) {
                setErrors(prev => ({ ...prev, Descripcion: error.errors[0].message }));
            }
        }
    };

    // Validar archivo usando Zod
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tamaño (máx 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, Imagen_Url: "El archivo no puede superar los 5MB." }));
            setImagen(null);
            setPreview(null);
            return;
        }

        try {
            ProyectoSchema.shape.Imagen_Url.parse(file);
            setErrors(prev => ({ ...prev, Imagen_Url: undefined }));
            setImagen(file);

            // Solo mostrar preview si es imagen (no PDF)
            if (file.type.startsWith("image/")) {
                setPreview(URL.createObjectURL(file));
            } else {
                setPreview(null);
            }
        } catch (error) {
            if (error instanceof z.ZodError) {
                setErrors(prev => ({ ...prev, Imagen_Url: error.errors[0].message }));
                setImagen(null);
                setPreview(null);
            }
        }
    };

    // Enviar formulario
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validar que existe la imagen
        if (!imagen) {
            setErrors(prev => ({ ...prev, Imagen_Url: "Debes subir un archivo para el proyecto." }));
            return;
        }

        // Validar con el schema completo antes de enviar
        try {
            ProyectoSchema.parse({
                Titulo: titulo.trim(),
                Descripcion: descripcion.trim(),
                Imagen_Url: imagen,
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: typeof errors = {};
                error.errors.forEach(err => {
                    const field = err.path[0] as keyof typeof errors;
                    newErrors[field] = err.message;
                });
                setErrors(newErrors);
                return;
            }
        }

        const formData = new FormData();
        formData.append("Titulo", titulo.trim());
        formData.append("Descripcion", descripcion.trim());
        formData.append("Imagen_Url", imagen);

        createProyectoMutation.mutate(
            { formData, },
            {
                onSuccess: () => {
                    setTitulo("");
                    setDescripcion("");
                    setImagen(null);
                    setPreview(null);
                    setErrors({});
                    onClose();
                    refetch();
                    showToast("Proyecto creado con éxito", "success");
                },
                onError: (error) => {
                    console.error("Error al crear el proyecto:", error);
                    showToast("Hubo un problema al crear el proyecto", "error");
                },
            }
        );
    };

    return (
        <>
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}

            <div className="fixed inset-0  backdrop-blur flex items-center justify-center z-50">
                <form
                    onSubmit={handleSubmit}
                    className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 space-y-4"
                >
                    <h3 className="text-lg font-semibold text-gray-800">Crear Proyecto</h3>

                    {/* Campo Título */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Título</label>
                        <input
                            type="text"
                            placeholder="Título del proyecto"
                            value={titulo}
                            onChange={handleTituloChange}
                            maxLength={100}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm"
                            required
                        />
                        <div className="text-right text-xs text-gray-500 mt-1">{titulo.length}/100</div>
                        {errors.Titulo && <p className="text-xs text-red-500 mt-1">{errors.Titulo}</p>}
                    </div>

                    {/* Campo Descripción */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea
                            placeholder="Descripción del proyecto"
                            value={descripcion}
                            onChange={handleDescripcionChange}
                            maxLength={1000}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm break-words"
                            style={{ whiteSpace: "normal", overflowWrap: "break-word" }}
                            rows={3}
                            required
                        />
                        <div className="text-right text-xs text-gray-500 mt-1">{descripcion.length}/1000</div>
                        {errors.Descripcion && <p className="text-xs text-red-500 mt-1">{errors.Descripcion}</p>}
                    </div>

                    {/* Campo Imagen */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Archivo del Proyecto</label>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".png,.jpg,.jpeg,.heic,.pdf"
                            onChange={handleFileChange}
                            className="hidden"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full px-4 py-3 rounded-lg border-2 border-dashed border-sky-300 bg-sky-50 hover:bg-sky-100 transition-colors cursor-pointer flex flex-col items-center gap-2"
                        >
                            <svg className="w-8 h-8 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            <span className="text-sky-600 font-medium">
                                {imagen ? "Cambiar Archivo" : "Haz clic para seleccionar archivo"}
                            </span>
                            {imagen && (
                                <span className="text-xs text-gray-600 truncate max-w-full">{imagen.name}</span>
                            )}
                        </button>


                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-xs text-blue-700">
                            <strong>Nota:</strong> Los archivos se crean como ocultos por defecto. Puedes cambiar la visibilidad después de crear el archivo.
                        </p>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-4">
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm text-sm"
                            disabled={createProyectoMutation.status === "pending"}
                        >
                            {createProyectoMutation.status === "pending" ? "Creando..." : "Crear Proyecto"}
                        </button>
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

            <style>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slideIn {
                    animation: slideIn 0.3s ease-out;
                }
            `}</style>
        </>
    );
}