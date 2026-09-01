import { z } from 'zod';

// Validar apertura de mesa (id_mesa es INT / STRING, opcional nombre_cliente)
export const abrirMesaSchema = z.object({
  id_mesa: z.union([z.number(), z.string()]),
  nombre_cliente: z.string().optional().nullable(),
  tarifa_aplicada: z.union([z.number(), z.string()]).optional()
});

// Validar adición de consumo
export const agregarConsumoSchema = z.object({
  id_sesion: z.union([z.number(), z.string()]),
  id_producto: z.union([z.number(), z.string()]),
  cantidad: z.number().min(1)
});

// Validar cobro de mesa
export const cobrarMesaSchema = z.object({
  id_sesion: z.union([z.number(), z.string()]),
  metodo_pago: z.string().optional()
});



