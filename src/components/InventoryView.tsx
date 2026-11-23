import React, { useState } from 'react';
import { ArrowLeftRight, Layers, Package, Plus, Save, X } from 'lucide-react';
import { apiFetch } from '../lib/api';
import {
  Branch,
  CALAMINA_COLORS,
  CoilStock,
  formatBs,
  GAUGE_SPECS,
  getColorByCode,
  Product,
  PROFILE_LABELS,
  ProfileType,
  StockTransfer,
} from '../types/calaminas';
import { CalaminaProfileSVG } from './CalaminaProfileSVG';

interface InventoryViewProps {
  mode: 'catalog' | 'coils' | 'kardex';
  branches: Branch[];
  products: Product[];
  coils: CoilStock[];
  transfers: StockTransfer[];
  activeBranchId: string;
  onRefresh: () => Promise<void>;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  mode,
  branches,
  products,
  coils,
  transfers,
  activeBranchId,
  onRefresh,
}) => {
  const [newProdOpen, setNewProdOpen] = useState(false);
  const [newCoilOpen, setNewCoilOpen] = useState(false);
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // New Product State
  const [pSku, setPSku] = useState('');
  const [pName, setPName] = useState('');
  const [pProfile, setPProfile] = useState<ProfileType>('ONDULADA');
  const [pPrice, setPPrice] = useState('42');
  const [pWidth, setPWidth] = useState('0.80');
  const [pColors, setPColors] = useState<string[]>(['ZINC', 'RAL-3009', 'RAL-5005']);

  // New Coil State
  const [cCode, setCCode] = useState('');
  const [cColor, setCColor] = useState('RAL-3009');
  const [cGauge, setCGauge] = useState('28');
  const [cMeters, setCMeters] = useState('1200');
  const [cWeight, setCWeight] = useState('3200');
  const [cSupplier, setCSupplier] = useState('Ternium / Acero Sur');

  // Transfer State
  const [tFrom, setTFrom] = useState(activeBranchId);
  const [tTo, setTTo] = useState(
    branches.find((b) => b.id !== activeBranchId)?.id || 'SUC-02'
  );
  const [tProdId, setTProdId] = useState(products[0]?.id || '');
  const [tColor, setTColor] = useState('ZINC');
  const [tGauge, setTGauge] = useState('28');
  const [tQty, setTQty] = useState('100');
  const [tNotes, setTNotes] = useState('');

  const handleSavePrice = async (prodId: string) => {
    try {
      await apiFetch(`/api/products/${prodId}`, {
        method: 'PATCH',
        body: JSON.stringify({ basePricePerMeter: Number(priceDraft) }),
      });
      setEditingPriceId(null);
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar precio.');
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch('/api/products', {
        method: 'POST',
        body: JSON.stringify({
          sku: pSku,
          name: pName,
          profileType: pProfile,
          basePricePerMeter: Number(pPrice),
          usefulWidthM: Number(pWidth),
          totalWidthM: Number(pWidth) + 0.12,
          cuttable: pProfile !== 'ACCESORIO' && pProfile !== 'PERFIL',
          availableColors: pColors,
          availableGauges: ['24', '26', '28', '30'],
        }),
      });
      setNewProdOpen(false);
      setPSku('');
      setPName('');
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear producto.');
    }
  };

  const handleCreateCoil = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch('/api/coils', {
        method: 'POST',
        body: JSON.stringify({
          coilCode: cCode,
          branchId: activeBranchId,
          colorCode: cColor,
          gauge: cGauge,
          initialMeters: Number(cMeters),
          weightKg: Number(cWeight),
          supplier: cSupplier,
        }),
      });
      setNewCoilOpen(false);
      setCCode('');
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar bobina.');
    }
  };

  const handleToggleCoilStatus = async (coil: CoilStock) => {
    const next = coil.status === 'DISPONIBLE' ? 'EN_MAQUINA' : 'DISPONIBLE';
    await apiFetch(`/api/coils/${coil.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next }),
    });
    await onRefresh();
  };

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch('/api/transfers', {
        method: 'POST',
        body: JSON.stringify({
          fromBranchId: tFrom,
          toBranchId: tTo,
          productId: tProdId,
          colorCode: tColor,
          gauge: tGauge,
          quantity: Number(tQty),
          notes: tNotes,
        }),
      });
      setTNotes('');
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al realizar traspaso.');
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs text-red-700 dark:text-red-300 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {mode === 'catalog' && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold tracking-wider uppercase text-[#c2410c]">
                ALMACÉN Y STOCK · CATÁLOGO MAESTRO
              </p>
              <h2 className="font-display italic font-extrabold text-xl text-slate-900 dark:text-white uppercase">
                CATÁLOGO DE CALAMINAS, PERFILES Y ACCESORIOS
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setNewProdOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c2410c] hover:bg-[#9a3412] text-white font-display font-bold text-xs tracking-wider uppercase cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nuevo Perfil / Ítem</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] uppercase tracking-wider text-slate-400">
                  <th className="py-3 pr-3">SKU / Perfil</th>
                  <th className="py-3 px-3">Producto</th>
                  <th className="py-3 px-3">Colores Disponibles</th>
                  <th className="py-3 px-3 text-right">Precio Base</th>
                  {branches.map((b) => (
                    <th key={b.id} className="py-3 px-3 text-right">
                      {b.code}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 pr-3">
                      <div className="font-mono-tabular font-bold text-slate-800 dark:text-slate-200">
                        {p.sku}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase">
                        {PROFILE_LABELS[p.profileType]}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                      <div className="text-[11px] text-slate-400">{p.waveOrStepInfo}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 flex-wrap max-w-[160px]">
                        {p.availableColors.map((cCode) => {
                          const c = getColorByCode(cCode);
                          return (
                            <span
                              key={cCode}
                              title={c.name}
                              className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600"
                              style={{ backgroundColor: c.hex }}
                            />
                          );
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {editingPriceId === p.id ? (
                        <div className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            step="0.5"
                            value={priceDraft}
                            onChange={(e) => setPriceDraft(e.target.value)}
                            className="w-20 rounded-lg border border-orange-400 px-2 py-1 text-right font-mono-tabular font-bold bg-white dark:bg-slate-800"
                          />
                          <button
                            type="button"
                            onClick={() => handleSavePrice(p.id)}
                            className="p-1.5 rounded-lg bg-emerald-600 text-white cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingPriceId(p.id);
                            setPriceDraft(String(p.basePricePerMeter));
                          }}
                          className="font-mono-tabular font-bold text-[#c2410c] hover:underline cursor-pointer"
                          title="Clic para editar precio base"
                        >
                          {formatBs(p.basePricePerMeter)}/{p.unitLabel}
                        </button>
                      )}
                    </td>
                    {branches.map((b) => (
                      <td key={b.id} className="py-3 px-3 text-right font-mono-tabular font-semibold">
                        {(p.stockByBranch[b.id] || 0).toLocaleString('es-BO')} {p.unitLabel}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {mode === 'coils' && (
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold tracking-wider uppercase text-[#c2410c]">
                MATERIA PRIMA ACERO GALVANIZADO &amp; PREPINTADO
              </p>
              <h2 className="font-display italic font-extrabold text-xl text-slate-900 dark:text-white uppercase">
                CONTROL DE BOBINAS MADRE Y COLORES RAL
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setNewCoilOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#c2410c] hover:bg-[#9a3412] text-white font-display font-bold text-xs tracking-wider uppercase cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Ingresar Bobina</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {coils.map((coil) => {
              const col = getColorByCode(coil.colorCode);
              const pct = Math.round((coil.remainingMeters / coil.initialMeters) * 100);
              const branch = branches.find((b) => b.id === coil.branchId);
              return (
                <div
                  key={coil.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-8 h-8 rounded-xl border border-slate-300 dark:border-slate-600 shrink-0 shadow-2xs"
                        style={{ backgroundColor: col.hex }}
                      />
                      <div>
                        <div className="font-mono-tabular font-bold text-xs text-slate-900 dark:text-white">
                          {coil.coilCode}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {col.name} · Cal. {coil.gauge}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleToggleCoilStatus(coil)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                        coil.status === 'EN_MAQUINA'
                          ? 'bg-orange-100 text-[#c2410c] dark:bg-orange-950 dark:text-orange-300'
                          : coil.status === 'DISPONIBLE'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {coil.status.replace('_', ' ')}
                    </button>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-slate-500">Metraje restante:</span>
                      <span className="font-mono-tabular font-bold text-slate-900 dark:text-white">
                        {coil.remainingMeters.toLocaleString('es-BO')} / {coil.initialMeters} ml ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: col.code === 'RAL-9003' ? '#94A3B8' : col.hex,
                        }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-700/60 text-[11px] text-slate-500 flex justify-between">
                    <span>{branch?.code} · {coil.weightKg} kg</span>
                    <span className="font-mono-tabular">{coil.lotNumber}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {mode === 'kardex' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <section className="lg:col-span-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#0b1324] text-white flex items-center justify-center">
                <ArrowLeftRight className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-display italic font-extrabold text-base text-slate-900 dark:text-white uppercase">
                  NUEVO TRASPASO ENTRE SUCURSALES
                </h2>
                <p className="text-xs text-slate-500">
                  Mueve láminas o accesorios desde Planta a Sucursales
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateTransfer} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-500 mb-1">Origen</label>
                  <select
                    value={tFrom}
                    onChange={(e) => setTFrom(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-semibold"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-500 mb-1">Destino</label>
                  <select
                    value={tTo}
                    onChange={(e) => setTTo(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-semibold"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-500 mb-1">Producto</label>
                <select
                  value={tProdId}
                  onChange={(e) => setTProdId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-semibold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.stockByBranch[tFrom] || 0} {p.unitLabel} disp.)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold uppercase text-slate-500 mb-1">Color</label>
                  <select
                    value={tColor}
                    onChange={(e) => setTColor(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2.5"
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
                    value={tGauge}
                    onChange={(e) => setTGauge(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-2.5"
                  >
                    {GAUGE_SPECS.map((g) => (
                      <option key={g.gauge} value={g.gauge}>
                        Cal. {g.gauge}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-500 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={tQty}
                    onChange={(e) => setTQty(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-mono-tabular font-bold"
                  />
                </div>
              </div>

              <input
                type="text"
                value={tNotes}
                onChange={(e) => setTNotes(e.target.value)}
                placeholder="Motivo / placa camión de traslado..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
              />

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#c2410c] hover:bg-[#9a3412] text-white font-display font-bold uppercase tracking-wider cursor-pointer"
              >
                Ejecutar Traspaso de Stock
              </button>
            </form>
          </section>

          <section className="lg:col-span-7 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
            <h2 className="font-display italic font-extrabold text-base text-slate-900 dark:text-white uppercase">
              HISTORIAL DE KARDEX Y TRASPASOS ({transfers.length})
            </h2>
            <div className="space-y-3">
              {transfers.map((tr) => (
                <div
                  key={tr.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono-tabular font-bold text-[#c2410c]">
                        {tr.transferNumber}
                      </span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {tr.productName}
                      </span>
                    </div>
                    <div className="text-slate-500 mt-1">
                      {tr.fromBranchName} → <strong>{tr.toBranchName}</strong>
                    </div>
                    {tr.notes && <div className="text-[11px] text-slate-400 mt-0.5">{tr.notes}</div>}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono-tabular font-extrabold text-sm text-emerald-600 dark:text-emerald-400">
                      {tr.quantityMetersOrUnits} {tr.unitLabel}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {new Date(tr.createdAt).toLocaleDateString('es-BO')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* New Product Modal */}
      {newProdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base uppercase text-slate-900 dark:text-white">
                Nuevo Perfil / Producto de Calamina
              </h3>
              <button
                type="button"
                onClick={() => setNewProdOpen(false)}
                className="text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 flex justify-center">
                <CalaminaProfileSVG
                  profileType={pProfile}
                  colorCode={pColors[0] || 'ZINC'}
                  className="w-48 h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-500 mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={pSku}
                    onChange={(e) => setPSku(e.target.value)}
                    placeholder="CAL-TERM-30"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-500 mb-1">Perfil</label>
                  <select
                    value={pProfile}
                    onChange={(e) => setPProfile(e.target.value as ProfileType)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-bold"
                  >
                    {Object.entries(PROFILE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold uppercase text-slate-500 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={pName}
                  onChange={(e) => setPName(e.target.value)}
                  placeholder="CALAMINA TRAPEZOIDAL TERMOACÚSTICA"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-500 mb-1">
                    Precio Base (Bs/ml o Ud)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={pPrice}
                    onChange={(e) => setPPrice(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono-tabular font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-500 mb-1">
                    Ancho Útil (m)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    value={pWidth}
                    onChange={(e) => setPWidth(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono-tabular"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold uppercase text-slate-500 mb-1">
                  Colores Disponibles
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CALAMINA_COLORS.map((c) => {
                    const checked = pColors.includes(c.code);
                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() =>
                          setPColors((prev) =>
                            checked ? prev.filter((x) => x !== c.code) : [...prev, c.code]
                          )
                        }
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] cursor-pointer ${
                          checked
                            ? 'border-[#c2410c] bg-orange-50 dark:bg-orange-950/40 font-bold'
                            : 'border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-slate-300"
                          style={{ backgroundColor: c.hex }}
                        />
                        <span>{c.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#c2410c] text-white font-display font-bold uppercase tracking-wider cursor-pointer"
              >
                Guardar en Catálogo
              </button>
            </form>
          </div>
        </div>
      )}

      {/* New Coil Modal */}
      {newCoilOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-base uppercase text-slate-900 dark:text-white">
                Ingresar Nueva Bobina Madre
              </h3>
              <button
                type="button"
                onClick={() => setNewCoilOpen(false)}
                className="text-slate-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateCoil} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-500 mb-1">
                  Código de Bobina
                </label>
                <input
                  type="text"
                  required
                  value={cCode}
                  onChange={(e) => setCCode(e.target.value)}
                  placeholder="BOB-ROJO-28-B"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono-tabular"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-500 mb-1">Color RAL</label>
                  <select
                    value={cColor}
                    onChange={(e) => setCColor(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
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
                    value={cGauge}
                    onChange={(e) => setCGauge(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                  >
                    {GAUGE_SPECS.map((g) => (
                      <option key={g.gauge} value={g.gauge}>
                        Cal. {g.gauge}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-500 mb-1">
                    Metros Lineales
                  </label>
                  <input
                    type="number"
                    required
                    value={cMeters}
                    onChange={(e) => setCMeters(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-500 mb-1">Peso (kg)</label>
                  <input
                    type="number"
                    required
                    value={cWeight}
                    onChange={(e) => setCWeight(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono-tabular"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold uppercase text-slate-500 mb-1">Proveedor</label>
                <input
                  type="text"
                  value={cSupplier}
                  onChange={(e) => setCSupplier(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#c2410c] text-white font-display font-bold uppercase tracking-wider cursor-pointer"
              >
                Registrar Bobina en Planta
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
