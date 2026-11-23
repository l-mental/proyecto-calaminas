export type ProfileType =
  | 'ONDULADA'
  | 'TRAPEZOIDAL'
  | 'TEJA_ESPANOLA'
  | 'TRASLUCIDA'
  | 'PANEL_TERMICO'
  | 'CUMBRERA'
  | 'PERFIL'
  | 'ACCESORIO';

export type FinishType = 'GALVANIZADA' | 'PREPINTADA' | 'MATE' | 'TRASLUCIDA';

export interface CalaminaColor {
  code: string;
  name: string;
  hex: string;
  accentHex: string;
  finish: FinishType;
  surchargePerMeter: number; // Extra Bs per linear meter over natural galvanized
}

export interface GaugeSpec {
  gauge: string;
  thicknessMm: number;
  label: string;
  priceMultiplier: number;
  weightKgPerSqm: number;
}

export interface Branch {
  id: string;
  code: string;
  name: string;
  city: string;
  address: string;
  isFactory: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  profileType: ProfileType;
  description: string;
  usefulWidthM: number;
  totalWidthM: number;
  waveOrStepInfo: string;
  basePricePerMeter: number; // Base price in Bs per linear meter (or per unit for non-cuttable)
  cuttable: boolean;
  unitLabel: string; // 'ml' | 'unidad' | 'bolsa' | 'tira 6m' | 'rollo'
  minLengthM: number;
  maxLengthM: number;
  defaultLengthM: number;
  availableColors: string[]; // color codes
  availableGauges: string[]; // gauge codes e.g. '24', '26', '28', '30'
  stockByBranch: Record<string, number>; // linear meters (for cuttable) or units
  active: boolean;
}

export interface CoilStock {
  id: string;
  coilCode: string;
  branchId: string;
  colorCode: string;
  gauge: string;
  widthMm: number;
  initialMeters: number;
  remainingMeters: number;
  weightKg: number;
  supplier: string;
  lotNumber: string;
  status: 'DISPONIBLE' | 'EN_MAQUINA' | 'AGOTADA';
  updatedAt: string;
}

export interface CartItem {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  profileType: ProfileType;
  cuttable: boolean;
  colorCode: string;
  colorName: string;
  colorHex: string;
  gauge: string;
  lengthMeters: number; // 1 for unit items
  quantity: number;
  totalLinearMeters: number;
  areaSqm: number;
  weightKg: number;
  unitPrice: number; // Price per sheet (length * pricePerMeter) or per unit
  pricePerMeter: number;
  subtotal: number;
  cutNote?: string;
}

export interface Client {
  id: string;
  name: string;
  nitCi: string;
  phone: string;
  email: string;
  address: string;
  type: 'PARTICULAR' | 'CONSTRUCTORA' | 'FERRETERIA' | 'ESTANCIA';
  creditLimit: number;
  currentDebt: number;
}

export type PaymentMethod = 'EFECTIVO' | 'QR_BNB' | 'MIXTO' | 'CREDITO';
export type DispatchStatus = 'EN_PLANTA' | 'CARGANDO_CAMION' | 'EN_RUTA' | 'ENTREGADO';

export interface BnbQrTransaction {
  qrId: number;
  gloss: string;
  amount: number;
  currency: 'BOB' | 'USD';
  expirationDate: string;
  singleUse: boolean;
  additionalData: string;
  destinationAccountId: string;
  qrImageBase64: string;
  statusId: 1 | 2 | 3 | 4; // 1=No Usado, 2=Usado, 3=Expirado, 4=Con Error
  voucherId: string | null;
  sourceBankId: number | null;
  sourceBankName: string | null;
  originName: string | null;
  transactionDateTime: string | null;
  generatedAt: string;
  mode: 'BNB_API' | 'SIMULADOR';
  saleId?: string;
}

export interface SaleRecord {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  branchId: string;
  branchName: string;
  operatorId: string;
  operatorName: string;
  clientId: string;
  clientName: string;
  clientNit: string;
  items: CartItem[];
  totalLinearMeters: number;
  totalAreaSqm: number;
  totalWeightKg: number;
  subtotal: number;
  discount: number;
  freightCost: number;
  total: number;
  paymentMethod: PaymentMethod;
  cashPaid: number;
  qrPaid: number;
  creditAmount: number;
  status: 'COMPLETADA' | 'ANULADA' | 'PENDIENTE_QR';
  deliveryType?: 'RETIRO_PLANTA' | 'ENVIO_OBRA';
  dispatchStatus?: DispatchStatus;
  qrTransaction?: BnbQrTransaction;
  cutOrderId?: string;
  proformaId?: string;
  deliveryAddress?: string;
  notes?: string;
}

export interface ProformaRecord {
  id: string;
  proformaNumber: string;
  createdAt: string;
  validUntil: string;
  branchId: string;
  branchName: string;
  operatorName: string;
  clientId: string;
  clientName: string;
  clientNit: string;
  items: CartItem[];
  subtotal: number;
  discount: number;
  freightCost: number;
  total: number;
  status: 'VIGENTE' | 'CONVERTIDA' | 'EXPIRADA';
  notes?: string;
}

export type CutOrderStatus = 'PENDIENTE' | 'EN_ROLADORA' | 'LISTO' | 'ENTREGADO';

export interface CutOrderItem {
  productName: string;
  profileType: ProfileType;
  colorCode: string;
  colorName: string;
  colorHex: string;
  gauge: string;
  lengthMeters: number;
  quantity: number;
  totalLinearMeters: number;
  cutNote?: string;
}

export interface CutOrder {
  id: string;
  orderNumber: string;
  saleId: string;
  invoiceNumber: string;
  branchId: string;
  branchName: string;
  clientName: string;
  createdAt: string;
  status: CutOrderStatus;
  machine: string;
  priority: 'NORMAL' | 'URGENTE';
  items: CutOrderItem[];
  totalMeters: number;
  operatorAssigned?: string;
}

export interface StockTransfer {
  id: string;
  transferNumber: string;
  createdAt: string;
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  productId: string;
  productName: string;
  colorCode: string;
  gauge: string;
  quantityMetersOrUnits: number;
  unitLabel: string;
  requestedBy: string;
  status: 'COMPLETADO' | 'EN_TRANSITO';
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  orderNumber: string;
  createdAt: string;
  supplier: string;
  branchId: string;
  branchName: string;
  description: string;
  colorCode: string;
  gauge: string;
  metersBought: number;
  weightKg: number;
  totalCostBs: number;
  status: 'RECIBIDA' | 'PENDIENTE';
}

export interface CashMovement {
  id: string;
  createdAt: string;
  type: 'INGRESO' | 'EGRESO';
  concept: string;
  amount: number;
  operatorName: string;
}

export interface CashRegisterShift {
  id: string;
  shiftNumber: number;
  branchId: string;
  openedAt: string;
  openedBy: string;
  initialCash: number;
  cashSales: number;
  qrSales: number;
  creditSales: number;
  movements: CashMovement[];
  expectedCash: number;
  status: 'ABIERTO' | 'CERRADO';
  closedAt?: string;
  countedCash?: number;
  difference?: number;
  closeNotes?: string;
}

export interface StaffUser {
  id: string;
  username: string;
  fullName: string;
  role: 'ADMIN' | 'VENDEDOR' | 'OPERADOR_CORTE' | 'ALMACENERO';
  branchId: string;
  active: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  module: 'SEGURIDAD' | 'VENTAS' | 'INVENTARIO' | 'CAJA' | 'PRODUCCION' | 'BNB_QR';
  action: string;
  detail: string;
  actorName: string;
  actorRole: string;
}

export interface BnbPublicConfig {
  mode: 'SIMULADOR' | 'BNB_API';
  baseUrl: string;
  destinationAccountId: string;
  hasAccountId: boolean;
  hasAuthorizationId: boolean;
  webhookPath: string;
  lastTokenCheckAt?: string;
}

export const CALAMINA_COLORS: CalaminaColor[] = [
  { code: 'ZINC', name: 'Zincalum Natural', hex: '#B8C4CC', accentHex: '#E2E8F0', finish: 'GALVANIZADA', surchargePerMeter: 0 },
  { code: 'RAL-3009', name: 'Rojo Teja', hex: '#7E281F', accentHex: '#A63A2E', finish: 'PREPINTADA', surchargePerMeter: 6.5 },
  { code: 'RAL-5005', name: 'Azul Zafiro', hex: '#1A3D7C', accentHex: '#2B57A8', finish: 'PREPINTADA', surchargePerMeter: 6.5 },
  { code: 'RAL-6005', name: 'Verde Bosque', hex: '#184A32', accentHex: '#266B4A', finish: 'PREPINTADA', surchargePerMeter: 6.5 },
  { code: 'RAL-8004', name: 'Terracota Colonial', hex: '#9C4527', accentHex: '#C25B37', finish: 'PREPINTADA', surchargePerMeter: 7.5 },
  { code: 'RAL-9003', name: 'Blanco Puro', hex: '#EFF4F8', accentHex: '#FFFFFF', finish: 'PREPINTADA', surchargePerMeter: 6.5 },
  { code: 'RAL-9005', name: 'Negro Mate', hex: '#1F242B', accentHex: '#3A424D', finish: 'MATE', surchargePerMeter: 8.0 },
  { code: 'RAL-7016', name: 'Gris Antracita', hex: '#38414A', accentHex: '#525E6B', finish: 'MATE', surchargePerMeter: 7.5 },
  { code: 'RAL-3005', name: 'Rojo Vino', hex: '#5E1D24', accentHex: '#802A34', finish: 'PREPINTADA', surchargePerMeter: 7.0 },
  { code: 'RAL-2004', name: 'Naranja Industrial', hex: '#D9531E', accentHex: '#F97316', finish: 'PREPINTADA', surchargePerMeter: 7.0 },
  { code: 'RAL-8017', name: 'Café Colonial', hex: '#4A3228', accentHex: '#694739', finish: 'MATE', surchargePerMeter: 7.5 },
  { code: 'TRANS', name: 'Cristal Traslúcido', hex: '#D8F3FF', accentHex: '#FFFFFF', finish: 'TRASLUCIDA', surchargePerMeter: 14.0 },
  { code: 'OPAL', name: 'Blanco Opal Traslúcido', hex: '#F1F8FC', accentHex: '#E0F2FE', finish: 'TRASLUCIDA', surchargePerMeter: 14.0 },
];

export const GAUGE_SPECS: GaugeSpec[] = [
  { gauge: '24', thicknessMm: 0.55, label: 'Cal. 24 (0.55 mm · Industrial)', priceMultiplier: 1.32, weightKgPerSqm: 4.85 },
  { gauge: '26', thicknessMm: 0.45, label: 'Cal. 26 (0.45 mm · Reforzada)', priceMultiplier: 1.15, weightKgPerSqm: 3.95 },
  { gauge: '28', thicknessMm: 0.35, label: 'Cal. 28 (0.35 mm · Estándar)', priceMultiplier: 1.0, weightKgPerSqm: 3.15 },
  { gauge: '30', thicknessMm: 0.30, label: 'Cal. 30 (0.30 mm · Residencial)', priceMultiplier: 0.87, weightKgPerSqm: 2.65 },
  { gauge: '32', thicknessMm: 0.25, label: 'Cal. 32 (0.25 mm · Económica)', priceMultiplier: 0.76, weightKgPerSqm: 2.20 },
];

export const PROFILE_LABELS: Record<ProfileType, string> = {
  ONDULADA: 'Ondulada',
  TRAPEZOIDAL: 'Trapezoidal',
  TEJA_ESPANOLA: 'Teja Española',
  TRASLUCIDA: 'Traslúcida / Tragaluz',
  PANEL_TERMICO: 'Panel Termoacústico',
  CUMBRERA: 'Cumbreras / Zingería',
  PERFIL: 'Perfiles / Costaneras',
  ACCESORIO: 'Fijación / Accesorios',
};

export function getColorByCode(code: string): CalaminaColor {
  return CALAMINA_COLORS.find((c) => c.code === code) || CALAMINA_COLORS[0];
}

export function getGaugeSpec(gauge: string): GaugeSpec {
  return GAUGE_SPECS.find((g) => g.gauge === gauge) || GAUGE_SPECS[2];
}

export function computeSheetPricing(
  product: Product,
  colorCode: string,
  gauge: string,
  lengthMeters: number
): { pricePerMeter: number; unitPrice: number; areaSqm: number; weightKg: number } {
  if (!product.cuttable) {
    return {
      pricePerMeter: product.basePricePerMeter,
      unitPrice: Number(product.basePricePerMeter.toFixed(2)),
      areaSqm: 0,
      weightKg: 0.4,
    };
  }
  const color = getColorByCode(colorCode);
  const gaugeSpec = getGaugeSpec(gauge);
  const pricePerMeter = Number(
    (product.basePricePerMeter * gaugeSpec.priceMultiplier + color.surchargePerMeter).toFixed(2)
  );
  const unitPrice = Number((pricePerMeter * lengthMeters).toFixed(2));
  const areaSqm = Number((product.usefulWidthM * lengthMeters).toFixed(2));
  const weightKg = Number((product.totalWidthM * lengthMeters * gaugeSpec.weightKgPerSqm).toFixed(2));
  return { pricePerMeter, unitPrice, areaSqm, weightKg };
}

export function formatBs(value: number): string {
  return `Bs ${value.toLocaleString('es-BO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
