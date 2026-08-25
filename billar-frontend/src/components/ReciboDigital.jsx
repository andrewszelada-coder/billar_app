import React from 'react';
import { CheckCircle2, Receipt, Clock, ShoppingCart, DollarSign } from 'lucide-react';

const ReciboDigital = ({ resumen, onClose }) => {
  if (!resumen) return null;

  const totalTiempo = Number(resumen.total_tiempo || 0);
  const totalConsumos = Number(resumen.total_consumos || 0);
  const totalPagar = Number(resumen.total_pagar || (totalTiempo + totalConsumos));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/75 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-6 text-slate-100 shadow-2xl space-y-6">
        
        {/* Header Ticket */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/40">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <h3 className="text-2xl font-black text-white">¡Cobro Exitoso!</h3>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Recibo Digital — BilliardOS
          </p>
        </div>

        {/* Formato Recibo / Ticket Digital */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 font-mono text-sm shadow-inner">
          <div className="flex justify-between items-center border-b border-slate-800/80 pb-3 text-xs text-slate-400">
            <span>DETALLE CUENTA</span>
            <span className="uppercase font-bold text-emerald-400">{resumen.estado || 'FINALIZADA'}</span>
          </div>

          <div className="space-y-2.5">
            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-2 font-sans text-xs">
                <Clock className="w-4 h-4 text-slate-400" /> Tiempo ({resumen.minutos_jugados || 0} min)
              </span>
              <span className="font-bold text-slate-200">Bs. {totalTiempo.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-300">
              <span className="flex items-center gap-2 font-sans text-xs">
                <ShoppingCart className="w-4 h-4 text-slate-400" /> Consumos / Snacks
              </span>
              <span className="font-bold text-amber-400">Bs. {totalConsumos.toFixed(2)}</span>
            </div>
          </div>

          {/* Gran Total Destacado */}
          <div className="border-t-2 border-dashed border-slate-700 pt-4 mt-4 flex justify-between items-baseline">
            <span className="font-sans font-black text-sm text-slate-400 uppercase tracking-wider">
              TOTAL PAGADO
            </span>
            <span className="font-black text-3xl text-emerald-400 tracking-tight">
              Bs. {totalPagar.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Botón Cierre Recibo */}
        <button
          onClick={onClose}
          className="w-full py-4 text-lg bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black rounded-2xl uppercase tracking-wider shadow-xl shadow-emerald-950/60 transition cursor-pointer"
        >
          ACEPTAR Y CERRA DE MESA
        </button>

      </div>
    </div>
  );
};

export default ReciboDigital;
