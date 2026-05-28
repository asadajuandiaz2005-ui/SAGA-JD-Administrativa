export interface Imagen {
  Id_Imagen: number;
  Nombre_Imagen: string;
  Imagen: string;
  Visible: boolean;
  Fecha_Creacion: string;
  Fecha_Actualizacion: string;
}


export const ImagenDefault: Imagen = {
  Id_Imagen: 0,
  Nombre_Imagen: "",
  Imagen: "",
  Visible: false,
  Fecha_Creacion: "",
  Fecha_Actualizacion: "",
};
