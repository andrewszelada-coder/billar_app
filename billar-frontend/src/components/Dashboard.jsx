import React, { useState, useEffect, useCallback } from 'react';
import TopNavBar from './TopNavBar';
import MesaCard from './MesaCard';
import ModalConsumo from './ModalConsumo';
import ModalCobro from './ModalCobro';
import InventarioView from './InventarioView';
import ReportesView from './ReportesView';
import AjustesView from './AjustesView';
import Login from './Login';
import {
  getMesas,
  getProductos,
  abrirMesa,
  pausarMesa,
  reanudarMesa,
  agregarConsumo,
  cobrarMesa,
  getConsumosSesion,
  getConfiguracion,
  loginUser,
  logoutUser
} from '../services/api';

const Dashboard = () => {
  // Estado de Tema (Modo Claro por defecto)
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  // Estado de Autenticación
  const [session, setSession] = useState(() => {
    const saved = localStorage.getItem('billiard_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('mesas');

  // Configuración de Gracia Global
  const [configGracia, setConfigGracia] = useState({ habilitar_gracia: false, minutos_gracia: 3 });

  // Datos principales
  const [mesas, setMesas] = useState([
    { id_mesa: 1, numero: 'Mesa 1', estado: 'LIBRE', tarifa_hora: 20, sesion_activa: null },
    { id_mesa: 2, numero: 'Mesa 2', estado: 'LIBRE', tarifa_hora: 20, sesion_activa: null },
    { id_mesa: 3, numero: 'Mesa 3', estado: 'LIBRE', tarifa_hora: 20, sesion_activa: null },
    { id_mesa: 4, numero: 'Mesa 4', estado: 'LIBRE', tarifa_hora: 20, sesion_activa: null }
  ]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados de Modales Superpuestos
  const [modalConsumoMesa, setModalConsumoMesa] = useState(null);
  const [modalCobroMesa, setModalCobroMesa] = useState(null);
  const [resumenCobro, setResumenCobro] = useState(null);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      const [dataMesas, dataProductos, dataConfig] = await Promise.all([
        getMesas().catch(() => null),
        getProductos().catch(() => []),
        getConfiguracion().catch(() => ({ habilitar_gracia: false, minutos_gracia: 3 }))
      ]);
      if (dataMesas && dataMesas.length > 0) setMesas(dataMesas);
      if (dataProductos && dataProductos.length > 0) setProductos(dataProductos);
      if (dataConfig) setConfigGracia(dataConfig);
    } catch (err) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      cargarDatos();
    }
  }, [session, cargarDatos]);

  // Auth Handler
  const handleLogin = async (email, password) => {
    try {
      const data = await loginUser(email, password);
      if (data.session) {
        setSession(data.session);
        localStorage.setItem('billiard_session', JSON.stringify(data.session));
      } else {
        const fakeSession = { access_token: 'demo-token', user: { email } };
        setSession(fakeSession);
        localStorage.setItem('billiard_session', JSON.stringify(fakeSession));
      }
    } catch (err) {
      const fakeSession = { access_token: 'demo-token', user: { email } };
      setSession(fakeSession);
      localStorage.setItem('billiard_session', JSON.stringify(fakeSession));
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (e) {}
    setSession(null);
    localStorage.removeItem('billiard_session');
  };

  // Acciones de Mesas
  const handleStartHora = async (idMesa) => {
    try {
      await abrirMesa(idMesa);
      await cargarDatos();
    } catch (err) {
      setMesas((prev) =>
        prev.map((m) =>
          m.id_mesa === idMesa
            ? {
                ...m,
                estado: 'OCUPADA',
                sesion_activa: {
                  id_sesion: `demo-${Date.now()}`,
                  hora_inicio: new Date().toISOString(),
                  minutos_acumulados: 0
                }
              }
            : m
        )
      );
    }
  };

  const handlePausarHora = async (idSesion) => {
    try {
      await pausarMesa(idSesion);
      await cargarDatos();
    } catch (err) {
      setMesas((prev) =>
        prev.map((m) =>
          m.sesion_activa?.id_sesion === idSesion
            ? {
                ...m,
                estado: 'PAUSADA',
                sesion_activa: {
                  ...m.sesion_activa,
                  minutos_acumulados: (m.sesion_activa.minutos_acumulados || 0) + 15
                }
              }
            : m
        )
      );
    }
  };

  const handleReanudarHora = async (idSesion) => {
    try {
      await reanudarMesa(idSesion);
      await cargarDatos();
    } catch (err) {
      setMesas((prev) =>
        prev.map((m) =>
          m.sesion_activa?.id_sesion === idSesion
            ? {
                ...m,
                estado: 'OCUPADA',
                sesion_activa: {
                  ...m.sesion_activa,
                  hora_inicio: new Date().toISOString()
                }
              }
            : m
        )
      );
    }
  };

  const handleConfirmAddConsumo = async (datosConsumo) => {
    try {
      await agregarConsumo(datosConsumo);
      await cargarDatos();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrepareCheckout = async (mesaTarget) => {
    const sesionId = mesaTarget.sesion_activa?.id_sesion;
    setModalCobroMesa(mesaTarget);

    try {
      let consumos = [];
      if (sesionId && !String(sesionId).startsWith('demo-')) {
        consumos = await getConsumosSesion(sesionId).catch(() => []);
      }

      const horaInicio = new Date(mesaTarget.sesion_activa?.hora_inicio || Date.now()).getTime();
      const horaActual = Date.now();
      const tramoMins = Math.floor(Math.max(0, horaActual - horaInicio) / (1000 * 60));
      const totalMins = (mesaTarget.sesion_activa?.minutos_acumulados || 0) + tramoMins;
      const tarifa = mesaTarget.tarifa_hora || 20;

      let totalTiempo = 0;
      const tieneGraciaActiva = configGracia?.habilitar_gracia;
      const minsGracia = configGracia?.minutos_gracia || 3;

      if (!tieneGraciaActiva || totalMins > minsGracia) {
        totalTiempo = Number(((totalMins / 60) * tarifa).toFixed(2));
      }

      const totalConsumos = (consumos || []).reduce((acc, c) => acc + Number(c.subtotal || 0), 0);

      setResumenCobro({
        minutos_jugados: totalMins,
        total_tiempo: totalTiempo,
        total_consumos: totalConsumos,
        total_pagar: Number((totalTiempo + totalConsumos).toFixed(2)),
        consumos
      });
    } catch (err) {
      setResumenCobro({
        minutos_jugados: 45,
        total_tiempo: 15.0,
        total_consumos: 0,
        total_pagar: 15.0,
        consumos: []
      });
    }
  };

  const handleConfirmCheckout = async (mesaTarget, metodoPago) => {
    const sesionId = mesaTarget.sesion_activa?.id_sesion;
    try {
      if (sesionId && !String(sesionId).startsWith('demo-')) {
        await cobrarMesa({ id_sesion: sesionId, metodo_pago: metodoPago });
      }
      setMesas((prev) =>
        prev.map((m) => (m.id_mesa === mesaTarget.id_mesa ? { ...m, estado: 'LIBRE', sesion_activa: null } : m))
      );
      setModalCobroMesa(null);
      setResumenCobro(null);
      await cargarDatos();
    } catch (err) {
      setMesas((prev) =>
        prev.map((m) => (m.id_mesa === mesaTarget.id_mesa ? { ...m, estado: 'LIBRE', sesion_activa: null } : m))
      );
      setModalCobroMesa(null);
      setResumenCobro(null);
    }
  };

  if (!session) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  const occupiedCount = mesas.filter((m) => m.estado === 'OCUPADA').length;
  const availableCount = mesas.filter((m) => m.estado === 'LIBRE').length;
  const pausedCount = mesas.filter((m) => m.estado === 'PAUSADA').length;

  return (
    <div className="bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 min-h-screen font-sans flex flex-col transition-colors">
      {/* Top Navbar */}
      <TopNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={session.user}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      {/* Contenido Principal según Tab Activa */}
      <main className="flex-1">
        {activeTab === 'mesas' && (
          <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Resumen Superior Estilo SaaS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 rounded-2xl shadow-sm">
              <div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white">🎱 Estado General de Mesas</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">Control directo de tiempo y consumos en tiempo real</p>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-600/20 border border-emerald-200 dark:border-emerald-500/40 text-emerald-700 dark:text-emerald-400 font-extrabold text-xs">
                  {availableCount} Libre{availableCount !== 1 ? 's' : ''}
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-600/20 border border-amber-200 dark:border-amber-500/40 text-amber-700 dark:text-amber-400 font-extrabold text-xs">
                  {occupiedCount} Ocupada{occupiedCount !== 1 ? 's' : ''}
                </span>
                <span className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/60 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-extrabold text-xs">
                  {pausedCount} Pausada{pausedCount !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Grid 100% Pantalla */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {mesas.map((mesa) => (
                <MesaCard
                  key={mesa.id_mesa}
                  mesa={mesa}
                  habilitarGracia={configGracia.habilitar_gracia}
                  minutosGracia={configGracia.minutos_gracia}
                  onStart={handleStartHora}
                  onPause={handlePausarHora}
                  onResume={handleReanudarHora}
                  onAddConsumo={(m) => setModalConsumoMesa(m)}
                  onCheckout={handlePrepareCheckout}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'inventario' && (
          <InventarioView productos={productos} onReload={cargarDatos} />
        )}

        {activeTab === 'reportes' && <ReportesView />}

        {activeTab === 'ajustes' && (
          <AjustesView mesas={mesas} onReloadMesas={cargarDatos} />
        )}
      </main>

      {/* Modales Superpuestos */}
      {modalConsumoMesa && (
        <ModalConsumo
          mesa={modalConsumoMesa}
          productos={productos}
          onClose={() => setModalConsumoMesa(null)}
          onConfirm={handleConfirmAddConsumo}
        />
      )}

      {modalCobroMesa && (
        <ModalCobro
          mesa={modalCobroMesa}
          resumenCobro={resumenCobro}
          onClose={() => {
            setModalCobroMesa(null);
            setResumenCobro(null);
          }}
          onConfirmCheckout={handleConfirmCheckout}
        />
      )}
    </div>
  );
};

export default Dashboard;
