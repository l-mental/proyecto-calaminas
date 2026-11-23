import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Layers,
  Scissors,
  ShoppingBag,
  ShoppingCart,
} from 'lucide-react';
import {
  CALAMINA_COLORS,
  CoilStock,
  CutOrder,
  formatBs,
  getColorByCode,
  PROFILE_LABELS,
  Product,
  ProfileType,
  SaleRecord,
  StaffUser,
} from '../types/calaminas';
import type { NavTab } from './Sidebar';

type PeriodKey = 'day' | 'week' | 'month' | 'bimester' | 'trimester' | 'year';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'day', label: 'HOY (DÍA)' },
  { key: 'week', label: 'ESTA SEMANA' },
  { key: 'month', label: 'ESTE MES' },
  { key: 'bimester', label: 'BIMESTRE' },
  { key: 'trimester', label: 'TRIMESTRE' },
  { key: 'year', label: 'ESTE AÑO' },
];

interface DashboardViewProps {
  user: StaffUser;
  products: Product[];
  coils: CoilStock[];
  sales: SaleRecord[];
  cutOrders: CutOrder[];
  activeBranchId: string;
  onNavigate: (tab: NavTab, profileFilter?: ProfileType) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  products,
  coils,
  sales,
  cutOrders,
  activeBranchId,
  onNavigate,
}) => {
  const [period, setPeriod] = useState<PeriodKey>('day');

  const periodLabel = PERIODS.find((p) => p.key === period)?.label || 'HOY (DÍA)';

  const filteredSales = useMemo(() => {
    const now = Date.now();
    const dayMs = 86400000;
    const windowDays: Record<PeriodKey, number> = {
      day: 1,
      week: 7,
      month: 30,
      bimester: 60,
      trimester: 90,
      year: 365,
    };
    const cutoff = now - windowDays[period] * dayMs;
    return sales.filter((s) => {
      if (s.status === 'ANULADA') return false;
      const t = new Date(s.createdAt).getTime();
      if (period === 'day') {
        const sDate = new Date(s.createdAt).toDateString();
        const todayDate = new Date().toDateString();
        return sDate === todayDate;
      }
      return t >= cutoff;
    });
  }, [sales, period]);

  const metrics = useMemo(() => {
    const count = filteredSales.length;
    const revenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
    const avg = count > 0 ? revenue / count : 0;
    const meters = filteredSales.reduce((acc, s) => acc + s.totalLinearMeters, 0);
    return { count, revenue, avg, meters };
  }, [filteredSales]);

  const profileSummaries = useMemo(() => {
    const types: ProfileType[] = [
      'ONDULADA',
      'TRAPEZOIDAL',
      'TEJA_ESPANOLA',
      'TRASLUCIDA',
      'PANEL_TERMICO',
      'CUMBRERA',
      'PERFIL',
      'ACCESORIO',
    ];
    return types.map((type) => {
      const items = products.filter((p) => p.profileType === type && p.active);
      const branchStock = items.reduce(
        (acc, p) => acc + (p.stockByBranch[activeBranchId] || 0),
        0
      );
      const allStock = items.reduce(
        (acc, p) =>
          acc + Object.values(p.stockByBranch).reduce((sub, v) => sub + v, 0),
        0
      );
      const colorsSet = new Set<string>();
      items.forEach((p) => p.availableColors.forEach((c) => colorsSet.add(c)));
      const unitLabel = items[0]?.cuttable ? 'ml' : 'uds';
      return {
        type,
        label: PROFILE_LABELS[type],
        itemCount: items.length,
        branchStock,
        allStock,
        unitLabel,
        colors: Array.from(colorsSet),
      };
    });
  }, [products, activeBranchId]);

  const activeCoils = useMemo(
    () => coils.filter((c) => c.status !== 'AGOTADA').slice(0, 6),
    [coils]
  );

  const pendingCuts = useMemo(
    () => cutOrders.filter((c) => c.status !== 'ENTREGADO').slice(0, 5),
    [cutOrders]
  );

  return (
    <div className="space-y-6">
      {/* Top Hero Header matching Screenshot 2 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-[0.16em] uppercase text-[#c2410c] dark:text-orange-400">
            FÁBRICA DE CALAMINAS, PERFILES Y CUBIERTAS METÁLICAS
          </p>
          <h1 className="font-display italic font-extrabold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white uppercase mt-1">
            OPERACIONES ACEROCAL
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Control de bobinas, corte a medida, colores RAL, stock multi-sucursal y facturación para{' '}
            <span className="font-semibold text-[#c2410c] dark:text-orange-400">
              {user.fullName}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('pos')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#c2410c] hover:bg-[#9a3412] text-white font-display font-bold text-xs tracking-wider uppercase shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>VENDER / COTIZAR</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('kardex')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#0b1324] hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-display font-bold text-xs tracking-wider uppercase shadow-sm transition-colors cursor-pointer whitespace-nowrap"
          >
            <Layers className="w-4 h-4" />
            <span>TRASPASAR UNIDADES</span>
          </button>
        </div>
      </div>

      {/* Rendimiento de Ventas Configurable */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-[#c2410c] text-white flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display italic font-extrabold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white uppercase">
                RENDIMIENTO DE VENTAS CONFIGURABLE
              </h2>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-400">
                MONITOREO EN TIEMPO REAL SEGÚN PERÍODO SELECCIONADO
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800">
            {PERIODS.map((p) => {
              const active = p.key === period;
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase transition-colors cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#c2410c] text-white shadow-2xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3 KPI Cards matching Screenshot 2 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 p-5">
            <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              CANTIDAD DE VENTAS ({periodLabel})
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-display font-extrabold text-3xl text-slate-900 dark:text-white tabular-nums">
                {metrics.count}
              </span>
              <span className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                OPERACIONES
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1.5">Transacciones completadas sin anular</p>
          </div>

          <div className="rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/60 p-5">
            <p className="text-[11px] font-bold tracking-wider uppercase text-emerald-700 dark:text-emerald-400">
              INGRESOS DEL PERÍODO ({periodLabel})
            </p>
            <div className="mt-2 font-display font-extrabold text-3xl text-emerald-600 dark:text-emerald-400 tabular-nums">
              {formatBs(metrics.revenue)}
            </div>
            <p className="text-xs text-emerald-700/75 dark:text-emerald-400/75 mt-1.5">
              Recaudación neta facturada
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 p-5">
            <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              TICKET PROMEDIO · METRAJE
            </p>
            <div className="mt-2 font-display font-extrabold text-3xl text-[#c2410c] dark:text-orange-400 tabular-nums">
              {formatBs(metrics.avg)}
            </div>
            <p className="text-xs text-slate-400 mt-1.5 tabular-nums">
              {metrics.meters.toLocaleString('es-BO', { maximumFractionDigits: 1 })} ml cortados en período
            </p>
          </div>
        </div>
      </section>

      {/* Inventario por Línea de Calamina */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-5">
          <div>
            <p className="text-[11px] font-bold tracking-[0.14em] uppercase text-[#c2410c] dark:text-orange-400">
              STOCK DISTRIBUIDO POR PERFIL Y CALIBRE
            </p>
            <h2 className="font-display italic font-extrabold text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white uppercase mt-0.5">
              INVENTARIO POR LÍNEA DE CALAMINA
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('catalog')}
            className="inline-flex items-center gap-1 text-xs font-bold tracking-wider uppercase text-[#c2410c] dark:text-orange-400 hover:underline cursor-pointer whitespace-nowrap"
          >
            <span>ADMINISTRAR CATÁLOGO COMPLETO ({products.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {profileSummaries.map((line) => (
            <button
              key={line.type}
              type="button"
              onClick={() => onNavigate('pos', line.type)}
              className="text-left rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 hover:border-orange-400 dark:hover:border-orange-500 p-4 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                  {line.itemCount} ÍTEMS
                </span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#c2410c] transition-colors" />
              </div>
              <div className="font-display font-bold text-sm text-slate-900 dark:text-white uppercase truncate">
                {line.label}
              </div>
              <div className="mt-2 font-mono-tabular font-bold text-lg text-[#c2410c] dark:text-orange-400">
                {line.branchStock.toLocaleString('es-BO')}{' '}
                <span className="text-xs font-sans font-semibold text-slate-500">
                  {line.unitLabel}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                Total red: {line.allStock.toLocaleString('es-BO')} {line.unitLabel}
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-slate-700/60 flex items-center gap-1 flex-wrap">
                {line.colors.slice(0, 6).map((cCode) => {
                  const col = getColorByCode(cCode);
                  return (
                    <span
                      key={cCode}
                      title={col.name}
                      className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-600"
                      style={{ backgroundColor: col.hex }}
                    />
                  );
                })}
                {line.colors.length > 6 && (
                  <span className="text-[10px] text-slate-400 ml-1">
                    +{line.colors.length - 6}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Bottom 2 Columns: Bobinas Madre por Color RAL + Órdenes de Corte Activas */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Bobinas Madre */}
        <section className="lg:col-span-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                MATERIA PRIMA EN ROLADORAS
              </p>
              <h3 className="font-display italic font-extrabold text-base text-slate-900 dark:text-white uppercase">
                STOCK DE BOBINAS POR COLOR RAL
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('coils')}
              className="text-xs font-bold text-[#c2410c] dark:text-orange-400 hover:underline cursor-pointer"
            >
              Ver todas ({coils.length})
            </button>
          </div>

          <div className="space-y-3">
            {activeCoils.map((coil) => {
              const col = getColorByCode(coil.colorCode);
              const pct = Math.min(100, Math.round((coil.remainingMeters / coil.initialMeters) * 100));
              return (
                <div
                  key={coil.id}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60"
                >
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600 shrink-0"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span className="font-mono-tabular font-bold text-slate-800 dark:text-slate-100">
                        {coil.coilCode}
                      </span>
                      <span className="text-slate-500 dark:text-slate-400 truncate">
                        {col.name} · Cal. {coil.gauge}
                      </span>
                    </div>
                    <span className="font-mono-tabular font-bold text-slate-900 dark:text-white shrink-0">
                      {coil.remainingMeters.toLocaleString('es-BO')} / {coil.initialMeters} ml
                    </span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: col.code === 'RAL-9003' ? '#94A3B8' : col.hex,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Color Palette Mini Legend */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3 text-[11px] text-slate-500">
            {CALAMINA_COLORS.slice(0, 6).map((c) => (
              <span key={c.code} className="inline-flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-slate-300"
                  style={{ backgroundColor: c.hex }}
                />
                <span>{c.name}</span>
              </span>
            ))}
          </div>
        </section>

        {/* Cola de Corte en Planta */}
        <section className="lg:col-span-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-2xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
                PRODUCCIÓN A MEDIDA
              </p>
              <h3 className="font-display italic font-extrabold text-base text-slate-900 dark:text-white uppercase">
                ÓRDENES DE CORTE EN ROLADORA
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('cut-orders')}
              className="text-xs font-bold text-[#c2410c] dark:text-orange-400 hover:underline cursor-pointer"
            >
              Ir a Planta
            </button>
          </div>

          {pendingCuts.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-400">
              No hay órdenes de corte pendientes en planta.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingCuts.map((order) => (
                <div
                  key={order.id}
                  className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Scissors className="w-3.5 h-3.5 text-[#c2410c]" />
                      <span className="font-mono-tabular font-bold text-xs text-slate-900 dark:text-white">
                        {order.orderNumber}
                      </span>
                      <span className="text-[11px] text-slate-400">· {order.invoiceNumber}</span>
                    </div>
                    <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate mt-1">
                      {order.clientName}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {order.machine} ·{' '}
                      <span className="font-mono-tabular font-semibold">
                        {order.totalMeters} ml
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase shrink-0 ${
                      order.status === 'LISTO'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : order.status === 'EN_ROLADORA'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {order.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
