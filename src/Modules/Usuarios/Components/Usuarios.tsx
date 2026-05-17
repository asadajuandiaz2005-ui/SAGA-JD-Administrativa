import { useState, useMemo, useEffect } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { LuSearch, LuFilter, LuPlus } from 'react-icons/lu';
import { MdKeyboardArrowUp, MdKeyboardArrowDown, MdKeyboardArrowLeft, MdKeyboardArrowRight, MdKeyboardDoubleArrowLeft, MdKeyboardDoubleArrowRight } from 'react-icons/md';
import { useUsers, useDeactivateUser, useActivateUser } from '../Hooks/userHook';
import type { Usuario } from '../Models/Usuario';
import CreateUserModal from './CreateUserModal';
import UserDetailModal from './UserDetailModal';
import EditUserModal from './EditUserModal';
import { isActive } from '../Helper/utils';
import type { FilterOptions } from '../Types/UserTypes';
import FilterUserModal from './FilterUserModal';
import { useUserPermissions } from '@/Modules/Auth/Hooks/PermissionHook';
import { useAuth } from '@/Modules/Auth/Context/AuthContext';
import { useNavigate } from '@tanstack/react-router';
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

const Usuarios = () => {
  const { data: users = [], isLoading, refetch } = useUsers();
  const {canEdit, canView } = useUserPermissions();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [globalFilter, setGlobalFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<FilterOptions>({ estado: 'todos' }); // Por defecto solo activos
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  
  const deactivateUserMutation = useDeactivateUser();
  const activateUserMutation = useActivateUser();

  const hasViewPermission = canView('usuarios');
  const hasEditPermission = canEdit('usuarios');

  const pageSizeOptions = [5, 10, 20, 50];
  const [pagination, setPagination] = useState({
    pageSize: 5,
    pageIndex: 0,
  });

  useEffect(() => {
    const handler = () => {
      refetch(); 
    };
    window.addEventListener('refreshUsuarios', handler);
    return () => window.removeEventListener('refreshUsuarios', handler);
  }, [refetch]);

  const usersToShow = useMemo(() => {
    if (isLoading || !users?.length) return [];

    if (hasEditPermission) {
      return users;
    }
    
    // Si solo puede ver, mostrar solo su usuario
    if (hasViewPermission && currentUser?.Id_Usuario) {
      const myUser = users.find(user => user.Id_Usuario === currentUser.Id_Usuario);
      return myUser ? [myUser] : [];
    }
    
    return [];
  }, [users, hasEditPermission, hasViewPermission, currentUser?.Id_Usuario, isLoading]);

  const applyCustomFilters = (data: Usuario[], filters: FilterOptions): Usuario[] => {
    return data.filter(user => {
      // Aplicar filtro de rol si está definido
      if (filters.rol && user.Rol?.Nombre_Rol !== filters.rol) {
        return false;
      }

      // Aplicar filtro de estado
      const userIsActive = isActive(user.Fecha_Eliminacion);
      if (filters.estado === 'activo' && !userIsActive) return false;
      if (filters.estado === 'inactivo' && userIsActive) return false;
      if (filters.estado === 'todos') return true; // Mostrar todos
      if (!filters.estado && !userIsActive) return false; // Si no hay filtro específico, ocultar inactivos

      return true;
    });
  };

  const filteredUsers = useMemo(() => {
    return applyCustomFilters(usersToShow, appliedFilters);
  }, [usersToShow, appliedFilters]);

  const columnHelper = createColumnHelper<Usuario>();

  const handleViewDetail = (user: Usuario) => {
    setSelectedUserId(user.Id_Usuario);
    setShowUserDetail(true);
  };

  const handleEdit = (user: Usuario) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeactivate = async (userId: number) => {
    try {
      // Validar que no sea el usuario admin
      const user = usersToShow.find(u => u.Id_Usuario === userId);
      if (user?.Nombre_Usuario.toLowerCase() === 'admin') {
        console.warn('No se puede desactivar el usuario admin');
        return;
      }
      await deactivateUserMutation.mutateAsync({ id: userId });
    } catch (error) {
      console.error('Error deactivating user:', error);
    }
  };

  const handleActivate = async (userId: number) => {
    try {
      await activateUserMutation.mutateAsync({ id: userId });
    } catch (error) {
      console.error('Error activating user:', error);
    }
  };

  const columns = useMemo(
    () => [
      columnHelper.accessor('Nombre_Usuario', {
        header: () => <><span className="hidden sm:inline">Nombre de Usuario</span><span className="sm:hidden text-[9px]">Usuario</span></>,
        cell: info => (
          <span className="font-medium transition-colors text-left w-full text-[10px] sm:text-[13px]">
            {info.getValue()}
          </span>
        ),
      }),
      columnHelper.accessor('Correo_Electronico', {
        header: () => <><span className="hidden sm:inline">Correo Electrónico</span><span className="sm:hidden text-[9px]">Correo</span></>,
        cell: info => (
          <div className="flex justify-start">
            <div className="text-gray-600 max-w-[100px] sm:max-w-xs truncate text-[10px] sm:text-[13px]">
              {info.getValue()}
            </div>
          </div>
        ),
      }),
      columnHelper.accessor('Rol.Nombre_Rol', {
        header: () => <><span className="hidden sm:inline">Rol</span><span className="sm:hidden text-[9px]">Rol</span></>,
        cell: info => (
          <div className="flex justify-start">
            <span className="px-1.5 py-0.5 sm:px-3 sm:py-1 bg-blue-100 text-blue-800 rounded-full text-[9px] sm:text-xs font-semibold whitespace-nowrap">
              {info.getValue()}
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
              <span className={`px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-xs font-semibold whitespace-nowrap ${
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
        header: () => <><span className="hidden sm:inline">Acciones</span><span className="sm:hidden text-[9px]">Acciones</span></>,
        cell: info => {
          const userIsActive = isActive(info.row.original.Fecha_Eliminacion);
          const canViewDetails = hasEditPermission || info.row.original.Id_Usuario === currentUser?.Id_Usuario;
          
          return (
            <div className="flex flex-row justify-center flex-nowrap gap-1 min-w-[50px] sm:min-w-[140px] overflow-visible">
              {canViewDetails && (
                <button
                  className="px-1.5 py-1 sm:px-2 sm:py-1 bg-gray-600 text-white text-[9px] sm:text-xs rounded hover:bg-gray-700 transition-colors w-auto whitespace-nowrap"
                  onClick={() => handleViewDetail(info.row.original)}
                  title="Ver detalles"
                >
                  Ver
                </button>
              )}
              {hasEditPermission && (
                <button
                  className="px-1.5 py-1 sm:px-2 sm:py-1 bg-blue-600 text-white text-[9px] sm:text-xs rounded hover:bg-blue-700 transition-colors w-auto whitespace-nowrap"
                  onClick={() => handleEdit(info.row.original)}
                  title="Editar"
                >
                  Editar
                </button>
              )}
              {hasEditPermission && (
                <>
                  {userIsActive ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="px-1.5 py-1 sm:px-2 sm:py-1 bg-red-600 text-white text-[9px] sm:text-xs rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-auto whitespace-nowrap"
                          disabled={deactivateUserMutation.isPending || info.row.original.Nombre_Usuario.toLowerCase() === 'admin'}
                          title={info.row.original.Nombre_Usuario.toLowerCase() === 'admin' ? 'No se puede desactivar el usuario admin' : 'Desactivar usuario'}
                        >
                          <span className="hidden sm:inline">Desactivar</span>
                          <span className="sm:hidden">Desact.</span>
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[90vw] max-w-lg mx-auto p-4 sm:p-6 rounded-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            <span>¿Desactivar usuario?</span>
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            <span>¿Estás seguro de que deseas desactivar el usuario "{info.row.original.Nombre_Usuario}"?</span>
                            <br />
                            <span>Esta acción puede revertirse posteriormente.</span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogAction
                            onClick={() => handleDeactivate(info.row.original.Id_Usuario)}
                            disabled={deactivateUserMutation.isPending}
                          >
                            <span>Desactivar</span>
                          </AlertDialogAction>
                          <AlertDialogCancel>
                            <span>Cancelar</span>
                          </AlertDialogCancel>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button
                          className="px-1.5 py-1 sm:px-2 sm:py-1 bg-green-600 text-white text-[9px] sm:text-xs rounded hover:bg-green-700 transition-colors w-auto whitespace-nowrap"
                          disabled={activateUserMutation.isPending}
                          title="Activar usuario"
                        >
                          Activar
                        </button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="w-[90vw] max-w-lg mx-auto p-4 sm:p-6 rounded-xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            <span>¿Activar usuario?</span>
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            <span>¿Estás seguro de que deseas activar el usuario "{info.row.original.Nombre_Usuario}"?</span>
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogAction
                            onClick={() => handleActivate(info.row.original.Id_Usuario)}
                            disabled={activateUserMutation.isPending}
                          >
                            <span>Activar</span>
                          </AlertDialogAction>
                          <AlertDialogCancel>
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
    [deactivateUserMutation.isPending, activateUserMutation.isPending, hasEditPermission, currentUser?.Id_Usuario]
  );

  const table = useReactTable({
    data: filteredUsers, 
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


  const handleApplyFilters = (filters: FilterOptions) => {
    setAppliedFilters(filters);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  const activeFiltersCount = Object.values(appliedFilters).filter(v => v && v !== '').length;

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

        {hasViewPermission && !hasEditPermission && (
          <div className="p-4 bg-blue-50">
            <div className="flex">
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Modo de solo lectura:</strong> Solo puedes ver tu información de usuario.
                </p>
              </div>
            </div>
          </div>
        )}
         <div className="flex items-start gap-4 flex-col justify-start">
            <h2 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
            <p className="text-sm text-gray-600 pb-4">Administra los usuarios del sistema</p>
        </div>

          {(hasEditPermission || filteredUsers.length > 1) && (
            <div className="bg-white rounded-lg p-3 w-full">
              <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 items-stretch sm:items-center justify-between pb-2">
                <div className="flex w-full gap-2 sm:justify-end">
                  {hasEditPermission && (
                  <div className="flex flex-row items-center justify-between gap-2 w-full sm:w-auto overflow-x-auto scrollbar-none pb-1 sm:pb-0">
                    <button
                      onClick={() => setShowFilterModal(true)}
                      className={`px-3 py-1.5 sm:px-4 sm:py-2 border rounded-lg flex items-center gap-2 transition-colors text-xs sm:text-sm whitespace-nowrap ${
                        activeFiltersCount > 0
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <LuFilter className="w-4 h-4" />
                      Filtros
                      {activeFiltersCount > 0 && (
                        <span className="bg-blue-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                          {activeFiltersCount}
                        </span>
                      )}
                    </button>
                  </div>
                )}
                    {hasEditPermission && (
                      <div className="w-full flex gap-2 sm:flex-1 sm:max-w-md order-2 sm:order-none">
                        <div className="relative w-full">
                          <LuSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                          <input
                            type="text"
                            placeholder="Buscar usuarios..."
                            value={globalFilter ?? ''}
                            onChange={(e) => setGlobalFilter(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    )}
                </div>
              
                {hasEditPermission && (
                   <div className="flex gap-2">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg flex items-center gap-2 transition-colors text-xs sm:text-sm whitespace-nowrap"
                      >
                      <LuPlus className="w-4 h-4 sm:w-5 sm:h-5" />
                      <span className="hidden sm:inline">Nuevo Usuario</span>
                      <span className="sm:hidden">Nuevo</span>
                      </button>
                      <button
                        onClick={() => navigate({ to: '/Usuarios/Roles' })}
                        className="px-3 py-1.5 sm:px-4 sm:py-2 border border-gray-300 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition whitespace-nowrap text-xs sm:text-sm"
                      >
                        Roles
                      </button>
                 </div>
                )}
               

              </div>
            </div>
          )}

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
                          {globalFilter ? 'No se encontraron usuarios que coincidan con la búsqueda' : 'No hay usuarios registrados'}
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
      
        {showCreateModal && hasEditPermission && (
          <CreateUserModal onClose={() => setShowCreateModal(false)} />
        )}
        
        {showUserDetail && selectedUserId && (
          <UserDetailModal
            userId={selectedUserId}
            isOpen={showUserDetail}
            onClose={() => {
              setShowUserDetail(false);
              setSelectedUserId(null);
            }}
          />
        )}

        {showEditModal && selectedUser && (
          <EditUserModal
            isOpen={showEditModal}
            onClose={() => {
              setShowEditModal(false);
              setSelectedUser(null);
            }}
            usert={selectedUser}
          />
        )}

        {hasEditPermission && (
          <FilterUserModal
            isOpen={showFilterModal}
            onClose={() => setShowFilterModal(false)}
            onApplyFilters={handleApplyFilters}
            currentFilters={appliedFilters}
          />
        )}
      </div>
    </div>
  );
};

export default Usuarios;