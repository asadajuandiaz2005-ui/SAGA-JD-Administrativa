import apiAuth from '@/Api/apiAuth';
import type { ProveedorFisico, CreateProveedorData, UpdateProveedorData } from '../Models/TablaProveedo/tablaFisicoProveedor';

// Función para obtener todos los proveedores físicos
export const getProveedoresFisicos = async (): Promise<ProveedorFisico[]> => {
  try {
    const response = await apiAuth.get('/Proveedores/fisico/');
    return response.data;
  } catch (error) {
    console.error('Error al obtener proveedores físicos:', error);
    throw error;
  }
};

// Función para crear un proveedor físico
export const createProveedorFisico = async (proveedor: CreateProveedorData): Promise<ProveedorFisico> => {
  try {
    const response = await apiAuth.post('/Proveedores/fisico/create', proveedor);
    return response.data;
  } catch (error) {
    console.error('Error al crear proveedor físico:', error);
    throw error;
  }
};

// Función para obtener un proveedor físico por ID
export const getProveedorFisicoById = async (id: number): Promise<ProveedorFisico> => {
  try {
    const response = await apiAuth.get(`/Proveedores/fisico/${id}`);
    return response.data;
  } catch (error) {
    console.error('Error al obtener proveedor físico por ID:', error);
    throw error;
  }
};

// Función para actualizar un proveedor físico
export const updateProveedorFisico = async (id: number, proveedor: UpdateProveedorData): Promise<ProveedorFisico> => {
  try {
    const response = await apiAuth.put(`/Proveedores/fisico/${id}`, proveedor);
    return response.data;
  } catch (error) {
    console.error('Error al actualizar proveedor físico:', error);
    throw error;
  }
};

// Función para eliminar un proveedor físico
export const deleteProveedorFisico = async (id: number): Promise<void> => {
  try {
    await apiAuth.delete(`/Proveedores/fisico/${id}`);
  } catch (error) {
    console.error(`❌ Error al eliminar proveedor físico ID: ${id}`, error);
    throw error;
  }
};

// Función para cambiar el estado de un proveedor físico
export const changeProveedorFisicoStatus = async (id: number, nuevoEstado: number): Promise<ProveedorFisico> => {
  try {
    const response = await apiAuth.patch(`/Proveedores/Fisico/${id}/estado`, { 
      Id_Estado_Proveedor: nuevoEstado 
    });
    return response.data;
  } catch (error) {
    console.error(`❌ Error al cambiar estado del proveedor físico ID: ${id}`, error);
    throw error;
  }
};

