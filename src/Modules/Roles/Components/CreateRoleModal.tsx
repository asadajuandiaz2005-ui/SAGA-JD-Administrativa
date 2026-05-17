import React, { useState } from 'react';
import { useCreateRole, usePermissions } from '../Hooks/RoleHook';
import { LuShield, LuX, LuLock, LuFolderTree } from 'react-icons/lu';
import { groupPermissionsByModule, getPermissionIdByLevel, type ModulePermission, type PermissionLevel } from '@/Modules/Usuarios/Helper/GroupPermiByModule';
import { RoleMAX_LENGTH, RoleMIN_LENGTH, type CreateRoleModalProps } from '../Types/RoleTypes';



const CreateRoleModal: React.FC<CreateRoleModalProps> = ({ onClose }) => {
  const [nombreRol, setNombreRol] = useState('');
  const [modulePermissions, setModulePermissions] = useState<ModulePermission[]>([]);
  const { data: permisos = [], isLoading } = usePermissions();
  const { mutateAsync } = useCreateRole();
  const [errors, setErrors] = useState<{ nombreRol?: string }>({});
    // Función para validar el nombre
    const validateNombreRol = (value: string) => {
      if (value.length < RoleMIN_LENGTH) {
        return `El nombre debe tener al menos ${RoleMIN_LENGTH} caracteres`;
      }
      if (value.length > RoleMAX_LENGTH) {
        return `El nombre no puede exceder ${RoleMAX_LENGTH} caracteres`;
      }
      return '';
    };

  // Inicializar permisos por módulo cuando se cargan los permisos
  React.useEffect(() => {
    if (permisos.length > 0) {
      const moduleGroups = groupPermissionsByModule(permisos);
      const initialState = Object.keys(moduleGroups).map(modulo => ({
        Modulo: modulo,
        level: 'none' as PermissionLevel,
        selectedId: getPermissionIdByLevel(moduleGroups[modulo], 'none')
      }));
      setModulePermissions(initialState);
    }
  }, [permisos]);

  const handlePermissionChange = (modulo: string, level: PermissionLevel) => {
    const moduleGroups = groupPermissionsByModule(permisos);
    const newId = getPermissionIdByLevel(moduleGroups[modulo], level);
    
    setModulePermissions(prev =>
      prev.map(mp =>
        mp.Modulo === modulo ? { ...mp, level, selectedId: newId } : mp
      )
    );
  };

      // Manejar cambios en el input con validación
    const handleNombreChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      
      // Limitar caracteres al máximo permitido
      if (value.length <= RoleMAX_LENGTH) {
        setNombreRol(value);
        
        // Validar en tiempo real
        const error = validateNombreRol(value);
        setErrors(prev => ({ ...prev, nombreRol: error }));
      }
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const nombreError = validateNombreRol(nombreRol);
    if (nombreError) {
      setErrors(prev => ({ ...prev, nombreRol: nombreError }));
      return;
    }
    // Solo envía los IDs de permisos que no son 'none'
    const permisosIds = modulePermissions
      .filter(mp => mp.level !== 'none')
      .map(mp => mp.selectedId);
    
      try {
        await mutateAsync({ roleData: { Nombre_Rol: nombreRol, IDS_Permisos: permisosIds } });
      } catch (error) {
        console.error('Error creating role:', error);
      }
    onClose();
  };

  // Calcular caracteres restantes
    const remainingChars = RoleMAX_LENGTH - nombreRol.length;
    const isNearLimit = remainingChars <= 10;
    const hasError = !!errors.nombreRol;

  // Verificar si el módulo tiene permiso de editar disponible
  const hasEditPermission = (modulo: string) => {
    return modulo !== 'auditoria';
  };

  return (
    <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
              Crear Nuevo Rol
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <LuX className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 p-6">
          <form onSubmit={handleSubmit} id="create-role-form" className="space-y-6">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <LuShield className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Información del Rol</h3>
                </div>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor='role-name' className="block text-sm font-medium text-gray-500 mb-2">
                      Nombre del Rol
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={nombreRol}
                        onChange={handleNombreChange}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${
                          hasError 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        placeholder={`Mínimo ${RoleMIN_LENGTH} caracteres`}
                        maxLength={RoleMAX_LENGTH}
                        required
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      {hasError ? (
                        <p className="text-red-600 text-xs">
                          {errors.nombreRol}
                        </p>
                      ) : (
                        <p className="text-gray-500 text-xs">
                          Mínimo {RoleMIN_LENGTH} caracteres
                        </p>
                      )}
                      
                      <p className={`text-xs font-medium ${
                        isNearLimit ? 'text-orange-600' : 'text-gray-500'
                      }`}>
                        {nombreRol.length}/{RoleMAX_LENGTH}
                      </p>
                    </div>

                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <LuLock className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Permisos por Módulo ({modulePermissions.length})</h3>
                </div>
              </div>
              
              <div className="p-5">
                {isLoading ? (
                  <div className="text-center py-8">Cargando permisos...</div>
                ) : (
                  <div className="space-y-4">
                    {modulePermissions.map((mp) => (
                      <div key={mp.Modulo} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <LuFolderTree className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm capitalize">{mp.Modulo}</h4>
                              <p className="text-xs text-gray-600">
                                {hasEditPermission(mp.Modulo) ? 'Módulo del sistema' : 'Solo lectura disponible'}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-8">
      
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Ver</span>
                            <label className="cursor-pointer" aria-label={`Permiso de ver para el módulo ${mp.Modulo}`}>
                              <input
                                type="checkbox"
                                checked={mp.level === 'view' || mp.level === 'edit'}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    if (!hasEditPermission(mp.Modulo) || mp.level !== 'edit') {
                                      handlePermissionChange(mp.Modulo, 'view');
                                    }
                                  } else {
                                    handlePermissionChange(mp.Modulo, 'none');
                                  }
                                }}
                                className="sr-only"
                              />
                              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                (mp.level === 'view' || mp.level === 'edit') ? 'bg-green-500' : 'bg-red-400'
                              }`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  (mp.level === 'view' || mp.level === 'edit') ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </div>
                            </label>
                          </div>


                          <div className="flex flex-col items-center gap-2">
                            <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Editar</span>
                            <label
                              className={`cursor-pointer ${!hasEditPermission(mp.Modulo) ? 'opacity-50 cursor-not-allowed' : ''}`}
                              aria-label={`Permiso de editar para el módulo ${mp.Modulo}`}
                            >
                              <input
                                type="checkbox"
                                checked={mp.level === 'edit'}
                                onChange={(e) => {
                                  if (hasEditPermission(mp.Modulo)) {
                                    if (e.target.checked) {
                                      handlePermissionChange(mp.Modulo, 'edit');
                                    } else {
                                      if (mp.level === 'edit') {
                                        handlePermissionChange(mp.Modulo, 'view');
                                      }
                                    }
                                  }
                                }}
                                disabled={!hasEditPermission(mp.Modulo)}
                                className="sr-only"
                              />
                              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                mp.level === 'edit' ? 'bg-green-500' : 'bg-red-400'
                              }`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  mp.level === 'edit' ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            </div>
          </form>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 p-6 border-t bg-gray-50 z-10">
          <button
            type="submit"
            form="create-role-form"
            disabled={hasError || nombreRol.length < RoleMIN_LENGTH}
            className={`px-6 py-2 rounded-lg transition-colors font-medium ${
              hasError || nombreRol.length < RoleMIN_LENGTH
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            Crear Rol
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoleModal;