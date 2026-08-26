import React from 'react';

const SideNavBar = ({ onOpenNewTable, activeTab = 'mapa' }) => {
  return (
    <aside className="hidden md:flex flex-col bg-[#f8fafc] w-64 border-r border-gray-200 p-4 shrink-0 z-40 h-full">
      <div className="mb-6 px-1">
        <h2 className="font-extrabold text-xl text-[#00dbe9] tracking-tight">BilliardOS</h2>
        <p className="text-xs font-medium text-gray-500 mt-0.5">Terminal Principal</p>
      </div>

      <button
        onClick={onOpenNewTable}
        className="w-full bg-[#00dbe9] text-[#002022] font-bold py-2.5 px-4 rounded-xl mb-6 hover:brightness-95 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98"
      >
        <span className="material-symbols-outlined text-[20px]">add</span>
        Abrir Nueva Mesa
      </button>

      <nav className="flex-1 flex flex-col gap-1 text-sm font-medium">
        <a
          href="#"
          className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all ${
            activeTab === 'mapa'
              ? 'bg-[#cf5cff] text-white font-semibold shadow-xs'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">map</span>
          Mapa de Mesas
        </a>
        <a
          href="#"
          className="flex items-center gap-3 px-3.5 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 rounded-xl transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">inventory_2</span>
          Inventario
        </a>
        <a
          href="#"
          className="flex items-center gap-3 px-3.5 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 rounded-xl transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">group</span>
          Clientes
        </a>
        <a
          href="#"
          className="flex items-center gap-3 px-3.5 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 rounded-xl transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">assessment</span>
          Reportes
        </a>
        <a
          href="#"
          className="flex items-center gap-3 px-3.5 py-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-200/60 rounded-xl transition-all"
        >
          <span className="material-symbols-outlined text-[20px]">schedule</span>
          Info Turno
        </a>
      </nav>

      <div className="mt-auto pt-4 border-t border-gray-200">
        <a
          href="#"
          className="flex items-center gap-3 px-3.5 py-2.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all text-sm font-medium"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          Cerrar Sesión
        </a>
      </div>
    </aside>
  );
};

export default SideNavBar;
