import { useState, useEffect } from "react";
import { useUpdateFAQ } from "../Hook/FAQHook";
import type { FAQ } from "../Models/FAQModels";
import { z } from "zod";
import { CreateFAQSchema } from "../Schemas/FAQSchemas";
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
import { Button } from '@/Modules/Global/components/Sidebar/ui/button';

interface FAQEditProps {
    faq: FAQ;
    onClose: () => void;
}

export default function FAQEdit({ faq, onClose }: FAQEditProps) {
    const updateFAQMutation = useUpdateFAQ();

    const [pregunta, setPregunta] = useState(faq.Pregunta);
    const [respuesta, setRespuesta] = useState(faq.Respuesta);
    const [preguntaError, setPreguntaError] = useState("");
    const [respuestaError, setRespuestaError] = useState("");

    // Pre-cargar los valores de la FAQ cuando se monta el componente
    useEffect(() => {
        setPregunta(faq.Pregunta);
        setRespuesta(faq.Respuesta);
        setPreguntaError("");
        setRespuestaError("");
    }, [faq]);

    const validateField = (field: "Pregunta" | "Respuesta", value: string) => {
        try {
            if (field === "Pregunta") {
                CreateFAQSchema.pick({ Pregunta: true }).parse({ Pregunta: value.trim() });
                setPreguntaError("");
            } else {
                CreateFAQSchema.pick({ Respuesta: true }).parse({ Respuesta: value.trim() });
                setRespuestaError("");
            }
        } catch (err) {
            if (err instanceof z.ZodError) {
                const message = err.errors[0]?.message || "Error de validación";
                if (field === "Pregunta") setPreguntaError(message);
                else setRespuestaError(message);
            }
        }
    };

    const handleSubmit = async () => {
        if (preguntaError || respuestaError || pregunta.trim().length < 10 || respuesta.trim().length < 10) {
            return;
        }

        try {
            await updateFAQMutation.mutateAsync({
                id: faq.Id_FAQ,
                data: {
                    Pregunta: pregunta.trim(),
                    Respuesta: respuesta.trim(),
                }
            });
            onClose();
        } catch (error) {
            console.error("Error al actualizar la pregunta:", error);
        }
    };

    return (
        <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-6 space-y-4">
                <h3 className="text-lg font-semibold text-gray-800">Editar Pregunta Frecuente</h3>

                {/* Campo de Pregunta */}
                 <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Pregunta
                        </label>
                        <textarea
                            placeholder="Escribe la pregunta..."
                            value={pregunta}
                            onChange={(e) => {
                                const v = e.target.value;
                                setPregunta(v);
                                validateField("Pregunta", v);
                            }}
                            maxLength={100}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 scrollbar-rounded"
                            rows={2}
                            required
                        />
                        <div className="text-right text-xs text-gray-500 mt-1">
                            {pregunta.length}/100
                        </div>
                        {preguntaError ? (
                            <p className="text-xs text-red-500 mt-1">{preguntaError}</p>
                        ) : (
                            <p className="text-xs text-gray-400 mt-1">&nbsp;</p>
                        )}
                    </div>

                {/* Campo de Respuesta */}
                  <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Respuesta
                        </label>
                        <textarea
                            placeholder="Escribe la respuesta a la pregunta..."
                            value={respuesta}
                            onChange={(e) => {
                                const v = e.target.value;
                                setRespuesta(v);
                                validateField("Respuesta", v);
                            }}
                            maxLength={700}
                            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-500 text-sm break-words scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 scrollbar-rounded"
                            style={{ whiteSpace: "normal", overflowWrap: "break-word" }}
                            rows={5}
                            required
                        />
                        <div className="text-right text-xs text-gray-500 mt-1">
                            {respuesta.length}/700
                        </div>
                        {respuestaError ? (
                            <p className="text-xs text-red-500 mt-1">{respuestaError}</p>
                        ) : (
                            <p className="text-xs text-gray-400 mt-1">&nbsp;</p>
                        )}
                    </div>
                <div className="flex justify-end gap-4">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button
                                type="button"
                                disabled={
                                    updateFAQMutation.isPending || 
                                    !!preguntaError || 
                                    !!respuestaError ||
                                    pregunta.trim().length < 10 ||
                                    respuesta.trim().length < 10
                                }
                                className={`px-4 py-2 rounded-lg text-white shadow-sm text-sm ${
                                    updateFAQMutation.isPending 
                                        ? 'bg-blue-300 cursor-not-allowed' 
                                        : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                {updateFAQMutation.isPending ? "Actualizando..." : "Actualizar Pregunta"}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Confirmar actualización?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    ¿Estás seguro de que deseas actualizar esta pregunta frecuente? Los cambios se guardarán en el sistema.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogAction
                                    onClick={handleSubmit}
                                    disabled={updateFAQMutation.isPending}
                                >
                                    {updateFAQMutation.isPending ? 'Actualizando...' : 'Confirmar'}
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
            </div>
        </div>
    );
}