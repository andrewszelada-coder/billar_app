const { z } = require('zod');

// Validación para abrir sesión de mesa
const abrirSesionSchema = z.object({
  mesa_id: z.number({
    required_error: 'El ID de la mesa es obligatorio',
    invalid_type_error: 'El ID de la mesa debe ser un número'
  }).int().positive()
});

// Validación para agregar consumo
const agregarConsumoSchema = z.object({
  sesion_id: z.number().int().positive(),
  producto_id: z.number().int().positive(),
  cantidad: z.number().int().min(1, 'La cantidad debe ser al menos 1')
});

// Validación para calcular o cerrar sesión
const cerrarSesionSchema = z.object({
  sesion_id: z.number({
    required_error: 'El ID de la sesión es obligatorio'
  }).int().positive()
});

module.exports = {
  abrirSesionSchema,
  agregarConsumoSchema,
  cerrarSesionSchema
};
