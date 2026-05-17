import { useState, useEffect } from "react";
import { useUpdateProyecto } from "../Hook/HookProyecto";
import { z } from "zod";
import { ProyectoUpdateSchema } from "../schemas/Proyecto";
import type { Proyecto } from "../Models/ProyectoModels";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/Modules/Global/components/Sidebar/ui/alert-dialog";

interface ProyectoFormEditProps {
    proyecto: Proyecto;
    onClose: () => void;
}

export default function ProyectoFormEdit({ proyecto, onClose }: ProyectoFormEditProps) {
    const [titulo, setTitulo] = useState(proyecto.Titulo);
    const [descripcion, setDescripcion] = useState(proyecto.Descripcion);
    const [imagen, setImagen] = useState<File | null>(null);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    
    const [errors, setErrors] = useState<{
        Titulo?: string;
        Descripcion?: string;
        Imagen_Url?: string;
    }>({});

    const updateProyectoMutation = useUpdateProyecto();

    // Pre-cargar los valores cuando cambie el proyecto
    useEffect(() => {
        setTitulo(proyecto.Titulo);
        setDescripcion(proyecto.Descripcion);
        setImagen(null);
    }, [proyecto]);

    // Validar título
    const handleTituloChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setTitulo(value);

        try {
            ProyectoUpdateSchema.shape.Titulo.parse(value);
            setErrors(prev => ({ ...prev, Titulo: undefined }));
        } catch (error) {
            if (error instanceof z.ZodError) {
                setErrors(prev => ({ ...prev, Titulo: error.errors[0].message }));
            }
        }
    };

    // Validar descripción
    const handleDescripcionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const value = e.target.value;
        setDescripcion(value);

        try {
            ProyectoUpdateSchema.shape.Descripcion.parse(value);
            setErrors(prev => ({ ...prev, Descripcion: undefined }));
        } catch (error) {
            if (error instanceof z.ZodError) {
                setErrors(prev => ({ ...prev, Descripcion: error.errors[0].message }));
            }
        }
    };

    // Validar archivo
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validar tamaño (máx 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, Imagen_Proyecto: "El archivo no puede superar los 5MB." }));
            setImagen(null);
            return;
        }

        try {
            ProyectoUpdateSchema.shape.Imagen_Url.parse(file);
            setErrors(prev => ({ ...prev, Imagen_Url: undefined }));
            setImagen(file);
        } catch (error) {
            if (error instanceof z.ZodError) {
                setErrors(prev => ({ ...prev, Imagen_Url: error.errors[0].message }));
                setImagen(null);
            }
        }
    };

    // Validar formulario antes de mostrar confirmación
    const handleSubmitClick = (e: React.FormEvent) => {
        e.preventDefault();

        // Validar con el schema completo
        try {
            ProyectoUpdateSchema.parse({
                Id_Proyecto: proyecto.Id_Proyecto,
                Titulo: titulo.trim(),
                Descripcion: descripcion.trim(),
                Imagen_Proyecto: imagen || undefined
            });
            
            // Si la validación pasa, mostrar diálogo de confirmación
            setShowConfirmDialog(true);
        } catch (error) {
            if (error instanceof z.ZodError) {
                const newErrors: typeof errors = {};
                for (const err of error.errors) {
                    const field = err.path[0] as keyof typeof errors;
                    newErrors[field] = err.message;
                }
                setErrors(newErrors);
            }
        }
    };

    // Enviar formulario después de confirmar
    const handleConfirmedSubmit = async () => {
        const formData = new FormData();
        formData.append("Titulo", titulo.trim());
        formData.append("Descripcion", descripcion.trim());
        
        // Solo agregar imagen si se seleccionó una nueva
        if (imagen instanceof File) {
            formData.append("Imagen_Url", imagen);
        }

        updateProyectoMutation.mutate(
            { 
                id: proyecto.Id_Proyecto, 
                formData 
            },
            {
                onSuccess: () => {
                    setShowConfirmDialog(false);
                    onClose();
                },
                onError: (error) => {
                    console.error("Error al actualizar proyecto:", error);
                    setShowConfirmDialog(false);
                }
            }
        );
    };

    const isFormValid = !errors.Titulo && !errors.Descripcion && !errors.Imagen_Url && titulo.trim().length >= 5 && descripcion.trim().length >= 10;

    return (
        <>
            <div className="fixed inset-0 backdrop-blur flex items-center justify-center z-50 p-4">
                <form
                    onSubmit={handleSubmitClick}
                    className="w-full max-w-md bg-white rounded-lg shadow-xl p-6 space-y-4"
                >
                    <h3 className="text-lg font-semibold text-gray-800">Editar Proyecto</h3>

                    {/* Campo Título */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Título</label>
                        <input
                            type="text"
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
                            value={descripcion}
                            onChange={handleDescripcionChange}
                            maxLength={1000}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm break-words scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100"
                            style={{ whiteSpace: "normal", overflowWrap: "break-word" }}
                            rows={3}
                            required
                        />
                        <div className="text-right text-xs text-gray-500 mt-1">{descripcion.length}/1000</div>
                        {errors.Descripcion && <p className="text-xs text-red-500 mt-1">{errors.Descripcion}</p>}
                    </div>

                    {/* Estado del Proyecto */}
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <h4 className="text-sm font-semibold text-gray-700">Estado del Proyecto</h4>
                        <p className="text-sm font-bold text-gray-800">{proyecto.Estado?.Nombre_Estado || "Sin estado"}</p>
                    </div>

                    {/* Campo Imagen */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Archivo del Proyecto (opcional)</label>
                        
                        {/* Mostrar nombre del archivo actual si existe */}
                        {proyecto.Imagen_Url && !imagen && (
                            <div className="mb-2">
                                <p className="text-xs text-gray-600 mb-1">Archivo actual:</p>
                                <div className="px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700">
                                    {decodeURIComponent(proyecto.Imagen_Url.split('/').pop()?.split('?')[0] || 'Archivo del proyecto')}
                                </div>
                            </div>
                        )}
                        
                        <label className="block w-full cursor-pointer border border-gray-300 rounded-lg bg-gray-50 px-3 py-2 hover:bg-gray-100 transition-colors">
                            <span className="text-xs text-gray-500">
                                {imagen ? imagen.name : "Cambiar archivo (PNG, JPG, JPEG, HEIC, PDF)"}
                            </span>
                            <input
                                type="file"
                                accept=".png,.jpg,.jpeg,.heic,.pdf"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </label>
                        
                        {imagen && (
                            <p className="text-xs text-green-600 mt-1">
                                ✓ Nuevo archivo seleccionado: {imagen.name}
                            </p>
                        )}
                        
                        {errors.Imagen_Url && <p className="text-xs text-red-500 mt-1">{errors.Imagen_Url}</p>}
                        
                        <p className="text-xs text-gray-500 mt-1">
                            Deja vacío si no deseas cambiar el archivo actual
                        </p>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-4 pt-2">
                        <button
                            type="submit"
                            className={`px-4 py-2 rounded-lg shadow-sm text-sm ${
                                isFormValid 
                                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                    : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                            }`}
                            disabled={!isFormValid || updateProyectoMutation.isPending}
                        >
                            {updateProyectoMutation.isPending ? 'Guardando...' : 'Guardar Cambios'}
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

            {/* AlertDialog de confirmación */}
            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Guardar cambios?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Estás a punto de actualizar el proyecto "{proyecto.Titulo.length > 30 ? `${proyecto.Titulo.substring(0, 30)}...` : proyecto.Titulo}". 
                            {imagen && " Se reemplazará el archivo actual con el nuevo archivo seleccionado."}
                            {!imagen && " El archivo actual se mantendrá sin cambios."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogAction 
                            onClick={handleConfirmedSubmit}
                            disabled={updateProyectoMutation.isPending}
                        >
                            {updateProyectoMutation.isPending ? 'Guardando...' : 'Confirmar'}
                        </AlertDialogAction>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
