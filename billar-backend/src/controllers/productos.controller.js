import { supabase } from '../config/supabase.js';

export class ProductosController {
  async listar(req, res, next) {
    try {
      const { data, error } = await supabase.from('productos').select('*').order('nombre');
      if (error) throw error;
      return res.json(data || []);
    } catch (err) {
      next(err);
    }
  }

  async crear(req, res, next) {
    try {
      const { nombre, precio_actual, stock = 0, categoria = 'Bebidas' } = req.body;
      if (!nombre || precio_actual === undefined) {
        return res.status(400).json({ error: 'Nombre y precio son requeridos', code: 'INVALID_DATA' });
      }
      const { data, error } = await supabase.from('productos').insert([{
        nombre,
        precio_actual: Number(precio_actual),
        stock: Number(stock),
        categoria,
        activo: true
      }]).select('*').single();

      if (error) throw error;
      return res.status(201).json(data);
    } catch (err) {
      next(err);
    }
  }

  async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre, precio_actual, stock, categoria, activo } = req.body;

      const updates = {};
      if (nombre !== undefined) updates.nombre = nombre;
      if (precio_actual !== undefined) updates.precio_actual = Number(precio_actual);
      if (stock !== undefined) updates.stock = Number(stock);
      if (categoria !== undefined) updates.categoria = categoria;
      if (activo !== undefined) updates.activo = Boolean(activo);

      const { data, error } = await supabase
        .from('productos')
        .update(updates)
        .eq('id_producto', id)
        .select('*')
        .single();

      if (error) throw error;
      return res.json(data);
    } catch (err) {
      next(err);
    }
  }

  async eliminar(req, res, next) {
    try {
      const { id } = req.params;
      // Desactivación lógica
      const { error } = await supabase
        .from('productos')
        .update({ activo: false })
        .eq('id_producto', id);

      if (error) throw error;
      return res.json({ mensaje: 'Producto desactivado exitosamente' });
    } catch (err) {
      next(err);
    }
  }
}

export default new ProductosController();
