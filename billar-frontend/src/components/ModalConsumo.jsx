import React, { useState, useEffect } from 'react';

const ModalConsumo = ({ mesa = {}, productos = [], onClose, onConfirm }) => {
  const safeProductos = Array.isArray(productos) ? productos : [];
  const [selectedProductoId, setSelectedProductoId] = useState(safeProductos[0]?.id_producto || '');
  const [cantidad, setCantidad] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    if (safeProductos.length > 0 && (!selectedProductoId || !safeProductos.some(p => String(p.id_producto) === String(selectedProductoId)))) {
      setSelectedProductoId(safeProductos[0].id_producto);
    }
  }, [safeProductos, selectedProductoId]);

  const effectiveProductoId = selectedProductoId || safeProductos[0]?.id_producto;

  const productoSeleccionado = safeProductos.find(
    (p) => String(p?.id_producto) === String(effectiveProductoId)
  );

  const subtotal = productoSeleccionado
    ? (Number(productoSeleccionado.precio_actual || 0) * Number(cantidad || 1)).toFixed(2)
    : '0.00';

  const handleSubmit = async (e) => {
    e.preventDefault();
    const activeSesionId = mesa?.sesion_activa?.id_sesion || mesa?.id_sesion;
    const finalProductoId = effectiveProductoId;

    if (!activeSesionId || !finalProductoId || !cantidad) {
      setErrorMsg('No se pudo identificar la sesión activa o el producto seleccionado');
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      await onConfirm?.({
        id_sesion: activeSesionId,
        id_producto: String(finalProductoId).trim(),
        cantidad: Number(cantidad)
      });
      onClose?.();
    } catch (err) {
      console.error('[ModalConsumo] Error al agregar consumo:', err);
      const msg = err?.response?.data?.error || err?.message || 'Error al registrar consumo';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-6 text-slate-800 dark:text-slate-100 relative">
        {/* Botón X de Cierre Obligatorio */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white bg-slate-100 dark:bg-slate-700 rounded-full w-9 h-9 flex items-center justify-center font-bold text-lg cursor-pointer transition-colors"
          title="Cerrar modal"
        >
          ✕
        </button>

        {/* Encabezado */}
        <div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Añadir Consumo a {mesa?.numero ?? `Mesa ${mesa?.id_mesa ?? ''}`}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Carga productos directamente a la cuenta activa</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3.5 rounded-xl text-sm font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Seleccionar Producto</label>
            <select
              value={effectiveProductoId || ''}
              onChange={(e) => setSelectedProductoId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl p-3.5 focus:outline-hidden focus:border-slate-500 text-base"
            >
              {safeProductos.length === 0 && <option value="">Sin productos disponibles</option>}
              {safeProductos.map((prod) => (
                <option key={prod.id_producto} value={prod.id_producto}>
                  {prod?.nombre ?? 'Producto'} - Bs {Number(prod?.precio_actual ?? 0).toFixed(2)} (Stock: {prod?.stock ?? 'N/A'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Cantidad</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold w-12 h-12 rounded-xl text-xl cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-center font-extrabold text-slate-900 dark:text-white rounded-xl p-3 text-xl focus:outline-hidden"
              />
              <button
                type="button"
                onClick={() => setCantidad(cantidad + 1)}
                className="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white font-bold w-12 h-12 rounded-xl text-xl cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Subtotal */}
          <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl p-4 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">Subtotal del consumo:</span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">Bs {subtotal}</span>
          </div>

          {/* Acciones */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-base transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedProductoId}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl text-base transition-colors cursor-pointer shadow-md disabled:opacity-50"
            >
              {loading ? 'Guardando...' : 'Cargar a la Cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalConsumo;
