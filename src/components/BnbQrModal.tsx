import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  X,
  XCircle,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import { formatBs, type BnbQrTransaction } from '../types/calaminas';

interface BnbQrModalProps {
  open: boolean;
  amount: number;
  gloss: string;
  clientName: string;
  onClose: () => void;
  onPaymentConfirmed: (tx: BnbQrTransaction) => void;
}

export const BnbQrModal: React.FC<BnbQrModalProps> = ({
  open,
  amount,
  gloss,
  clientName,
  onClose,
  onPaymentConfirmed,
}) => {
  const [tx, setTx] = useState<BnbQrTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [simBankId, setSimBankId] = useState(1);
  const [simPayer, setSimPayer] = useState(
    clientName && clientName !== 'VENTA MOSTRADOR (CONSUMIDOR FINAL)'
      ? clientName
      : 'JUAN PEREZ MAMANI'
  );

  useEffect(() => {
    if (!open) {
      setTx(null);
      setError(null);
      return;
    }

    let cancelled = false;
    const createQr = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiFetch<BnbQrTransaction>('/api/bnb/generate-qr', {
          method: 'POST',
          body: JSON.stringify({
            amount,
            gloss,
            additionalData: clientName,
            currency: 'BOB',
            singleUse: true,
          }),
        });
        if (!cancelled) {
          setTx(res);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error al generar el QR BNB.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    createQr();
    return () => {
      cancelled = true;
    };
  }, [open, amount, gloss, clientName]);

  // Automatic polling for ReceiveNotification / getQRStatusAsync
  useEffect(() => {
    if (!open || !tx || tx.statusId !== 1) return;

    const timer = setInterval(async () => {
      try {
        const res = await apiFetch<{
          statusId: 1 | 2 | 3 | 4;
          transaction?: BnbQrTransaction;
        }>(`/api/bnb/qr-status/${tx.qrId}`);
        if (res.transaction) {
          setTx(res.transaction);
        }
      } catch {
        // Keep polling silently
      }
    }, 3000);

    return () => clearInterval(timer);
  }, [open, tx]);

  if (!open) return null;

  const handleCheckStatus = async () => {
    if (!tx) return;
    setChecking(true);
    try {
      const res = await apiFetch<{
        statusId: 1 | 2 | 3 | 4;
        transaction?: BnbQrTransaction;
      }>(`/api/bnb/qr-status/${tx.qrId}`);
      if (res.transaction) setTx(res.transaction);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al consultar estado QR.');
    } finally {
      setChecking(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!tx) return;
    setSimulating(true);
    setError(null);
    try {
      const res = await apiFetch<{
        success: boolean;
        message: string;
        transaction?: BnbQrTransaction;
      }>(`/api/bnb/simulate-payment/${tx.qrId}`, {
        method: 'POST',
        body: JSON.stringify({
          originName: simPayer,
          sourceBankId: simBankId,
        }),
      });
      if (res.transaction) {
        setTx(res.transaction);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al simular notificación BNB.');
    } finally {
      setSimulating(false);
    }
  };

  const handleCancelQr = async () => {
    if (tx && tx.statusId === 1) {
      await apiFetch(`/api/bnb/cancel-qr/${tx.qrId}`, { method: 'POST' }).catch(() => {});
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
      <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* BNB Green-Accented Header */}
        <div className="px-6 py-4 bg-[#009b3a] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base tracking-tight">
                PAGO QR SIMPLE · BNB OPEN BANKING
              </h3>
              <p className="text-[11px] text-emerald-100">
                Banco Nacional de Bolivia · Interoperable con todos los bancos
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancelQr}
            className="p-1.5 rounded-lg hover:bg-white/15 transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-[#009b3a]" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Generando QR Simple (getQRWithImageAsync)...
              </span>
            </div>
          )}

          {error && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 p-3.5 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tx && !loading && (
            <>
              <div className="flex flex-col sm:flex-row items-center gap-5">
                {/* QR Image Container */}
                <div className="relative p-3 rounded-2xl bg-white border-2 border-slate-200 shadow-xs shrink-0">
                  {tx.qrImageBase64 ? (
                    <img
                      src={`data:image/png;base64,${tx.qrImageBase64}`}
                      alt={`QR BNB #${tx.qrId}`}
                      className="w-44 h-44 object-contain"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center bg-slate-100 text-slate-400">
                      <QrCode className="w-16 h-16" />
                    </div>
                  )}
                  {tx.statusId === 2 && (
                    <div className="absolute inset-0 bg-emerald-600/90 rounded-xl flex flex-col items-center justify-center text-white">
                      <CheckCircle2 className="w-12 h-12 mb-1" />
                      <span className="font-display font-bold text-sm uppercase">PAGADO</span>
                    </div>
                  )}
                </div>

                {/* Transaction Metadata */}
                <div className="flex-1 w-full space-y-2.5 text-xs">
                  <div>
                    <span className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                      MONTO A COBRAR (BOB)
                    </span>
                    <div className="font-display font-extrabold text-2xl text-slate-900 dark:text-white tabular-nums">
                      {formatBs(tx.amount)}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">QR ID</span>
                      <div className="font-mono-tabular font-bold text-slate-800 dark:text-slate-200">
                        #{tx.qrId}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase font-bold">
                        VENCIMIENTO
                      </span>
                      <div className="font-mono-tabular font-semibold text-slate-700 dark:text-slate-300">
                        {tx.expirationDate}
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">GLOSA</span>
                    <div className="font-semibold text-slate-700 dark:text-slate-200 truncate">
                      {tx.gloss}
                    </div>
                  </div>

                  <div className="pt-1">
                    {tx.statusId === 1 && (
                      <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Esperando transferencia QR (statusId: 1)
                      </span>
                    )}
                    {tx.statusId === 2 && (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        Pago confirmado · Voucher {tx.voucherId}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Confirmed Payment Details */}
              {tx.statusId === 2 && (
                <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 text-xs space-y-1.5">
                  <div className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4" />
                    Notificación ReceiveNotification recibida correctamente
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-emerald-900 dark:text-emerald-200 pt-1">
                    <div>
                      <span className="opacity-70">Titular origen:</span>{' '}
                      <strong>{tx.originName}</strong>
                    </div>
                    <div>
                      <span className="opacity-70">Banco:</span>{' '}
                      <strong>{tx.sourceBankName}</strong>
                    </div>
                    <div>
                      <span className="opacity-70">VoucherId:</span>{' '}
                      <strong className="font-mono-tabular">{tx.voucherId}</strong>
                    </div>
                    <div>
                      <span className="opacity-70">Fecha/Hora:</span>{' '}
                      <strong className="font-mono-tabular">{tx.transactionDateTime}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Sandbox Simulator Box when waiting */}
              {tx.statusId === 1 && tx.mode === 'SIMULADOR' && (
                <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                      <Smartphone className="w-3.5 h-3.5 text-[#009b3a]" />
                      Simulador de App Bancaria (Pruebas Webhook BNB)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      value={simPayer}
                      onChange={(e) => setSimPayer(e.target.value)}
                      placeholder="Titular pagador"
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                    />
                    <select
                      value={simBankId}
                      onChange={(e) => setSimBankId(Number(e.target.value))}
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                    >
                      <option value={1}>Banco Nacional de Bolivia (BNB)</option>
                      <option value={2}>Banco Mercantil Santa Cruz</option>
                      <option value={3}>Banco Bisa</option>
                      <option value={4}>Banco de Crédito (BCP)</option>
                      <option value={5}>Banco Unión</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    disabled={simulating}
                    onClick={handleSimulatePayment}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#009b3a] hover:bg-[#007f2f] text-white font-display font-bold text-xs tracking-wider uppercase transition-colors cursor-pointer"
                  >
                    {simulating
                      ? 'Enviando ReceiveNotification...'
                      : 'Simular Pago QR del Cliente (Webhook BNB)'}
                  </button>
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={handleCheckStatus}
                  disabled={checking || tx.statusId === 2}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checking ? 'animate-spin' : ''}`} />
                  <span>Verificar Estado</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCancelQr}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  {tx.statusId === 2 && (
                    <button
                      type="button"
                      onClick={() => onPaymentConfirmed(tx)}
                      className="px-5 py-2.5 rounded-xl bg-[#c2410c] hover:bg-[#9a3412] text-white font-display font-bold text-xs tracking-wider uppercase cursor-pointer"
                    >
                      Emitir Venta &amp; Orden de Corte
                    </button>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
