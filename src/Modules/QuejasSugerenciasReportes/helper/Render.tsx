import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ContactoItem } from "../types/ContactoTypes";

interface ArchiveConfig {
  onArchiveClick: (item: ContactoItem) => void;
  hasViewPermission: boolean;
  hasEditPermission: boolean;
}


export const renderTipoCell = (item: ContactoItem) => {
  let colorClass = '';
  switch (item.tipo) {
    case 'Queja':
      colorClass = 'bg-red-100 text-red-700 font-medium';
      break;
    case 'Sugerencia':
      colorClass = 'bg-yellow-100 text-yellow-700 font-medium';
      break;
    case 'Reporte':
      colorClass = 'bg-blue-100 text-blue-700 font-medium';
      break;
  }

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-full text-[7px] sm:text-xs whitespace-nowrap ${colorClass}`}>
      {item.tipo}
    </span>
  );
};

export const renderPersonaCell = (item: ContactoItem) => {
  const nombreCompleto = item._nombreCompleto || [item.nombre, item.primerApellido, item.segundoApellido]
    .filter(Boolean)
    .join(' ');

  if (!nombreCompleto) {
    return <span className="text-[7px] sm:text-sm text-gray-400 italic font-medium whitespace-nowrap">Anónimo</span>;
  }

  const truncatedMobile = nombreCompleto.length > 15 ? nombreCompleto.substring(0, 15) + '...' : nombreCompleto;

  return (
    <div title={nombreCompleto} className="font-medium whitespace-nowrap text-gray-700">
      <span className="hidden sm:inline text-sm">{nombreCompleto}</span>
      <span className="sm:hidden text-[7px]">{truncatedMobile}</span>
    </div>
  );
};

export const renderMensajeCell = (mensaje?: string) => {
  if (!mensaje) return <span className="text-[7px] sm:text-sm text-gray-400">-</span>;
  const truncatedDesktop = mensaje.length > 50 ? mensaje.substring(0, 50) + '...' : mensaje;
  const truncatedMobile = mensaje.length > 15 ? mensaje.substring(0, 15) + '...' : mensaje;
  return (
    <div title={mensaje}>
      <span className="hidden sm:inline text-sm text-gray-700">{truncatedDesktop}</span>
      <span className="sm:hidden text-[7px] text-gray-700">{truncatedMobile}</span>
    </div>
  );
};

export const renderEstadoCell = (item: ContactoItem) => {
  if (!item.estado) return <span className="text-[7px] sm:text-sm text-gray-400">-</span>;

  let badgeClass = '';
  switch (item.estado) {
    case 'Pendiente':
      badgeClass = 'bg-yellow-100 text-yellow-700 border border-yellow-300';
      break;
    case 'Contestado':
      badgeClass = 'bg-green-100 text-green-700 border border-green-300';
      break;
    case 'Archivado':
      badgeClass = 'bg-red-100 text-red-700 border border-red-300'; 
      break;
    default:
      badgeClass = 'bg-gray-100 text-gray-700 border border-gray-300';
  }

  return (
    <span className={`px-2 py-0.5 sm:px-3 sm:py-1 text-[7px] sm:text-xs rounded-full font-semibold whitespace-nowrap ${badgeClass}`}>
      {item.estado}
    </span>
  );
};

export const renderFechaCell = (fecha?: Date | string | null) => {
  if (!fecha) return <span className="text-[7px] sm:text-sm">N/A</span>;
  const fechaObj = new Date(fecha);
  return (
    <span className="text-[7px] sm:text-sm text-gray-700 whitespace-nowrap">
      {format(fechaObj, 'dd/MM/yyyy', { locale: es })}
    </span>
  );
};



export const renderAccionesCell = (item: ContactoItem, config: ArchiveConfig) => {
  const { 
    onArchiveClick,
    hasViewPermission,
    hasEditPermission
  } = config;
  
  const isArchived = item.estado === 'Archivado';
  
  const actionText = isArchived ? 'Desarchivar' : 'Archivar';
  const actionColor = isArchived ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700';
  const actionTitle = isArchived ? `Desarchivar ${item.tipo}` : `Archivar ${item.tipo}`;

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {hasViewPermission && (
        <button
          className="px-1 sm:px-4 py-0.5 sm:py-1.5 bg-gray-600 text-white text-[7px] sm:text-xs rounded hover:bg-gray-700 transition-colors whitespace-nowrap"
          title="Ver detalles"
          onClick={() => window.dispatchEvent(new CustomEvent('openContactoDetail', { detail: item }))}
        >
          Ver
        </button>
      )}
      {/* El botón Responder solo se muestra si NO está archivado */}
      {hasEditPermission && !isArchived && item.estado === 'Pendiente' && ( 
        <button
          className="px-1 sm:px-4 py-0.5 sm:py-1.5 bg-blue-600 text-white text-[7px] sm:text-xs rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
          title="Responder"
          onClick={() => window.dispatchEvent(new CustomEvent('openContactoResponder', { detail: item }))}
        >
          Responder
        </button>
      )}
      {hasEditPermission && (item.estado === 'Contestado' || item.estado === 'Archivado') && (
        <button
          type="button"
          onClick={() => onArchiveClick(item)}
          className={`px-1 sm:px-4 py-0.5 sm:py-1.5 text-white text-[7px] sm:text-xs rounded transition-colors whitespace-nowrap ${actionColor}`}
          title={actionTitle}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};