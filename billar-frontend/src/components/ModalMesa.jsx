import React, { useState } from 'react';
import { X, Plus, DollarSign, ShoppingBag, Check } from 'lucide-react';

const ModalMesa = ({ mesa, productos, onClose, onAgregarConsumo, onCobrar, cargando }) => {
  const [productoSeleccionado, setProductoSeleccionado] = useState(productos[0]?.id_producto || '');
  const [cantidad, setCantidad] = useState(1);
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [mensajeConsumo, setMensajeConsumo] = useState('');

  if (!mesa) return null;

  const sesionId = mesa.sesion_activa?.id_sesion;

  const handleConsumoSubmit = async (e) => {
    e.preventDefault();
    if (!productoSeleccionado || !sesionId) return;

    try {
      await onAgregarConsumo({
        id_sesion: sesionId,
        id_producto: Number(productoSeleccionado),
        cantidad: Number(cantidad)
      });
      setMensajeConsumo('¡Consumo agregado correctamente!');
      setTimeout(() => setMensajeConsumo(''), 3000);
      setCantidad(1);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al agregar consumo');
    }
  };

  const handleCobrarSubmit = () => {
    if (!sesionId) return;
    onCobrar({ id_sesion: sesionId, metodo_pago: metodoPago });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800 bg-slate-800/50">
          <div>
            <span className="text-xs uppercase tracking-widest text-red-400 font-bold">Mesa en Juego</span>
            <h2 className="text-2xl font-black">{mesa.numero} ({mesa.tipo})</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          
          {/* SECCIÓN 1: Agregar Consumo */}
          <div className="bg-slate-800/60 border border-slate-700/60 p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="w-5 h-5 text-amber-400" />
              <h3 className="font-bold text-lg text-slate-200">Registrar Consumo</h3>
            </div>

            {mensajeConsumo && (
              <div className="mb-3 p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-sm font-semibold flex items-center gap-2">
                <Check className="w-4 h-4" /> {mensajeConsumo}
              </div>
            )}

            <form onSubmit={handleConsumoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                  Seleccionar Producto
                </label>
                <select
                  value={productoSeleccionado}
                  onChange={(e) => setProductoSeleccionado(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                >
                  {productos.map((prod) => (
                    <option key={prod.id_producto} value={prod.id_producto}>
                      {prod.nombre} - Bs. {Number(prod.precio_actual).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 items-end">
                <div className="w-1/3">
                  <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-bold text-center focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={cargando}
                  className="w-2/3 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-amber-950/40"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                  Agregar Consumo
                </button>
              </div>
            </form>
          </div>

          {/* SECCIÓN 2: Finalizar y Cobrar */}
          <div className="bg-red-950/30 border border-red-900/40 p-5 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-red-400" />
              <h3 className="font-bold text-lg text-slate-200">Cobrar y Liberar Mesa</h3>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              El sistema calculará el costo de tiempo (gratis si es &le; 3 min) más la suma de consumos registrados.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
                Método de Pago
              </label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white font-medium focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                <option value="EFECTIVO">Efectivo</option>
                <option value="QR">Transferencia QR</option>
                <option value="TARJETA">Tarjeta de Débito / Crédito</option>
              </select>
            </div>

            <button
              onClick={handleCobrarSubmit}
              disabled={cargando}
              className="w-full py-4 bg-red-600 hover:bg-red-500 active:scale-95 text-white font-black rounded-xl uppercase tracking-wider text-base flex items-center justify-center gap-2 shadow-xl shadow-red-950/60 transition"
            >
              <DollarSign className="w-6 h-6" />
              Cobrar Mesa Ahora
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ModalMesa;
