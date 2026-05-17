import { Eye, EyeOff, MessageSquare, User, Calendar, RefreshCcw } from "lucide-react";
import type { FAQ } from "../Models/FAQModels";
import { formatDate } from "../../Inventario/helper/DateFormater.ts";

interface FAQModalProps {
    isOpen: boolean;
    onClose: () => void;
    faq: FAQ;
}

const FAQModal = ({ isOpen, onClose, faq }: FAQModalProps) => {
    if (!isOpen) return null;

    const isVisible = faq.Visible;

    return (
        <div className="fixed inset-0 backdrop-blur bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-gray-900">Detalle de Pregunta Frecuente</h1>
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
                        {/* Información de la Pregunta */}
                        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
                            <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                        <MessageSquare className="w-4 h-4 text-blue-600" />
                                    </div>
                                    <h3 className="text-base font-bold text-gray-900">Información de la Pregunta</h3>
                                </div>
                            </div>

                            <div className="p-5">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                            Pregunta
                                        </div>
                                        <p className="text-sm font-medium text-gray-900 break-words">{faq.Pregunta}</p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                            Respuesta
                                        </div>
                                        <p className="text-sm text-gray-900 break-words">
                                            {faq.Respuesta || "Sin respuesta disponible"}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                            Visibilidad
                                        </div>
                                        <div className="flex items-start gap-2">
                                            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                                                isVisible
                                                    ? 'bg-green-100 text-green-700 border border-green-300'
                                                    : 'bg-gray-100 text-gray-700 border border-gray-300'
                                            }`}>
                                                {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                                                {isVisible ? 'Visible' : 'Oculta'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-2">
                                            {isVisible 
                                                ? "Esta pregunta es visible para los usuarios públicos."
                                                : "Esta pregunta está oculta y no aparece en la vista pública."}
                                        </p>
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
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <div className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                            <Calendar size={14} className="inline mr-1" />
                                            Fecha de Creación
                                        </div>
                                        <p className="text-sm text-gray-900">
                                            {formatDate(faq.Fecha_Creacion)}
                                        </p>
                                    </div>

                                    {faq.Fecha_Actualizacion && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                                <RefreshCcw size={14} className="inline mr-1" />
                                                Última Actualización
                                            </div>
                                            <p className="text-sm text-gray-900">
                                                {formatDate(faq.Fecha_Actualizacion)}
                                            </p>
                                        </div>
                                    )}

                                    {faq.Usuario && (
                                        <div className="bg-gray-50 p-4 rounded-lg">
                                            <div className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
                                                Creado por
                                            </div>
                                            <p className="text-sm text-gray-900">
                                                {faq.Usuario.Nombre_Usuario || 'Desconocido'}
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

export default FAQModal;
