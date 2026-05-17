import { useState, useEffect } from "react";
import { Calendar, RefreshCcw, Image as ImageIcon, Info } from "lucide-react";
import type { Imagen } from "../Models/ModelsEdiImagen";

interface ImagenModalProps {
    isOpen: boolean;
    onClose: () => void;
    imagen: Imagen;
}

const ImagenModal = ({ isOpen, onClose, imagen }: ImagenModalProps) => {
    const [_isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        setIsEditing(false);
    }, [imagen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-900">Detalle de Imagen</h1>
                        <button 
                            onClick={onClose} 
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 p-6">
                    <div className="space-y-6">
                        {/* Información de la Imagen */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <ImageIcon className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900">Información de la Imagen</h3>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                            Nombre de la Imagen
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 break-words">{imagen.Nombre_Imagen}</p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                            Vista Previa
                                        </div>
                                        <div className="flex justify-center bg-white rounded-lg overflow-hidden border border-gray-300 shadow-sm">
                                            <img
                                                src={imagen.Imagen}
                                                alt={imagen.Nombre_Imagen}
                                                className="w-full h-auto object-contain max-h-[400px]"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Información de Registro */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Info className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900">Información de Registro</h3>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                            <Calendar size={14} className="inline mr-1" />
                                            Fecha de Creación
                                        </div>
                                        <p className="text-sm text-gray-900">
                                            {new Date(imagen.Fecha_Creacion).toLocaleDateString("es-ES", {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    {imagen.Fecha_Actualizacion && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                                <RefreshCcw size={14} className="inline mr-1" />
                                                Última Actualización
                                            </div>
                                            <p className="text-sm text-gray-900">
                                                {new Date(imagen.Fecha_Actualizacion).toLocaleDateString("es-ES", {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 flex justify-end gap-3 p-6 border-t bg-gray-50 z-10">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ImagenModal;
