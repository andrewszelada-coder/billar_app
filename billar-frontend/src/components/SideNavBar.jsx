import React from 'react';

const SideNavBar = ({ onOpenNewTable }) => {
  return (
    <aside className="hidden md:flex flex-col bg-surface-container h-full w-64 border-r border-outline-variant py-component-padding-y px-4 gap-2 shrink-0 z-40">
      <div className="mb-4 px-2">
        <h2 className="font-headline-md text-headline-md text-electric-cyan">BilliardOS</h2>
        <p className="font-label-md text-label-md text-on-surface-variant mt-1">Main Hall Terminal</p>
      </div>
      <button
        onClick={onOpenNewTable}
        className="w-full bg-electric-cyan text-on-primary-fixed font-label-md text-label-md py-3 rounded-lg mb-4 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 font-bold cursor-pointer"
      >
        <span className="material-symbols-outlined" data-icon="add" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
        Open New Table
      </button>
      <nav className="flex-1 flex flex-col gap-2 font-label-md text-label-md">
        <a className="flex items-center gap-3 px-3 py-2 bg-electric-purple text-on-secondary-container rounded-lg active:translate-x-1 transition-transform" href="#">
          <span className="material-symbols-outlined" data-icon="map">map</span>
          Floor Map
        </a>
        <a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors rounded-lg active:translate-x-1 transition-transform" href="#">
          <span className="material-symbols-outlined" data-icon="inventory_2">inventory_2</span>
          Inventory
        </a>
        <a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors rounded-lg active:translate-x-1 transition-transform" href="#">
          <span className="material-symbols-outlined" data-icon="group">group</span>
          Customers
        </a>
        <a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors rounded-lg active:translate-x-1 transition-transform" href="#">
          <span className="material-symbols-outlined" data-icon="assessment">assessment</span>
          Reports
        </a>
        <a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors rounded-lg active:translate-x-1 transition-transform" href="#">
          <span className="material-symbols-outlined" data-icon="schedule">schedule</span>
          Shift Info
        </a>
      </nav>
      <div className="mt-auto">
        <a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors rounded-lg font-label-md text-label-md active:translate-x-1 transition-transform" href="#">
          <span className="material-symbols-outlined" data-icon="logout">logout</span>
          Logout
        </a>
      </div>
    </aside>
  );
};

export default SideNavBar;
