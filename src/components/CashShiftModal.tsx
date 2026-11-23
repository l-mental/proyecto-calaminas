import React, { useState } from 'react';
import { ArrowDownCircle, ArrowUpCircle, Calculator, Lock, Unlock, X } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { formatBs, type CashRegisterShift } from '../types/calaminas';

interface CashShiftModalProps {
  open: boolean;
  shift: CashRegisterShift | undefined;
  activeBranchId: string;
  onClose: () => void;
  onShiftUpdated: () => Promise<void>;
}

export const CashShiftModal: React.FC<CashShiftModalProps> = ({
  open,
  shift,
  activeBranchId,
  onClose,
  onShiftUpdated,
}) => {
  const [initialCash, setInitialCash] = useState('1000');
  const [movType, setMovType] = useState<'INGRESO' | 'EGRESO'>('EGRESO');
  const [movConcept, setMovConcept] = useState('');
  const [movAmount, setMovAmount] = useState('');
  const [countedCash, setCountedCash] = useState(shift ? String(shift.expectedCash) : '0');
  const [closeNotes, setCloseNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/api/cash-shift/open', {
        method: 'POST',
        body: JSON.stringify({
          branchId: activeBranchId,
          initialCash: Number(initialCash) || 0,
        }),
      });
      await onShiftUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al abrir caja.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shift) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/api/cash-shift/movement', {
        method: 'POST',
        body: JSON.stringify({
          shiftId: shift.id,
          type: movType,
          concept: movConcept,
          amount: Number(movAmount),
        }),
      });
      setMovConcept('');
      setMovAmount('');
      await onShiftUpdated();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar movimiento.');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseShift = async () => {
    if (!shift) return;
    setLoading(true);
    setError(null);
    try {
      await apiFetch('/api/cash-shift/close', {
        method: 'POST',
        body: JSON.stringify({
          shiftId: shift.id,
          countedCash: Number(countedCash) || 0,
          closeNotes,
        }),
      });
      await onShiftUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cerrar turno de caja.');
    } finally {
      setLoading(false);
    }
  };

  const difference = shift ? (Number(countedCash) || 0) - shift.expectedCash : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display italic font-extrabold text-lg text-slate-900 dark:text-white uppercase">
                {shift ? `ARQUEO DE CAJA · TURNO #${shift.shiftNumber}` : 'APERTURA DE TURNO DE CAJA'}
              </h3>
              <p className="text-xs text-slate-500">
                {shift
                  ? `Abierto por ${shift.openedBy} · ${new Date(shift.openedAt).toLocaleString('es-BO')}`
                  : 'Define el fondo inicial en efectivo para comenzar a operar en mostrador'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5">
          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3 text-xs text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {!shift ? (
            <form onSubmit={handleOpenShift} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1.5">
                  EFECTIVO INICIAL EN CAJA (BS)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={initialCash}
                  onChange={(e) => setInitialCash(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-base font-mono-tabular font-bold text-slate-900 dark:text-white"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>ABRIR TURNO DE CAJA</span>
              </button>
            </form>
          ) : (
            <>
              {/* Summary Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Fondo Inicial</div>
                  <div className="font-mono-tabular font-bold text-sm text-slate-900 dark:text-white mt-1">
                    {formatBs(shift.initialCash)}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Ventas Efectivo</div>
                  <div className="font-mono-tabular font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                    {formatBs(shift.cashSales)}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700">
                  <div className="text-[10px] font-bold uppercase text-slate-400">Cobros QR BNB</div>
                  <div className="font-mono-tabular font-bold text-sm text-sky-600 dark:text-sky-400 mt-1">
                    {formatBs(shift.qrSales)}
                  </div>
                </div>
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
                  <div className="text-[10px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
                    Efectivo Esperado
                  </div>
                  <div className="font-mono-tabular font-extrabold text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                    {formatBs(shift.expectedCash)}
                  </div>
                </div>
              </div>

              {/* Register Cash Movement */}
              <form
                onSubmit={handleAddMovement}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
              >
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Registrar Ingreso / Egreso de Caja Chica
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  <select
                    value={movType}
                    onChange={(e) => setMovType(e.target.value as 'INGRESO' | 'EGRESO')}
                    className="sm:col-span-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-100"
                  >
                    <option value="EGRESO">Egreso (-)</option>
                    <option value="INGRESO">Ingreso (+)</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={movConcept}
                    onChange={(e) => setMovConcept(e.target.value)}
                    placeholder="Concepto (ej. Pago flete, compra flejes)"
                    className="sm:col-span-6 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                  />
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={movAmount}
                    onChange={(e) => setMovAmount(e.target.value)}
                    placeholder="Bs"
                    className="sm:col-span-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono-tabular text-slate-800 dark:text-slate-100"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Registrar Movimiento
                </button>
              </form>

              {/* Recent Movements */}
              {shift.movements.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Movimientos del turno
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-1.5">
                    {shift.movements.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800"
                      >
                        <div className="flex items-center gap-2">
                          {m.type === 'INGRESO' ? (
                            <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <ArrowDownCircle className="w-3.5 h-3.5 text-red-500" />
                          )}
                          <span className="text-slate-700 dark:text-slate-200">{m.concept}</span>
                        </div>
                        <span
                          className={`font-mono-tabular font-bold ${
                            m.type === 'INGRESO' ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {m.type === 'INGRESO' ? '+' : '-'} {formatBs(m.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Shift Section */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                  Cierre y Arqueo de Efectivo Físico
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Efectivo Contado en Gaveta (Bs)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={countedCash}
                      onChange={(e) => setCountedCash(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-mono-tabular font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Diferencia (Sobrante / Faltante)
                    </label>
                    <div
                      className={`px-3 py-2.5 rounded-xl border font-mono-tabular font-bold text-sm ${
                        Math.abs(difference) < 0.01
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-300'
                          : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300'
                      }`}
                    >
                      {difference >= 0 ? '+' : ''}
                      {formatBs(difference)}
                    </div>
                  </div>
                </div>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Observaciones de cierre de turno..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                />
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleCloseShift}
                  className="w-full py-3 rounded-xl bg-[#0b1324] hover:bg-slate-800 text-white font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>CERRAR TURNO Y GUARDAR ARQUEO</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
