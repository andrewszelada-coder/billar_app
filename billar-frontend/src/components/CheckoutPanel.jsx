import React, { useState } from 'react';
import useTimer from '../hooks/useTimer';

const CheckoutPanel = ({ mesa, productos = [], onAddItem, onCheckout }) => {
  const [selectedProducto, setSelectedProducto] = useState(productos[0]?.id_producto || '');
  const [cantidad, setCantidad] = useState(1);
  const [showItemModal, setShowItemModal] = useState(false);

  const isOccupied = mesa && mesa.estado === 'OCUPADA';
  const isPending = mesa && (mesa.estado === 'POR_COBRAR' || mesa.estado === 'PENDING');
  const horaInicio = mesa?.sesion_activa?.hora_inicio;
  const tarifaHora = Number(mesa?.tarifa_hora || 20);

  const { formattedTime, totalMinutes } = useTimer(isOccupied ? horaInicio : null);

  const esGracia = isOccupied && totalMinutes <= 3;
  const tableTimeBill = esGracia ? 0 : Number(((totalMinutes / 60) * tarifaHora).toFixed(2));
  
  // Consumos extras de la sesión activa
  const consumos = mesa?.sesion_activa?.consumos || [
    { id_consumo: 1, nombre: 'Corona Extra', cantidad: 2, precio_unitario: 5.00 },
    { id_consumo: 2, nombre: 'Nachos', cantidad: 1, precio_unitario: 8.50 }
  ];

  const sumConsumos = isOccupied ? (mesa?.sesion_activa?.consumos?.reduce((sum, item) => sum + (Number(item.precio_unitario) * Number(item.cantidad)), 0) || 18.50) : 0;

  // Subtotal, Impuesto (8%), Total
  const subtotal = tableTimeBill + sumConsumos;
  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  const handleAddItemSubmit = (e) => {
    e.preventDefault();
    if (!mesa || !selectedProducto) return;
    onAddItem({
      id_sesion: mesa.sesion_activa?.id_sesion,
      id_producto: Number(selectedProducto),
      cantidad: Number(cantidad)
    });
    setShowItemModal(false);
  };

  if (!mesa) {
    return (
      <aside className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col shrink-0 p-8 justify-center items-center text-gray-400">
        <span className="material-symbols-outlined text-6xl mb-3 text-gray-300">touch_app</span>
        <p className="text-sm font-medium text-center text-gray-500">
          Selecciona una mesa activa para ver los detalles
        </p>
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-96 bg-white border-l border-gray-200 flex flex-col shrink-0 relative h-full">
      {/* Panel Header */}
      <div className="p-5 border-b border-gray-200 flex justify-between items-center bg-[#f8fafc]">
        <h2 className="font-bold text-gray-900 text-base">Sesión Activa</h2>
        <span className="bg-[#cf5cff] text-white px-2.5 py-0.5 rounded text-xs font-bold">
          {mesa.numero}
        </span>
      </div>

      <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
        {/* Session Info Box */}
        <div className="bg-[#f8fafc] border border-gray-200 rounded-xl p-4 shadow-xs">
          <div className="flex justify-between items-center mb-2 text-xs">
            <span className="text-gray-500 font-medium">Hora Inicio</span>
            <span className="text-gray-900 font-semibold">
              {horaInicio ? new Date(horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '18:30 PM'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 font-medium">Tarifa</span>
            <span className="text-gray-900 font-semibold">${tarifaHora}/hr</span>
          </div>
        </div>

        {/* Itemized Charges */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center border-b border-gray-200 pb-2 mb-4">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
              Desglose de Consumos
            </h3>
            {isOccupied && (
              <button
                onClick={() => setShowItemModal(true)}
                className="text-xs bg-[#00dbe9] text-[#002022] font-bold px-2.5 py-1 rounded-md hover:brightness-95 transition-all flex items-center gap-1 cursor-pointer"
              >
                + Consumo
              </button>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {/* Tiempo de mesa */}
            <div className="flex justify-between items-start text-xs border-b border-gray-100 pb-3">
              <div>
                <div className="font-semibold text-gray-900">Tiempo de Mesa</div>
                <div className="text-gray-400 font-mono text-[11px] mt-0.5">
                  {formattedTime || '01:45:22'}
                </div>
              </div>
              <div className="font-mono font-bold text-gray-900">
                ${(tableTimeBill || 21.50).toFixed(2)}
              </div>
            </div>

            {/* Consumos adicionales */}
            {consumos.map((item, idx) => (
              <div key={item.id_consumo || idx} className="flex justify-between items-start text-xs border-b border-gray-100 pb-3">
                <div>
                  <div className="font-semibold text-gray-900">{item.nombre || item.producto?.nombre}</div>
                  <div className="text-gray-400 text-[11px] mt-0.5">
                    {item.cantidad}x @ ${(Number(item.precio_unitario || item.producto?.precio_actual || 5)).toFixed(2)}
                  </div>
                </div>
                <div className="font-mono font-bold text-gray-900">
                  ${(Number(item.cantidad) * Number(item.precio_unitario || item.producto?.precio_actual || 5)).toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals & Checkout Button */}
        <div className="mt-auto border-t border-gray-200 pt-4 flex flex-col gap-3">
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 font-medium">Subtotal</span>
            <span className="font-mono font-bold text-gray-800">${(subtotal || 40.00).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-gray-500 font-medium">Impuesto (8%)</span>
            <span className="font-mono font-bold text-gray-800">${(tax || 3.20).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-dashed border-gray-200">
            <span className="font-bold text-gray-900 text-lg">Total</span>
            <span className="font-extrabold text-2xl text-[#00dbe9] font-mono">
              ${(total || 43.20).toFixed(2)}
            </span>
          </div>

          {(isOccupied || isPending) && (
            <button
              onClick={() => onCheckout(mesa)}
              className="w-full bg-[#00dbe9] text-[#002022] font-extrabold text-sm py-3.5 rounded-xl mt-3 hover:brightness-95 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
            >
              <span className="material-symbols-outlined text-[20px]">receipt_long</span>
              Cobrar {mesa.numero}
            </button>
          )}
        </div>
      </div>

      {/* Modal Agregar Producto */}
      {showItemModal && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-bold text-lg text-gray-900">Agregar Consumo a {mesa.numero}</h3>
            <form onSubmit={handleAddItemSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Producto</label>
                <select
                  value={selectedProducto}
                  onChange={(e) => setSelectedProducto(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#00dbe9] focus:outline-none"
                >
                  {productos.length > 0 ? (
                    productos.map((prod) => (
                      <option key={prod.id_producto} value={prod.id_producto}>
                        {prod.nombre} - ${Number(prod.precio_actual).toFixed(2)}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="1">Corona Extra - $5.00</option>
                      <option value="2">Nachos con Queso - $8.50</option>
                      <option value="3">Refresco 600ml - $3.00</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Cantidad</label>
                <input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg p-2.5 text-sm text-gray-900 focus:ring-2 focus:ring-[#00dbe9] focus:outline-none"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 text-xs cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#00dbe9] text-[#002022] font-bold rounded-lg hover:brightness-95 text-xs cursor-pointer shadow-xs"
                >
                  Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};

export default CheckoutPanel;
