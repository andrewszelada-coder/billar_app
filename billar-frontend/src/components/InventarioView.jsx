import React, { useState } from 'react';
import { crearProducto, actualizarProducto, eliminarProducto } from '../services/api';

const InventarioView = ({ productos, onReload }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProd, setEditingProd] = useState(null);

  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [stock, setStock] = useState('');
  const [categoria, setCategoria] = useState('Bebidas');
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingSave, setLoadingSave] = useState(false);

  const openCreateModal = () => {
    setEditingProd(null);
    setNombre('');
    setPrecio('');
    setStock('10');
    setCategoria('Bebidas');
    setErrorMsg('');
    setModalOpen(true);
  };

  const openEditModal = (prod) => {
    setEditingProd(prod);
    setNombre(prod.nombre);
    setPrecio(prod.precio_actual);
    setStock(prod.stock || 0);
    setCategoria(prod.categoria || 'Bebidas');
    setErrorMsg('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoadingSave(true);

    const payload = {
      nombre,
      precio_actual: Number(precio),
      stock: Number(stock),
      categoria
    };

    try {
      if (editingProd) {
        await actualizarProducto(editingProd.id_producto, payload);
      } else {
        await crearProducto(payload);
      }
      setModalOpen(false);
      onReload();
    } catch (err) {
      console.error('[InventarioView] Error al guardar producto:', err);
      setErrorMsg(err.response?.data?.error || err.message || 'Error al guardar el producto.');
    } finally {
      setLoadingSave(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Seguro que deseas desactivar este producto?')) return;
    try {
      await eliminarProducto(id);
      onReload();
    } catch (err) {
      console.error('[InventarioView] Error al eliminar producto:', err);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-800 dark:text-slate-100">
      {/* Header Módulo Estilo SaaS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white">📦 Gestión de Inventario</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Administra catálogo de productos, precios y control de stock</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-5 py-3 rounded-xl text-sm transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-sm"
        >
          <span>➕</span> Nuevo Producto
        </button>
      </div>

      {/* Tabla de Productos Estilo SaaS Premium */}
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">
                <th className="p-4">Producto</th>
                <th className="p-4">Categoría</th>
                <th className="p-4">Precio Unitario</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 text-sm">
              {productos.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 font-semibold">
                    No hay productos registrados en el inventario.
                  </td>
                </tr>
              ) : (
                productos.map((prod) => (
                  <tr key={prod.id_producto} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/40 transition-colors">
                    <td className="p-4 font-bold text-slate-900 dark:text-white">{prod.nombre}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-300">
                      <span className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg text-xs font-semibold">
                        {prod.categoria || 'General'}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      Bs {Number(prod.precio_actual).toFixed(2)}
                    </td>
                    <td className="p-4 font-semibold text-slate-700 dark:text-slate-200">{prod.stock ?? 'N/A'}</td>
                    <td className="p-4">
                      {prod.activo !== false ? (
                        <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                          Activo
                        </span>
                      ) : (
                        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-900 text-slate-500 border border-slate-300 dark:border-slate-700 px-2.5 py-1 rounded-full">
                          Inactivo
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(prod)}
                        className="bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer border border-slate-200 dark:border-slate-600"
                      >
                        ✏️ Editar
                      </button>
                      <button
                        onClick={() => handleDelete(prod.id_producto)}
                        className="bg-red-50 dark:bg-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer border border-red-200 dark:border-red-800"
                      >
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD Producto */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 text-slate-800 dark:text-slate-100 relative">
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-700 rounded-full w-8 h-8 flex items-center justify-center font-bold"
            >
              ✕
            </button>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              {editingProd ? 'Editar Producto' : 'Crear Producto'}
            </h2>

            {errorMsg && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-200 text-xs p-3 rounded-xl font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑ\s.\-]*$/.test(val) && val.length <= 25) {
                      setNombre(val);
                    }
                  }}
                  maxLength={25}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Precio (Bs)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={precio}
                    onChange={(e) => setPrecio(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 text-base"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Stock</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 text-base"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Categoría</label>
                <input
                  type="text"
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3 text-base"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingSave}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl disabled:opacity-50"
                >
                  {loadingSave ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventarioView;
