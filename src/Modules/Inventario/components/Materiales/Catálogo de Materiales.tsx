import React, { useState, useMemo, useEffect } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  createColumnHelper,
  flexRender,
} from '@tanstack/react-table';
import { LuPlus, LuFilter, LuSearch } from 'react-icons/lu';
import {
  useGetAllMaterials, 
  useGetMaterialesDisponibles,
  useGetMaterialesAgotados,
  useGetMaterialesDeBaja,
  useGetMaterialesAgotadosYDeBaja,
  useGetMaterialesConCategorias, 
  useGetMaterialesSinCategorias,
  useGetMaterialesPorDebajoDeStock,
  useGetMaterialesPorEncimaDeStock,
  useGetMaterialesEntreRangoPrecio,
  useUpdateEstadoMaterial,
} from '../../hooks/useMaterials';
import { MdKeyboardArrowLeft, MdKeyboardArrowRight, MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight, MdKeyboardArrowUp, MdKeyboardArrowDown} from "react-icons/md";
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

import type { Material } from '../../models/Inventario';
import type { MaterialFilterOptions } from '../../types/MaterialTypes';
import { getMaterialLoadingState } from '../../helper/MaterialesHelpers';
import CreateMaterialModal from './CreateMaterialModal';
import DetailMaterialModal from './DetailMaterialModal';
import FilterMaterialModal from './FilterMaterialModal';
import EditMaterialModal from './EditMaterialModal';
import { useNavigate } from '@tanstack/react-router';

interface CatalogoMaterialesProps {
  onBack?: () => void;
}

const CatalogoMateriales: React.FC<CatalogoMaterialesProps> = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<MaterialFilterOptions>({});
  const [estadoFilter, setEstadoFilter] = useState<string>('Todos'); // Por defecto mostrar todos
  const updateEstadoMutation = useUpdateEstadoMaterial();
  const navigate = useNavigate();


  // Hooks para obtener materiales según el estado
  const { data: todosMateriales = [], isLoading: isLoadingTodos, refetch: refetchTodos } = useGetAllMaterials();
  const { data: materialesDisponibles = [], isLoading: isLoadingDisponibles, refetch: refetchDisponibles } = useGetMaterialesDisponibles();
  const { data: materialesAgotados = [], isLoading: isLoadingAgotados, refetch: refetchAgotados } = useGetMaterialesAgotados();
  const { data: materialesDeBaja = [], isLoading: isLoadingDeBaja, refetch: refetchDeBaja } = useGetMaterialesDeBaja();
  const { data: materialesAgotadosYDeBaja = [], isLoading: isLoadingAgotadosYDeBaja, refetch: refetchAgotadosYDeBaja } = useGetMaterialesAgotadosYDeBaja();
  const { data: materialesConCategorias = [], isLoading: isLoadingConCat, refetch: refetchConCat } = useGetMaterialesConCategorias();
  const { data: materialesSinCategorias = [], isLoading: isLoadingSinCat, refetch: refetchSinCat } = useGetMaterialesSinCategorias();
  const { data: materialesEncimaStock = [], isLoading: isLoadingAbove, refetch: refetchAbove } = useGetMaterialesPorEncimaDeStock(
    appliedFilters.stockMinimo || 0, 

  );
  const { data: materialesDebajoStock = [], isLoading: isLoadingBelow, refetch: refetchBelow } = useGetMaterialesPorDebajoDeStock(
    appliedFilters.stockMaximo || 0, 
  );
  
  // Hook para filtro de rango de precio - solo se habilita cuando hay ambos valores
  const hasRangoPrecio = !!(appliedFilters.precioMin && appliedFilters.precioMax);
  const { data: materialesPorPrecio = [], isLoading: isLoadingPrecio, refetch: refetchPrecio } = useGetMaterialesEntreRangoPrecio(
    appliedFilters.precioMin || 0,
    appliedFilters.precioMax || 0
  );

  const pageSizeOptions = [5, 10, 20, 50];
  const [pagination, setPagination] = useState({
    pageSize: 5,
    pageIndex: 0,
  });

  const refetchAllData = () => {
    refetchTodos();
    refetchDisponibles();
    refetchAgotados();
    refetchDeBaja();
    refetchAgotadosYDeBaja();
    refetchConCat();
    refetchSinCat();
    refetchAbove();
    refetchBelow();
    if (hasRangoPrecio) refetchPrecio();
  };

  useEffect(() => {
    const handler = () => refetchAllData();
    window.addEventListener('refreshInventario', handler);
    return () => window.removeEventListener('refreshInventario', handler);
  }, []);

  const materialesPorEstado = useMemo(() => {
    if (estadoFilter === 'Disponible') return materialesDisponibles;
    if (estadoFilter === 'Agotado') return materialesAgotados;
    if (estadoFilter === 'De baja') return materialesDeBaja;
    if (estadoFilter === 'Agotado y De baja') return materialesAgotadosYDeBaja;
    return todosMateriales; 
  }, [estadoFilter, todosMateriales, materialesDisponibles, materialesAgotados, materialesDeBaja, materialesAgotadosYDeBaja]);

  const { materials, isLoading } = useMemo(() => {
    if (hasRangoPrecio) {
      return { materials: materialesPorPrecio, isLoading: isLoadingPrecio };
    }
    
    if (appliedFilters.soloConCategorias) {
      return { materials: materialesConCategorias, isLoading: isLoadingConCat };
    }
    if (appliedFilters.soloSinCategorias) {
      return { materials: materialesSinCategorias, isLoading: isLoadingSinCat };
    }
    if (appliedFilters.tipoFiltroStock === 'encima' && appliedFilters.stockMinimo) {
      return { materials: materialesEncimaStock, isLoading: isLoadingAbove };
    }
    if (appliedFilters.tipoFiltroStock === 'debajo' && appliedFilters.stockMaximo) {
      return { materials: materialesDebajoStock, isLoading: isLoadingBelow };
    }
    
    const loading = getMaterialLoadingState(estadoFilter, {
      todos: isLoadingTodos,
      disponibles: isLoadingDisponibles,
      agotados: isLoadingAgotados,
      deBaja: isLoadingDeBaja,
      agotadosYDeBaja: isLoadingAgotadosYDeBaja
    });
    
    return { materials: materialesPorEstado, isLoading: loading };
  }, [
    hasRangoPrecio,
    materialesPorPrecio, isLoadingPrecio,
    appliedFilters, 
    estadoFilter,
    materialesPorEstado,
    todosMateriales, isLoadingTodos,
    materialesDisponibles, isLoadingDisponibles,
    materialesAgotados, isLoadingAgotados,
    materialesDeBaja, isLoadingDeBaja,
    materialesAgotadosYDeBaja, isLoadingAgotadosYDeBaja,
    materialesConCategorias, isLoadingConCat,
    materialesSinCategorias, isLoadingSinCat,
    materialesEncimaStock, isLoadingAbove,
    materialesDebajoStock, isLoadingBelow
  ]);


  const filterByStock = (material: Material, conStock?: boolean) => {
    if (!conStock) return true;
    return material.Cantidad > 0;
  };

  const filterByStockEntre = (material: Material, tipoFiltroStock?: string, stockMinimo?: number, stockMaximo?: number) => {
    if (tipoFiltroStock !== 'entre') return true;
    if (stockMinimo && material.Cantidad < stockMinimo) return false;
    if (stockMaximo && material.Cantidad > stockMaximo) return false;
    return true;
  };

  const applyAdditionalFilters = (data: Material[], filters: MaterialFilterOptions): Material[] => {
    return data.filter(material =>
      filterByStock(material, filters.conStock) &&
      filterByStockEntre(material, filters.tipoFiltroStock, filters.stockMinimo, filters.stockMaximo)
    );
  };

  const filteredMaterials = useMemo(() => {
    return applyAdditionalFilters(materials, appliedFilters);
  }, [materials, appliedFilters]);

  const columnHelper = createColumnHelper<Material>();

  const columns = useMemo(
    () => [
      columnHelper.accessor('Nombre_Material', {
        header: () => <><span className="hidden sm:inline">Material</span><span className="sm:hidden text-[9px]">Material</span></>,
        cell: info => (
          <div 
            className="flex justify-center text-[8px] sm:text-[13px] text-gray-900  truncate max-w-[70px] sm:max-w-[150px]" 
            title={info.getValue()}
          >
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor('Descripcion', {
        header: () => <><span className="hidden sm:inline">Descripción</span><span className="sm:hidden text-[9px]">Desc.</span></>,
        cell: info => (
          <div 
            className="flex justify-center text-[8px] sm:text-[13px] text-gray-600 truncate max-w-[80px] sm:max-w-[200px]"
            title={info.getValue() || 'Sin descripción'}
          >
            {info.getValue() || 'Sin descripción'}
          </div>
        ),
      }),
      columnHelper.accessor('Cantidad', {
        header: () => <><span className="hidden sm:inline">Cantidad</span><span className="sm:hidden text-[9px]">Cant.</span></>,
        cell: info => (
          <div className={`flex justify-center text-[8px] sm:text-[13px] font-bold ${info.getValue() <= 0 ? 'text-red-600' : 'text-green-600'}`}>
            {info.getValue()}
          </div>
        ),
      }),
      columnHelper.accessor((row) => row.Unidad_Medicion?.Nombre_Unidad_Medicion, {
        id: 'U_Medida',
        header: () => <><span className="hidden sm:inline">U. Medida</span><span className="sm:hidden text-[9px]">U. Med</span></>,
        cell: info => {
          const unidad = info.getValue() || 'Sin unidad';
          return (
            <div 
              className="flex justify-center text-[8px] sm:text-[13px] text-gray-600 truncate max-w-[50px] sm:max-w-[100px]"
              title={unidad}
            >
              {unidad}
            </div>
          );
        },
      }),
      columnHelper.accessor('Precio_Unitario', {
        header: () => <><span className="hidden sm:inline">Precio Un.</span><span className="sm:hidden text-[9px]">Precio</span></>,
        cell: info => (
          <div className="text-[8px] sm:text-[13px] flex justify-center text-gray-900">
            <span className="hidden sm:inline">₡{info.getValue().toLocaleString('es-CR', { minimumFractionDigits: 2 })}</span>
            <span className="sm:hidden">₡{info.getValue().toLocaleString('es-CR', { maximumFractionDigits: 0 })}</span>
          </div>
        ),
      }),
      columnHelper.accessor('Estado_Material.Nombre_Estado_Material', {
        header: () => <><span className="hidden sm:inline">Estado</span><span className="sm:hidden text-[9px]">Estado</span></>,
        cell: info => {
          const estado = info.getValue();
          let colorClass = '';
          
          if (estado === 'Disponible') {
            colorClass = 'bg-emerald-100 text-emerald-700 border border-emerald-300';
          } else if (estado === 'Agotado') {
            colorClass = 'bg-red-100 text-red-700 border border-red-300';
          } else if (estado === 'De baja') {
            colorClass = 'bg-slate-200 text-slate-700 border border-slate-400';
          } else if (estado === 'Agotado y de baja') {
            colorClass = 'bg-amber-100 text-amber-700 border border-amber-300';
          }
          
          return (
            <div className="flex justify-center">
              <span className={`px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[8px] sm:text-xs font-semibold whitespace-nowrap ${colorClass}`}>
                {estado === 'Agotado y de baja' ? (
                   <><span className="hidden sm:inline">Agotado y de baja</span><span className="sm:hidden">Agot. / Baja</span></>
                ) : estado}
              </span>
            </div>
          );
        },
      }),
      columnHelper.accessor('Categorias', {
        header: () => <><span className="hidden sm:inline">Categorías</span><span className="sm:hidden text-[9px]">Categorías</span></>,
        cell: info => {
          const categorias = info.getValue() || [];
          
          if (!categorias || categorias.length === 0) {
            return (
              <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-gray-100 text-gray-600 rounded-full text-[8px] sm:text-xs whitespace-nowrap">
                Sin categoría
              </span>
            );
          }
          
          return (
            <div className="flex gap-1 justify-center max-w-[60px] sm:max-w-xs flex-wrap">
              {categorias.slice(0, 1).map((cat: any, index: number) => {
                const categoria = cat.Categoria || cat;
                const key = cat.Id_Material_Categoria || cat.Id_Categoria || index;
                const nombreCategoria = categoria.Nombre_Categoria || 'N/A';
                
                return (
                  <span 
                    key={key} 
                    className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg text-[7px] sm:text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 truncate max-w-[70px] sm:max-w-[100px]"
                    title={nombreCategoria}
                  >
                    {nombreCategoria}
                  </span>
                );
              })}
              {categorias.length > 1 && (
                <span className="px-1.5 py-0.5 sm:px-2.5 sm:py-1 bg-gray-100 text-gray-600 rounded-full text-[7px] sm:text-xs">
                  +{categorias.length - 1}
                </span>
              )}
            </div>
          );
        },
      }),
      columnHelper.display({
        id: 'acciones',
        header: () => <><span className="hidden sm:inline">Acciones</span><span className="sm:hidden text-[9px]">Acciones</span></>,
        cell: info => (
          <div className="flex flex-row justify-center flex-nowrap gap-1 min-w-[50px] sm:min-w-[140px] overflow-visible">
            <button
              className="px-1.5 py-1 sm:px-2 sm:py-1 bg-gray-600 text-white text-[7px] sm:text-xs rounded hover:bg-gray-700 transition-colors w-auto whitespace-nowrap"
              onClick={() => handleViewDetail(info.row.original)}
              title="Ver detalles"
            >
              Ver
            </button>
            <button
              className="px-1.5 py-1 sm:px-2 sm:py-1 bg-blue-600 text-white text-[7px] sm:text-xs rounded hover:bg-blue-700 transition-colors w-auto whitespace-nowrap"
              onClick={() => handleEdit(info.row.original)}
              title="Editar"
            >
              Editar
            </button>
            {(() => {
              const estadoNombre = info.row.original.Estado_Material?.Nombre_Estado_Material;
              const cantidad = info.row.original.Cantidad;
              
              // Estado 1: Disponible → Mostrar botón "Dar de baja"
              if (estadoNombre === 'Disponible') {
                return (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="px-1.5 py-1 sm:px-2 sm:py-1 w-auto whitespace-nowrap bg-red-600 text-white text-[7px] sm:text-xs rounded hover:bg-red-700 transition-colors"
                        disabled={updateEstadoMutation.isPending}
                        title="Dar de baja"
                      >
                        Dar de baja
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          <span>¿Dar de baja material?</span>
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          <span>¿Estás seguro de que deseas dar de baja el material "{info.row.original.Nombre_Material.length > 20 ? info.row.original.Nombre_Material.substring(0, 20) + '...' : info.row.original.Nombre_Material}"?</span>
                          <br />
                          <span>Esta acción puede revertirse posteriormente.</span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogAction
                          onClick={() => handleToggleEstado(info.row.original)}
                          disabled={updateEstadoMutation.isPending}
                        >
                          <span>Dar de baja</span>
                        </AlertDialogAction>
                        <AlertDialogCancel>
                          <span>Cancelar</span>
                        </AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                );
              }
              
              // Estado 3: De baja → Mostrar botón "Activar" (solo si cantidad > 0)
              if (estadoNombre === 'De baja') {
                return (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className={`px-1.5 py-1 sm:px-2 sm:py-1 text-[7px] sm:text-xs w-auto whitespace-nowrap text-white rounded transition-colors ${
                          cantidad === 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                        disabled={updateEstadoMutation.isPending || cantidad === 0}
                        title={cantidad === 0 
                          ? 'No se puede activar un material con cantidad 0. Realice un movimiento de ingreso primero.' 
                          : 'Activar material'}
                      >
                        Quitar de baja
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          <span>¿Activar material?</span>
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {cantidad === 0 ? (
                            <>
                              <span className="text-amber-600 font-semibold"> Advertencia:</span>
                              <br />
                              <span>No se puede activar el material "{info.row.original.Nombre_Material.length > 20 ? info.row.original.Nombre_Material.substring(0, 20) + '...' : info.row.original.Nombre_Material}" porque tiene cantidad 0 en stock.</span>
                              <br />
                              <span>Para activarlo, primero debe realizar un movimiento de ingreso.</span>
                            </>
                          ) : (
                            <span>¿Estás seguro de que deseas activar este material "{info.row.original.Nombre_Material.length > 20 ? info.row.original.Nombre_Material.substring(0, 20) + '...' : info.row.original.Nombre_Material}"?</span>
              
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogAction
                          onClick={() => handleToggleEstado(info.row.original)}
                          disabled={updateEstadoMutation.isPending || cantidad === 0}
                        >
                          <span>Activar</span>
                        </AlertDialogAction>
                        <AlertDialogCancel>
                          <span>Cancelar</span>
                        </AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                );
              }
              
              // Estado 2: Agotado → Mostrar botón "Dar de baja"
              if (estadoNombre === 'Agotado') {
                return (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className="px-1.5 py-1 sm:px-2 sm:py-1 w-auto whitespace-nowrap bg-red-600 text-white text-[7px] sm:text-xs rounded hover:bg-red-700 transition-colors"
                        disabled={updateEstadoMutation.isPending}
                        title="Dar de baja material agotado"
                      >
                        Dar de baja
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          <span>¿Dar de baja material agotado?</span>
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          <span>¿Estás seguro de que deseas dar de baja el material "{info.row.original.Nombre_Material.length > 20 ? info.row.original.Nombre_Material.substring(0, 20) + '...' : info.row.original.Nombre_Material}"?</span>
                          <br />
                          <span>El material está agotado y pasará al estado "Agotado y de baja".</span>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogAction
                          onClick={() => handleToggleEstado(info.row.original)}
                          disabled={updateEstadoMutation.isPending}
                        >
                          <span>Dar de baja</span>
                        </AlertDialogAction>
                        <AlertDialogCancel>
                          <span>Cancelar</span>
                        </AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                );
              }
              
              // Estado 4: Agotado y de baja → Mostrar botón "Quitar de baja" (solo si cantidad > 0)
              if (estadoNombre === 'Agotado y de baja') {
                return (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button
                        className={`px-1.5 py-1 sm:px-2 sm:py-1 text-[7px] sm:text-xs w-auto whitespace-nowrap text-white rounded transition-colors ${
                          cantidad === 0
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-green-600 hover:bg-green-700'
                        }`}
                        disabled={updateEstadoMutation.isPending || cantidad === 0}
                        title={cantidad === 0 
                          ? 'No se puede quitar de baja un material con cantidad 0. Realice un movimiento de ingreso primero.' 
                          : 'Quitar estado de baja (quedará como Agotado)'}
                      >
                        Quitar de baja
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          <span>¿Quitar estado de baja?</span>
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          {cantidad === 0 ? (
                            <>
                              <span className="text-amber-600 font-semibold"> Advertencia:</span>
                              <br />
                              <span>No se puede quitar de baja el material "{info.row.original.Nombre_Material.length > 20 ? info.row.original.Nombre_Material.substring(0, 20) + '...' : info.row.original.Nombre_Material}" porque tiene cantidad 0 en stock.</span>
                              <br />
                              <span>Para quitarlo de baja, primero debe realizar un movimiento de ingreso.</span>
                            </>
                          ) : (
                            <>
                              <span>¿Estás seguro de que deseas quitar el estado de baja del material "{info.row.original.Nombre_Material.length > 20 ? info.row.original.Nombre_Material.substring(0, 20) + '...' : info.row.original.Nombre_Material}"?</span>
                              <br />
                              <span>El material quedará en estado "Agotado".</span>
                            </>
                          )}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogAction
                          onClick={() => handleToggleEstado(info.row.original)}
                          disabled={updateEstadoMutation.isPending || cantidad === 0}
                        >
                          <span>Quitar de baja</span>
                        </AlertDialogAction>
                        <AlertDialogCancel>
                          <span>Cancelar</span>
                        </AlertDialogCancel>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                );
              }
              
              return null;
            })()}
          </div>
        ),
      }),
    ], [updateEstadoMutation.isPending]);

  const table = useReactTable({
    data: filteredMaterials,
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
    const handleEdit = (material: Material) => {
    setSelectedMaterial(material);
    setShowEditModal(true);
  };

  const handleViewDetail = (material: Material) => {
    setSelectedMaterial(material);
    setShowDetailModal(true);
  };

  const handleToggleEstado = (material: Material) => {
    const estadoActualId = material.Estado_Material.Id_Estado_Material;
    
    // Lógica de cambio de estados:
    // 1 (Disponible) → 3 (De baja)
    // 3 (De baja) → 1 (Disponible) - solo si Cantidad > 0
    // 2 (Agotado) → 3 (De baja) - backend auto-cambia a 4 si corresponde
    // 4 (Agotado y de baja) → 2 (Agotado) - para quitar el estado de baja
    
    let nuevoEstadoId: number;
    
    if (estadoActualId === 1) {
      // Disponible → De baja
      nuevoEstadoId = 3;
    } else if (estadoActualId === 3) {
      // De baja → Disponible (solo si cantidad > 0, validado por backend)
      nuevoEstadoId = 1;
    } else if (estadoActualId === 2) {
      // Agotado → De baja (backend lo cambiará a Agotado y de baja automáticamente)
      nuevoEstadoId = 3;
    } else if (estadoActualId === 4) {
      // Agotado y de baja → Agotado (quita el estado de baja)
      nuevoEstadoId = 2;
    } else {
      // Fallback
      nuevoEstadoId = estadoActualId === 1 ? 3 : 1;
    }
    
    updateEstadoMutation.mutate({
      materialId: material.Id_Material,
      estadoMaterialId: nuevoEstadoId,
    });
  };


  const handleApplyFilters = (filters: MaterialFilterOptions) => {
    const cleanFilters = { ...filters };
    
    // Limpiar valores residuales de stock según el tipo seleccionado
    if (cleanFilters.tipoFiltroStock === 'encima') cleanFilters.stockMaximo = undefined;
    if (cleanFilters.tipoFiltroStock === 'debajo') cleanFilters.stockMinimo = undefined;
    if (!cleanFilters.tipoFiltroStock) {
      cleanFilters.stockMinimo = undefined;
      cleanFilters.stockMaximo = undefined;
    }

    setAppliedFilters(cleanFilters);
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
  };

  const activeFiltersCount = Object.values(appliedFilters).filter(v => 
    v !== undefined && v !== '' && v !== false
  ).length;

  const renderMaterialesView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-3">
          <div className="flex items-start gap-4 flex-col justify-start">
            <h2 className="text-2xl font-bold text-gray-900">Catálogo de Materiales</h2>
            <p className="text-sm text-gray-600 pb-4">Gestiona los materiales del inventario</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between pb-2">
          {/* Fila 1 en móvil / Izquierda en desktop */}
          <div className="flex flex-row items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2 flex-1 sm:w-auto">
              <label htmlFor="estado-filter-select" className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">Estado:</label>
              <select
                id="estado-filter-select"
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="flex-1 sm:flex-none px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm w-full sm:w-auto"
              >
                <option value="Todos">Todos los estados</option>
                <option value="Disponible">Disponible</option>
                <option value="Agotado">Agotado</option>
                <option value="De baja">De baja</option>
                <option value="Agotado y De baja">Agotado y de baja</option>
              </select>
            </div>
            
            <button
              onClick={() => setShowFilterModal(true)}
              className={` sm:flex-none justify-center whitespace-nowrap px-2 py-1.5 sm:px-4 sm:py-2 border rounded-md flex items-center gap-1 sm:gap-2 transition-colors text-xs sm:text-sm ${
                activeFiltersCount > 0
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <LuFilter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Filtros
              {activeFiltersCount > 0 && (
                <span className="bg-blue-500 text-white text-[10px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>
    <div className="flex w-full flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-end">
      {/* Fila 2 en móvil / Centro en desktop */}
          <div className="relative w-full sm:flex-1 sm:max-w-md">
            <LuSearch className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <input
              type="text"
              placeholder="Buscar materiales..."
              value={globalFilter ?? ''}
              onChange={(e) => setGlobalFilter(e.target.value)}
              className="w-full pl-8 pr-2 py-1.5 sm:pl-10 sm:pr-4 sm:py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm"
            />
          </div>

          {/* Fila 3 en móvil / Derecha en desktop */}
          <div className="flex flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex-1 sm:flex-none justify-center bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap px-2 py-1.5 sm:px-4 sm:py-2 rounded-md flex items-center gap-1 sm:gap-2 transition-colors text-xs sm:text-sm"
            >
              <LuPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Nuevo
            </button>
            <button
              onClick={() => navigate({ to: '/Inventario/Materiales/Medidores' })}
              className="flex-1 sm:flex-none justify-center whitespace-nowrap px-2 py-1.5 sm:px-4 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-xs sm:text-sm"
            >
              Medidores
            </button>
          </div>
      </div>      
          
        </div>
      </div>

<div className="bg-white rounded-2xl shadow-sm border border-sky-100 overflow-hidden">
        <div className="overflow-x-auto max-h-[calc(100vh-300px)] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-600 scrollbar-track-blue-100">
          <table className="min-w-full table-auto">
            <thead className="bg-sky-50 sticky top-0 z-10">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="text-left text-xs sm:text-sm text-sky-700">
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-2 sm:px-4 py-3 font-medium border-b border-sky-100 cursor-pointer"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <span className="flex items-center justify-center gap-1">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' && <MdKeyboardArrowUp className="inline" />}
                        {header.column.getIsSorted() === 'desc' && <MdKeyboardArrowDown className="inline" />}
                      </span>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-sky-50">
              {table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-2 sm:px-4 py-8 text-center text-slate-500">
                    {globalFilter ? 'No se encontraron materiales que coincidan con la búsqueda' : 'No hay materiales registrados'}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-sky-50 cursor-pointer transition-colors"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="px-2 sm:px-4 py-3 text-xs sm:text-sm text-slate-700 align-top">
                        {typeof cell.column.columnDef.cell === 'function'
                          ? cell.column.columnDef.cell(cell.getContext())
                          : cell.getValue() as React.ReactNode}
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


      <CreateMaterialModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
      />

      {selectedMaterial && (
        <DetailMaterialModal
          material={selectedMaterial}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedMaterial(null);
          }}
        />
      )}

        {showEditModal && selectedMaterial && (
        <EditMaterialModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedMaterial(null);
          }}
          material={selectedMaterial}
        />
      )}

      <FilterMaterialModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={appliedFilters}
      />

      </div>
    );
  };

  return renderMaterialesView();
}

export default CatalogoMateriales