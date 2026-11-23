import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  KeyRound,
  Plus,
  QrCode,
  RefreshCw,
  Shield,
  Truck,
  Users,
  Webhook,
  XCircle,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import {
  BnbPublicConfig,
  BnbQrTransaction,
  Branch,
  CALAMINA_COLORS,
  Client,
  formatBs,
  GAUGE_SPECS,
  getColorByCode,
  PurchaseOrder,
  SaleRecord,
  StaffUser,
} from '../types/calaminas';

/* -------------------------------------------------------------------------- */
/* 1. Compras de Bobinas / Proveedores                                         */
/* -------------------------------------------------------------------------- */
export const PurchasesView: React.FC<{
  purchases: PurchaseOrder[];
  branches: Branch[];
  activeBranchId: string;
  onRefresh: () => Promise<void>;
}> = ({ purchases, branches, activeBranchId, onRefresh }) => {
  const [supplier, setSupplier] = useState('Ternium / Acero Sur');
  const [colorCode, setColorCode] = useState('RAL-3009');
  const [gauge, setGauge] = useState('28');
  const [meters, setMeters] = useState('1400');
  const [weight, setWeight] = useState('3750');
  const [cost, setCost] = useState('34800');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await apiFetch('/api/purchases', {
        method: 'POST',
        body: JSON.stringify({
          supplier,
          branchId: activeBranchId,
          description: `Bobina Madre ${getColorByCode(colorCode).name} Cal. ${gauge} x 1200mm`,
          colorCode,
          gauge,
          metersBought: Number(meters),
          weightKg: Number(weight),
          totalCostBs: Number(cost),
        }),
      });
      await onRefresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <section className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#c2410c] text-white flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-display italic font-extrabold text-base text-slate-900 dark:text-white uppercase">
              INGRESAR COMPRA DE BOBINA
            </h2>
            <p className="text-xs text-slate-500">
              Registra compra a proveedor y carga automáticamente la bobina al stock
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold uppercase text-slate-500 mb-1">Proveedor / Siderúrgica</label>
            <input
              type="text"
              required
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Color RAL</label>
              <select
                value={colorCode}
                onChange={(e) => setColorCode(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
              >
                {CALAMINA_COLORS.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Calibre</label>
              <select
                value={gauge}
                onChange={(e) => setGauge(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
              >
                {GAUGE_SPECS.map((g) => (
                  <option key={g.gauge} value={g.gauge}>
                    Cal. {g.gauge}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Metros (ml)</label>
              <input
                type="number"
                required
                value={meters}
                onChange={(e) => setMeters(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono-tabular font-bold"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Peso (kg)</label>
              <input
                type="number"
                required
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono-tabular font-bold"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Costo (Bs)</label>
              <input
                type="number"
                required
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono-tabular font-bold"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-[#c2410c] text-white font-display font-bold uppercase tracking-wider cursor-pointer"
          >
            {saving ? 'Registrando...' : 'Registrar Compra e Ingresar Bobina'}
          </button>
        </form>
      </section>

      <section className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <h2 className="font-display italic font-extrabold text-base text-slate-900 dark:text-white uppercase">
          HISTORIAL DE COMPRAS A PROVEEDORES ({purchases.length})
        </h2>
        <div className="space-y-3">
          {purchases.map((p) => (
            <div
              key={p.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono-tabular font-bold text-[#c2410c]">{p.orderNumber}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{p.supplier}</span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 mt-1">{p.description}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  {p.branchName} · {p.metersBought} ml · {p.weightKg} kg
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="font-mono-tabular font-extrabold text-sm text-slate-900 dark:text-white">
                  {formatBs(p.totalCostBs)}
                </div>
                <span className="text-[10px] font-bold uppercase text-emerald-600">{p.status}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 2. Finanzas y Reportes                                                     */
/* -------------------------------------------------------------------------- */
export const FinanceReportsView: React.FC<{
  sales: SaleRecord[];
  purchases: PurchaseOrder[];
}> = ({ sales, purchases }) => {
  const validSales = useMemo(() => sales.filter((s) => s.status !== 'ANULADA'), [sales]);

  const summary = useMemo(() => {
    const totalRev = validSales.reduce((a, s) => a + s.total, 0);
    const cashRev = validSales.reduce((a, s) => a + s.cashPaid, 0);
    const qrRev = validSales.reduce((a, s) => a + s.qrPaid, 0);
    const creditRev = validSales.reduce((a, s) => a + s.creditAmount, 0);
    const totalMeters = validSales.reduce((a, s) => a + s.totalLinearMeters, 0);
    const totalPurchases = purchases.reduce((a, p) => a + p.totalCostBs, 0);
    return { totalRev, cashRev, qrRev, creditRev, totalMeters, totalPurchases };
  }, [validSales, purchases]);

  const byColor = useMemo(() => {
    const map = new Map<string, { name: string; hex: string; meters: number; revenue: number }>();
    for (const s of validSales) {
      for (const it of s.items) {
        if (!it.cuttable) continue;
        const cur = map.get(it.colorCode) || {
          name: it.colorName,
          hex: it.colorHex,
          meters: 0,
          revenue: 0,
        };
        cur.meters += it.totalLinearMeters;
        cur.revenue += it.subtotal;
        map.set(it.colorCode, cur);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
  }, [validSales]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold tracking-wider uppercase text-[#c2410c]">
          ANÁLISIS FINANCIERO Y METRAJE VENDIDO
        </p>
        <h2 className="font-display italic font-extrabold text-2xl text-slate-900 dark:text-white uppercase">
          FINANZAS Y REPORTES DE PLANTA
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-bold uppercase text-slate-400">Facturación Total</div>
          <div className="font-display font-extrabold text-2xl text-slate-900 dark:text-white mt-1 tabular-nums">
            {formatBs(summary.totalRev)}
          </div>
          <div className="text-xs text-slate-400 mt-1">{validSales.length} ventas válidas</div>
        </div>
        <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800">
          <div className="text-[11px] font-bold uppercase text-emerald-700 dark:text-emerald-400">
            Recaudado QR BNB
          </div>
          <div className="font-display font-extrabold text-2xl text-emerald-600 dark:text-emerald-400 mt-1 tabular-nums">
            {formatBs(summary.qrRev)}
          </div>
          <div className="text-xs text-emerald-700/75 mt-1">Acreditación directa en cuenta</div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-bold uppercase text-slate-400">Efectivo &amp; Crédito</div>
          <div className="font-display font-extrabold text-2xl text-[#c2410c] mt-1 tabular-nums">
            {formatBs(summary.cashRev)}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Créditos por cobrar: {formatBs(summary.creditRev)}
          </div>
        </div>
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-[11px] font-bold uppercase text-slate-400">Total Metros Laminados</div>
          <div className="font-display font-extrabold text-2xl text-slate-900 dark:text-white mt-1 font-mono-tabular">
            {summary.totalMeters.toLocaleString('es-BO')} ml
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Compras bobinas: {formatBs(summary.totalPurchases)}
          </div>
        </div>
      </div>

      {/* Breakdown by Color RAL */}
      <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <h3 className="font-display italic font-extrabold text-base text-slate-900 dark:text-white uppercase">
          VENTAS POR COLOR DE CALAMINA
        </h3>
        <div className="space-y-3">
          {byColor.map((row) => (
            <div
              key={row.name}
              className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700 text-xs"
            >
              <div className="flex items-center gap-3">
                <span
                  className="w-6 h-6 rounded-lg border border-slate-300"
                  style={{ backgroundColor: row.hex }}
                />
                <span className="font-bold text-slate-900 dark:text-white">{row.name}</span>
              </div>
              <div className="flex items-center gap-6 font-mono-tabular">
                <span className="text-slate-500">{row.meters.toFixed(1)} ml</span>
                <span className="font-extrabold text-[#c2410c]">{formatBs(row.revenue)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 3. Clientes y Constructoras                                                */
/* -------------------------------------------------------------------------- */
export const ClientsView: React.FC<{
  clients: Client[];
  onRefresh: () => Promise<void>;
}> = ({ clients, onRefresh }) => {
  const [name, setName] = useState('');
  const [nit, setNit] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<Client['type']>('CONSTRUCTORA');
  const [creditLimit, setCreditLimit] = useState('15000');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/clients', {
      method: 'POST',
      body: JSON.stringify({
        name,
        nitCi: nit,
        phone,
        address,
        type,
        creditLimit: Number(creditLimit) || 0,
      }),
    });
    setName('');
    setNit('');
    setPhone('');
    setAddress('');
    await onRefresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <section className="lg:col-span-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <Users className="w-5 h-5 text-[#c2410c]" />
          <h2 className="font-display italic font-extrabold text-base text-slate-900 dark:text-white uppercase">
            NUEVO CLIENTE / OBRA
          </h2>
        </div>
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Razón Social / Nombre"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
          />
          <div className="grid grid-cols-2 gap-2.5">
            <input
              type="text"
              value={nit}
              onChange={(e) => setNit(e.target.value)}
              placeholder="NIT / CI"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-mono-tabular"
            />
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Teléfono / WhatsApp"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-mono-tabular"
            />
          </div>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Dirección de entrega / obra"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
          />
          <div className="grid grid-cols-2 gap-2.5">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as Client['type'])}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-bold"
            >
              <option value="CONSTRUCTORA">Constructora</option>
              <option value="FERRETERIA">Ferretería</option>
              <option value="ESTANCIA">Estancia</option>
              <option value="PARTICULAR">Particular</option>
            </select>
            <input
              type="number"
              value={creditLimit}
              onChange={(e) => setCreditLimit(e.target.value)}
              placeholder="Límite Crédito Bs"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-mono-tabular"
            />
          </div>
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#c2410c] text-white font-display font-bold uppercase tracking-wider cursor-pointer"
          >
            Guardar Cliente
          </button>
        </form>
      </section>

      <section className="lg:col-span-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <h2 className="font-display italic font-extrabold text-base text-slate-900 dark:text-white uppercase">
          DIRECTORIO DE CLIENTES Y LÍNEAS DE CRÉDITO ({clients.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {clients.map((c) => (
            <div
              key={c.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-slate-900 dark:text-white">{c.name}</span>
                <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-[10px] font-bold uppercase">
                  {c.type}
                </span>
              </div>
              <div className="text-slate-500 font-mono-tabular">
                NIT/CI: {c.nitCi} · Tel: {c.phone}
              </div>
              <div className="text-slate-400 truncate">{c.address}</div>
              {c.creditLimit > 0 && (
                <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700 flex justify-between font-mono-tabular">
                  <span>Crédito: {formatBs(c.creditLimit)}</span>
                  <span className={c.currentDebt > 0 ? 'text-[#c2410c] font-bold' : 'text-emerald-600'}>
                    Deuda: {formatBs(c.currentDebt)}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 4. Equipo / Staff                                                          */
/* -------------------------------------------------------------------------- */
export const StaffView: React.FC<{
  staff: StaffUser[];
  branches: Branch[];
  currentUser: StaffUser;
  onRefresh: () => Promise<void>;
}> = ({ staff, branches, currentUser, onRefresh }) => {
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<StaffUser['role']>('VENDEDOR');
  const [branchId, setBranchId] = useState(branches[0]?.id || 'SUC-01');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch('/api/staff', {
        method: 'POST',
        body: JSON.stringify({ username, fullName, role, branchId, password }),
      });
      setUsername('');
      setFullName('');
      setPassword('');
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear operador.');
    }
  };

  const toggleActive = async (member: StaffUser) => {
    await apiFetch(`/api/staff/${member.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !member.active }),
    });
    await onRefresh();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <section className="lg:col-span-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-[#c2410c]" />
          <h2 className="font-display italic font-extrabold text-base text-slate-900 dark:text-white uppercase">
            CREAR OPERADOR / VENDEDOR
          </h2>
        </div>
        {error && (
          <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs">{error}</div>
        )}
        <form onSubmit={handleCreate} className="space-y-3 text-xs">
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nombre completo"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
          />
          <input
            type="text"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Usuario de acceso (ej. maria.ventas)"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
          />
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Clave inicial (mín. 6 caracteres)"
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
          />
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as StaffUser['role'])}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-bold"
          >
            <option value="VENDEDOR">Vendedor Mostrador</option>
            <option value="OPERADOR_CORTE">Operador de Roladora</option>
            <option value="ALMACENERO">Almacenero / Bobinas</option>
            <option value="ADMIN">Administrador</option>
          </select>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
          >
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={currentUser.role !== 'ADMIN'}
            className="w-full py-3 rounded-xl bg-[#c2410c] disabled:opacity-50 text-white font-display font-bold uppercase tracking-wider cursor-pointer"
          >
            Registrar Usuario
          </button>
        </form>
      </section>

      <section className="lg:col-span-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
        <h2 className="font-display italic font-extrabold text-base text-slate-900 dark:text-white uppercase">
          EQUIPO DE PLANTA Y MOSTRADOR ({staff.length})
        </h2>
        <div className="space-y-3">
          {staff.map((m) => (
            <div
              key={m.id}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="font-bold text-slate-900 dark:text-white">{m.fullName}</div>
                <div className="text-slate-500 font-mono-tabular">
                  @{m.username} · {m.role} · {branches.find((b) => b.id === m.branchId)?.name}
                </div>
              </div>
              {currentUser.role === 'ADMIN' && m.id !== currentUser.id && (
                <button
                  type="button"
                  onClick={() => toggleActive(m)}
                  className={`px-3 py-1.5 rounded-lg font-bold uppercase text-[10px] cursor-pointer ${
                    m.active
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {m.active ? 'Activo' : 'Inactivo'}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* 5. Configuración API Market BNB Pago QR & Monitor                          */
/* -------------------------------------------------------------------------- */
export const BnbConfigView: React.FC<{
  config: BnbPublicConfig;
  qrTransactions: BnbQrTransaction[];
  onRefresh: () => Promise<void>;
}> = ({ config, qrTransactions, onRefresh }) => {
  const [mode, setMode] = useState<'SIMULADOR' | 'BNB_API'>(config.mode);
  const [baseUrl, setBaseUrl] = useState(config.baseUrl);
  const [accountId, setAccountId] = useState('');
  const [authorizationId, setAuthorizationId] = useState('');
  const [destinationAccountId, setDestinationAccountId] = useState(config.destinationAccountId);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    try {
      await apiFetch('/api/bnb/config', {
        method: 'POST',
        body: JSON.stringify({
          mode,
          baseUrl,
          accountId,
          authorizationId,
          destinationAccountId,
        }),
      });
      setAccountId('');
      setAuthorizationId('');
      await onRefresh();
      setStatusMsg({ ok: true, text: 'Configuración BNB QR guardada en el servidor.' });
    } catch (err) {
      setStatusMsg({
        ok: false,
        text: err instanceof Error ? err.message : 'Error al guardar configuración.',
      });
    }
  };

  const handleTestToken = async () => {
    setTesting(true);
    setStatusMsg(null);
    try {
      const res = await apiFetch<{ success: boolean; message: string }>('/api/bnb/test-token', {
        method: 'POST',
      });
      setStatusMsg({ ok: res.success, text: res.message });
    } catch (err) {
      setStatusMsg({
        ok: false,
        text: err instanceof Error ? err.message : 'No se pudo obtener token BNB.',
      });
    } finally {
      setTesting(false);
    }
  };

  const webhookFullUrl = `${window.location.origin}${config.webhookPath}`;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold tracking-wider uppercase text-[#009b3a]">
          BANCO NACIONAL DE BOLIVIA · OPEN BANKING API MARKET
        </p>
        <h2 className="font-display italic font-extrabold text-2xl text-slate-900 dark:text-white uppercase">
          INTEGRACIÓN PAGO QR SIMPLE &amp; NOTIFICACIONES V2
        </h2>
      </div>

      {statusMsg && (
        <div
          className={`rounded-xl px-4 py-3 text-xs font-semibold flex items-center gap-2 ${
            statusMsg.ok
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {statusMsg.ok ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <section className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5">
            <KeyRound className="w-5 h-5 text-[#009b3a]" />
            <h3 className="font-display font-bold text-base uppercase text-slate-900 dark:text-white">
              Credenciales y Modo de Operación
            </h3>
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                Modo de Entorno
              </label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as 'SIMULADOR' | 'BNB_API')}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-bold"
              >
                <option value="SIMULADOR">Simulador Local BNB (Pruebas / Demo)</option>
                <option value="BNB_API">API Market BNB Real (Test / Producción)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">Base URL BNB</label>
              <input
                type="url"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-mono-tabular"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                accountId {config.hasAccountId && <span className="text-emerald-600">(Configurado)</span>}
              </label>
              <input
                type="password"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="Dejar vacío para conservar actual"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-mono-tabular"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                authorizationId{' '}
                {config.hasAuthorizationId && <span className="text-emerald-600">(Configurado)</span>}
              </label>
              <input
                type="password"
                value={authorizationId}
                onChange={(e) => setAuthorizationId(e.target.value)}
                placeholder="Dejar vacío para conservar actual"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-mono-tabular"
              />
            </div>

            <div>
              <label className="block font-bold uppercase text-slate-500 mb-1">
                destinationAccountId (1 = BOB, 2 = USD)
              </label>
              <select
                value={destinationAccountId}
                onChange={(e) => setDestinationAccountId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-bold"
              >
                <option value="1">1 - Cuenta en Bolivianos (BOB)</option>
                <option value="2">2 - Cuenta en Dólares (USD)</option>
              </select>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#009b3a] hover:bg-[#007f2f] text-white font-display font-bold uppercase tracking-wider cursor-pointer"
              >
                Guardar Config
              </button>
              <button
                type="button"
                disabled={testing}
                onClick={handleTestToken}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 font-bold uppercase inline-flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
                <span>Probar Token</span>
              </button>
            </div>
          </form>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1.5">
            <div className="font-bold uppercase text-slate-500 flex items-center gap-1.5">
              <Webhook className="w-3.5 h-3.5 text-[#009b3a]" />
              <span>Endpoint Webhook ReceiveNotification (Para BNB)</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 font-mono-tabular text-[11px] break-all text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              POST {webhookFullUrl}
            </div>
          </div>
        </section>

        {/* Live QR Transactions Log */}
        <section className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-5 h-5 text-[#009b3a]" />
            <h3 className="font-display font-bold text-base uppercase text-slate-900 dark:text-white">
              Registro de QRs Generados ({qrTransactions.length})
            </h3>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto">
            {qrTransactions.map((q) => (
              <div
                key={q.qrId}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono-tabular font-bold text-slate-900 dark:text-white">
                      QR #{q.qrId}
                    </span>
                    <span className="text-slate-500">· {q.gloss}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {q.originName ? `${q.originName} (${q.sourceBankName})` : q.additionalData}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-mono-tabular font-extrabold text-slate-900 dark:text-white">
                    {formatBs(q.amount)}
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase ${
                      q.statusId === 2
                        ? 'text-emerald-600'
                        : q.statusId === 1
                        ? 'text-amber-600'
                        : 'text-slate-400'
                    }`}
                  >
                    {q.statusId === 2
                      ? `PAGADO · ${q.voucherId}`
                      : q.statusId === 1
                      ? 'NO USADO'
                      : 'EXPIRADO'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
