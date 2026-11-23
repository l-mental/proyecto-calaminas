import React, { useState } from 'react';
import {
  Calendar,
  Download,
  MapPin,
  Menu,
  Moon,
  Palette,
  Scissors,
  Sun,
  Truck,
  X,
} from 'lucide-react';
import type { Branch } from '../types/calaminas';

interface TopHeaderProps {
  branches: Branch[];
  activeBranchId: string;
  onChangeBranch: (branchId: string) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenMobileMenu: () => void;
  onOpenColorPaletteModal: () => void;
  onExportCsv: () => void;
  pendingCutsCount: number;
  inRouteCount: number;
  salesTodayCount: number;
  onNavigateCutOrders: () => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  branches,
  activeBranchId,
  onChangeBranch,
  darkMode,
  onToggleDarkMode,
  onOpenMobileMenu,
  onOpenColorPaletteModal,
  onExportCsv,
  pendingCutsCount,
  inRouteCount,
  salesTodayCount,
  onNavigateCutOrders,
}) => {
  const [agendaOpen, setAgendaOpen] = useState(false);
  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];
  const formattedDate = new Intl.DateTimeFormat('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 no-print">
      <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
        {/* Left: Hamburger + Company descriptor */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase truncate">
            <span className="text-[#c2410c] dark:text-orange-400 whitespace-nowrap">
              ACEROCAL FÁBRICA S.R.L.
            </span>
            <span className="hidden sm:inline text-slate-300 dark:text-slate-700">·</span>
            <span className="hidden md:inline text-slate-500 dark:text-slate-400 truncate">
              CALAMINAS, BOBINAS &amp; PERFILES
            </span>
          </div>
        </div>

        {/* Right: Branch selector + Date/City + Export CSV + Agenda + Muestrario RAL + Night Mode */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Branch Selector */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
            <MapPin className="w-3.5 h-3.5 text-[#c2410c] dark:text-orange-400 shrink-0" />
            <select
              value={activeBranchId}
              onChange={(e) => onChangeBranch(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
              aria-label="Sucursal activa"
            >
              {branches.map((b) => (
                <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900">
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="hidden lg:block text-right pr-1">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight capitalize">
              {formattedDate}
            </div>
            <div className="text-[10px] font-semibold tracking-wider uppercase text-slate-400">
              {activeBranch ? `${activeBranch.city.toUpperCase()}, BOLIVIA` : 'SANTA CRUZ, BOLIVIA'}
            </div>
          </div>

          {/* 1. Laravel 11 (.ZIP) Download matching Screenshots 2 & 3 */}
          <a
            href="/api/export/laravel-zip"
            download="acerocal-laravel-11.zip"
            title="Descargar proyecto completo en Laravel 11 (.zip)"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 border border-orange-200 dark:border-orange-800/70 text-[11px] font-bold tracking-wider uppercase text-[#c2410c] dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-950 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">LARAVEL (.ZIP)</span>
          </a>

          {/* 1b. Export CSV */}
          <button
            type="button"
            onClick={onExportCsv}
            title="Descargar reporte de ventas e inventario en CSV"
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold tracking-wider uppercase text-slate-600 dark:text-slate-300 hover:border-orange-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5 text-[#c2410c]" />
            <span>CSV</span>
          </button>

          {/* 2. Calendar / Agenda Hoy Popover matching Screenshot 2 */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAgendaOpen((o) => !o)}
              title="Agenda de planta y despachos de hoy"
              className="p-2 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800/70 text-[#c2410c] dark:text-orange-400 hover:bg-orange-100 transition-colors cursor-pointer relative"
            >
              <Calendar className="w-4 h-4" />
              {pendingCutsCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#c2410c] absolute -top-0.5 -right-0.5" />
              )}
            </button>

            {agendaOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl p-4 z-50 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="font-display font-bold uppercase text-slate-900 dark:text-white">
                    AGENDA DE PLANTA HOY
                  </span>
                  <button
                    type="button"
                    onClick={() => setAgendaOpen(false)}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Scissors className="w-3.5 h-3.5 text-[#c2410c]" />
                      Cortes pendientes
                    </span>
                    <strong className="font-mono-tabular text-[#c2410c]">{pendingCutsCount}</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <Truck className="w-3.5 h-3.5 text-sky-600" />
                      Despachos en ruta
                    </span>
                    <strong className="font-mono-tabular text-sky-600">{inRouteCount}</strong>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                    <span className="text-slate-600 dark:text-slate-300">Ventas registradas hoy</span>
                    <strong className="font-mono-tabular text-emerald-600">{salesTodayCount}</strong>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAgendaOpen(false);
                      onNavigateCutOrders();
                    }}
                    className="py-2 px-2.5 rounded-xl bg-[#c2410c] text-white font-bold text-[10px] uppercase cursor-pointer"
                  >
                    Ver Roladora
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAgendaOpen(false);
                      onOpenColorPaletteModal();
                    }}
                    className="py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-[10px] uppercase cursor-pointer"
                  >
                    Muestrario RAL
                  </button>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={onOpenColorPaletteModal}
            title="Simulador de techos y muestrario oficial RAL"
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-200 hover:border-orange-400 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <Palette className="w-3.5 h-3.5 text-[#c2410c]" />
            <span>MUESTRARIO RAL</span>
          </button>

          {/* 3. Night Mode Toggle matching Screenshot 2 */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] font-bold tracking-wider uppercase text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs cursor-pointer whitespace-nowrap shrink-0"
            title={darkMode ? 'Cambiar a modo claro' : 'Cambiar a modo nocturno'}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{darkMode ? 'CLARO' : 'NOCTURNO'}</span>
          </button>
        </div>
      </div>

      {/* Mobile branch selector strip */}
      <div className="xl:hidden px-4 py-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/70 dark:bg-slate-900">
        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-[#c2410c]" />
          <select
            value={activeBranchId}
            onChange={(e) => onChangeBranch(e.target.value)}
            className="bg-transparent font-semibold focus:outline-none"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id} className="bg-white dark:bg-slate-900">
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onOpenColorPaletteModal}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#c2410c]"
        >
          <Palette className="w-3 h-3" />
          <span>Simulador RAL</span>
        </button>
      </div>
    </header>
  );
};
