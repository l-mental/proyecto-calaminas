import React, { useMemo, useState } from 'react';
import { Ban, Printer, QrCode, Search, Truck } from 'lucide-react';
import { apiFetch } from '../lib/api';
import {
  type DispatchStatus,
  formatBs,
  type PaymentMethod,
  type SaleRecord,
} from '../types/calaminas';

interface SalesHistoryViewProps {
  sales: SaleRecord[];
  onRefresh: () => Promise<void>;
  onPrintSale: (sale: SaleRecord) => void;
}

const DISPATCH_LABELS: Record<DispatchStatus, string> = {
  EN_PLANTA: 'En Planta',
  CARGANDO_CAMION: 'Cargando Camión',
  EN_RUTA: 'En Ruta a Obra',
  ENTREGADO: 'Entregado',
};

const DISPATCH_COLORS: Record<DispatchStatus, string> = {
  EN_PLANTA: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700',
  CARGANDO_CAMION: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800',
  EN_RUTA: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800',
  ENTREGADO: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
};

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({
  sales,
  onRefresh,
  onPrintSale,
}) => {
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'ALL'>('ALL');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [updatingDispatchId, setUpdatingDispatchId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sales.filter((s) => {
      if (methodFilter !== 'ALL' && s.paymentMethod !== methodFilter) return false;
      if (!q) return true;
      return (
        s.invoiceNumber.toLowerCase().includes(q) ||
        s.clientName.toLowerCase().includes(q) ||
        s.clientNit.toLowerCase().includes(q) ||
        (s.qrTransaction?.voucherId || '').toLowerCase().includes(q)
      );
    });
  }, [sales, search, methodFilter]);

  const handleCancelSale = async (sale: SaleRecord) => {
    setCancellingId(sale.id);
    try {
      await apiFetch(`/api/sales/${sale.id}/cancel`, { method: 'POST' });
      await onRefresh();
    } finally {
      setCancellingId(null);
    }
  };

  const handleUpdateDispatch = async (saleId: string, dispatchStatus: DispatchStatus) => {
    setUpdatingDispatchId(saleId);
    try {
      await apiFetch(`/api/sales/${saleId}/dispatch`, {
        method: 'PATCH',
        body: JSON.stringify({ dispatchStatus }),
      });
      await onRefresh();
    } finally {
      setUpdatingDispatchId(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-wider uppercase text-[#c2410c]">
            FACTURACIÓN &amp; DESPACHOS A OBRA
          </p>
          <h2 className="font-display italic font-extrabold text-2xl text-slate-900 dark:text-white uppercase">
            HISTORIAL DE VENTAS ({filtered.length})
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="N° factura, cliente, voucher..."
              className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
            />
          </div>
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value as PaymentMethod | 'ALL')}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold uppercase"
          >
            <option value="ALL">Todos los pagos</option>
            <option value="EFECTIVO">Efectivo</option>
            <option value="QR_BNB">Pago QR BNB</option>
            <option value="MIXTO">Mixto</option>
            <option value="CREDITO">Crédito</option>
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 bg-slate-50/70 dark:bg-slate-800/40">
              <th className="py-3.5 px-4">Comprobante</th>
              <th className="py-3.5 px-3">Cliente / NIT</th>
              <th className="py-3.5 px-3">Detalle Calaminas</th>
              <th className="py-3.5 px-3">Despacho</th>
              <th className="py-3.5 px-3">Pago</th>
              <th className="py-3.5 px-3 text-right">Metraje</th>
              <th className="py-3.5 px-3 text-right">Total</th>
              <th className="py-3.5 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.map((s) => {
              const currentDispatch: DispatchStatus = s.dispatchStatus || 'EN_PLANTA';
              return (
                <tr
                  key={s.id}
                  className={`hover:bg-slate-50/70 dark:hover:bg-slate-800/40 ${
                    s.status === 'ANULADA' ? 'opacity-50' : ''
                  }`}
                >
                  <td className="py-3.5 px-4">
                    <div className="font-mono-tabular font-bold text-slate-900 dark:text-white">
                      {s.invoiceNumber}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono-tabular">
                      {new Date(s.createdAt).toLocaleString('es-BO')}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-bold text-slate-800 dark:text-slate-100">
                      {s.clientName}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      NIT: {s.clientNit} · {s.branchName}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="flex flex-wrap gap-1.5">
                      {s.items.slice(0, 2).map((it, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300"
                        >
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-slate-300"
                            style={{ backgroundColor: it.colorHex }}
                          />
                          <span>
                            {it.quantity}× {it.colorName} ({it.lengthMeters}m)
                          </span>
                        </span>
                      ))}
                      {s.items.length > 2 && (
                        <span className="text-[10px] text-slate-400">
                          +{s.items.length - 2} más
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-slate-500">
                        <Truck className="w-3 h-3 text-[#c2410c]" />
                        <span>
                          {s.deliveryType === 'ENVIO_OBRA' ? 'Envío a Obra' : 'Retiro Planta'}
                        </span>
                      </div>
                      {s.status !== 'ANULADA' && (
                        <div>
                          <select
                            disabled={updatingDispatchId === s.id}
                            value={currentDispatch}
                            onChange={(e) =>
                              handleUpdateDispatch(s.id, e.target.value as DispatchStatus)
                            }
                            aria-label={`Estado de despacho ${s.invoiceNumber}`}
                            className={`px-2 py-1 rounded-lg border text-[10px] font-bold uppercase cursor-pointer focus:outline-none ${DISPATCH_COLORS[currentDispatch]}`}
                          >
                            {(Object.keys(DISPATCH_LABELS) as DispatchStatus[]).map((st) => (
                              <option
                                key={st}
                                value={st}
                                className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                              >
                                {DISPATCH_LABELS[st]}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      {s.deliveryAddress && (
                        <div className="text-[10px] text-slate-400 truncate max-w-[160px]" title={s.deliveryAddress}>
                          {s.deliveryAddress}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-3">
                    <div className="font-bold uppercase text-slate-700 dark:text-slate-200">
                      {s.paymentMethod}
                    </div>
                    {s.qrTransaction?.voucherId && (
                      <div className="inline-flex items-center gap-1 text-[10px] text-emerald-600 font-mono-tabular">
                        <QrCode className="w-3 h-3" />
                        <span>{s.qrTransaction.voucherId}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono-tabular">
                    {s.totalLinearMeters} ml
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="font-mono-tabular font-extrabold text-slate-900 dark:text-white">
                      {formatBs(s.total)}
                    </div>
                    {s.status === 'ANULADA' && (
                      <span className="text-[10px] font-bold text-red-600 uppercase">ANULADA</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onPrintSale(s)}
                        className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                        title="Imprimir comprobante"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      {s.status !== 'ANULADA' && (
                        <button
                          type="button"
                          disabled={cancellingId === s.id}
                          onClick={() => handleCancelSale(s)}
                          className="p-2 rounded-lg border border-red-200 dark:border-red-900 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                          title="Anular venta y devolver stock"
                        >
                          <Ban className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
