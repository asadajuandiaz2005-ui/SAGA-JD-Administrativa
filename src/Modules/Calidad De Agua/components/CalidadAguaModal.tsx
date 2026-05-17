import { useEffect } from "react";
import { FileText, Eye, EyeOff, Info, User } from "lucide-react";
import { LuX } from 'react-icons/lu';


interface CalidadAguaModalProps {
    isOpen: boolean;
    onClose: () => void;
    archivo: {
        Id_Calidad_Agua: number;
        Titulo: string;
        Url_Archivo: string;
        Fecha_Creacion: string;
        Fecha_Actualizacion?: string;
        Descripcion: string;
        Visible: boolean;
        Usuario: {
            Id_Usuario: number;
            Nombre_Usuario: string;
            Id_Rol: number;
            Nombre_Rol: string;
        };
    };
    refetch: () => void;
}

const CalidadAguaModal = ({ isOpen, onClose, archivo }: CalidadAguaModalProps) => {

    useEffect(() => {
        // Reset any state if needed
    }, [archivo]);

    if (!isOpen) return null;


    return (
        <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            Detalle de Calidad de Agua
                        </h1>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <LuX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 p-6">
                    <div className="space-y-6">
                        {/* Información del Documento */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <Info className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900">Información del Documento</h3>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-lg lg:col-span-2">
                                        <div className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                            Título
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 break-words">
                                            {archivo.Titulo}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-gray-50 p-4 rounded-lg lg:col-span-2">
                                        <div className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                            Descripción
                                        </div>
                                        <p className="text-sm text-gray-900 break-words">
                                            {archivo.Descripcion?.trim() || "Sin descripción disponible"}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg lg:col-span-2">
                                        <div className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                            Archivo Adjunto
                                        </div>
                                        <div className="group relative bg-gradient-to-br from-blue-50 via-white to-blue-50 border border-blue-200 rounded-xl p-4 hover:shadow-lg hover:border-blue-400 transition-all duration-300 hover:-translate-y-0.5">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                    <div className="relative flex-shrink-0">
                                                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-lg shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                                                            <FileText size={24} className="text-white" />
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
                                                            {decodeURIComponent(archivo.Url_Archivo.split('/').pop()?.split('?')[0] || 'Archivo adjunto')}
                                                        </p>
                                                        
                                                    </div>
                                                </div>
                                                <a
                                                    href={archivo.Url_Archivo}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-xs font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-lg transform hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5 group/btn flex-shrink-0"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        width="14"
                                                        height="14"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        className="group-hover/btn:scale-110 transition-transform"
                                                    >
                                                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                                        <circle cx="12" cy="12" r="3" />
                                                    </svg>
                                                    Ver
                                                </a>
                                            </div>
                                            {/* Efecto de brillo al hover */}
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20 group-hover:animate-shimmer pointer-events-none"></div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                            Visibilidad
                                        </div>
                                        <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-semibold border ${
                                            archivo.Visible 
                                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                                                : 'bg-slate-200 text-slate-700 border border-slate-400'
                                        }`}>
                                            {archivo.Visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                            {archivo.Visible ? 'Visible' : 'Oculto'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Información de Registro */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <User className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900">Información de Registro</h3>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="grid grid-cols-2 gap-6">

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <label htmlFor='Fecha_Creacion' className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                            Fecha de Creación
                                        </label>
                                        <p className="text-sm text-gray-900">
                                            {new Date(archivo.Fecha_Creacion).toLocaleDateString("es-ES", {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>

                                    {archivo.Fecha_Actualizacion && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                                Última Actualización
                                            </div>
                                            <p className="text-sm text-gray-900">
                                                {new Date(archivo.Fecha_Actualizacion).toLocaleDateString("es-ES", {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </p>
                                        </div>
                                    )}

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                            Creado por
                                        </div>
                                        <p className="text-sm text-gray-900">
                                            {archivo.Usuario.Nombre_Usuario}
                                        </p>
                                    </div>
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

export default CalidadAguaModal;
