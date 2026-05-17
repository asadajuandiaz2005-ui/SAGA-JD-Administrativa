import React, { useState } from 'react';
import { ZodError } from 'zod';
import { LuX } from 'react-icons/lu';
import { useResponderContacto } from '../hook/HookContacto';
import { RespuestaSchema } from '../schemas/ContactoSchemas';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/Modules/Global/components/Sidebar/ui/alert-dialog';
import type { ContactoItem } from '../types/ContactoTypes';

interface ResponderModalProps {
  item: ContactoItem;
  isOpen: boolean;
  onClose: () => void;
}

const ResponderModal: React.FC<ResponderModalProps> = ({ item, isOpen, onClose }) => {
  const [respuesta, setRespuesta] = useState('');
  const [validationError, setValidationError] = useState('');
  const { mutate: sendRespuesta, isPending, error } = useResponderContacto(item);

  if (!isOpen) return null;

  const handleSendResponse = () => {
    try {
      RespuestaSchema.parse({ respuesta });
      setValidationError('');
      sendRespuesta(respuesta, {
        onSuccess: () => {
          setRespuesta('');
          setTimeout(() => {
            onClose();
          }, 1200);
        },
      });
    } catch (err) {
      if (err instanceof ZodError) {
        setValidationError(err.errors[0]?.message || 'Error de validación');
      }
    }
  };

  const renderCaracterCount = () => {
    const count = respuesta.length;
    const max = 150;
    return (
      <div className={`text-sm flex items-center justify-end ${count > max ? 'text-red-600' : 'text-gray-500'}`}>
        {count} / {max}
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <h2 className="text-lg font-semibold text-gray-800">
            Responder a {item.tipo}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors absolute top-6 right-6"
          >
            <LuX size={20} />
          </button>
        </div>
        {/* Contenido */}
        <div className="p-6 space-y-4">
          <div>
            <h3 className="text-md font-semibold text-gray-700 mb-2">De:</h3>
            <p className="text-gray-600 break-all">{item.nombre} &lt;{item.correo}&gt;</p>
          </div>
          <div>
            <h3 className="text-md font-semibold text-gray-700 mb-2">Mensaje:</h3>
            <p className="text-gray-600 whitespace-pre-wrap break-all">{item.mensaje}</p>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Responder</h3>
          <textarea
            className="w-full border border-gray-300 rounded-lg p-2 scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100"
            rows={4}
            minLength={10}
            maxLength={150}
            placeholder="Escribe tu respuesta aquí..."
            value={respuesta}
            onChange={e => setRespuesta(e.target.value)}
            disabled={isPending}
          /> 
          {validationError && <div className="text-red-600 mt-2 text-sm">{validationError}</div>}  
          {error && <div className="text-red-600 mt-2 text-sm">{error.message}</div>}          
          {renderCaracterCount()}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                type="button"
                disabled={isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isPending ? 'Enviando...' : 'Enviar Respuesta'}
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar envío?</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro de que deseas enviar esta respuesta? Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction
                  onClick={() => handleSendResponse()}
                  disabled={isPending}
                >
                  {isPending ? 'Enviando...' : 'Confirmar'}
                </AlertDialogAction>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            disabled={isPending}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResponderModal