import React, { useState, useEffect, useCallback } from 'react';
import TopNavBar from './TopNavBar';
import SideNavBar from './SideNavBar';
import MesaCard from './MesaCard';
import CheckoutPanel from './CheckoutPanel';
import { getMesas, getProductos, abrirMesa, agregarConsumo, cobrarMesa } from '../services/api';

const Dashboard = () => {
  const [mesas, setMesas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMesa, setSelectedMesa] = useState(null);
  const [resumenCobro, setResumenCobro] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [dataMesas, dataProductos] = await Promise.all([
        getMesas(),
        getProductos()
      ]);
      setMesas(dataMesas);
      setProductos(dataProductos);

      // Mantener la mesa seleccionada o seleccionar la primera ocupada
      if (selectedMesa) {
        const actualizada = dataMesas.find((m) => m.id_mesa === selectedMesa.id_mesa);
        setSelectedMesa(actualizada || dataMesas[0] || null);
      } else {
        const ocupada = dataMesas.find((m) => m.estado === 'OCUPADA');
        setSelectedMesa(ocupada || dataMesas[0] || null);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMesa]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleOpenTable = async (idMesa) => {
    try {
      await abrirMesa(idMesa);
      await cargarDatos();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al abrir mesa');
    }
  };

  const handleAddItem = async (datosConsumo) => {
    try {
      await agregarConsumo(datosConsumo);
      await cargarDatos();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al agregar item');
    }
  };

  const handleCheckout = async (mesaTarget) => {
    const sesionId = mesaTarget.sesion_activa?.id_sesion;
    if (!sesionId) return;

    try {
      const res = await cobrarMesa({ id_sesion: sesionId });
      setResumenCobro(res);
      await cargarDatos();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al procesar el cobro');
    }
  };

  // Contadores
  const occupiedCount = mesas.filter((m) => m.estado === 'OCUPADA').length;
  const availableCount = mesas.filter((m) => m.estado === 'LIBRE').length;
  const pendingCount = mesas.filter((m) => m.estado === 'POR_COBRAR' || m.estado === 'PENDING').length;

  return (
    <div className="bg-background text-on-surface font-body-md h-screen overflow-hidden flex flex-col">
      {/* TopNavBar */}
      <TopNavBar />

      <div className="flex flex-1 overflow-hidden">
        {/* SideNavBar */}
        <SideNavBar onOpenNewTable={() => {
          const libre = mesas.find((m) => m.estado === 'LIBRE');
          if (libre) handleOpenTable(libre.id_mesa);
        }} />

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col lg:flex-row overflow-hidden bg-surface-lowest">
          {/* Table Grid */}
          <div className="flex-1 p-container-margin overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="font-headline-lg text-headline-lg text-on-surface">Floor Overview</h1>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full bg-electric-purple text-on-secondary-container font-label-md text-label-md">
                  {occupiedCount} Occupied
                </span>
                <span className="px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-md text-label-md border border-outline-variant">
                  {availableCount} Available
                </span>
                <span className="px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary-container font-label-md text-label-md">
                  {pendingCount} Pending
                </span>
              </div>
            </div>

            {loading && mesas.length === 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-56 bg-surface-container rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {mesas.map((mesa) => (
                  <MesaCard
                    key={mesa.id_mesa}
                    mesa={mesa}
                    isSelected={selectedMesa?.id_mesa === mesa.id_mesa}
                    onSelect={(m) => setSelectedMesa(m)}
                    onOpenTable={handleOpenTable}
                    onAddItem={() => {
                      setSelectedMesa(mesa);
                    }}
                    onCheckout={handleCheckout}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Checkout Panel */}
          <CheckoutPanel
            mesa={selectedMesa}
            productos={productos}
            onAddItem={handleAddItem}
            onCheckout={handleCheckout}
          />
        </main>
      </div>

      {/* Recibo / Toast modal tras checkout */}
      {resumenCobro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-headline-md text-headline-md text-electric-cyan">Payment Processed</h3>
            <div className="space-y-2 text-sm text-on-surface-variant font-mono">
              <div className="flex justify-between">
                <span>Minutes Played:</span>
                <span className="font-bold text-on-surface">{resumenCobro.minutos_totales} min</span>
              </div>
              <div className="flex justify-between">
                <span>Time Charge:</span>
                <span className="font-bold text-on-surface">${Number(resumenCobro.monto_tiempo).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t border-outline-variant pt-2 text-base font-bold text-electric-cyan font-sans">
                <span>Total Paid:</span>
                <span>${Number(resumenCobro.total_pagar || resumenCobro.monto_tiempo).toFixed(2)}</span>
              </div>
            </div>
            <button
              onClick={() => setResumenCobro(null)}
              className="w-full bg-electric-cyan text-on-primary-fixed font-bold py-3 rounded hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
