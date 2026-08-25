import React, { useState } from 'react';
import useTimer from '../hooks/useTimer';

const CheckoutPanel = ({ mesa, productos, onAddItem, onCheckout }) => {
  const [selectedProducto, setSelectedProducto] = useState(productos[0]?.id_producto || '');
  const [cantidad, setCantidad] = useState(1);
  const [showItemModal, setShowItemModal] = useState(false);

  const isOccupied = mesa && mesa.estado === 'OCUPADA';
  const horaInicio = mesa?.sesion_activa?.hora_inicio;
  const tarifaHora = Number(mesa?.tarifa_hora || 20);

  const { formattedTime, totalMinutes } = useTimer(isOccupied ? horaInicio : null);

  const esGracia = isOccupied && totalMinutes <= 3;
  const tableTimeBill = esGracia ? 0 : Number(((totalMinutes / 60) * tarifaHora).toFixed(2));
  
  // Tax / Totales
  const subtotal = tableTimeBill;
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
      <aside className="w-full lg:w-96 bg-surface border-l border-outline-variant flex flex-col shrink-0 shadow-sm p-6 justify-center items-center text-on-surface-variant">
        <span className="material-symbols-outlined text-6xl mb-2" data-icon="touch_app">touch_app</span>
        <p className="font-body-md text-body-md text-center">Select an active table to view details</p>
      </aside>
    );
  }

  return (
    <aside className="w-full lg:w-96 bg-surface border-l border-outline-variant flex flex-col shrink-0 shadow-sm relative">
      <div className="p-6 border-b border-outline-variant flex justify-between items-center bg-surface-container-low">
        <h2 className="font-headline-md text-headline-md text-on-surface">Active Session</h2>
        <span className="bg-electric-purple text-on-secondary-container px-2 py-1 rounded text-sm font-bold">
          {mesa.numero}
        </span>
      </div>

      <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
        {/* Session Info */}
        <div className="bg-surface-container-lowest border border-outline-variant rounded p-4 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-on-surface-variant font-label-md text-label-md">Start Time</span>
            <span className="text-on-surface font-medium">
              {horaInicio ? new Date(horaInicio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant font-label-md text-label-md">Rate</span>
            <span className="text-on-surface font-medium">${tarifaHora}/hr</span>
          </div>
        </div>

        {/* Digital Receipt / Charges */}
        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-center border-b border-outline-variant pb-2 mb-3">
            <h3 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest">
              Itemized Charges
            </h3>
            {isOccupied && (
              <button
                onClick={() => setShowItemModal(true)}
                className="text-xs bg-electric-cyan text-on-primary-fixed font-bold px-2 py-1 rounded hover:opacity-90 transition-opacity"
              >
                + Add Item
              </button>
            )}
          </div>

          <div className="flex flex-col gap-3 py-3">
            <div className="flex justify-between items-start group">
              <div>
                <div className="text-on-surface font-medium">Table Time</div>
                <div className="text-on-surface-variant text-sm">{formattedTime || '00:00:00'}</div>
              </div>
              <div className="text-on-surface font-mono font-medium">${tableTimeBill.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* Totals & Actions */}
        <div className="mt-auto border-t border-outline-variant pt-4 flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant font-medium">Subtotal</span>
            <span className="text-on-surface font-mono font-medium">${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-on-surface-variant font-medium">Tax (8%)</span>
            <span className="text-on-surface font-mono font-medium">${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-end mt-2 pt-2 border-t border-outline-variant border-dashed">
            <span className="font-headline-md text-headline-md text-on-surface">Total</span>
            <span className="font-stats-number text-stats-number text-electric-cyan">${total.toFixed(2)}</span>
          </div>

          {isOccupied && (
            <button
              onClick={() => onCheckout(mesa)}
              className="w-full bg-electric-cyan text-on-primary-fixed font-headline-md text-headline-md py-4 rounded-lg mt-4 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-bold cursor-pointer"
            >
              <span className="material-symbols-outlined" data-icon="receipt_long">receipt_long</span>
              Checkout {mesa.numero}
            </button>
          )}
        </div>
      </div>

      {/* Modal agregar producto si se abre desde el panel */}
      {showItemModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-outline-variant rounded-xl p-6 w-full max-w-sm shadow-xl space-y-4">
            <h3 className="font-headline-md text-headline-md text-on-surface">Add Item to {mesa.numero}</h3>
            <form onSubmit={handleAddItemSubmit} className="space-y-4">
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Product</label>
                <select
                  value={selectedProducto}
                  onChange={(e) => setSelectedProducto(e.target.value)}
                  className="w-full bg-surface-container border border-outline-variant rounded p-2 text-on-surface"
                >
                  {productos.map((prod) => (
                    <option key={prod.id_producto} value={prod.id_producto}>
                      {prod.nombre} - ${Number(prod.precio_actual).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-label-md text-label-md text-on-surface-variant mb-1">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={cantidad}
                  onChange={(e) => setCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-surface-container border border-outline-variant rounded p-2 text-on-surface"
                />
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowItemModal(false)}
                  className="px-4 py-2 bg-surface-variant text-on-surface rounded hover:bg-surface-container-highest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-electric-cyan text-on-primary-fixed font-bold rounded hover:opacity-90"
                >
                  Add
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
