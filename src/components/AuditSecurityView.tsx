import React, { useMemo, useState } from 'react';
import { Lock, ShieldAlert, ShieldCheck } from 'lucide-react';
import type { AuditLogEntry } from '../types/calaminas';

interface AuditSecurityViewProps {
  logs: AuditLogEntry[];
}

export const AuditSecurityView: React.FC<AuditSecurityViewProps> = ({ logs }) => {
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');

  const filtered = useMemo(
    () => logs.filter((l) => moduleFilter === 'ALL' || l.module === moduleFilter),
    [logs, moduleFilter]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold tracking-wider uppercase text-[#c2410c]">
            BITÁCORA DE OPERACIONES &amp; CONTROL INTERNO
          </p>
          <h2 className="font-display italic font-extrabold text-2xl text-slate-900 dark:text-white uppercase">
            SEGURIDAD Y AUDITORÍA DEL SISTEMA
          </h2>
        </div>

        <select
          value={moduleFilter}
          onChange={(e) => setModuleFilter(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold uppercase"
        >
          <option value="ALL">Todos los módulos</option>
          <option value="VENTAS">Ventas</option>
          <option value="INVENTARIO">Inventario y Bobinas</option>
          <option value="PRODUCCION">Producción / Corte</option>
          <option value="CAJA">Arqueo de Caja</option>
          <option value="BNB_QR">Pago QR BNB</option>
          <option value="SEGURIDAD">Accesos y Seguridad</option>
        </select>
      </div>

      {/* Security Safeguards Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase">
              Sesiones Firmadas HMAC-SHA256
            </div>
            <div className="text-[11px] text-slate-500">
              Tokens verificados en servidor + Cookies HttpOnly
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-950 text-[#c2410c] dark:text-orange-400 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase">
              Claves Cifradas Scrypt
            </div>
            <div className="text-[11px] text-slate-500">
              Sal criptográfica única por operador
            </div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase">
              Auditoría Inmutable ({logs.length})
            </div>
            <div className="text-[11px] text-slate-500">
              Registro automático de ventas, anulaciones y traspasos
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs overflow-x-auto">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-400 bg-slate-50/70 dark:bg-slate-800/40">
              <th className="py-3.5 px-4">Fecha / Hora</th>
              <th className="py-3.5 px-3">Módulo</th>
              <th className="py-3.5 px-3">Acción</th>
              <th className="py-3.5 px-3">Detalle</th>
              <th className="py-3.5 px-4">Operador</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  No hay eventos registrados en este módulo.
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 px-4 font-mono-tabular text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('es-BO')}
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-bold text-[10px] uppercase text-slate-700 dark:text-slate-300">
                      {log.module}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                    {log.action}
                  </td>
                  <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{log.detail}</td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {log.actorName} ({log.actorRole})
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
