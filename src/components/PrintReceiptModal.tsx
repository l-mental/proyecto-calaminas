import React from 'react';
import { Printer, X } from 'lucide-react';
import { formatBs, type CutOrder, type ProformaRecord, type SaleRecord } from '../types/calaminas';

interface PrintReceiptModalProps {
  sale?: SaleRecord | null;
  proforma?: ProformaRecord | null;
  cutOrder?: CutOrder | null;
  onClose: () => void;
}

export const PrintReceiptModal: React.FC<PrintReceiptModalProps> = ({
  sale,
  proforma,
  cutOrder,
  onClose,
}) => {
  if (!sale && !proforma && !cutOrder) return null;

  const isCut = Boolean(cutOrder && !sale && !proforma);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl bg-white text-slate-900 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between no-print">
          <h3 className="font-display font-bold text-sm uppercase tracking-wider">
            {sale
              ? `COMPROBANTE DE VENTA ${sale.invoiceNumber}`
              : proforma
              ? `PROFORMA / COTIZACIÓN ${proforma.proformaNumber}`
              : `ORDEN DE CORTE EN PLANTA ${cutOrder?.orderNumber}`}
          </h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#c2410c] hover:bg-[#9a3412] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div id="printable-document" className="p-8 overflow-y-auto space-y-6 bg-white text-slate-900">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <div className="font-display italic font-extrabold text-2xl tracking-tight">
                ACERO<span className="text-[#c2410c]">CAL</span> S.R.L.
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Fábrica de Calaminas Onduladas, Trapezoidales, Teja Española y Perfiles
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                {sale?.branchName || proforma?.branchName || cutOrder?.branchName} · Bolivia
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                {sale ? 'NOTA DE VENTA' : proforma ? 'PROFORMA COMERCIAL' : 'ORDEN DE CORTE'}
              </div>
              <div className="font-mono-tabular font-extrabold text-lg text-[#c2410c]">
                {sale?.invoiceNumber || proforma?.proformaNumber || cutOrder?.orderNumber}
              </div>
              <div className="text-[11px] text-slate-500 font-mono-tabular">
                {new Date(
                  sale?.createdAt || proforma?.createdAt || cutOrder?.createdAt || Date.now()
                ).toLocaleString('es-BO')}
              </div>
            </div>
          </div>

          {/* Client Info */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">CLIENTE / OBRA</span>
              <div className="font-bold text-slate-900 mt-0.5">
                {sale?.clientName || proforma?.clientName || cutOrder?.clientName}
              </div>
              {(sale?.deliveryAddress || proforma?.notes) && (
                <div className="text-slate-600 mt-0.5">
                  {sale?.deliveryAddress || proforma?.notes}
                </div>
              )}
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-slate-400">
                {isCut ? 'MÁQUINA ROLADORA' : 'NIT / CI · OPERADOR'}
              </span>
              <div className="font-mono-tabular font-bold text-slate-900 mt-0.5">
                {isCut
                  ? cutOrder?.machine
                  : `NIT/CI: ${sale?.clientNit || proforma?.clientNit || '0'}`}
              </div>
              <div className="text-slate-600 mt-0.5">
                {isCut
                  ? `Prioridad: ${cutOrder?.priority}`
                  : `Atendido por: ${sale?.operatorName || proforma?.operatorName}`}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 text-left text-[10px] uppercase tracking-wider text-slate-500">
                <th className="py-2 pr-2">Descripción / Perfil</th>
                <th className="py-2 px-2">Color RAL</th>
                <th className="py-2 px-2">Cal.</th>
                <th className="py-2 px-2 text-right">Largo</th>
                <th className="py-2 px-2 text-right">Cant.</th>
                <th className="py-2 px-2 text-right">Total ml</th>
                {!isCut && <th className="py-2 pl-2 text-right">Subtotal</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(sale?.items || proforma?.items || cutOrder?.items || []).map((item, idx) => (
                <tr key={idx}>
                  <td className="py-2.5 pr-2">
                    <div className="font-bold text-slate-900">{item.productName}</div>
                    {item.cutNote && (
                      <div className="text-[10px] text-orange-700 mt-0.5">Nota: {item.cutNote}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-2">
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        className="w-3 h-3 rounded-full border border-slate-300 inline-block"
                        style={{ backgroundColor: item.colorHex }}
                      />
                      <span>{item.colorName}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-2 font-mono-tabular">{item.gauge}</td>
                  <td className="py-2.5 px-2 text-right font-mono-tabular">
                    {item.lengthMeters.toFixed(2)} m
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono-tabular font-bold">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 px-2 text-right font-mono-tabular">
                    {item.totalLinearMeters.toFixed(1)} ml
                  </td>
                  {!isCut && 'subtotal' in item && typeof item.subtotal === 'number' && (
                    <td className="py-2.5 pl-2 text-right font-mono-tabular font-bold">
                      {formatBs(item.subtotal)}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals & QR Info */}
          {!isCut && (sale || proforma) && (
            <div className="flex flex-col sm:flex-row justify-between gap-4 pt-4 border-t-2 border-slate-200">
              <div className="text-xs text-slate-600 space-y-1">
                {sale && (
                  <>
                    <div>
                      Método de Pago: <strong className="text-slate-900">{sale.paymentMethod}</strong>
                    </div>
                    <div>
                      Metraje Total: <strong className="font-mono-tabular">{sale.totalLinearMeters} ml</strong> ·
                      Área cubierta: <strong className="font-mono-tabular">{sale.totalAreaSqm} m²</strong> ·
                      Peso aprox.: <strong className="font-mono-tabular">{sale.totalWeightKg} kg</strong>
                    </div>
                    {sale.qrTransaction?.voucherId && (
                      <div className="text-emerald-700 font-semibold">
                        Pago QR BNB Confirmado · Voucher: {sale.qrTransaction.voucherId}
                      </div>
                    )}
                  </>
                )}
                {proforma && (
                  <div>
                    Cotización válida hasta:{' '}
                    <strong>{new Date(proforma.validUntil).toLocaleDateString('es-BO')}</strong>
                  </div>
                )}
              </div>

              <div className="w-full sm:w-64 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-mono-tabular font-semibold">
                    {formatBs((sale || proforma)!.subtotal)}
                  </span>
                </div>
                {(sale || proforma)!.discount > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Descuento:</span>
                    <span className="font-mono-tabular">
                      - {formatBs((sale || proforma)!.discount)}
                    </span>
                  </div>
                )}
                {(sale || proforma)!.freightCost > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Flete / Transporte:</span>
                    <span className="font-mono-tabular">
                      {formatBs((sale || proforma)!.freightCost)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-200 text-base font-extrabold">
                  <span>TOTAL:</span>
                  <span className="font-mono-tabular text-[#c2410c]">
                    {formatBs((sale || proforma)!.total)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
