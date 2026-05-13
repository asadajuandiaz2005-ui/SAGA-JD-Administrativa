import React, { useState, useEffect } from 'react';
import { useGetCategoriasActivas } from '../../hooks/useCategorias';
import { useUpdateMaterial } from '../../hooks/useMaterials';
import { useUnidadesMedicionActivas } from '../../hooks/HookUnidadMedicion';
import { useAlerts } from '@/Modules/Global/context/AlertContext';
import { UpdateMaterialSchema } from '../../schema/UpdateMaterialSchema';
import {
  NOMBRE_MATERIAL_MAX_LENGTH,
  DESCRIPCION_MAX_LENGTH,
  PRECIO_MIN,
  type EditMaterialModalProps
} from '../../types/MaterialTypes';
import type { UpdateMaterialData } from '../../models/Material';
import CreateCategoriaModal from '../Categorias/CreateCategoriaModal';
import CreateUnidadMedicionModal from '../UnidadesMedicion/CreateUnidadMedicionModal';
import CreateModalProveedor from '@/Modules/Proveedores/Components/CreateModalProveedor';
import { LuPlus } from 'react-icons/lu';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogHeader,
  AlertDialogFooter
} from "@/Modules/Global/components/Sidebar/ui/alert-dialog";
import { Button } from '@/Modules/Global/components/Sidebar/ui/button';
import { useProveedoresFisicos } from '@/Modules/Proveedores/Hook/hookFisicoProveedor';
import { useProveedoresJuridicos } from '@/Modules/Proveedores/Hook/hookjuridicoproveedor';


const EditMaterialModal: React.FC<EditMaterialModalProps> = ({
  material,
  isOpen,
  onClose,
}) => {
  const { showError } = useAlerts();
  const updateMaterialMutation = useUpdateMaterial();
  const { data: categorias = [] } = useGetCategoriasActivas();
  const { data: unidadesMedicion = [] } = useUnidadesMedicionActivas();
  const [isCreateCategoriaModalOpen, setIsCreateCategoriaModalOpen] = useState(false);
  const [isCreateUnidadMedicionModalOpen, setIsCreateUnidadMedicionModalOpen] = useState(false);
  const [isCreateProveedorModalOpen, setIsCreateProveedorModalOpen] = useState(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { proveedoresFisicos = [] } = useProveedoresFisicos();
  const { proveedoresJuridicos = [] } = useProveedoresJuridicos();

  const [formData, setFormData] = useState<UpdateMaterialData>({
    Nombre_Material: '',
    Descripcion: '',
    Id_Unidad_Medicion: 0,
    Precio_Unitario: 0,
    Numero_Estanteria: 1,
    IDS_Categorias: [],
  });

  const [selectedCategorias, setSelectedCategorias] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [fieldCharCounts, setFieldCharCounts] = useState({
    nombreMaterial: 0,
    descripcion: 0
  });

  useEffect(() => {
    if (isOpen && material) {
      const categorias = (material.Categorias && material.Categorias.length > 0)
        ? material.Categorias
        : (material.Categorias || []);

      const categoriaIds = categorias.map(cat => {
        if (cat) {
          return cat.Id_Categoria;
        }
        return (cat as any).Id_Categoria;
      });

      setFormData({
        Nombre_Material: material.Nombre_Material,
        Descripcion: material.Descripcion || '',
        Id_Unidad_Medicion: material.Unidad_Medicion.Id_Unidad_Medicion,
        Precio_Unitario: material.Precio_Unitario,
        Numero_Estanteria: material.Numero_Estanteria,
        IDS_Categorias: categoriaIds,
        Id_Tipo_Proveedor: material.Proveedor?.Tipo_Entidad,
        Id_Proveedor: material.Proveedor?.Id_Proveedor,
      });
      setSelectedCategorias(categoriaIds);
      setFieldCharCounts({
        nombreMaterial: material.Nombre_Material.length,
        descripcion: (material.Descripcion || '').length
      });
      setFormErrors({});
    }
  }, [isOpen, material]);

  if (!isOpen) return null;

  const createInputHandler = (fieldName: string, maxLength?: number) => {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;

      if (maxLength && value.length > maxLength) {
        return;
      }

      setFormData(prev => ({ ...prev, [fieldName]: value }));

      if (fieldName === 'Nombre_Material') {
        setFieldCharCounts(prev => ({ ...prev, nombreMaterial: value.length }));
      } else if (fieldName === 'Descripcion') {
        setFieldCharCounts(prev => ({ ...prev, descripcion: value.length }));
      }

      if (formErrors[fieldName]) {
        setFormErrors(prev => ({ ...prev, [fieldName]: '' }));
      }
    };
  };

  const renderCharCounter = (current: number, max: number) => (
    <span className={`text-xs ${current > max * 0.9 ? 'text-orange-500' : 'text-gray-500'}`}>
      {current}/{max}
    </span>
  );

  const validateMaterial = () => {
    const validationResult = UpdateMaterialSchema.safeParse({
      ...formData,
      IDS_Categorias: selectedCategorias,
    });

    if (!validationResult.success) {
      const errors: { [key: string]: string } = {};
      validationResult.error.errors.forEach((error: any) => {
        if (error.path[0]) {
          errors[error.path[0] as string] = error.message;
        }
      });
      setFormErrors(errors);

      showError('Por favor, corrige los errores en el formulario');
      return false;
    }

    if (formData.Id_Tipo_Proveedor && !formData.Id_Proveedor) {
      setFormErrors(prev => ({ ...prev, Id_Proveedor: 'Debe seleccionar un proveedor' }));
      showError('Por favor, selecciona un proveedor');
      return false;
    }

    return true;
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setIsConfirmDialogOpen(true);
  };

  const handleConfirmUpdate = async () => {
    if (!validateMaterial()) {
      setIsConfirmDialogOpen(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const updateData: UpdateMaterialData = {
        Nombre_Material: formData.Nombre_Material,
        Descripcion: formData.Descripcion,
        Id_Unidad_Medicion: formData.Id_Unidad_Medicion,
        Precio_Unitario: formData.Precio_Unitario,
        Numero_Estanteria: formData.Numero_Estanteria,
        IDS_Categorias: selectedCategorias,
        Id_Tipo_Proveedor: formData.Id_Tipo_Proveedor,
        Id_Proveedor: formData.Id_Proveedor,
      };

      await updateMaterialMutation.mutateAsync({
        id: material.Id_Material,
        data: updateData,
      });

      setIsConfirmDialogOpen(false);
      onClose();
      window.dispatchEvent(new Event('refreshInventario'));
    } catch (error: any) {
      console.log('Error al actualizar material:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoriaChange = (categoriaId: number, checked: boolean) => {
    setSelectedCategorias(prev =>
      checked
        ? [...prev, categoriaId]
        : prev.filter(id => id !== categoriaId)
    );
  };

  return (
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-lg mx-4 flex flex-col overflow-hidden max-h-[90vh]">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <h2 className="text-xl font-bold text-gray-900">
            Editar Material
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
          <form id="edit-material-form" onSubmit={handleOpenConfirm} className="p-6 space-y-4">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="nombre" className="block text-sm flex gap-2 font-medium text-gray-700">
                    Nombre del Material
                    <p className="text-red-500">*</p>
                  </label>
                  {renderCharCounter(fieldCharCounts.nombreMaterial, NOMBRE_MATERIAL_MAX_LENGTH)}
                </div>
                <input
                  type="text"
                  id="nombre"
                  value={formData.Nombre_Material}
                  onChange={createInputHandler('Nombre_Material', NOMBRE_MATERIAL_MAX_LENGTH)}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${formErrors.Nombre_Material
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300'
                    }`}
    
                />
                {formErrors.Nombre_Material && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.Nombre_Material}</p>
                )}
              </div>

              <div>
                <label htmlFor="unidad" className="block text-sm flex justify-between font-medium text-gray-700 mb-1">
                  <span className="flex gap-1 items-center justify-center">Unidad de Medición <p className="text-red-500">*</p></span>
                  <button
                    type="button"
                    onClick={() => setIsCreateUnidadMedicionModalOpen(true)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                  >
                    <LuPlus className="w-3 h-3" />
                    Nueva
                  </button>
                </label>
                <select
                  id="unidad"
                  value={formData.Id_Unidad_Medicion || ''}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 0;
                    setFormData({ ...formData, Id_Unidad_Medicion: value });
                    if (formErrors.Id_Unidad_Medicion) {
                      setFormErrors(prev => ({ ...prev, Id_Unidad_Medicion: '' }));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${formErrors.Id_Unidad_Medicion
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300'
                    }`}
                  required
                >
                  <option value="">Seleccionar unidad de medición</option>
                  {unidadesMedicion.map((unidad) => (
                    <option key={unidad.Id_Unidad_Medicion} value={unidad.Id_Unidad_Medicion}>
                      {unidad.Nombre_Unidad || unidad.Nombre_Unidad_Medicion}
                    </option>
                  ))}
                </select>
                {formErrors.Id_Unidad_Medicion && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.Id_Unidad_Medicion}</p>
                )}
              </div>

              <div>
                <label htmlFor="precio" className="block text-sm flex gap-2 font-medium text-gray-700 mb-1">
                  Precio Unitario (₡)
                  <p className="text-red-500">*</p>
                </label>
                <input
                  type="number"
                  id="precio"
                  min={PRECIO_MIN}
                  step="0.01"
                  value={formData.Precio_Unitario}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    setFormData({ ...formData, Precio_Unitario: value });
                    if (formErrors.Precio_Unitario) {
                      setFormErrors(prev => ({ ...prev, Precio_Unitario: '' }));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${formErrors.Precio_Unitario
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300'
                    }`}
                  required
                />
                {formErrors.Precio_Unitario && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.Precio_Unitario}</p>
                )}
              </div>

              <div>
                <label htmlFor="numero-estanteria" className="block text-sm flex gap-2 font-medium text-gray-700 mb-1">
                  Número de Estantería
                  <p className="text-red-500">*</p>
                </label>
                <input
                  type="number"
                  id="numero-estanteria"
                  min="1"
                  max="50"
                  value={formData.Numero_Estanteria}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setFormData({ ...formData, Numero_Estanteria: value });
                    if (formErrors.Numero_Estanteria) {
                      setFormErrors(prev => ({ ...prev, Numero_Estanteria: '' }));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${formErrors.Numero_Estanteria
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300'
                    }`}
                  required
                />
                {formErrors.Numero_Estanteria && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.Numero_Estanteria}</p>
                )}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="descripcion" className="block text-sm flex gap-2 font-medium text-gray-700">
                  Descripción (Opcional)
                </label>
                {renderCharCounter(fieldCharCounts.descripcion, DESCRIPCION_MAX_LENGTH)}
              </div>
              <textarea
                id="descripcion"
                rows={3}
                value={formData.Descripcion}
                onChange={createInputHandler('Descripcion', DESCRIPCION_MAX_LENGTH)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 focus:ring-blue-500 focus:border-blue-500 ${formErrors.Descripcion
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                    : 'border-gray-300'
                  }`}
                placeholder="Descripción del material..."
                required
              />
              {formErrors.Descripcion && (
                <p className="mt-1 text-sm text-red-600">{formErrors.Descripcion}</p>
              )}
            </div>

            <div>
              <label htmlFor="tipo-proveedor" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Proveedor (Opcional)
              </label>
              <select
                id="tipo-proveedor"
                value={formData.Id_Tipo_Proveedor || ''}
                onChange={(e) => {
                  const tipoProveedor = e.target.value ? Number.parseInt(e.target.value) : undefined;
                  setFormData(prev => ({ 
                    ...prev, 
                    Id_Tipo_Proveedor: tipoProveedor,
                    Id_Proveedor: undefined // Resetear proveedor cuando cambia el tipo
                  }));
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Sin proveedor</option>
                <option value="1">Proveedor Físico</option>
                <option value="2">Proveedor Jurídico</option>
              </select>
            </div>

            {formData.Id_Tipo_Proveedor && (
              <div>
                <label htmlFor="proveedor" className="block text-sm flex justify-between font-medium text-gray-700 mb-1">
                  <span>Proveedor <span className="text-red-500">*</span></span>
                  <button
                    type="button"
                    onClick={() => setIsCreateProveedorModalOpen(true)}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                  >
                    <LuPlus className="w-3 h-3" />
                    Nuevo
                  </button>
                </label>
                <select
                  id="proveedor"
                  value={formData.Id_Proveedor || ''}
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      Id_Proveedor: e.target.value ? Number.parseInt(e.target.value) : undefined 
                    }));
                    if (formErrors.Id_Proveedor) {
                      setFormErrors(prev => ({ ...prev, Id_Proveedor: '' }));
                    }
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${formErrors.Id_Proveedor
                    ? 'border-red-500'
                    : 'border-gray-300'
                    }`}
                >
                  <option value="">Seleccionar proveedor</option>
                  {formData.Id_Tipo_Proveedor === 1 && proveedoresFisicos.map((proveedor) => (
                    <option key={proveedor.Id_Proveedor} value={proveedor.Id_Proveedor}>
                      {proveedor.Nombre_Proveedor}
                    </option>
                  ))}
                  {formData.Id_Tipo_Proveedor === 2 && proveedoresJuridicos.map((proveedor) => (
                    <option key={proveedor.Id_Proveedor} value={proveedor.Id_Proveedor}>
                      {proveedor.Razon_Social}
                    </option>
                  ))}
                </select>
                {formErrors.Id_Proveedor && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.Id_Proveedor}</p>
                )}
              </div>
            )}

            <div>
              <div className="block text-sm font-medium flex justify-between text-gray-700 mb-2">
                <span>Categorías (Opcional)</span>
                <button
                  type="button"
                  onClick={() => setIsCreateCategoriaModalOpen(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                >
                  <LuPlus className="w-3 h-3" />
                  Nueva
                </button>
              </div>

              <div className={`grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-md p-3 ${formErrors.IDS_Categorias
                  ? 'border-red-500'
                  : 'border-gray-300'
                }`}>
                {categorias.map((categoria) => (
                  <label key={categoria.Id_Categoria} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedCategorias.includes(categoria.Id_Categoria)}
                      onChange={(e) => {
                        handleCategoriaChange(categoria.Id_Categoria, e.target.checked);
                        if (formErrors.IDS_Categorias) {
                          setFormErrors(prev => ({ ...prev, IDS_Categorias: '' }));
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 overflow-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100"
                    />
                    <span className="text-sm text-gray-700">{categoria.Nombre_Categoria.length > 15 ? `${categoria.Nombre_Categoria.slice(0, 9)}...` : categoria.Nombre_Categoria}
                    </span>
                  </label>
                ))}
              </div>
              {formErrors.IDS_Categorias && (
                <p className="mt-1 text-sm text-red-600">{formErrors.IDS_Categorias}</p>
              )}
            </div>
          </form>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 p-6 border-t bg-gray-50 z-10">
          <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
            <Button
              form="edit-material-form"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Actualizando...' : 'Actualizar Material'}
            </Button>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Confirmar actualización?</AlertDialogTitle>
                <AlertDialogDescription>
                  ¿Estás seguro de que deseas actualizar este material? Esta acción modificará la información del material en el inventario.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction
                  onClick={handleConfirmUpdate}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Actualizando...' : 'Confirmar'}
                </AlertDialogAction>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>

      <CreateCategoriaModal
        isOpen={isCreateCategoriaModalOpen}
        onClose={() => setIsCreateCategoriaModalOpen(false)}
      />
      <CreateUnidadMedicionModal
        isOpen={isCreateUnidadMedicionModalOpen}
        onClose={() => setIsCreateUnidadMedicionModalOpen(false)}
      />
      {isCreateProveedorModalOpen && (
        <CreateModalProveedor
          onClose={() => setIsCreateProveedorModalOpen(false)}
          setShowCreateModal={setIsCreateProveedorModalOpen}
        />
      )}
    </div>
  );
};

export default EditMaterialModal;