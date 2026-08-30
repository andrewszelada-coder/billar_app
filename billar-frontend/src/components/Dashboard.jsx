import React, { useState, useEffect, useCallback } from 'react';
import TopNavBar from './TopNavBar';
import MesaCard from './MesaCard';
import ModalConsumo from './ModalConsumo';
import ModalCobro from './ModalCobro';
import InventarioView from './InventarioView';
import ReportesView from './ReportesView';
import AjustesView from './AjustesView';
import Login from './Login';
import ErrorBoundary from './ErrorBoundary';
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

  const [mesas, setMesas] = useState([]);
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
      if (dataMesas && dataMesas.length > 0) {
        setMesas(dataMesas.map(m => (m.estado === 'LIBRE' ? { ...m, sesion_activa: null } : m)));
      }
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
  const handleStartHora = async (idMesa, tarifaHora = 20) => {
    if (!idMesa) {
      alert('Error: El ID de la mesa es requerido');
      return;
    }
    const safeIdMesa = String(idMesa).trim();

    // Actualización optimista estricta solo para la mesa afectada por id_mesa
    setMesas(prev => prev.map(m => 
      String(m.id_mesa) === safeIdMesa ? { 
        ...m,
        estado: 'OCUPADA',
        sesion_activa: { 
          id_sesion: `temp-${Date.now()}`,
          id_mesa: safeIdMesa,
          hora_inicio: new Date().toISOString(), 
          minutos_acumulados: 0
        } 
      } : m
    ));

    try {
      const res = await abrirMesa(safeIdMesa, tarifaHora);
      console.log('[Frontend] Mesa abierta exitosamente (Respuesta API):', res);

      const sesionReal = res?.sesion_activa || res?.sesion;
      if (sesionReal) {
        setMesas(prev => prev.map(m =>
          String(m.id_mesa) === safeIdMesa ? {
            ...m,
            estado: 'OCUPADA',
            sesion_activa: sesionReal
          } : m
        ));
      }
      await cargarDatos();
    } catch (err) {
      console.error('[Frontend] Error al abrir mesa en backend:', err);
      const errMsg = err?.response?.data?.error || err?.message || 'Error al abrir la mesa';
      alert(`Error al abrir mesa: ${errMsg}`);
      await cargarDatos();
    }
  };

  const handlePausarHora = async (idSesion) => {
    // Optimistic UI Update: Cambiar interfaz inmediatamente a PAUSADA
    setMesas((prev) =>
      prev.map((m) => {
        if (m.sesion_activa?.id_sesion === idSesion) {
          const rawHora = m.sesion_activa.hora_inicio;
          const horaInicioStr = (typeof rawHora === 'string' && !rawHora.endsWith('Z') && !rawHora.includes('T')) ? `${rawHora}Z` : rawHora;
          const horaInicio = new Date(horaInicioStr || Date.now()).getTime();
          const horaActual = Date.now();
          const tramoSegundos = (!isNaN(horaInicio) && horaInicio > 0) ? Math.max(0, Math.floor((horaActual - horaInicio) / 1000)) : 0;
          const totalSegundos = (Number(m.sesion_activa.segundos_acumulados) || 0) + tramoSegundos;
          return {
            ...m,
            estado: 'PAUSADA',
            sesion_activa: {
              ...m.sesion_activa,
              estado: 'PAUSADA',
              segundos_acumulados: totalSegundos
            }
          };
        }
        return m;
      })
    );

    try {
      await pausarMesa(idSesion);
      await cargarDatos();
    } catch (err) {
      console.error('Error al pausar mesa en backend:', err);
      await cargarDatos();
    }
  };

  const handleReanudarHora = async (idSesion) => {
    // Optimistic UI Update: Cambiar interfaz inmediatamente a OCUPADA
    setMesas((prev) =>
      prev.map((m) => {
        if (m.sesion_activa?.id_sesion === idSesion) {
          return {
            ...m,
            estado: 'OCUPADA',
            sesion_activa: {
              ...m.sesion_activa,
              estado: 'ACTIVA',
              hora_inicio: new Date().toISOString()
            }
          };
        }
        return m;
      })
    );

    try {
      await reanudarMesa(idSesion);
      await cargarDatos();
    } catch (err) {
      console.error('Error al reanudar mesa en backend:', err);
      await cargarDatos();
    }
  };

  const handleConfirmAddConsumo = async (datosConsumo) => {
    const res = await agregarConsumo(datosConsumo);
    await cargarDatos();
    return res;
  };

  const handlePrepareCheckout = async (mesaTarget) => {
    if (!mesaTarget) return;
    const sesionId = mesaTarget.sesion_activa?.id_sesion;
    setModalCobroMesa(mesaTarget);

    try {
      let consumos = mesaTarget.sesion_activa?.consumos || [];
      if (sesionId && !String(sesionId).startsWith('demo-') && !String(sesionId).startsWith('temp-')) {
        try {
          const fetched = await getConsumosSesion(sesionId);
          if (Array.isArray(fetched) && fetched.length > 0) {
            consumos = fetched;
          }
        } catch (e) {
          console.warn('[Dashboard] Error obteniendo consumos de API:', e);
        }
      }

      const rawHora = mesaTarget.sesion_activa?.hora_inicio;
      const horaInicioStr = (typeof rawHora === 'string' && !rawHora.endsWith('Z') && !rawHora.includes('T')) ? `${rawHora}Z` : rawHora;
      const horaInicio = new Date(horaInicioStr || Date.now()).getTime();
      const horaActual = Date.now();
      const tramoSegundos = (mesaTarget.estado === 'OCUPADA' && !isNaN(horaInicio) && horaInicio > 0)
        ? Math.max(0, Math.floor((horaActual - horaInicio) / 1000))
        : 0;
      const totalSegundos = (Number(mesaTarget.sesion_activa?.segundos_acumulados) || 0) + tramoSegundos;
      const totalMins = Math.floor(totalSegundos / 60);
      const tarifa = Number(mesaTarget.tarifa_hora || 20);

      let totalTiempo = 0;
      const tieneGraciaActiva = configGracia?.habilitar_gracia;
      const minsGracia = configGracia?.minutos_gracia || 3;

      if (!tieneGraciaActiva || totalMins > minsGracia) {
        totalTiempo = Number(((totalSegundos / 3600) * tarifa).toFixed(2));
      }

      const totalConsumos = (consumos || []).reduce((acc, c) => acc + Number(c.subtotal || 0), 0);

      setResumenCobro({
        minutos_jugados: totalMins,
        total_tiempo: totalTiempo,
        total_consumos: totalConsumos,
        total_pagar: Number((totalTiempo + totalConsumos).toFixed(2)),
        consumos: consumos || []
      });
    } catch (err) {
      console.error('Error al preparar cobro:', err);
      setResumenCobro({
        minutos_jugados: 0,
        total_tiempo: 0,
        total_consumos: 0,
        total_pagar: 0,
        consumos: []
      });
    }
  };

  const handleConfirmCheckout = async (mesaTarget, metodoPago) => {
    if (!mesaTarget) return;
    const sesionId = mesaTarget?.sesion_activa?.id_sesion;
    const targetIdMesa = String(mesaTarget?.id_mesa || mesaTarget?.id);

    // 1. Ejecutar petición de cobro primero en el backend
    if (sesionId && !String(sesionId).startsWith('demo-') && !String(sesionId).startsWith('temp-')) {
      const resCobro = await cobrarMesa({ id_sesion: sesionId, metodo_pago: metodoPago });
      console.log('[Dashboard] Cobro completado con éxito:', resCobro);
    }

    // 2. Solo al tener éxito en el backend, actualizar estado local y cerrar el modal
    setMesas((prev) =>
      prev.map((m) => {
        const currentId = String(m?.id_mesa || m?.id);
        return currentId === targetIdMesa ? { ...m, estado: 'LIBRE', sesion_activa: null } : m;
      })
    );

    setModalCobroMesa(null);
    setResumenCobro(null);
    await cargarDatos();
  };

  if (!session) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  const occupiedCount = mesas.filter((m) => m.estado === 'OCUPADA').length;
  const availableCount = mesas.filter((m) => m.estado === 'LIBRE').length;
  const pausedCount = mesas.filter((m) => m.estado === 'PAUSADA').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors">
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
          <div className="p-6 w-full max-w-screen-2xl mx-auto space-y-6">
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

            {/* Grid 100% Pantalla: En celdas de a 3 */}
            {loading && mesas.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center space-y-3">
                <div className="text-4xl animate-bounce">🎱</div>
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200">Cargando estado de mesas...</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Conectando directamente con la base de datos de Supabase</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {mesas.map((mesa, idx) => {
                  const safeId = String(mesa?.id_mesa ?? mesa?.id ?? (idx + 1)).trim();
                  const mesaSanitizada = {
                    ...mesa,
                    id_mesa: safeId
                  };
                  return (
                    <ErrorBoundary key={safeId}>
                      <MesaCard
                        mesa={mesaSanitizada}
                        id_mesa={safeId}
                        habilitarGracia={configGracia.habilitar_gracia}
                        minutosGracia={configGracia.minutos_gracia}
                        onStart={handleStartHora}
                        onPause={handlePausarHora}
                        onResume={handleReanudarHora}
                        onAddConsumo={(m) => setModalConsumoMesa(m)}
                        onCheckout={handlePrepareCheckout}
                      />
                    </ErrorBoundary>
                  );
                })}
              </div>
            )}
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
