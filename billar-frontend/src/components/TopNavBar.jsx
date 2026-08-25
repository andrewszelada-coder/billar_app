import React from 'react';

const TopNavBar = () => {
  return (
    <nav className="bg-surface font-headline-md text-headline-md top-0 w-full px-gutter h-16 border-b border-outline-variant flex justify-between items-center z-50 shrink-0">
      <div className="flex items-center gap-4">
        <span className="font-headline-md text-headline-md font-bold text-electric-cyan">BilliardOS</span>
      </div>
      <div className="flex items-center gap-4">
        <button className="text-on-surface-variant hover:text-electric-cyan hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 transition-transform">
          <span className="material-symbols-outlined" data-icon="light_mode">light_mode</span>
        </button>
        <button className="text-on-surface-variant hover:text-electric-cyan hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 transition-transform">
          <span className="material-symbols-outlined" data-icon="notifications">notifications</span>
        </button>
        <button className="text-on-surface-variant hover:text-electric-cyan hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 transition-transform">
          <span className="material-symbols-outlined" data-icon="settings">settings</span>
        </button>
        <button className="text-on-surface-variant hover:text-electric-cyan hover:bg-surface-container-high transition-colors p-2 rounded-full active:scale-95 transition-transform">
          <span className="material-symbols-outlined" data-icon="account_circle">account_circle</span>
        </button>
      </div>
    </nav>
  );
};

export default TopNavBar;
