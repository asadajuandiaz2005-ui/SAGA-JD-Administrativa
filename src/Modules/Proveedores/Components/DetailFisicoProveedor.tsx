import React, { useState } from 'react';
import { LuX, LuPhone, LuBuilding2, LuCalendar, LuIdCard , LuUserRound} from 'react-icons/lu';
import * as Accordion from "@radix-ui/react-accordion";
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { formatPhoneNumberDisplay } from '../Schema/SchemaFisicoProveedor';
import type { ProveedorFisico } from '../Models/TablaProveedo/tablaFisicoProveedor';

interface ProveedorDetailModalProps {
  proveedor: ProveedorFisico | null;
  isOpen: boolean;
  onClose: () => void;
}

const ProveedorDetailModal: React.FC<ProveedorDetailModalProps> = ({ proveedor, isOpen, onClose }) => {
  const [openSections, setOpenSections] = useState<number[]>([1, 2]); // Abrir por defecto

  const handleValueChange = (values: string[]) => {
    setOpenSections(values.map(v => Number(v)));
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return 'Sin fecha';
    
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  const getStatusDisplay = (estado: any) => {
    const estadoNombre = estado?.Estado_Proveedor || 'Sin estado';
    return estadoNombre;
  };

  const isActiveProveedor = (estado: any) => {
    const estadoNombre = estado?.Estado_Proveedor || '';
    return estadoNombre.toLowerCase() === 'activo';
  };

  if (!isOpen || !proveedor) return null;

  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-4xl max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">Detalle del Proveedor</h1>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <LuX className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-left">
          {/* Proveedor Header Card */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-lg mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <LuBuilding2 className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">{proveedor.Nombre_Proveedor}</h2>
                <p className="text-blue-100">{proveedor.Tipo_Identificacion}: {proveedor.Identificacion}</p>
              </div>
            </div>
          </div>

          {/* Accordion Sections */}
          <Accordion.Root
            type="multiple"
            value={openSections.map(String)}
            onValueChange={handleValueChange}
            className="space-y-4"
          >
            {/* Información Básica */}
            <Accordion.Item
              value="1"
              className="border border-gray-200 rounded-lg shadow-sm bg-white"
            >
              <Accordion.Header>
                <Accordion.Trigger className="text-base font-semibold px-6 py-4 border-b-0 hover:bg-gray-50 w-full text-left">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <LuBuilding2 className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-900">Información Básica</span>
                    </div>
                    <span className="text-gray-500">
                      {openSections.includes(1) ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
                    </span>
                  </div>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="accordion-content px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <LuUserRound className="w-4 h-4 text-gray-400" />
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Nombre del Proveedor</label>
                        <p className="text-gray-900 font-medium">{proveedor.Nombre_Proveedor || 'Sin nombre'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <LuIdCard className="w-4 h-4 text-gray-400" />
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Identificación</label>
                        <p className="text-gray-900 font-medium">{proveedor.Identificacion || 'Sin identificación'}</p>
                        <p className="text-xs text-gray-500">{proveedor.Tipo_Identificacion || 'Sin tipo'}</p>
                      </div>
                    </div>

                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <LuPhone className="w-4 h-4 text-gray-400" />
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Teléfono</label>
                        <p className="text-gray-900 font-medium">
                          {proveedor.Telefono_Proveedor ? formatPhoneNumberDisplay(proveedor.Telefono_Proveedor) : 'Sin teléfono'}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-2">Estado del Proveedor</label>
                      <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border ${
                        isActiveProveedor(proveedor.Estado_Proveedor)
                          ? 'bg-blue-100 text-green-800 border-blue-200' 
                          : 'bg-red-100 text-red-800 border-red-200'
                      }`}>
                        {getStatusDisplay(proveedor.Estado_Proveedor)}
                      </span>
                    </div>
                  </div>
                </div>
              </Accordion.Content>
            </Accordion.Item>

            {/* Información de Fechas */}
            <Accordion.Item
              value="2"
              className="border border-gray-200 rounded-lg shadow-sm bg-white"
            >
              <Accordion.Header>
                <Accordion.Trigger className="text-base font-semibold px-6 py-4 border-b-0 hover:bg-gray-50 w-full text-left">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-3">
                      <LuCalendar className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-900">Información de Fechas</span>
                    </div>
                    <span className="text-gray-500">
                      {openSections.includes(2) ? <FiChevronDown size={20} /> : <FiChevronRight size={20} />}
                    </span>
                  </div>
                </Accordion.Trigger>
              </Accordion.Header>
              <Accordion.Content className="accordion-content px-6 pb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <LuCalendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Fecha de Creación</label>
                        <p className="text-gray-900 font-medium">{formatDate(proveedor.Fecha_Creacion)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <LuCalendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-1">Última Actualización</label>
                        <p className="text-gray-900 font-medium">{formatDate(proveedor.Fecha_Actualizacion)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Accordion.Content>
            </Accordion.Item>
          </Accordion.Root>


        </div>
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

export default ProveedorDetailModal;
