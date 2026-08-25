import React, { useState } from 'react';
import { X, Plus, Utensils, Check } from 'lucide-react';

const ModalConsumo = ({ mesa, productos, onClose, onAgregarConsumo, cargando }) => {
  const [productoSeleccionado, setProductoSeleccionado] = useState(productos[0]?.id_producto || '');
  const [cantidad, setCantidad] = useState(1);
  const [mensajeExito, setMensajeExito] = useState('');

  if (!mesa) return null;

  const sesionId = mesa.sesion_activa?.id_sesion;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!productoSeleccionado || !sesionId) return;

    try {
      await onAgregarConsumo({
        id_sesion: sesionId,
        id_producto: Number(productoSeleccionado),
        cantidad: Number(cantidad)
      });
      setMensajeExito('¡Consumo registrado exitosamente!');
      setTimeout(() => {
        setMensajeExito('');
        onClose();
      }, 1500);
    } catch (err) {
      alert(err.response?.data?.error || 'Error al registrar consumo');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/70 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800 bg-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Comanda de Consumo</span>
              <h2 className="text-xl font-black text-white">{mesa.numero}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {mensajeExito && (
            <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl text-sm font-bold flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-400" /> {mensajeExito}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Producto / Bebida / Snack
            </label>
            <select
              value={productoSeleccionado}
              onChange={(e) => setProductoSeleccionado(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-2xl px-4 py-4 text-white font-bold text-base focus:ring-2 focus:ring-amber-500 focus:outline-none cursor-pointer"
            >
              {productos.map((prod) => (
                <option key={prod.id_producto} value={prod.id_producto}>
                  {prod.nombre} ({prod.categoria}) — Bs. {Number(prod.precio_actual).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Cantidad
            </label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                className="w-14 h-14 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-2xl rounded-2xl border border-slate-700 flex items-center justify-center cursor-pointer"
              >
                -
              </button>
              <input
                type="number"
                min="1"
                value={cantidad}
                onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-2xl py-3 text-center text-white font-black text-2xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setCantidad(cantidad + 1)}
                className="w-14 h-14 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-black text-2xl rounded-2xl border border-slate-700 flex items-center justify-center cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-lg uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-amber-950/60 transition cursor-pointer mt-4"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
            AGREGAR COMANDA
          </button>
        </form>

      </div>
    </div>
  );
};

export default ModalConsumo;
