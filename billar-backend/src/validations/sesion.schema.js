import { z } from 'zod';

// Validar apertura de mesa (id_mesa es INT / SERIAL)
export const abrirMesaSchema = z.object({
  id_mesa: z.number({
    required_error: 'El id_mesa es obligatorio',
    invalid_type_error: 'El id_mesa debe ser un número entero'
  }).int().positive()
});

// Validar adición de consumo (id_sesion es UUID string, id_producto es INT, cantidad INT >= 1)
export const agregarConsumoSchema = z.object({
  id_sesion: z.string({
    required_error: 'El id_sesion es obligatorio',
    invalid_type_error: 'El id_sesion debe ser un UUID válido'
  }).uuid('El id_sesion debe ser un UUID válido'),
  id_producto: z.number({
    required_error: 'El id_producto es obligatorio',
    invalid_type_error: 'El id_producto debe ser un número entero'
  }).int().positive(),
  cantidad: z.number({
    required_error: 'La cantidad es obligatoria',
    invalid_type_error: 'La cantidad debe ser un número entero'
  }).int().min(1, 'La cantidad debe ser al menos 1')
});

// Validar cobro de mesa (id_sesion es UUID string, opcional metodo_pago)
export const cobrarMesaSchema = z.object({
  id_sesion: z.string({
    required_error: 'El id_sesion es obligatorio',
    invalid_type_error: 'El id_sesion debe ser un UUID válido'
  }).uuid('El id_sesion debe ser un UUID válido'),
  metodo_pago: z.string().optional()
});


