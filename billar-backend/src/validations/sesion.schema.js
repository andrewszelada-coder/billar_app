import { z } from 'zod';

// Validar apertura de mesa
export const abrirSesionSchema = z.object({
  id_mesa: z.number({
    required_error: 'El id_mesa es obligatorio',
    invalid_type_error: 'El id_mesa debe ser un número entero'
  }).int().positive()
});

// Validar adición de consumo
export const agregarConsumoSchema = z.object({
  id_sesion: z.number({
    required_error: 'El id_sesion es obligatorio',
    invalid_type_error: 'El id_sesion debe ser un número entero'
  }).int().positive(),
  id_producto: z.number({
    required_error: 'El id_producto es obligatorio',
    invalid_type_error: 'El id_producto debe ser un número entero'
  }).int().positive(),
  cantidad: z.number({
    required_error: 'La cantidad es obligatoria',
    invalid_type_error: 'La cantidad debe ser un número entero'
  }).int().min(1, 'La cantidad debe ser al menos 1')
});

// Validar cobro de sesión
export const cobrarSesionSchema = z.object({
  id_sesion: z.number({
    required_error: 'El id_sesion es obligatorio',
    invalid_type_error: 'El id_sesion debe ser un número entero'
  }).int().positive()
});
