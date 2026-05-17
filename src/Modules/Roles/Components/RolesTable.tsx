import { useState, useMemo } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { LuSearch, LuPlus } from 'react-icons/lu';
import { MdKeyboardArrowUp, MdKeyboardArrowDown, MdKeyboardArrowLeft, MdKeyboardArrowRight, MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight } from 'react-icons/md';
import { useRoles, useDeactivateRole, useActivateRole } from '../Hooks/RoleHook';
import RoleDetailModal from './RoleDetailModal';
import CreateRoleModal from './CreateRoleModal';
import type { Role } from '../Models/Role';
import { EditRoleModal } from './EditRolModal';
import { isActive } from '@/Modules/Usuarios/Helper/utils';
import { useUserPermissions } from '@/Modules/Auth/Hooks/PermissionHook';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/Modules/Global/components/Sidebar/ui/alert-dialog';


const Roles = () => {
  const { data: allRoles = [], isLoading } = useRoles();
  const { canCreate, canEdit } = useUserPermissions();
  const [globalFilter, setGlobalFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [showRoleDetail, setShowRoleDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [estadoFilter, setEstadoFilter] = useState<string>('Todos'); // Por defecto mostrar todos los roles
  const [_selectedRole, setSelectedRole] = useState<Role | null>(null);
  const deactivateRoleMutation = useDeactivateRole();
  const activateRoleMutation = useActivateRole();
  const pageSizeOptions = [5, 10, 20, 50];
  const [pagination, setPagination] = useState({
    pageSize: 5,
    pageIndex: 0,
  });

  const roles = useMemo(() => {
    if (estadoFilter === 'Todos') {
      return allRoles;
    }
    return allRoles.filter(role => {
      const roleIsActive = isActive(role.Fecha_Eliminacion);
      if (estadoFilter === 'Activo') return roleIsActive;
      if (estadoFilter === 'Inactivo') return !roleIsActive;
      return true;
    });
  }, [allRoles, estadoFilter]);

  const columnHelper = createColumnHelper<Role>();

  const handleViewDetail = (role: Role) => {
    setSelectedRoleId(role.Id_Rol);
    setShowRoleDetail(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setSelectedRoleId(role.Id_Rol);
    setShowEditModal(true);
  };

  const handleDeactivate = async (roleId: number) => {
    try {
      // Validar que no sea el rol Administrador
      const role = allRoles.find(r => r.Id_Rol === roleId);
      if (role?.Nombre_Rol.toLowerCase() === 'administrador') {
        console.warn('No se puede desactivar el rol Administrador');
        return;
      }
      await deactivateRoleMutation.mutateAsync({ id: roleId });
    } catch (error) {
      console.error('Error deactivating role:', error);
    }
  };

  const handleActivate = async (roleId: number) => {
    try {
      await activateRoleMutation.mutateAsync({ id: roleId});
    } catch (error) {
      console.error('Error activating role:', error);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('Nombre_Rol', {
        header: () => <><span className="hidden sm:inline">Nombre del Rol</span><span className="sm:hidden text-[9px]">Nombre</span></>,
        cell: info => (
          <div className="flex justify-start">
            <span className="font-medium transition-colors text-left w-full text-[10px] sm:text-sm">
              {info.getValue()}
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('Permisos', {
        header: () => <><span className="hidden sm:inline">Permisos</span><span className="sm:hidden text-[9px]">Permisos</span></>,
        cell: info => (
          <div className="flex justify-start">
            <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-blue-100 text-blue-800 rounded-full text-[9px] sm:text-xs font-semibold whitespace-nowrap">
              {info.getValue()?.length ?? 0} Perm.
            </span>
          </div>
        ),
      }),
      columnHelper.accessor('Fecha_Eliminacion', { 
        header: () => <><span className="hidden sm:inline">Estado</span><span className="sm:hidden text-[9px]">Estado</span></>,
        cell: info => {
          const activo = isActive(info.getValue());
          return (
            <div className="flex justify-start">
              <span className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-xs font-semibold whitespace-nowrap ${
                activo 
                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-300' 
                  : 'bg-red-100 text-red-700 border border-red-300'
              }`}>
                {activo ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'acciones',
        header: () => <><span className="hidden sm:inline">Acciones</span><span className="sm:hidden text-[9px]">Acción</span></>,
        cell: info => {
          const roleIsActive = isActive(info.row.original.Fecha_Eliminacion);
          
          return (
            <div className="flex justify-center gap-1">
              <button
                className="px-2 py-1 bg-gray-600 text-white text-[9px] sm:text-xs rounded hover:bg-gray-700 transition-colors whitespace-nowrap"
                onClick={() => handleViewDetail(info.row.original)}
                title="Ver detalles"
              >
                Ver
              </button>
              {canEdit('usuarios') && (
                <button
                  className="px-2 py-1 bg-blue-600 text-white text-[9px] sm:text-xs rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
                  onClick={() => handleEdit(info.row.original)}
                  title="Editar"
                >
                  Editar
                </button>
              )}
              {canEdit('usuarios') && (
                <>
                  {roleIsActive ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="px-2 py-1 bg-red-600 text-white text-[9px] sm:text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                          disabled={deactivateRoleMutation.isPending || info.row.original.Nombre_Rol.toLowerCase() === 'administrador'}
                          title={info.row.original.Nombre_Rol.toLowerCase() === 'administrador' ? 'No se puede desactivar el rol Administrador' : 'Desactivar rol'}
                        >
                          <span className="hidden sm:inline">Desactivar</span>
                          <span className="sm:hidden">Desc.</span>
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[90vw] max-w-lg mx-auto p-4 sm:p-6">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            <span>¿Desactivar rol?</span>
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-sm sm:text-base">
                            <span>¿Estás seguro de que deseas desactivar el rol "{info.row.original.Nombre_Rol}"?</span>
                            <br />
                            <span>Si lo haces, se desactivarán los usuarios con este rol.</span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                          <AlertDialogAction
                            onClick={() => handleDeactivate(info.row.original.Id_Rol)}
                            disabled={deactivateRoleMutation.isPending}
                            className="w-full sm:w-auto"
                          >
                            <span>Desactivar</span>
                          </AlertDialogAction>
                          <AlertDialogCancel className="w-full sm:w-auto mt-2 sm:mt-0">
                            <span>Cancelar</span>
                          </AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="px-2 py-1 bg-green-600 text-white text-[9px] sm:text-xs rounded hover:bg-green-700 transition-colors whitespace-nowrap"
                          disabled={activateRoleMutation.isPending}
                          title="Activar rol"
                        >
                           <span className="hidden sm:inline">Activar</span>
                           <span className="sm:hidden">Act.</span>
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[90vw] max-w-lg mx-auto p-4 sm:p-6">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            <span>¿Activar rol?</span>
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-sm sm:text-base">
                            <span>¿Estás seguro de que deseas activar el rol "{info.row.original.Nombre_Rol}"?</span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0">
                          <AlertDialogAction
                            onClick={() => handleActivate(info.row.original.Id_Rol)}
                            disabled={activateRoleMutation.isPending}
                            className="w-full sm:w-auto"
                          >
                            <span>Activar</span>
                          </AlertDialogAction>
                          <AlertDialogCancel className="w-full sm:w-auto mt-2 sm:mt-0">
                            <span>Cancelar</span>
                          </AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </>
              )}
            </div>
          );
        },
      }),
    ],
    [deactivateRoleMutation.isPending, activateRoleMutation.isPending, canEdit]
  );

  const table = useReactTable({
    data: roles,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: setPagination,
    initialState: {
      pagination: {
        pageSize: 5,
      },
    },
  });


  if (isLoading) {
    return (
      <div className="w-full flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-start h-full p-2">
      <div className="w-full overflow-hidden">
           <div className="flex items-start gap-4 flex-col justify-start">
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Roles</h2>
            <p className="text-sm text-gray-600 pb-4">Gestiona los roles de los usuarios en el sistema</p>
        </div>

        <div className="bg-white rounded-lg p-3 w-full mb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 items-stretch sm:items-center justify-between">
            <div className='gap-2 flex items-center w-full sm:w-auto overflow-x-auto scrollbar-none pb-1 sm:pb-0'>
              <label htmlFor='estado' className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Estado:</label>
              <select
                  id="estado"
                  value={estadoFilter}
                  onChange={(e) => setEstadoFilter(e.target.value)}
                  className="px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                >
                  <option value="Todos">Todos los roles</option>
                  <option value="Activo">Activos</option>
                  <option value="Inactivo">Inactivos</option>
                </select>
            </div>
           
            <div className="w-full flex gap-2 sm:flex-1 sm:max-w-md order-2 sm:order-none">
              <div className="relative w-full">
                <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="Buscar roles..."
                  value={globalFilter ?? ''}
                  onChange={(e) => setGlobalFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {canCreate('usuarios') && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 transition-colors text-xs sm:text-sm whitespace-nowrap"
                >
                  <LuPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Nuevo Rol</span>
                  <span className="sm:hidden">Nuevo</span>
                </button>
              )}
            </div>
          </div>
        </div>

      <div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100 mb-4">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
            <table className="min-w-full table-auto">
              <thead className="bg-sky-50">
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="text-left text-xs sm:text-sm text-sky-700">
                    {headerGroup.headers.map((header, index) => (
                      <th
                        key={header.id}
                        className={`px-2 sm:px-4 py-3 font-medium border-b border-sky-100 ${
                          index === 0 ? 'text-left' : 'text-center'
                        }`}
                      >
                        {(() => {
                          if (header.isPlaceholder) {
                            return null;
                          }
                          if (header.column.getCanSort()) {
                            return (
                              <button
                                type="button"
                                className={`cursor-pointer select-none flex items-center gap-2 bg-transparent border-none p-0 whitespace-nowrap ${
                                  index === 0 ? 'justify-start' : 'justify-center'
                                }`}
                                onClick={header.column.getToggleSortingHandler()}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    header.column.getToggleSortingHandler()?.(e);
                                  }
                                }}
                                tabIndex={0}
                                aria-label={`Ordenar por ${header.column.columnDef.header as string}`}
                              >
                                <span className="flex items-center gap-1">
                                  {flexRender(header.column.columnDef.header, header.getContext())}
                                  {header.column.getIsSorted() === 'asc' && <MdKeyboardArrowUp className="inline" />}
                                  {header.column.getIsSorted() === 'desc' && <MdKeyboardArrowDown className="inline" />}
                                </span>
                              </button>
                            );
                          }
                          return (
                            <span className={`whitespace-nowrap ${index === 0 ? 'text-left' : 'text-center'}`}>
                              {flexRender(header.column.columnDef.header, header.getContext())}
                            </span>
                          );
                        })()}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-sky-50">
                {table.getRowModel().rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-2 sm:px-4 py-8 text-center text-slate-500">
                      {globalFilter ? 'No se encontraron roles que coincidan con la búsqueda' : 'No hay roles registrados'}
                    </td>
                  </tr>
                ) : (
                  table.getRowModel().rows.map((row) => (
                    <tr 
                      key={row.id} 
                      className="hover:bg-sky-50 cursor-pointer transition-colors"
                    >
                      {row.getVisibleCells().map((cell, index) => (
                        <td key={cell.id} className={`px-2 sm:px-4 py-3 text-xs sm:text-sm text-slate-700 align-top ${
                          index === 0 ? 'text-left' : 'text-center'
                        }`}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-gray-50 px-3 sm:px-6 py-2 sm:py-3 border-t border-gray-200 flex flex-row items-center justify-between gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1 sm:gap-2 whitespace-nowrap">
            <span className='text-[10px] sm:text-sm text-gray-700'>Filas por página:</span>
            <select
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                table.setPageSize(Number(e.target.value));
              }}
              className="border border-gray-300 rounded-md px-1 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {pageSizeOptions.map((pageSize) => (
                <option key={pageSize} value={pageSize}>
                  {pageSize}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 whitespace-nowrap">
            <button
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              className="p-1 sm:p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Primera página"
            >
              <MdKeyboardDoubleArrowLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1 sm:p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Página anterior"
            >
              <MdKeyboardArrowLeft className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
            <span className="px-1.5 sm:px-2 py-1 text-[10px] sm:text-sm whitespace-nowrap">
              Pág. {table.getState().pagination.pageIndex + 1} de{' '}
              {table.getPageCount()}
            </span>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1 sm:p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Página siguiente"
            >
              <MdKeyboardArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              className="p-1 sm:p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Última página"
            >
              <MdKeyboardDoubleArrowRight className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
        </div>
      </div>

   
      {showCreateModal && (
        <CreateRoleModal onClose={() => setShowCreateModal(false)} />
      )}

   
      {showEditModal && selectedRoleId && (
        <EditRoleModal
          roleId={selectedRoleId}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedRoleId(null);
          }}
        />
      )}

   
      {showRoleDetail && selectedRoleId && (
        <RoleDetailModal
          roleId={selectedRoleId}
          isOpen={showRoleDetail}
          onClose={() => {
            setShowRoleDetail(false);
            setSelectedRoleId(null);
          }}
        />
      )}
    </div>
  );
};

export default Roles;