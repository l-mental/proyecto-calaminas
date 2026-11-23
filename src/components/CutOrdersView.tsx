import React, { useState } from 'react';
import { CheckCircle2, Play, Printer, Scissors, Truck } from 'lucide-react';
import { apiFetch } from '../lib/api';
import type { CutOrder, CutOrderStatus } from '../types/calaminas';

interface CutOrdersViewProps {
  cutOrders: CutOrder[];
  onRefresh: () => Promise<void>;
  onPrintCutOrder: (order: CutOrder) => void;
}

export const CutOrdersView: React.FC<CutOrdersViewProps> = ({
  cutOrders,
  onRefresh,
  onPrintCutOrder,
}) => {
  const [filter, setFilter] = useState<CutOrderStatus | 'ALL'>('ALL');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const visibleOrders = cutOrders.filter((o) => filter === 'ALL' || o.status === filter);

  const advanceStatus = async (order: CutOrder, next: CutOrderStatus) => {
    setUpdatingId(order.id);
    try {
      await apiFetch(`/api/cut-orders/${order.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      await onRefresh();
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-wider uppercase text-[#c2410c]">
            PISO DE PRODUCCIÓN Y ROLADORAS
          </p>
          <h2 className="font-display italic font-extrabold text-2xl text-slate-900 dark:text-white uppercase">
            ÓRDENES DE CORTE A MEDIDA
          </h2>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {(['ALL', 'PENDIENTE', 'EN_ROLADORA', 'LISTO', 'ENTREGADO'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider cursor-pointer ${
                filter === st
                  ? 'bg-[#c2410c] text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {st === 'ALL' ? 'TODAS' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {visibleOrders.length === 0 ? (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-12 text-center text-sm text-slate-400">
          No hay órdenes de corte en este estado.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {visibleOrders.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 shadow-2xs flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <Scissors className="w-4 h-4 text-[#c2410c]" />
                      <span className="font-mono-tabular font-extrabold text-sm text-slate-900 dark:text-white">
                        {order.orderNumber}
                      </span>
                      <span className="text-xs text-slate-400">· {order.invoiceNumber}</span>
                      {order.priority === 'URGENTE' && (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold uppercase">
                          URGENTE
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mt-1">
                      {order.clientName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {order.machine} · {order.branchName}
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      order.status === 'ENTREGADO'
                        ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        : order.status === 'LISTO'
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : order.status === 'EN_ROLADORA'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-orange-100 text-[#c2410c] dark:bg-orange-950 dark:text-orange-300'
                    }`}
                  >
                    {order.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Items to Cut */}
                <div className="mt-3 space-y-2">
                  {order.items.map((it, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                          style={{ backgroundColor: it.colorHex }}
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {it.productName}
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {it.colorName} · Cal. {it.gauge}
                            {it.cutNote ? ` · ${it.cutNote}` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0 font-mono-tabular">
                        <div className="font-extrabold text-slate-900 dark:text-white">
                          {it.quantity} uds × {it.lengthMeters.toFixed(2)} m
                        </div>
                        <div className="text-[11px] text-[#c2410c] font-bold">
                          {it.totalLinearMeters} ml
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onPrintCutOrder(order)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Hoja de Corte</span>
                </button>

                <div className="flex items-center gap-2">
                  {order.status === 'PENDIENTE' && (
                    <button
                      type="button"
                      disabled={updatingId === order.id}
                      onClick={() => advanceStatus(order, 'EN_ROLADORA')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Iniciar en Roladora</span>
                    </button>
                  )}
                  {order.status === 'EN_ROLADORA' && (
                    <button
                      type="button"
                      disabled={updatingId === order.id}
                      onClick={() => advanceStatus(order, 'LISTO')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Marcar Listo</span>
                    </button>
                  )}
                  {order.status === 'LISTO' && (
                    <button
                      type="button"
                      disabled={updatingId === order.id}
                      onClick={() => advanceStatus(order, 'ENTREGADO')}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0b1324] hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Entregar al Cliente</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
