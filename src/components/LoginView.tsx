import React, { useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  Layers,
  Palette,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { apiFetch, setInMemoryToken } from '../lib/api';
import type { StaffUser } from '../types/calaminas';
import { ColorPaletteModal } from './ColorPaletteModal';

interface LoginViewProps {
  requiresInitialSetup: boolean;
  onAuthenticated: (user: StaffUser) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({
  requiresInitialSetup,
  onAuthenticated,
}) => {
  const [setupMode, setSetupMode] = useState(requiresInitialSetup);
  const [username, setUsername] = useState('admin');
  const [fullName, setFullName] = useState('Administrador Sistema');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const endpoint = setupMode ? '/api/auth/setup-admin' : '/api/auth/login';
      const body = setupMode
        ? { username, fullName, password, rememberMe }
        : { username, password, rememberMe };

      const res = await apiFetch<{ token: string; user: StaffUser }>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
      });
      setInMemoryToken(res.token);
      onAuthenticated(res.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full login-diagonal-bg flex items-center justify-center p-4 sm:p-8">
      <div className="w-full max-w-[1080px] rounded-3xl overflow-hidden shadow-[0_28px_70px_-15px_rgba(11,19,36,0.28)] border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900">
        {/* Top Industrial Checkered Strip */}
        <div className="industrial-top-strip w-full" />

        <div className="grid grid-cols-1 lg:grid-cols-12">
          {/* Left Brand & Calamina Lines Panel (Navy to Burnt Orange gradient) */}
          <div
            className="lg:col-span-6 p-8 sm:p-10 text-white flex flex-col justify-between relative overflow-hidden"
            style={{
              background:
                'radial-gradient(circle at 92% 96%, rgba(194, 65, 12, 0.72) 0%, rgba(124, 45, 18, 0.35) 35%, rgba(7, 13, 28, 1) 72%), #070d1c',
            }}
          >
            <div>
              <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-orange-500 mb-3">
                FÁBRICA &amp; LAMINADORA DE TECHOS METÁLICOS
              </p>

              <h1 className="font-display italic font-extrabold text-4xl sm:text-5xl tracking-tight leading-none mb-4">
                <span className="text-white">ACERO</span>
                <span className="text-[#ff5a1f]">CAL</span>
              </h1>

              <p className="text-sm text-slate-300 leading-relaxed max-w-md mb-8">
                Sistema integral para venta de calaminas onduladas, trapezoidales, teja española y
                paneles térmicos a medida, control de bobinas y colores RAL, corte en roladora,
                stock multi-sucursal y Pago QR BNB.
              </p>

              {/* 4 Product Line Cards matching Screenshot 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-orange-500/15 text-orange-400">
                      <Layers className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[10px] font-mono-tabular tracking-wider text-slate-400 uppercase">
                      RAL / ZINC
                    </span>
                  </div>
                  <h2 className="font-display font-bold text-xs tracking-wide uppercase text-white">
                    CALAMINA ONDULADA
                  </h2>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Sinusoidal 11 Ondas · Ancho 0.80m
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-slate-400">
                    Calibres 24 · 26 · 28 · 30 · 32
                  </div>
                </div>

                <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-sky-500/15 text-sky-400">
                      <Layers className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[10px] font-mono-tabular tracking-wider text-slate-400 uppercase">
                      T101 / PUR
                    </span>
                  </div>
                  <h2 className="font-display font-bold text-xs tracking-wide uppercase text-white">
                    TRAPEZOIDAL &amp; TÉRMICA
                  </h2>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Prepintada RAL · Policarbonato · Panel PUR
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-slate-400">
                    Rojo Teja · Azul · Naranja · Traslúcida
                  </div>
                </div>

                <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-amber-500/15 text-amber-400">
                      <Sparkles className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[10px] font-mono-tabular tracking-wider text-slate-400 uppercase">
                      COLONIAL
                    </span>
                  </div>
                  <h2 className="font-display font-bold text-xs tracking-wide uppercase text-white">
                    TEJA ESPAÑOLA METÁLICA
                  </h2>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Estampado Paso 35cm · Mate/Brillo
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-slate-400">
                    Terracota · Café · Negro Mate · Vino
                  </div>
                </div>

                <div className="rounded-xl bg-white/[0.04] border border-white/10 p-4 backdrop-blur-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-emerald-500/15 text-emerald-400">
                      <Wrench className="w-3.5 h-3.5" />
                    </span>
                    <span className="text-[10px] font-mono-tabular tracking-wider text-slate-400 uppercase">
                      A MEDIDA
                    </span>
                  </div>
                  <h2 className="font-display font-bold text-xs tracking-wide uppercase text-white">
                    CUMBRERAS &amp; PERFILES C
                  </h2>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Canaletas · Botaguas · Costaneras
                  </p>
                  <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] text-slate-400">
                    EPDM · Cintas Asfálticas · Fijación
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom summary bar */}
            <div className="mt-8 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold tracking-wider uppercase text-slate-300">
              <span className="inline-flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-orange-400" />
                13 COLORES RAL &amp; CORTE EXACTO
              </span>
              <span className="inline-flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-orange-400" />
                MULTI-SUCURSAL · QR BNB
              </span>
            </div>
          </div>

          {/* Right White Login Panel */}
          <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center bg-white dark:bg-slate-900">
            <div className="max-w-md w-full mx-auto">
              <h2 className="font-display italic font-extrabold text-2xl sm:text-3xl tracking-tight text-slate-900 dark:text-white uppercase">
                {setupMode ? 'CONFIGURACIÓN INICIAL' : 'ACCESO AL SISTEMA'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 mb-6">
                {setupMode
                  ? 'Crea la clave maestra del Administrador para activar tu planta de calaminas y empezar a operar.'
                  : 'Ingresa tus credenciales para gestionar cortes a medida, inventario de bobinas, mostrador y facturación.'}
              </p>

              {requiresInitialSetup && (
                <div className="mb-5 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 p-3.5 text-xs text-orange-900 dark:text-orange-200 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">Primer arranque detectado</p>
                    <p className="mt-0.5 text-orange-800/90 dark:text-orange-300/90">
                      Define la contraseña del operador administrador (mínimo 6 caracteres) para
                      asegurar el sistema.
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="mb-5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 px-4 py-3 text-xs font-medium text-red-700 dark:text-red-300">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-600 dark:text-slate-400 mb-1.5">
                    USUARIO OPERADOR / ADMIN
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ej. admin"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                  />
                </div>

                {setupMode && (
                  <div>
                    <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-600 dark:text-slate-400 mb-1.5">
                      NOMBRE COMPLETO DEL OPERADOR
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ej. Administrador Sistema"
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold tracking-wider uppercase text-slate-600 dark:text-slate-400 mb-1.5">
                    {setupMode ? 'CREAR CLAVE DE ACCESO (MÍN. 6 CARACT.)' : 'CLAVE DE ACCESO'}
                  </label>
                  <input
                    type="password"
                    required
                    minLength={setupMode ? 6 : 1}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-3 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
                    />
                    MANTENER SESIÓN
                  </label>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                    ACCESO SEGURO
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 rounded-xl bg-[#c2410c] hover:bg-[#9a3412] disabled:opacity-60 text-white font-display font-bold text-xs tracking-wider uppercase py-3.5 px-5 flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <span>
                    {loading
                      ? 'VALIDANDO ACCESO...'
                      : setupMode
                      ? 'ACTIVAR ADMIN E INGRESAR'
                      : 'INGRESAR AL SISTEMA'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {!requiresInitialSetup && setupMode && (
                <button
                  type="button"
                  onClick={() => setSetupMode(false)}
                  className="mt-3 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 underline cursor-pointer"
                >
                  Volver al inicio de sesión
                </button>
              )}

              {/* Dark Navy Secondary Buttons matching Screenshot 1 */}
              <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                <a
                  href="/api/export/laravel-zip"
                  download="acerocal-laravel-11.zip"
                  className="w-full rounded-xl bg-[#0b1324] hover:bg-[#16223d] text-white font-display font-bold text-[11px] tracking-wider uppercase py-3 px-4 flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4 text-orange-400" />
                  <span>DESCARGAR PROYECTO COMPLETO LARAVEL 11 (.ZIP)</span>
                </a>

                <button
                  type="button"
                  onClick={() => setPaletteOpen(true)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-display font-bold text-[11px] tracking-wider uppercase py-2.5 px-4 flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Palette className="w-4 h-4 text-[#c2410c]" />
                  <span>EXPLORAR DISEÑOS Y COLORES DE CALAMINAS</span>
                </button>

                <p className="text-center text-[11px] font-bold tracking-widest uppercase text-slate-400 pt-1">
                  ACEROCAL FÁBRICA S.R.L. ·{' '}
                  <span className="text-orange-600">CALAMINAS, BOBINAS &amp; PERFILES</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Public Roof & RAL Finish Preview Modal (No Protected ERP Data) */}
      <ColorPaletteModal open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
};
