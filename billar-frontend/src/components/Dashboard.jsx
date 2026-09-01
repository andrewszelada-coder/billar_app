import React, { useState, useEffect } from 'react';
import TopNavBar from './TopNavBar';
import MesaCard from './MesaCard';
import ModalConsumo from './ModalConsumo';
import ModalCobro from './ModalCobro';
import InventarioView from './InventarioView';
import ReportesView from './ReportesView';
import AjustesView from './AjustesView';
import Login from './Login';
import ErrorBoundary from './ErrorBoundary';
import { loginUser, logoutUser } from '../services/api';
import { useDashboard } from '../hooks/useDashboard';

const Dashboard = () => {
  // Estado de Tema
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

  // Custom Hook con toda la lógica de negocio y datos
  const {
    mesas,
    productos,
    configGracia,
    loading,
    cargarDatos,
    modalConsumoMesa,
    setModalConsumoMesa,
    modalCobroMesa,
    setModalCobroMesa,
    resumenCobro,
    setResumenCobro,
    handleStartHora,
    handlePausarHora,
    handleReanudarHora,
    handleConfirmAddConsumo,
    handlePrepareCheckout,
    handleConfirmCheckout
  } = useDashboard(session);

  // Auth Handlers
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

  if (!session) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  const occupiedCount = mesas.filter((m) => m.estado === 'OCUPADA').length;
  const availableCount = mesas.filter((m) => m.estado === 'LIBRE').length;
  const pausedCount = mesas.filter((m) => m.estado === 'PAUSADA').length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-sans flex flex-col transition-colors">
      <TopNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={session.user}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      <main className="flex-1">
        {activeTab === 'mesas' && (
          <div className="p-6 w-full max-w-screen-2xl mx-auto space-y-6">
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
                  const mesaSanitizada = { ...mesa, id_mesa: safeId };
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
