import type { CategoriaMaterial } from "../models/CategoriaMaterial";
import type { Material } from "../models/Material";

// Helper to render material categories
export const MaterialCategories: React.FC<{ categorias: CategoriaMaterial[]; emptyClass?: string; itemClass?: string }> = ({
  categorias,
  emptyClass = "px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full",
  itemClass = "px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
}) => (
  <>
    {categorias && categorias.length > 0 ? (
      categorias.map((categoria) => (
        <span
          key={categoria.Id_Categoria}
          className={itemClass}
        >
          {categoria.Nombre_Categoria}
        </span>
      ))
    ) : (
      <span className={emptyClass}>
        Sin categoría
      </span>
    )}
  </>
);

// Helper to render material info
export const MaterialInfo: React.FC<{ material: Material; showCategories?: boolean; categoriesProps?: any }> = ({
  material,
  showCategories = true,
  categoriesProps = {}
}) => (
  <div className="min-w-0 w-full">
    <p className="text-sm font-medium text-gray-900 break-words">{material.Nombre_Material}</p>
    {showCategories && (
      <div className="flex flex-wrap gap-1 mt-1">
        <MaterialCategories categorias={material.Categorias} {...categoriesProps} />
      </div>
    )}
    <div className="flex items-center gap-2 mt-2">
      <p className="text-xs text-gray-500">
        Stock: {material.Cantidad} {material.Unidad_Medicion.Abreviatura}
      </p>
      <span className={`px-2 py-0.5 text-xs rounded-full ${
        material.Estado_Material.Nombre_Estado_Material === 'Disponible'
          ? 'bg-green-100 text-green-800'
          : 'bg-red-100 text-red-800'
      }`}>
        {material.Estado_Material.Nombre_Estado_Material}
      </span>
    </div>
  </div>
);