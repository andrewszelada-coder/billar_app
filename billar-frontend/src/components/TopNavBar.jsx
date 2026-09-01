import React from 'react';

const TopNavBar = ({ activeTab, setActiveTab, user, onLogout, isDarkMode, setIsDarkMode }) => {
  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 px-6 py-3.5 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-20 shadow-xs transition-colors">
      {/* Brand Logo */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">🎱</span>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-none">
            BilliardOS
          </h1>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Control de Mesas & BI</span>
        </div>
      </div>

      {/* Tabs de Navegación Principal Estilo SaaS */}
      <nav className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700/80">
        <button
          onClick={() => setActiveTab('mesas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'mesas'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <span>🎱</span>
          <span>Mesas</span>
        </button>

        <button
          onClick={() => setActiveTab('inventario')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'inventario'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <span>📦</span>
          <span>Inventario</span>
        </button>

        <button
          onClick={() => setActiveTab('reportes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'reportes'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <span>📊</span>
          <span>Reportes</span>
        </button>

        <button
          onClick={() => setActiveTab('ajustes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'ajustes'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-slate-700/60'
          }`}
        >
          <span>⚙️</span>
          <span>Ajustes</span>
        </button>
      </nav>

      {/* Acciones del Header: Toggle Tema + Logout */}
      <div className="flex items-center gap-3">
        {/* Toggle Dark/Light Mode */}
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer text-lg flex items-center justify-center"
          title={isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
        >
          {isDarkMode ? '☀️' : '🌙'}
        </button>

        {/* User Badge */}
        <div className="hidden sm:flex flex-col text-right">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{user?.email || 'Administrador'}</span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">● En Línea</span>
        </div>

        {/* Botón Salir */}
        <button
          onClick={onLogout}
          className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
          title="Cerrar Sesión"
        >
          <span>🚪</span>
          <span className="hidden sm:inline">Salir</span>
        </button>
      </div>
    </header>
  );
};

export default TopNavBar;
