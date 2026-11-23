import React, { useState } from 'react';
import {
  ArrowLeftRight,
  BarChart3,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Database,
  History,
  Layers,
  LayoutGrid,
  LogOut,
  Package,
  QrCode,
  Scissors,
  Shield,
  ShieldAlert,
  ShoppingCart,
  Truck,
  Users,
  X,
} from 'lucide-react';
import type { StaffUser } from '../types/calaminas';

export type NavTab =
  | 'dashboard'
  | 'pos'
  | 'purchases'
  | 'catalog'
  | 'coils'
  | 'kardex'
  | 'cut-orders'
  | 'sales'
  | 'finance'
  | 'clients'
  | 'staff'
  | 'bnb-config'
  | 'audit';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  user: StaffUser;
  pendingCutsCount: number;
  mobileOpen: boolean;
  onCloseMobile: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  user,
  pendingCutsCount,
  mobileOpen,
  onCloseMobile,
  onLogout,
}) => {
  const [warehouseOpen, setWarehouseOpen] = useState(true);

  const isWarehouseActive = activeTab === 'catalog' || activeTab === 'coils' || activeTab === 'kardex';

  const handleNav = (tab: NavTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const navItemClass = (isActive: boolean) =>
    `w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold tracking-wide transition-colors cursor-pointer ${
      isActive
        ? 'bg-orange-50 dark:bg-orange-950/50 text-[#c2410c] dark:text-orange-400'
        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/70 hover:text-slate-900 dark:hover:text-white'
    }`;

  const subItemClass = (isActive: boolean) =>
    `w-full flex items-center gap-2.5 pl-9 pr-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
      isActive
        ? 'text-[#c2410c] dark:text-orange-400 bg-orange-50/70 dark:bg-orange-950/30 font-semibold'
        : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/40'
    }`;

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c2410c] flex items-center justify-center text-white shadow-sm shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display italic font-extrabold text-lg tracking-tight text-slate-900 dark:text-white leading-none">
              ACEROCAL
            </div>
            <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-[#c2410c] dark:text-orange-400 mt-1">
              PRO CALAMINAS
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          aria-label="Cerrar menú"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        <button
          type="button"
          onClick={() => handleNav('dashboard')}
          className={navItemClass(activeTab === 'dashboard')}
        >
          <span className="flex items-center gap-3">
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">TABLERO PRINCIPAL</span>
          </span>
          {activeTab === 'dashboard' && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
        </button>

        <button
          type="button"
          onClick={() => handleNav('pos')}
          className={navItemClass(activeTab === 'pos')}
        >
          <span className="flex items-center gap-3 text-left">
            <ShoppingCart className="w-4 h-4 shrink-0" />
            <span className="leading-tight">COTIZAR / POS MOSTRADOR</span>
          </span>
          {activeTab === 'pos' && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
        </button>

        <button
          type="button"
          onClick={() => handleNav('cut-orders')}
          className={navItemClass(activeTab === 'cut-orders')}
        >
          <span className="flex items-center gap-3">
            <Scissors className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">ÓRDENES DE CORTE</span>
          </span>
          {pendingCutsCount > 0 && (
            <span className="text-[11px] font-mono-tabular font-bold text-[#c2410c] dark:text-orange-400">
              {pendingCutsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => handleNav('purchases')}
          className={navItemClass(activeTab === 'purchases')}
        >
          <span className="flex items-center gap-3">
            <Truck className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">COMPRAS BOBINAS</span>
          </span>
        </button>

        {/* Collapsible Almacén y Stock */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setWarehouseOpen(!warehouseOpen)}
            className={navItemClass(isWarehouseActive)}
          >
            <span className="flex items-center gap-3">
              <Database className="w-4 h-4 shrink-0" />
              <span className="whitespace-nowrap">ALMACÉN Y STOCK</span>
            </span>
            {warehouseOpen ? (
              <ChevronDown className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
            )}
          </button>
          {warehouseOpen && (
            <div className="mt-1 space-y-0.5">
              <button
                type="button"
                onClick={() => handleNav('catalog')}
                className={subItemClass(activeTab === 'catalog')}
              >
                <Package className="w-3.5 h-3.5 shrink-0" />
                <span>Catálogo Calaminas</span>
              </button>
              <button
                type="button"
                onClick={() => handleNav('coils')}
                className={subItemClass(activeTab === 'coils')}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>Bobinas y Colores RAL</span>
              </button>
              <button
                type="button"
                onClick={() => handleNav('kardex')}
                className={subItemClass(activeTab === 'kardex')}
              >
                <ArrowLeftRight className="w-3.5 h-3.5 shrink-0" />
                <span>Kardex y Traspasos</span>
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => handleNav('sales')}
          className={navItemClass(activeTab === 'sales')}
        >
          <span className="flex items-center gap-3">
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">HISTORIAL VENTAS</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleNav('finance')}
          className={navItemClass(activeTab === 'finance')}
        >
          <span className="flex items-center gap-3">
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">FINANZAS Y REPORTES</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleNav('clients')}
          className={navItemClass(activeTab === 'clients')}
        >
          <span className="flex items-center gap-3">
            <Users className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">CLIENTES Y OBRAS</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleNav('staff')}
          className={navItemClass(activeTab === 'staff')}
        >
          <span className="flex items-center gap-3">
            <Shield className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">EQUIPO / STAFF</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleNav('bnb-config')}
          className={navItemClass(activeTab === 'bnb-config')}
        >
          <span className="flex items-center gap-3">
            <QrCode className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">PAGO QR BNB / API</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleNav('audit')}
          className={navItemClass(activeTab === 'audit')}
        >
          <span className="flex items-center gap-3">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">SEGURIDAD / AUDITORÍA</span>
          </span>
          {activeTab === 'audit' && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
        </button>
      </nav>

      {/* Bottom Operator Card matching Screenshot 2 */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/70">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-950 text-[#c2410c] dark:text-orange-400 font-display font-bold text-sm flex items-center justify-center shrink-0">
              {user.fullName.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate uppercase">
                {user.fullName}
              </div>
              <div className="text-[10px] font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                {user.role}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            title="Cerrar sesión"
            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden lg:block w-[256px] shrink-0 h-screen sticky top-0 no-print">
        {content}
      </aside>

      {/* Mobile slide-over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative w-[270px] max-w-[85vw] h-full z-10">{content}</div>
        </div>
      )}
    </>
  );
};
