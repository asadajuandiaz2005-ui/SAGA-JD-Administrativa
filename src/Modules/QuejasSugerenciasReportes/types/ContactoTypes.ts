// src/Modules/QuejasSugerenciasReportes/types/ContactoTypes.ts

export type TipoContacto = 'Queja' | 'Sugerencia' | 'Reporte';
export type EstadoContacto = 'Pendiente' | 'Contestado' | 'Archivado';

export interface ContactoFilterOptions {
  tipo?: TipoContacto;
  estado?: EstadoContacto;
  fechaInicio?: string;
  fechaFin?: string;
  conAdjunto?: boolean;
}

export interface FilterContactoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: ContactoFilterOptions) => void;
  currentFilters: ContactoFilterOptions;
}

export interface ContactoItem {
  id: number;
  tipo: TipoContacto;
  nombre?: string;
  primerApellido?: string;
  segundoApellido?: string;
  ubicacion?: string;
  mensaje: string;
  correo?: string;
  fechaCreacion: Date | string | null;
  estado?: string
  adjunto?: string | null;
  _timestamp?: number;
  _searchString?: string;
  _nombreCompleto?: string;
}
export const ESTADO_IDS = {
  PENDIENTE: 1,
  CONTESTADO: 2,
  ARCHIVADO: 3,
};