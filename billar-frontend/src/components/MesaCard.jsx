import React from 'react';
import useTimer from '../hooks/useTimer';

const MesaCard = ({ mesa, isSelected, onSelect, onOpenTable, onAddItem, onCheckout }) => {
  const isOccupied = mesa.estado === 'OCUPADA';
  const isPending = mesa.estado === 'POR_COBRAR' || mesa.estado === 'PENDING';
  const isAvailable = !isOccupied && !isPending;

  const horaInicio = mesa.sesion_activa?.hora_inicio;
  const tarifaHora = Number(mesa.tarifa_hora || 20);
  const { formattedTime, totalMinutes } = useTimer(isOccupied ? horaInicio : null);

  // Cálculo en tiempo real
  const esGracia = isOccupied && totalMinutes <= 3;
  const currentBill = esGracia ? 0 : Number(((totalMinutes / 60) * tarifaHora).toFixed(2));

  return (
    <div
      onClick={() => onSelect(mesa)}
      className={`bg-surface-container-lowest shadow-sm rounded-lg p-4 flex flex-col gap-4 relative overflow-hidden group hover:border-electric-cyan transition-colors cursor-pointer ${
        isSelected ? 'ring-2 ring-electric-cyan' : ''
      } ${
        isOccupied
          ? 'border-l-4 border-electric-purple'
          : isPending
          ? 'border-l-4 border-tertiary-container'
          : 'border border-outline-variant'
      }`}
    >
      {/* Header Card */}
      <div className="flex justify-between items-start">
        <h3 className="font-headline-md text-headline-md text-on-surface">{mesa.numero}</h3>
        {isOccupied && (
          <span className="bg-electric-purple text-on-secondary-container px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
            Occupied
          </span>
        )}
        {isPending && (
          <span className="bg-tertiary-container text-on-tertiary-container px-2 py-1 rounded text-xs font-bold uppercase tracking-wider animate-pulse">
            Pending
          </span>
        )}
        {isAvailable && (
          <span className="bg-surface-container-high text-on-surface-variant border border-outline-variant px-2 py-1 rounded text-xs font-bold uppercase tracking-wider">
            Available
          </span>
        )}
      </div>

      {/* Body Card */}
      {isOccupied && (
        <div className="flex flex-col items-center justify-center py-4">
          <div className="font-stats-number text-stats-number text-electric-cyan font-mono tracking-widest">
            {formattedTime}
          </div>
          <div className="font-body-md text-body-md text-on-surface-variant mt-1">
            Current Bill: <span className="text-on-surface font-bold">${currentBill.toFixed(2)}</span>
          </div>
        </div>
      )}

      {isPending && (
        <div className="flex flex-col items-center justify-center py-4">
          <div className="font-label-md text-label-md text-on-surface-variant mb-1">Total Due</div>
          <div className="font-stats-number text-stats-number text-tertiary-container">
            ${currentBill.toFixed(2)}
          </div>
        </div>
      )}

      {isAvailable && (
        <div className="flex-1 flex flex-col items-center justify-center py-6 text-outline-variant">
          <span
            className="material-symbols-outlined text-6xl mb-2"
            data-icon="sports_esports"
            style={{ fontVariationSettings: "'FILL' 0" }}
          >
            sports_esports
          </span>
          <span className="font-body-md text-body-md">Ready for play</span>
        </div>
      )}

      {/* Footer Actions */}
      {isOccupied && (
        <div className="grid grid-cols-2 gap-2 mt-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddItem(mesa);
            }}
            className="border-2 border-electric-cyan text-on-surface font-bold hover:bg-surface-container-low font-label-md text-label-md py-2 rounded transition-colors text-center cursor-pointer"
          >
            Add Item
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCheckout(mesa);
            }}
            className="bg-electric-cyan text-on-primary-fixed font-bold font-label-md text-label-md py-2 rounded hover:opacity-90 transition-opacity text-center cursor-pointer"
          >
            Checkout
          </button>
        </div>
      )}

      {isPending && (
        <div className="flex flex-col gap-2 mt-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCheckout(mesa);
            }}
            className="w-full bg-tertiary-container text-on-tertiary-container font-label-md text-label-md py-3 rounded hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-bold cursor-pointer"
          >
            <span className="material-symbols-outlined" data-icon="payments">payments</span>
            Process Payment
          </button>
        </div>
      )}

      {isAvailable && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenTable(mesa.id_mesa);
          }}
          className="w-full bg-surface-variant text-on-surface hover:bg-surface-container-highest border border-outline-variant font-label-md text-label-md py-3 rounded transition-colors mt-auto flex items-center justify-center gap-2 font-bold cursor-pointer"
        >
          <span className="material-symbols-outlined" data-icon="play_arrow">play_arrow</span>
          Open Table
        </button>
      )}
    </div>
  );
};

export default MesaCard;
