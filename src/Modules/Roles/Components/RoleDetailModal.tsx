import React from 'react';
import { useRoleById } from '../Hooks/RoleHook';
import { LuShield, LuX, LuLock, LuFolderTree } from 'react-icons/lu';
import type { Permiso } from '@/Modules/Roles/Models/Role';
import { getPermissionLabel } from '@/Modules/Usuarios/Helper/GroupPermiByModule';
import type { RoleDetailModalProps } from '../Types/RoleTypes';
import { isActive } from '@/Modules/Usuarios/Helper/utils';
import type { FechaEliminacionType } from '@/Modules/Usuarios/Types/UserTypes';

const RoleDetailModal: React.FC<RoleDetailModalProps> = ({ roleId, isOpen, onClose }) => {
  const { data: role, isLoading } = useRoleById(roleId);

    const getStatusDisplay = (Fecha_Eliminacion: FechaEliminacionType | undefined) => {
      if (Fecha_Eliminacion === undefined) return 'Desconocido';
      return isActive(Fecha_Eliminacion) ? 'Activo' : 'Inactivo';
    };


  if (!isOpen) return null;

  // Agrupar permisos por módulo
  const groupedPermisos = role?.Permisos?.reduce((acc: any, permiso: Permiso) => {
    if (!acc[permiso.Modulo]) {
      acc[permiso.Modulo] = [];
    }
    acc[permiso.Modulo].push(permiso);
    return acc;
  }, {});


  return (
      <div className="fixed inset-0 bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-2xl border border-gray-200 w-full max-w-3xl flex flex-col overflow-hidden max-h-[90vh]">
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                Detalles del Rol
              </h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <LuX className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 p-6">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
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
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label htmlFor='role-name' className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Nombre del Rol</label>
                        <p className="text-sm font-medium text-gray-900">{role?.Nombre_Rol}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label htmlFor='role-permissions' className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Total de Permisos</label>
                        <p className="text-sm font-medium text-gray-900">{role?.Permisos?.length || 0} permisos asignados</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <label htmlFor='role-status' className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">Estado del Rol</label>
                        <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold border ${
                          isActive(role?.Fecha_Eliminacion)
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-red-100 text-red-800 border-red-200'
                        }`}>
                          {getStatusDisplay(role?.Fecha_Eliminacion)}
                        </span>
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
                      <h3 className="text-base font-bold text-gray-900">Permisos por Módulo</h3>
                    </div>
                  </div>
                  
                  <div className="p-5">
                    <div className="space-y-4">
                      {Object.entries(groupedPermisos || {}).map(([modulo, permisos]: [string, any]) => (
                        <div key={modulo} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <LuFolderTree className="w-5 h-5 text-blue-600" />
                              </div>
                              <div>
                                <h4 className="font-bold text-gray-900 text-sm capitalize">{modulo}</h4>
                                <p className="text-xs text-gray-600">
                                  Módulo del sistema
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 flex-wrap">
                              {permisos.map((permiso: Permiso) => {
                                const label = getPermissionLabel(permiso);
                                return (
                                  <span key={permiso.Id} className={`px-3 py-1 rounded-lg text-xs font-semibold border ${label.className}`}>
                                    {label.text}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
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

export default RoleDetailModal;