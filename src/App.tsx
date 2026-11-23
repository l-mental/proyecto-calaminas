/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AuditSecurityView } from './components/AuditSecurityView';
import { CashShiftModal } from './components/CashShiftModal';
import { ColorPaletteModal } from './components/ColorPaletteModal';
import { CutOrdersView } from './components/CutOrdersView';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { LoginView } from './components/LoginView';
import {
  BnbConfigView,
  ClientsView,
  FinanceReportsView,
  PurchasesView,
  StaffView,
} from './components/OperationsViews';
import { PosView } from './components/PosView';
import { PrintReceiptModal } from './components/PrintReceiptModal';
import { SalesHistoryView } from './components/SalesHistoryView';
import { NavTab, Sidebar } from './components/Sidebar';
import { TopHeader } from './components/TopHeader';
import { apiFetch, setInMemoryToken } from './lib/api';
import type {
  AuditLogEntry,
  BnbPublicConfig,
  BnbQrTransaction,
  Branch,
  CashRegisterShift,
  Client,
  CoilStock,
  CutOrder,
  Product,
  ProfileType,
  ProformaRecord,
  PurchaseOrder,
  SaleRecord,
  StaffUser,
  StockTransfer,
} from './types/calaminas';

interface BootstrapPayload {
  branches: Branch[];
  products: Product[];
  coils: CoilStock[];
  clients: Client[];
  sales: SaleRecord[];
  proformas: ProformaRecord[];
  cutOrders: CutOrder[];
  transfers: StockTransfer[];
  purchases: PurchaseOrder[];
  shifts: CashRegisterShift[];
  qrTransactions: BnbQrTransaction[];
  auditLogs: AuditLogEntry[];
  staff: StaffUser[];
  bnbConfig: BnbPublicConfig;
}

function escapeCsvCell(val: unknown): string {
  const s = String(val ?? '').replace(/"/g, '""');
  return `"${s}"`;
}

export default function App() {
  const [authChecked, setAuthChecked] = useState(false);
  const [requiresInitialSetup, setRequiresInitialSetup] = useState(false);
  const [user, setUser] = useState<StaffUser | null>(null);
  const [data, setData] = useState<BootstrapPayload | null>(null);
  const [loadingData, setLoadingData] = useState(false);

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [posProfileFilter, setPosProfileFilter] = useState<ProfileType | 'ALL'>('ALL');
  const [activeBranchId, setActiveBranchId] = useState<string>('SUC-01');
  const [darkMode, setDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [cashModalOpen, setCashModalOpen] = useState(false);
  const [colorPaletteOpen, setColorPaletteOpen] = useState(false);
  const [printTarget, setPrintTarget] = useState<{
    sale?: SaleRecord;
    proforma?: ProformaRecord;
    cutOrder?: CutOrder;
  } | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const loadBootstrap = useCallback(async () => {
    setLoadingData(true);
    try {
      const payload = await apiFetch<BootstrapPayload>('/api/bootstrap');
      setData(payload);
      if (payload.branches.length > 0) {
        setActiveBranchId((prev) =>
          payload.branches.some((b) => b.id === prev) ? prev : payload.branches[0].id
        );
      }
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const st = await apiFetch<{
          requiresInitialSetup: boolean;
          authenticated: boolean;
          user: StaffUser | null;
        }>('/api/auth/status');
        setRequiresInitialSetup(st.requiresInitialSetup);
        if (st.authenticated && st.user) {
          setUser(st.user);
          setActiveBranchId(st.user.branchId || 'SUC-01');
          await loadBootstrap();
        }
      } catch {
        // Stay on login screen
      } finally {
        setAuthChecked(true);
      }
    };
    initAuth();
  }, [loadBootstrap]);

  const handleAuthenticated = async (loggedUser: StaffUser) => {
    setUser(loggedUser);
    setRequiresInitialSetup(false);
    setActiveBranchId(loggedUser.branchId || 'SUC-01');
    await loadBootstrap();
  };

  const handleLogout = async () => {
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
    setInMemoryToken(null);
    setUser(null);
    setData(null);
    const st = await apiFetch<{ requiresInitialSetup: boolean }>('/api/auth/status').catch(() => ({
      requiresInitialSetup: false,
    }));
    setRequiresInitialSetup(st.requiresInitialSetup);
  };

  const handleNavigate = (tab: NavTab, profileFilter?: ProfileType) => {
    if (profileFilter) {
      setPosProfileFilter(profileFilter);
    } else if (tab === 'pos') {
      setPosProfileFilter('ALL');
    }
    setActiveTab(tab);
  };

  const handleExportCsv = () => {
    if (!data) return;
    const rows: string[] = [];
    rows.push(
      [
        'Factura',
        'Fecha',
        'Sucursal',
        'Cliente',
        'NIT',
        'MetodoPago',
        'Despacho',
        'Metraje_ML',
        'Total_Bs',
        'Estado',
      ]
        .map(escapeCsvCell)
        .join(',')
    );
    for (const s of data.sales) {
      rows.push(
        [
          s.invoiceNumber,
          new Date(s.createdAt).toLocaleString('es-BO'),
          s.branchName,
          s.clientName,
          s.clientNit,
          s.paymentMethod,
          s.dispatchStatus || 'EN_PLANTA',
          s.totalLinearMeters,
          s.total.toFixed(2),
          s.status,
        ]
          .map(escapeCsvCell)
          .join(',')
      );
    }

    rows.push('');
    rows.push(['SKU', 'Producto', 'Perfil', 'PrecioBase_Bs', 'Unidad', 'StockSucursalActiva'].map(escapeCsvCell).join(','));
    for (const p of data.products) {
      rows.push(
        [
          p.sku,
          p.name,
          p.profileType,
          p.basePricePerMeter.toFixed(2),
          p.unitLabel,
          p.stockByBranch[activeBranchId] || 0,
        ]
          .map(escapeCsvCell)
          .join(',')
      );
    }

    const blob = new Blob(['\uFEFF' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `acerocal-reporte-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f5f8] dark:bg-slate-950 text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <Loader2 className="w-5 h-5 animate-spin text-[#c2410c]" />
          <span>Iniciando sistema ACEROCAL...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginView
        requiresInitialSetup={requiresInitialSetup}
        onAuthenticated={handleAuthenticated}
      />
    );
  }

  if (!data || (loadingData && !data)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3f5f8] dark:bg-slate-950 text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <Loader2 className="w-5 h-5 animate-spin text-[#c2410c]" />
          <span>Cargando inventario de bobinas y sucursales...</span>
        </div>
      </div>
    );
  }

  const activeShift =
    data.shifts.find((s) => s.status === 'ABIERTO' && s.branchId === activeBranchId) ||
    data.shifts.find((s) => s.status === 'ABIERTO');

  const pendingCutsCount = data.cutOrders.filter(
    (c) => c.status === 'PENDIENTE' || c.status === 'EN_ROLADORA'
  ).length;

  const inRouteCount = data.sales.filter(
    (s) => s.status !== 'ANULADA' && s.dispatchStatus === 'EN_RUTA'
  ).length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const salesTodayCount = data.sales.filter(
    (s) => s.status !== 'ANULADA' && s.createdAt.slice(0, 10) === todayStr
  ).length;

  return (
    <div className="min-h-screen bg-[#f4f6f9] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top 4px Industrial Checkered Bar across full width */}
      <div className="industrial-top-strip w-full sticky top-0 z-50 no-print" />

      <div className="flex-1 flex min-h-0">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => handleNavigate(tab)}
          user={user}
          pendingCutsCount={pendingCutsCount}
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
          onLogout={handleLogout}
        />

        <div className="flex-1 min-w-0 flex flex-col">
          <TopHeader
            branches={data.branches}
            activeBranchId={activeBranchId}
            onChangeBranch={setActiveBranchId}
            darkMode={darkMode}
            onToggleDarkMode={() => setDarkMode((d) => !d)}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
            onOpenColorPaletteModal={() => setColorPaletteOpen(true)}
            onExportCsv={handleExportCsv}
            pendingCutsCount={pendingCutsCount}
            inRouteCount={inRouteCount}
            salesTodayCount={salesTodayCount}
            onNavigateCutOrders={() => handleNavigate('cut-orders')}
          />

          <main className="flex-1 p-4 sm:p-6 max-w-[1600px] w-full mx-auto">
            {activeTab === 'dashboard' && (
              <DashboardView
                user={user}
                products={data.products}
                coils={data.coils}
                sales={data.sales}
                cutOrders={data.cutOrders}
                activeBranchId={activeBranchId}
                onNavigate={handleNavigate}
              />
            )}

            {activeTab === 'pos' && (
              <PosView
                products={data.products}
                clients={data.clients}
                proformas={data.proformas}
                activeShift={activeShift}
                activeBranchId={activeBranchId}
                initialProfileFilter={posProfileFilter}
                onOpenCashShiftModal={() => setCashModalOpen(true)}
                onSaleCompleted={async () => {
                  await loadBootstrap();
                }}
                onOpenPrintModal={(opts) => setPrintTarget(opts)}
                onRefreshData={loadBootstrap}
              />
            )}

            {(activeTab === 'catalog' || activeTab === 'coils' || activeTab === 'kardex') && (
              <InventoryView
                mode={activeTab}
                branches={data.branches}
                products={data.products}
                coils={data.coils}
                transfers={data.transfers}
                activeBranchId={activeBranchId}
                onRefresh={loadBootstrap}
              />
            )}

            {activeTab === 'cut-orders' && (
              <CutOrdersView
                cutOrders={data.cutOrders}
                onRefresh={loadBootstrap}
                onPrintCutOrder={(cutOrder) => setPrintTarget({ cutOrder })}
              />
            )}

            {activeTab === 'sales' && (
              <SalesHistoryView
                sales={data.sales}
                onRefresh={loadBootstrap}
                onPrintSale={(sale) => setPrintTarget({ sale })}
              />
            )}

            {activeTab === 'purchases' && (
              <PurchasesView
                purchases={data.purchases}
                branches={data.branches}
                activeBranchId={activeBranchId}
                onRefresh={loadBootstrap}
              />
            )}

            {activeTab === 'finance' && (
              <FinanceReportsView sales={data.sales} purchases={data.purchases} />
            )}

            {activeTab === 'clients' && (
              <ClientsView clients={data.clients} onRefresh={loadBootstrap} />
            )}

            {activeTab === 'staff' && (
              <StaffView
                staff={data.staff}
                branches={data.branches}
                currentUser={user}
                onRefresh={loadBootstrap}
              />
            )}

            {activeTab === 'bnb-config' && (
              <BnbConfigView
                config={data.bnbConfig}
                qrTransactions={data.qrTransactions}
                onRefresh={loadBootstrap}
              />
            )}

            {activeTab === 'audit' && <AuditSecurityView logs={data.auditLogs || []} />}
          </main>
        </div>
      </div>

      {/* Modals */}
      <CashShiftModal
        open={cashModalOpen}
        shift={activeShift}
        activeBranchId={activeBranchId}
        onClose={() => setCashModalOpen(false)}
        onShiftUpdated={loadBootstrap}
      />

      <ColorPaletteModal
        open={colorPaletteOpen}
        onClose={() => setColorPaletteOpen(false)}
      />

      <PrintReceiptModal
        sale={printTarget?.sale}
        proforma={printTarget?.proforma}
        cutOrder={printTarget?.cutOrder}
        onClose={() => setPrintTarget(null)}
      />
    </div>
  );
}
