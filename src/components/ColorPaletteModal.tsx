import React, { useState } from 'react';
import { Building2, Layers, Palette, Sun, X } from 'lucide-react';
import {
  CALAMINA_COLORS,
  GAUGE_SPECS,
  PROFILE_LABELS,
  type ProfileType,
} from '../types/calaminas';
import { CalaminaProfileSVG } from './CalaminaProfileSVG';
import { RoofVisualizerSVG } from './RoofVisualizerSVG';

interface ColorPaletteModalProps {
  open: boolean;
  onClose: () => void;
}

export const ColorPaletteModal: React.FC<ColorPaletteModalProps> = ({ open, onClose }) => {
  const [selectedColor, setSelectedColor] = useState(CALAMINA_COLORS[1].code);
  const [trimColor, setTrimColor] = useState(CALAMINA_COLORS[1].code);
  const [selectedProfile, setSelectedProfile] = useState<ProfileType>('ONDULADA');
  const [viewMode, setViewMode] = useState<'ROOF' | 'SHEET'>('ROOF');
  const [includeSkylight, setIncludeSkylight] = useState(true);

  if (!open) return null;

  const activeColor =
    CALAMINA_COLORS.find((c) => c.code === selectedColor) || CALAMINA_COLORS[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
      <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        <div className="px-6 py-4 bg-[#0b1324] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Palette className="w-5 h-5 text-orange-400" />
            <div>
              <h3 className="font-display italic font-extrabold text-base uppercase">
                SIMULADOR DE TECHOS, COLORES RAL &amp; CALIBRES
              </h3>
              <p className="text-[11px] text-slate-300">
                Visualiza diseños de calamina y 13 acabados (galvanizados, prepintados, mate y traslúcidos)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer"
            aria-label="Cerrar muestrario"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
          {/* Interactive Live Preview: Roof Architectural View vs 3D Sheet View */}
          <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode('ROOF')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase cursor-pointer transition-colors ${
                      viewMode === 'ROOF'
                        ? 'bg-[#c2410c] text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Vista Techo Completo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('SHEET')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase cursor-pointer transition-colors ${
                      viewMode === 'SHEET'
                        ? 'bg-[#c2410c] text-white'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Vista Plancha 3D</span>
                  </button>
                </div>

                {viewMode === 'ROOF' && (
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={includeSkylight}
                      onChange={(e) => setIncludeSkylight(e.target.checked)}
                      className="rounded border-slate-300 text-[#c2410c] focus:ring-[#c2410c]"
                    />
                    <Sun className="w-3.5 h-3.5 text-sky-500" />
                    <span>Incluir Tragaluz Traslúcido</span>
                  </label>
                )}
              </div>

              {viewMode === 'ROOF' ? (
                <RoofVisualizerSVG
                  profileType={selectedProfile}
                  colorCode={selectedColor}
                  trimColorCode={trimColor}
                  includeSkylight={includeSkylight}
                  className="w-full h-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
                />
              ) : (
                <div className="h-52 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center p-4">
                  <CalaminaProfileSVG
                    profileType={selectedProfile}
                    colorCode={selectedColor}
                    className="w-full h-36"
                  />
                </div>
              )}
            </div>

            <div className="md:col-span-5 space-y-4">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Diseño / Perfil de Lámina
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      'ONDULADA',
                      'TRAPEZOIDAL',
                      'TEJA_ESPANOLA',
                      'PANEL_TERMICO',
                      'TRASLUCIDA',
                      'CUMBRERA',
                    ] as ProfileType[]
                  ).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setSelectedProfile(p)}
                      className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                        selectedProfile === p
                          ? 'bg-[#c2410c] text-white'
                          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {PROFILE_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                <span
                  className="w-11 h-11 rounded-xl border border-slate-300 dark:border-slate-600 shadow-xs shrink-0"
                  style={{ backgroundColor: activeColor.hex }}
                />
                <div className="min-w-0">
                  <div className="font-display font-bold text-sm text-slate-900 dark:text-white truncate">
                    {activeColor.name}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono-tabular">
                    {activeColor.code} · {activeColor.finish}
                  </div>
                  <div className="text-[11px] font-mono-tabular font-bold text-[#c2410c] dark:text-orange-400">
                    {activeColor.surchargePerMeter > 0
                      ? `Recargo +Bs ${activeColor.surchargePerMeter.toFixed(2)}/ml`
                      : 'Precio Base Zincalum'}
                  </div>
                </div>
              </div>

              {viewMode === 'ROOF' && (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Color Cumbrera &amp; Canaleta (Remates)
                  </label>
                  <select
                    value={trimColor}
                    onChange={(e) => setTrimColor(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100"
                  >
                    {CALAMINA_COLORS.filter((c) => c.finish !== 'TRASLUCIDA').map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* All 13 Colors & Translucent Finishes */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Paleta Completa de Bobinas y Planchas ({CALAMINA_COLORS.length} Acabados)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {CALAMINA_COLORS.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setSelectedColor(c.code);
                    if (c.finish !== 'TRASLUCIDA') {
                      setTrimColor(c.code);
                    }
                  }}
                  className={`p-3 rounded-xl border text-left flex items-center gap-3 cursor-pointer transition-all ${
                    selectedColor === c.code
                      ? 'border-[#c2410c] bg-orange-50 dark:bg-orange-950/40 ring-1 ring-[#c2410c]'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  <span
                    className="w-8 h-8 rounded-lg border border-slate-300 dark:border-slate-600 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {c.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono-tabular">
                      {c.code} · {c.finish}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Gauges Reference */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Tabla Técnica de Calibres, Espesores y Pesos
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
              {GAUGE_SPECS.map((g) => (
                <div
                  key={g.gauge}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
                >
                  <div className="font-bold text-slate-900 dark:text-white">Calibre {g.gauge}</div>
                  <div className="font-mono-tabular text-[11px] text-[#c2410c] font-bold">
                    {g.thicknessMm} mm
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {g.weightKgPerSqm} kg/m²
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
