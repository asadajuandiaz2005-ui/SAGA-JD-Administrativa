import { z } from 'zod'
import { parsePhoneNumberFromString } from 'libphonenumber-js'

// Esquema base para campos comunes
const BaseAfiliadoSchema = z.object({
  Correo: z.string()
    .min(1, 'El correo no puede estar vacío')
    .max(100, 'El correo no puede tener más de 100 caracteres')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'El formato del correo electrónico no es válido'),

  Numero_Telefono: z.string()
    .min(1, 'El número de teléfono no puede estar vacío')
    .refine(
      (phone) => {
        const phoneNumber = parsePhoneNumberFromString(phone);
        return !!phoneNumber && phoneNumber.isValid();
      },
      { message: "Número de teléfono inválido" }
    ),

  Direccion_Exacta: z.string()
    .min(10, 'La dirección debe tener al menos 10 caracteres')
    .max(255, 'La dirección no puede tener más de 255 caracteres')
    .regex(/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.,#-]+$/, 'La dirección solo puede contener letras, números, espacios y los caracteres .,-#'),
});

export const AfiliadoFisicoSchema = BaseAfiliadoSchema.extend({
  Tipo_Identificacion: z.enum(['Cedula Nacional', 'DIMEX', 'Pasaporte'], {
    errorMap: () => ({ message: 'El tipo de identificación debe ser uno de los siguientes: Cedula Nacional, DIMEX, Pasaporte' })
  }),

  Identificacion: z.string()
    .min(1, 'La identificación no puede estar vacía'),

  Nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),

  Apellido1: z.string()
    .min(2, 'El primer apellido debe tener al menos 2 caracteres')
    .max(50, 'El primer apellido no puede tener más de 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El primer apellido solo puede contener letras y espacios'),

  Apellido2: z.string()
    .max(50, 'El segundo apellido no puede tener más de 50 caracteres')
    .optional(),

  Edad: z.coerce.number()
    .min(18, 'La edad mínima es 18 años')
    .max(120, 'La edad máxima es 120 años'),

  Planos_Terreno: z.union([z.instanceof(File), z.string()]).optional(),
  Certificacion_Literal: z.union([z.instanceof(File), z.string()]).optional(),
}).refine((data) => {
  const { Tipo_Identificacion, Identificacion } = data;

  if (Tipo_Identificacion === 'Cedula Nacional') {
    return /^\d{9,10}$/.test(Identificacion);
  } else if (Tipo_Identificacion === 'DIMEX') {
    return /^\d{11,12}$/.test(Identificacion);
  } else if (Tipo_Identificacion === 'Pasaporte') {
    return /^[a-zA-Z0-9]{6,20}$/.test(Identificacion);
  }
  return true;
}, (data) => {
  const { Tipo_Identificacion } = data;

  if (Tipo_Identificacion === 'Cedula Nacional') {
    return { message: 'La cédula nacional debe tener entre 9 y 10 dígitos', path: ['Identificacion'] };
  } else if (Tipo_Identificacion === 'DIMEX') {
    return { message: 'El DIMEX debe tener entre 11 y 12 dígitos', path: ['Identificacion'] };
  } else if (Tipo_Identificacion === 'Pasaporte') {
    return { message: 'El pasaporte debe tener entre 6 y 20 caracteres alfanuméricos', path: ['Identificacion'] };
  }
  return { message: 'Número de identificación no válido', path: ['Identificacion'] };
})

// Schema para edición (campos de identificación no editables y archivos opcionales)
export const AfiliadoFisicoEditSchema = BaseAfiliadoSchema.extend({
  Tipo_Identificacion: z.enum(['Cedula Nacional', 'DIMEX', 'Pasaporte'], {
    errorMap: () => ({ message: 'El tipo de identificación debe ser uno de los siguientes: Cedula Nacional, DIMEX, Pasaporte' })
  }),

  Nombre: z.string()
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(50, 'El nombre no puede tener más de 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios'),

  Apellido1: z.string()
    .min(2, 'El primer apellido debe tener al menos 2 caracteres')
    .max(50, 'El primer apellido no puede tener más de 50 caracteres')
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El primer apellido solo puede contener letras y espacios'),

  Apellido2: z.string()
    .max(50, 'El segundo apellido no puede tener más de 50 caracteres')
    .optional(),

  Edad: z.coerce.number()
    .min(18, 'La edad mínima es 18 años')
    .max(90, 'La edad máxima es 90 años'),

  // Archivos opcionales en edición
  Planos_Terreno: z.union([z.instanceof(File), z.string()]).optional(),
  Certificacion_Literal: z.union([z.instanceof(File), z.string()]).optional(),
});

export type AfiliadoFisico = z.infer<typeof AfiliadoFisicoSchema>
export type AfiliadoFisicoEdit = z.infer<typeof AfiliadoFisicoEditSchema>