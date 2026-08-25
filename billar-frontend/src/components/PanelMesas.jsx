import React, { useState, useEffect, useCallback } from 'react';
import { getMesas, getProductos, abrirMesa, agregarConsumo, cobrarMesa } from '../services/api';
import TarjetaMesa from './TarjetaMesa';
import ModalConsumo from './ModalConsumo';
import ModalCobro from './ModalCobro';
import ReciboDigital from './ReciboDigital';
import { RefreshCw, LayoutGrid } from 'lucide-react';

const PanelMesas = ({ onActualizarRecaudado }) => {
  const [mesas, setMesas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Modales
  const [mesaConsumo, setMesaConsumo] = useState(null);
  const [mesaCobro, setMesaCobro] = useState(null);
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
    } catch (err) {
      console.error('Error cargando mesas o productos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleAbrirMesa = async (idMesa) => {
    try {
      setActionLoading(true);
      await abrirMesa(idMesa);
      await cargarDatos();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al abrir la mesa');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAgregarConsumo = async (datosConsumo) => {
    setActionLoading(true);
    try {
      await agregarConsumo(datosConsumo);
      await cargarDatos();
    } finally {
      setActionLoading(false);
    }
  };

  const handleCobrarMesa = async (datosCobro) => {
    try {
      setActionLoading(true);
      const resultado = await cobrarMesa(datosCobro);
      setMesaCobro(null);
      setResumenCobro(resultado);
      if (onActualizarRecaudado && resultado.total_pagar) {
        onActualizarRecaudado(Number(resultado.total_pagar));
      }
      await cargarDatos();
    } catch (err) {
      alert(err.response?.data?.error || 'Error al cobrar la mesa');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Controles de Panel */}
      <div className="flex justify-between items-center bg-slate-800/60 backdrop-blur-md border border-slate-700/60 p-4 sm:p-5 rounded-2xl shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-tight">Salón de Juegos</h2>
            <p className="text-xs text-slate-400 font-medium">Gestión de mesas en tiempo real</p>
          </div>
        </div>

        <button
          onClick={cargarDatos}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-3 bg-slate-700 hover:bg-slate-600 active:scale-95 text-slate-200 rounded-xl font-bold text-sm border border-slate-600 transition cursor-pointer shadow-md"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* Grid de Mesas */}
      {loading && mesas.length === 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-72 bg-slate-800/40 rounded-2xl animate-pulse border border-slate-800"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mesas.map((mesa) => (
            <TarjetaMesa
              key={mesa.id_mesa}
              mesa={mesa}
              onAbrir={handleAbrirMesa}
              onAbrirConsumo={(m) => setMesaConsumo(m)}
              onAbrirCobro={(m) => setMesaCobro(m)}
            />
          ))}
        </div>
      )}

      {/* Modal de Comanda / Consumo */}
      {mesaConsumo && (
        <ModalConsumo
          mesa={mesaConsumo}
          productos={productos}
          onClose={() => setMesaConsumo(null)}
          onAgregarConsumo={handleAgregarConsumo}
          cargando={actionLoading}
        />
      )}

      {/* Modal de Cobro */}
      {mesaCobro && (
        <ModalCobro
          mesa={mesaCobro}
          onClose={() => setMesaCobro(null)}
          onCobrar={handleCobrarMesa}
          cargando={actionLoading}
        />
      )}

      {/* Recibo Digital de Cierre */}
      {resumenCobro && (
        <ReciboDigital
          resumen={resumenCobro}
          onClose={() => setResumenCobro(null)}
        />
      )}

    </div>
  );
};

export default PanelMesas;
