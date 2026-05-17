import z from 'zod';

export const ForgotPasswordSchema = z.object({
  email: z.string()
    .min(1, "El correo electrónico es requerido")
    .max(100)
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "El correo electrónico no es válido"),
});

export type ForgotPasswordData = z.infer<typeof ForgotPasswordSchema>;