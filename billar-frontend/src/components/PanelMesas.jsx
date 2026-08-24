import React, { useState } from 'react';
import { useMesaStore } from '../store/useMesaStore';
import { CronometroMesa } from './CronometroMesa';
import { Play, PlusCircle, CheckCircle, Receipt, Beer, RefreshCw } from 'lucide-react';

export function PanelMesas() {
  const { mesas, productos, consumosLocales, abrirMesaLocal, ponerPorCobrarLocal, cerrarMesaLocal, agregarConsumoLocal } = useMesaStore();
  const [modalMesa, setModalMesa] = useState(null); // Mesa seleccionada para agregar productos o ver ticket
  const [modalTicket, setModalTicket] = useState(null);

  // Colores dinámicos por estado estricto
  const getBadgeEstado = (estado) => {
    switch (estado) {
      case 'LIBRE':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'OCUPADA':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'POR_COBRAR':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/40';
      default:
        return 'bg-slate-700 text-slate-300';
    }
  };

  const getBorderEstado = (estado) => {
    switch (estado) {
      case 'LIBRE':
        return 'border-emerald-500/50 hover:border-emerald-400 shadow-emerald-950/20';
      case 'OCUPADA':
        return 'border-rose-500/50 hover:border-rose-400 shadow-rose-950/20';
      case 'POR_COBRAR':
        return 'border-amber-500/50 hover:border-amber-400 shadow-amber-950/20';
      default:
        return 'border-slate-700';
    }
  };

  const handleCerrarYGenerarTicket = (mesa) => {
    const consumos = consumosLocales[mesa.sesion_activa_id] || [];
    const inicio = new Date(mesa.hora_inicio).getTime();
    const ahora = new Date().getTime();
    const minutos = Math.floor(Math.max(0, ahora - inicio) / (1000 * 60));
    
    let montoTiempo = 0;
    if (minutos >= 3) {
      montoTiempo = Number(((minutos / 60) * mesa.tarifa_hora).toFixed(2));
    }

    const montoConsumos = consumos.reduce((sum, item) => sum + item.subtotal, 0);
    const montoTotal = Number((montoTiempo + montoConsumos).toFixed(2));

    setModalTicket({
      mesa,
      minutos,
      montoTiempo,
      montoConsumos,
      montoTotal,
      consumos
    });
  };

  const finalizarPagoFinal = (mesaId) => {
    cerrarMesaLocal(mesaId);
    setModalTicket(null);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="bg-emerald-500 w-3 h-8 rounded-full inline-block"></span>
            BilliardOS - Control de Mesas
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Sistema Touch-First de Digitalización de Billares & Registro de Tiempos
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-700 font-medium flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
            Servidor Local Sincronizado
          </span>
        </div>
      </div>

      {/* Grid de Mesas Responsive Touch-First */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mesas.map((mesa) => {
          const consumosMesa = mesa.sesion_activa_id ? (consumosLocales[mesa.sesion_activa_id] || []) : [];
          const totalConsumosMesa = consumosMesa.reduce((acc, c) => acc + c.subtotal, 0);

          return (
            <div
              key={mesa.id}
              className={`bg-slate-900/80 rounded-2xl border-2 p-5 flex flex-col justify-between shadow-2xl transition-all duration-200 hover:scale-[1.01] ${getBorderEstado(
                mesa.estado
              )}`}
            >
              {/* Encabezado Card */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-400 tracking-wider">
                    {mesa.numero}
                  </span>
                  <span className={`text-xs font-extrabold px-3 py-1 rounded-full border ${getBadgeEstado(mesa.estado)}`}>
                    {mesa.estado}
                  </span>
                </div>

                <h2 className="text-xl font-extrabold text-white mb-1">
                  {mesa.nombre}
                </h2>
                <p className="text-xs text-slate-400 mb-2">
                  Tarifa: <span className="text-emerald-400 font-bold">${mesa.tarifa_hora.toFixed(2)}/hr</span>
                </p>

                {/* Cronómetro visual si está OCUPADA o POR_COBRAR */}
                {mesa.estado !== 'LIBRE' && (
                  <CronometroMesa horaInicio={mesa.hora_inicio} tarifaHora={mesa.tarifa_hora} />
                )}

                {/* Resumen de Consumos Vinculados */}
                {mesa.estado !== 'LIBRE' && (
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/80 mb-4">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-300 mb-1">
                      <span className="flex items-center gap-1.5 text-amber-400">
                        <Beer className="w-3.5 h-3.5" /> Consumos ({consumosMesa.length})
                      </span>
                      <span className="font-bold text-white">${totalConsumosMesa.toFixed(2)}</span>
                    </div>
                    {consumosMesa.length > 0 && (
                      <div className="text-[11px] text-slate-400 truncate">
                        {consumosMesa.map((c) => `${c.cantidad}x ${c.nombre}`).join(', ')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Botones Grandes Touch-First (Para Tablet/Caja) */}
              <div className="flex flex-col gap-2 mt-2">
                {mesa.estado === 'LIBRE' && (
                  <button
                    onClick={() => abrirMesaLocal(mesa.id)}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-base rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-950/40"
                  >
                    <Play className="w-5 h-5 fill-current" /> ABRIR MESA
                  </button>
                )}

                {mesa.estado === 'OCUPADA' && (
                  <>
                    <button
                      onClick={() => setModalMesa(mesa)}
                      className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition"
                    >
                      <PlusCircle className="w-4 h-4" /> AGREGAR CONSUMO
                    </button>
                    <button
                      onClick={() => handleCerrarYGenerarTicket(mesa)}
                      className="w-full py-3.5 bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-amber-950/40"
                    >
                      <Receipt className="w-4 h-4" /> PRE-CIERRE / COBRAR
                    </button>
                  </>
                )}

                {mesa.estado === 'POR_COBRAR' && (
                  <button
                    onClick={() => handleCerrarYGenerarTicket(mesa)}
                    className="w-full py-4 bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-base rounded-xl flex items-center justify-center gap-2 transition shadow-lg shadow-rose-950/40 animate-bounce"
                  >
                    <CheckCircle className="w-5 h-5" /> CONFIRMAR PAGO
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Modal Agregar Consumos */}
      {modalMesa && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">
              Agregar Consumo - {modalMesa.nombre}
            </h3>
            <p className="text-xs text-slate-400 mb-4">Selecciona los productos solicitados en la mesa</p>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {productos.map((prod) => (
                <div
                  key={prod.id}
                  className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/60 flex justify-between items-center"
                >
                  <div>
                    <div className="text-sm font-bold text-white">{prod.nombre}</div>
                    <div className="text-xs text-emerald-400 font-semibold">${prod.precio.toFixed(2)}</div>
                  </div>
                  <button
                    onClick={() => {
                      agregarConsumoLocal(modalMesa.sesion_activa_id, prod.id, 1);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs rounded-lg flex items-center gap-1"
                  >
                    <PlusCircle className="w-4 h-4" /> Agregar
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setModalMesa(null)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Desglose Exacto / Ticket Inmutable de Cierre */}
      {modalTicket && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl text-white">
            <div className="text-center border-b border-slate-800 pb-4 mb-4">
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider">
                Desglose Inmutable de Cierre
              </span>
              <h2 className="text-2xl font-black mt-2">{modalTicket.mesa.nombre}</h2>
              <p className="text-xs text-slate-400">Detalle oficial de cobro y consumos</p>
            </div>

            <div className="space-y-4 text-sm">
              {/* Seccion Tiempo */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <div className="font-bold text-slate-200">Tiempo de Juego</div>
                  <div className="text-xs text-slate-400">{modalTicket.minutos} minutos transcurridos</div>
                </div>
                <div className="text-base font-extrabold text-emerald-400">
                  ${modalTicket.montoTiempo.toFixed(2)}
                </div>
              </div>

              {/* Seccion Consumos */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <div className="font-bold text-slate-200 mb-2 border-b border-slate-800/80 pb-1 flex justify-between">
                  <span>Productos Consumidos</span>
                  <span>Subtotal</span>
                </div>
                {modalTicket.consumos.length === 0 ? (
                  <div className="text-xs text-slate-500 italic py-1">Sin productos registrados</div>
                ) : (
                  modalTicket.consumos.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-xs py-1 border-b border-slate-900/50">
                      <span className="text-slate-300">
                        {item.cantidad}x {item.nombre}
                      </span>
                      <span className="font-semibold text-slate-200">${item.subtotal.toFixed(2)}</span>
                    </div>
                  ))
                )}
                <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-800 text-xs font-bold">
                  <span className="text-slate-400">Total Consumos</span>
                  <span className="text-amber-400">${modalTicket.montoConsumos.toFixed(2)}</span>
                </div>
              </div>

              {/* Total Final */}
              <div className="bg-emerald-950/40 border border-emerald-500/50 p-4 rounded-2xl flex justify-between items-center">
                <span className="text-base font-black text-white">TOTAL A PAGAR</span>
                <span className="text-3xl font-black text-emerald-400 tracking-tight">
                  ${modalTicket.montoTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setModalTicket(null)}
                className="py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm rounded-xl"
              >
                Volver a Panel
              </button>
              <button
                onClick={() => finalizarPagoFinal(modalTicket.mesa.id)}
                className="py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-950/50"
              >
                CERRAR Y LIBERAR MESA
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
