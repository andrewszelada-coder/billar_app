import React, { useState } from 'react';

const ModalCobro = ({ mesa = {}, resumenCobro = {}, onClose, onConfirmCheckout }) => {
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const handleProcessCheckout = async () => {
    if (!onConfirmCheckout || !mesa) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      await onConfirmCheckout(mesa, metodoPago);
    } catch (err) {
      console.error('[ModalCobro] Error al procesar cobro:', err);
      const msg = err?.response?.data?.error || err?.message || 'Error de red al procesar el cobro';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const listaConsumos = (Array.isArray(resumenCobro?.consumos) && resumenCobro.consumos.length > 0)
    ? resumenCobro.consumos
    : (Array.isArray(mesa?.sesion_activa?.consumos) ? mesa.sesion_activa.consumos : []);

  const totalConsumosCalculados = (listaConsumos || []).reduce((acc, c) => acc + Number(c.subtotal || 0), 0);
  const totalConsumos = Math.max(0, Number(resumenCobro?.total_consumos ?? totalConsumosCalculados));
  const minutosJugados = Math.max(0, Number(resumenCobro?.minutos_jugados ?? 0));
  const totalTiempo = Math.max(0, Number(resumenCobro?.total_tiempo ?? 0));
  const totalPagar = Math.max(0, Number(resumenCobro?.total_pagar ?? (totalTiempo + totalConsumos)));
  const tarifaHora = Number(mesa?.tarifa_hora ?? 20);

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

        {/* Header Recibo */}
        <div className="border-b border-slate-100 dark:border-slate-700 pb-3">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">Ticket / Recibo - {mesa?.numero ?? `Mesa ${mesa?.id_mesa ?? ''}`}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Detalle de liquidación de tiempo y consumos</p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3.5 rounded-xl text-sm font-semibold flex items-center gap-2">
            <span>⚠️</span>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Detalle Ticket Digital Super Limpio */}
        <div className="space-y-3 bg-slate-50 dark:bg-slate-900/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 text-sm">
          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span>Tiempo Jugado Total:</span>
            <span className="font-bold font-mono text-slate-900 dark:text-white text-base">
              {minutosJugados} min
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
            <span>Cobro por Tiempo (Bs {tarifaHora}/hr):</span>
            <span className="font-bold font-mono text-slate-900 dark:text-white text-base">
              Bs {totalTiempo.toFixed(2)}
            </span>
          </div>

          {totalTiempo === 0 && minutosJugados > 0 && (
            <div className="text-xs text-amber-700 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 p-2 rounded-lg text-center">
              ✓ Minutos de Gracia Aplicados (Costo de tiempo = Bs 0.00)
            </div>
          )}

          <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 border-t border-slate-200 dark:border-slate-800 pt-2">
            <span>Total Consumos Productos:</span>
            <span className="font-bold font-mono text-slate-900 dark:text-white text-base">
              Bs {totalConsumos.toFixed(2)}
            </span>
          </div>

          {/* Desglose de Consumos */}
          {Array.isArray(listaConsumos) && listaConsumos.length > 0 && (
            <div className="mt-2 space-y-1.5 border-t border-slate-200 dark:border-slate-800/80 pt-2 text-xs">
              <span className="font-bold text-slate-400 block uppercase">Detalle de Productos:</span>
              {listaConsumos.map((item, idx) => {
                const nombreProd = item?.nombre_producto || item?.productos?.nombre || 'Producto';
                const cant = item?.cantidad ?? 1;
                const sub = Number(item?.subtotal ?? 0);
                return (
                  <div key={item?.id_consumo || idx} className="flex justify-between text-slate-600 dark:text-slate-300">
                    <span>{cant}x {nombreProd}</span>
                    <span className="font-mono">Bs {sub.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-between items-center border-t border-slate-300 dark:border-slate-700 pt-3 text-lg font-black text-slate-900 dark:text-white">
            <span>TOTAL A PAGAR:</span>
            <span className="text-2xl font-mono text-emerald-600 dark:text-emerald-400">
              Bs {totalPagar.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Métodos de Pago: Exclusivamente EFECTIVO y TRANSFERENCIA */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Método de Pago</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMetodoPago('EFECTIVO')}
              className={`py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all cursor-pointer border flex items-center justify-center gap-2 ${
                metodoPago === 'EFECTIVO'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="text-lg">💵</span>
              <span>Efectivo</span>
            </button>

            <button
              type="button"
              onClick={() => setMetodoPago('TRANSFERENCIA')}
              className={`py-3.5 rounded-xl font-bold text-sm tracking-wide transition-all cursor-pointer border flex items-center justify-center gap-2 ${
                metodoPago === 'TRANSFERENCIA'
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span className="text-lg">📱</span>
              <span>Transferencia</span>
            </button>
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/80">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 font-bold rounded-xl text-base transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleProcessCheckout}
            disabled={loading}
            className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white font-extrabold rounded-xl text-base transition-colors cursor-pointer shadow-md disabled:opacity-50"
          >
            {loading ? 'Procesando...' : 'Confirmar Cobro y Liberar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalCobro;
