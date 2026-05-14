import { Home } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LuTags, LuActivity, LuRuler, LuPackage, LuShield } from 'react-icons/lu';
import { FaBoxes, FaUsers, FaTruck, FaUserFriends, FaBook,FaClipboardList, FaHandHoldingWater, FaRegQuestionCircle, FaEdit, FaImage, FaHistory, FaTachometerAlt, FaFileInvoiceDollar } from 'react-icons/fa';
import { MdOutlineReportGmailerrorred } from "react-icons/md";
import { GrHelpBook } from "react-icons/gr";
import { IoDocumentTextOutline } from 'react-icons/io5';


export interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: LucideIcon;
}

interface BreadcrumbConfig {
  [key: string]: {
    label: string;
    icon?: LucideIcon ;
  };
}

// Configuración de nombres personalizados para cada ruta
export const breadcrumbConfig: BreadcrumbConfig = {
  // Home
  '/Home': {
    label: 'Inicio',
    icon: Home,
  },
  
  // Gestión
  '/Usuarios': {
    label: 'Gestión de Usuarios',
    icon: FaUsers as LucideIcon,
  },
  '/Afiliados': {
    label: 'Gestión de Afiliados',
    icon: FaUserFriends as LucideIcon,
  },
  '/Inventario': {
    label: 'Inventario',
    icon: FaBoxes as LucideIcon,
  },
  '/Actas': {
    label: 'Gestión de Actas',
    icon: FaBook as LucideIcon,
  },
  '/CalidadAgua': {
    label: 'Calidad de Agua',
    icon: FaHandHoldingWater as LucideIcon,
  },

  '/Contacto': {
    label: 'Quejas/Sugerencias/Reportes',
    icon: MdOutlineReportGmailerrorred as LucideIcon,
  },
  '/Solicitudes': {
    label: 'Revisión de Solicitudes',
    icon: FaClipboardList as LucideIcon,
  },
  '/Proveedores': {
    label: 'Gestión de Proveedores',
    icon: FaTruck as LucideIcon,
  },
  
  // Seguridad
  '/Auditoria': {
    label: 'Control de Auditoría',
    icon:   FaHistory as LucideIcon,
  },
  
  // Edición
  '/FAQ': {
    label: 'Preguntas Frecuentes',
    icon: FaRegQuestionCircle as LucideIcon,
  },
  '/Proyectos': {
    label: 'Edición de Proyectos',
    icon: FaEdit as LucideIcon,
  },
  '/Imagenes': {
    label: 'Edición de Imágenes',
    icon: FaImage as LucideIcon,
  },
  
  // Ayuda
  '/Manuales': {
    label: 'Manuales de Uso',
    icon: GrHelpBook as LucideIcon,
  },
  
  //sub-ruta de Usuarios
    '/Usuarios/Roles': {
    label: 'Gestión de Roles',
    icon: LuShield as LucideIcon,
  },

  // Sub-rutas de Inventario
  '/Inventario/Materiales': {
    label: 'Catálogo de Materiales',
    icon: LuPackage as LucideIcon,
  },
  '/Inventario/Categorias': {
    label: 'Categorías',
    icon: LuTags as LucideIcon,
  },
  '/Inventario/UnidadesMedicion': {
    label: 'Unidades de Medición',
    icon: LuRuler as LucideIcon,
  },
  '/Inventario/Movimientos': {
    label: 'Movimientos de Inventario',
    icon: LuActivity as LucideIcon,
  },

  '/Inventario/Materiales/Medidores': {
    label: 'Gestión de Medidores',
    icon: FaTachometerAlt as LucideIcon,
  },

  // Sub-ruta de Afiliados
  '/Afiliados/Lecturas': {
    label: 'Gestión de Lecturas',
    icon: IoDocumentTextOutline as LucideIcon,
  },

  '/Afiliados/Facturas': {
    label: 'Gestión de Facturas',
    icon: FaFileInvoiceDollar as LucideIcon,
  },

};

/**
 * Genera los breadcrumbs basándose en la ruta actual
 * @param pathname - La ruta actual (ejemplo: /inventario/materiales)
 * @returns Array de BreadcrumbItem
 */
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  // Siempre incluir Home
  const breadcrumbs: BreadcrumbItem[] = [
    {
      label: 'Inicio',
      path: '/Home',
      icon: Home,
    },
  ];

  // Si estamos en home, retornar array vacío (no mostrar breadcrumb)
  if (pathname === '/Home' || pathname === '/' || pathname === '') {
    return [];
  }

  // Limpiar la ruta y dividirla en segmentos
  const segments = pathname.split('/').filter(segment => segment !== '');
  
  // Construir breadcrumbs acumulativos
  let currentPath = '';
  
  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    
    // Buscar configuración para esta ruta
    const config = breadcrumbConfig[currentPath];
    
    if (config) {
      breadcrumbs.push({
        label: config.label,
        path: currentPath,
        icon: config.icon,
      });
    } else {
      // Si no hay configuración, usar el segmento formateado
      breadcrumbs.push({
        label: formatSegment(segment),
        path: currentPath,
      });
    }
  });

  return breadcrumbs;
}

/**
 * Formatea un segmento de URL en un label legible
 * @param segment - Segmento de URL (ejemplo: "calidad-agua")
 * @returns Label formateado (ejemplo: "Calidad Agua")
 */
function formatSegment(segment: string): string {
  return segment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
