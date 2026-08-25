import React, { useState } from 'react';
import { X, Banknote, CreditCard, QrCode } from 'lucide-react';

const ModalCobro = ({ mesa, onClose, onCobrar, cargando }) => {
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');

  if (!mesa) return null;

  const sesionId = mesa.sesion_activa?.id_sesion;

  const handleCobrarSubmit = () => {
    if (!sesionId) return;
    onCobrar({ id_sesion: sesionId, metodo_pago: metodoPago });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-black/70 animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header Modal */}
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-800 bg-rose-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400">
              <Banknote className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400">Facturación & Cierre</span>
              <h2 className="text-xl font-black text-white">{mesa.numero} ({mesa.tipo})</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-6 space-y-6">
          <div className="text-center space-y-1 bg-slate-800/50 p-4 rounded-2xl border border-slate-700/50">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Sesión Activa
            </span>
            <div className="font-mono text-sm text-slate-300">
              ID: {sesionId ? `${sesionId.substring(0, 8)}...` : 'N/A'}
            </div>
          </div>

          {/* Selección de Método de Pago Touch */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Seleccionar Método de Pago
            </label>
            
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setMetodoPago('EFECTIVO')}
                className={`py-3.5 px-2 rounded-2xl font-black text-xs uppercase tracking-wider border flex flex-col items-center gap-2 transition cursor-pointer ${
                  metodoPago === 'EFECTIVO'
                    ? 'bg-rose-500 text-white border-rose-400 ring-2 ring-rose-500/50 shadow-lg shadow-rose-950/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Banknote className="w-6 h-6" />
                Efectivo
              </button>

              <button
                type="button"
                onClick={() => setMetodoPago('QR')}
                className={`py-3.5 px-2 rounded-2xl font-black text-xs uppercase tracking-wider border flex flex-col items-center gap-2 transition cursor-pointer ${
                  metodoPago === 'QR'
                    ? 'bg-rose-500 text-white border-rose-400 ring-2 ring-rose-500/50 shadow-lg shadow-rose-950/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <QrCode className="w-6 h-6" />
                Pago QR
              </button>

              <button
                type="button"
                onClick={() => setMetodoPago('TARJETA')}
                className={`py-3.5 px-2 rounded-2xl font-black text-xs uppercase tracking-wider border flex flex-col items-center gap-2 transition cursor-pointer ${
                  metodoPago === 'TARJETA'
                    ? 'bg-rose-500 text-white border-rose-400 ring-2 ring-rose-500/50 shadow-lg shadow-rose-950/50'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <CreditCard className="w-6 h-6" />
                Tarjeta
              </button>
            </div>
          </div>

          {/* Botón Gigante de Confirmación de Pago */}
          <button
            onClick={handleCobrarSubmit}
            disabled={cargando}
            className="w-full py-4 text-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black rounded-2xl uppercase tracking-wider flex items-center justify-center gap-3 shadow-xl shadow-rose-950/70 transition cursor-pointer"
          >
            <Banknote className="w-7 h-7" />
            FINALIZAR Y COBRAR
          </button>
        </div>

      </div>
    </div>
  );
};

export default ModalCobro;
