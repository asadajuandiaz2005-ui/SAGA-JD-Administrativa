import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CreateMedidorData } from '../models/Medidor';
import { getAllMedidores, getMedidoresNoInstalados, getMedidoresInstalados, getMedidoresAveriados, getMedidoresPendientes, getMedidoresPagados, getMedidoresLibres, getMedidoresAfiliado, createMedidor, updateEstadoMedidor, updateEstadoPagoMedidor } from '../service/MedidorServices';
import type { EstadoPagoMedidorNombre } from '../models/Medidor';
import { useAlerts } from '@/Modules/Global/context/AlertContext';

// Hook para obtener todos los medidores
export const useMedidores = () => {
  return useQuery({
    queryKey: ['medidores'],
    queryFn: getAllMedidores,
  });
};

// Hook para obtener medidores por estado
export const useMedidoresPorEstado = (estado: 'no-instalados' | 'instalados' | 'averiados' | 'pendientes' | 'pagados' | 'libres' | 'desconectados') => {
  const queryFnMap = {
    'no-instalados': getMedidoresNoInstalados,
    'instalados': getMedidoresInstalados,
    'averiados': getMedidoresAveriados,
    'pendientes': getMedidoresPendientes,
    'pagados': getMedidoresPagados,
    'libres': getMedidoresLibres,
    'desconectados': getMedidoresAveriados,
  };

  return useQuery({
    queryKey: ['medidores', estado],
    queryFn: queryFnMap[estado],
  });
};

// Hook para obtener medidores de un afiliado
export const useMedidoresAfiliado = (idAfiliado: number) => {
  return useQuery({
    queryKey: ['medidores', 'afiliado', idAfiliado],
    queryFn: () => getMedidoresAfiliado(idAfiliado),
    enabled: !!idAfiliado,
  });
};

// Hook para crear medidor
export const useCreateMedidor = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useAlerts();
  return useMutation({
    mutationFn: ({ data }: { data: CreateMedidorData;  }) =>
      createMedidor(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medidores'] });
      showSuccess('Éxito', 'Medidor creado correctamente');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Error al crear el medidor';
      showError('Error', errorMessage);
    },
  });
};

// Hook para actualizar estado del medidor
export const useUpdateEstadoMedidor = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useAlerts();

  return useMutation({
    mutationFn: ({ idMedidor, idEstado }: { idMedidor: number; idEstado: number; }) =>
      updateEstadoMedidor(idMedidor, idEstado),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medidores'] });
      showSuccess('Éxito', 'Estado del medidor actualizado correctamente');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Error al actualizar el estado del medidor';
      showError('Error', errorMessage);
    },
  });
};

// Hook para actualizar estado de pago del medidor
export const useUpdateEstadoPagoMedidor = () => {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useAlerts();

  return useMutation({
    mutationFn: ({ idMedidor, estadoPago }: { idMedidor: number; estadoPago: EstadoPagoMedidorNombre }) =>
      updateEstadoPagoMedidor(idMedidor, estadoPago),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medidores'] });
      showSuccess('Éxito', 'Estado de pago actualizado correctamente');
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Error al actualizar el estado de pago del medidor';
      showError('Error', errorMessage);
    },
  });
};
