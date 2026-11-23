import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type {
  AuditLogEntry,
  BnbQrTransaction,
  Branch,
  CashRegisterShift,
  Client,
  CoilStock,
  CutOrder,
  Product,
  ProformaRecord,
  PurchaseOrder,
  SaleRecord,
  StaffUser,
  StockTransfer,
} from '../src/types/calaminas';

export interface StoredCredential {
  userId: string;
  username: string;
  passwordHash: string; // salt:scryptHex
}

export interface BnbServerConfig {
  mode: 'SIMULADOR' | 'BNB_API';
  baseUrl: string;
  accountId: string;
  authorizationId: string;
  destinationAccountId: string;
  lastTokenCheckAt?: string;
}

export interface DatabaseState {
  adminClaimed: boolean;
  credentials: StoredCredential[];
  staff: StaffUser[];
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
  bnbConfig: BnbServerConfig;
  nextQrId: number;
  nextInvoiceSeq: number;
  nextCutSeq: number;
  nextProformaSeq: number;
}

const IS_SERVERLESS = Boolean(
  process.env.VERCEL || process.env.VERCEL_ENV || process.env.AWS_LAMBDA_FUNCTION_NAME
);
const DATA_DIR = IS_SERVERLESS
  ? '/tmp/acerocal-data'
  : path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'db.json');

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

function createExtraProducts(): Product[] {
  return [
    {
      id: 'PROD-TRASL-01',
      sku: 'TRASL-OND-PC',
      name: 'CALAMINA TRASLÚCIDA ONDULADA POLICARBONATO',
      profileType: 'TRASLUCIDA',
      description: 'Lámina tragaluz con filtro UV para iluminación natural sin goteras. Empalme exacto 11 ondas.',
      usefulWidthM: 0.8,
      totalWidthM: 1.07,
      waveOrStepInfo: '11 Ondas · Filtro UV 1.2mm · Policarbonato',
      basePricePerMeter: 58.0,
      cuttable: true,
      unitLabel: 'ml',
      minLengthM: 1.8,
      maxLengthM: 6.0,
      defaultLengthM: 3.0,
      availableColors: ['TRANS', 'OPAL'],
      availableGauges: ['28'],
      stockByBranch: { 'SUC-01': 640, 'SUC-02': 240, 'SUC-03': 210 },
      active: true,
    },
    {
      id: 'PROD-TRASL-02',
      sku: 'TRASL-T101-PC',
      name: 'CALAMINA TRASLÚCIDA TRAPEZOIDAL T101',
      profileType: 'TRASLUCIDA',
      description: 'Tragaluz estructural trapezoidal para naves industriales y tinglados deportivos.',
      usefulWidthM: 1.0,
      totalWidthM: 1.08,
      waveOrStepInfo: '5 Trapecios · Espesor 1.5mm · Alta Resistencia',
      basePricePerMeter: 72.0,
      cuttable: true,
      unitLabel: 'ml',
      minLengthM: 2.0,
      maxLengthM: 6.0,
      defaultLengthM: 4.0,
      availableColors: ['TRANS', 'OPAL'],
      availableGauges: ['28'],
      stockByBranch: { 'SUC-01': 520, 'SUC-02': 180, 'SUC-03': 160 },
      active: true,
    },
    {
      id: 'PROD-PANEL-01',
      sku: 'PANEL-PUR-40MM',
      name: 'PANEL SANDWICH TERMOACÚSTICO PUR 40MM',
      profileType: 'PANEL_TERMICO',
      description: 'Doble chapa de acero prepintado con núcleo aislante de poliuretano de alta densidad.',
      usefulWidthM: 1.0,
      totalWidthM: 1.04,
      waveOrStepInfo: 'Núcleo PUR 40mm · Aislamiento Térmico y Acústico',
      basePricePerMeter: 185.0,
      cuttable: true,
      unitLabel: 'ml',
      minLengthM: 2.0,
      maxLengthM: 12.0,
      defaultLengthM: 6.0,
      availableColors: ['RAL-9003', 'RAL-5005', 'RAL-3009', 'RAL-7016'],
      availableGauges: ['26', '28'],
      stockByBranch: { 'SUC-01': 780, 'SUC-02': 260, 'SUC-03': 190 },
      active: true,
    },
    {
      id: 'PROD-CUMB-04',
      sku: 'BOTA-LIMA-35',
      name: 'BOTAGUAS Y LIMAHOYA PLEGADA CNC (A MEDIDA)',
      profileType: 'CUMBRERA',
      description: 'Remate lateral de muro y encuentro de aguas en el mismo color RAL de tu cubierta.',
      usefulWidthM: 0.35,
      totalWidthM: 0.35,
      waveOrStepInfo: 'Desarrollo 350 mm · Plegado exacto a pedido',
      basePricePerMeter: 26.0,
      cuttable: true,
      unitLabel: 'ml',
      minLengthM: 1.0,
      maxLengthM: 3.0,
      defaultLengthM: 2.0,
      availableColors: ['ZINC', 'RAL-3009', 'RAL-5005', 'RAL-6005', 'RAL-8004', 'RAL-9003', 'RAL-9005', 'RAL-7016', 'RAL-2004'],
      availableGauges: ['26', '28'],
      stockByBranch: { 'SUC-01': 710, 'SUC-02': 240, 'SUC-03': 200 },
      active: true,
    },
    {
      id: 'PROD-ACC-04',
      sku: 'CINTA-TAPA-10',
      name: 'CINTA ASFÁLTICA ALUMINIZADA TAPAGOTERAS (10CM X 10M)',
      profileType: 'ACCESORIO',
      description: 'Banda autoadhesiva impermeable de aluminio y asfalto para sellado instantáneo de juntas.',
      usefulWidthM: 0.1,
      totalWidthM: 0.1,
      waveOrStepInfo: 'Rollo 10 cm x 10 metros · Autoadhesiva',
      basePricePerMeter: 75.0,
      cuttable: false,
      unitLabel: 'rollo',
      minLengthM: 1,
      maxLengthM: 1,
      defaultLengthM: 1,
      availableColors: ['ZINC'],
      availableGauges: ['28'],
      stockByBranch: { 'SUC-01': 260, 'SUC-02': 110, 'SUC-03': 95 },
      active: true,
    },
  ];
}

function createInitialSeed(): DatabaseState {
  const now = new Date();
  const todayIso = now.toISOString();
  const yesterdayIso = new Date(now.getTime() - 86400000).toISOString();
  const twoDaysAgoIso = new Date(now.getTime() - 2 * 86400000).toISOString();

  const branches: Branch[] = [
    {
      id: 'SUC-01',
      code: 'PLANTA-SCZ',
      name: 'Planta Industrial Parque Industrial',
      city: 'Santa Cruz',
      address: 'Parque Industrial PI-14, Mza 8, Santa Cruz',
      isFactory: true,
    },
    {
      id: 'SUC-02',
      code: 'NORTE-KM9',
      name: 'Sucursal Norte Km 9 Banzer',
      city: 'Santa Cruz',
      address: 'Av. Cristo Redentor Km 9, Esq. Los Pinos',
      isFactory: false,
    },
    {
      id: 'SUC-03',
      code: 'EL-ALTO',
      name: 'Centro Distribución El Alto',
      city: 'El Alto / La Paz',
      address: 'Av. 6 de Marzo Km 4, Zona Villa Bolívar',
      isFactory: false,
    },
  ];

  const products: Product[] = [
    {
      id: 'PROD-OND-01',
      sku: 'CAL-OND-ZINC',
      name: 'CALAMINA ONDULADA ZINCALUM SINUSOIDAL',
      profileType: 'ONDULADA',
      description: '11 ondas clásicas, aluminio-zinc AZ150 anticorrosivo. Corte a medida exacto en roladora.',
      usefulWidthM: 0.8,
      totalWidthM: 1.07,
      waveOrStepInfo: '11 Ondas · Alto 18 mm · Ancho útil 0.80 m',
      basePricePerMeter: 36.0,
      cuttable: true,
      unitLabel: 'ml',
      minLengthM: 1.0,
      maxLengthM: 12.0,
      defaultLengthM: 3.0,
      availableColors: ['ZINC', 'RAL-3009', 'RAL-5005', 'RAL-6005', 'RAL-9003', 'RAL-9005', 'RAL-2004'],
      availableGauges: ['24', '26', '28', '30', '32'],
      stockByBranch: { 'SUC-01': 4200, 'SUC-02': 1450, 'SUC-03': 1890 },
      active: true,
    },
    {
      id: 'PROD-OND-02',
      sku: 'CAL-OND-COLOR',
      name: 'CALAMINA ONDULADA PREPINTADA COLOR RAL',
      profileType: 'ONDULADA',
      description: 'Acero prepintado al horno poliéster siliconado con alta resistencia UV y climática.',
      usefulWidthM: 0.8,
      totalWidthM: 1.07,
      waveOrStepInfo: '11 Ondas · Pintura Poliéster 25µm · Ancho útil 0.80 m',
      basePricePerMeter: 38.0,
      cuttable: true,
      unitLabel: 'ml',
      minLengthM: 1.0,
      maxLengthM: 12.0,
      defaultLengthM: 3.6,
      availableColors: ['RAL-3009', 'RAL-5005', 'RAL-6005', 'RAL-8004', 'RAL-9003', 'RAL-9005', 'RAL-7016', 'RAL-2004', 'RAL-8017'],
      availableGauges: ['26', '28', '30'],
      stockByBranch: { 'SUC-01': 3150, 'SUC-02': 980, 'SUC-03': 1120 },
      active: true,
    },
    {
      id: 'PROD-TRAP-01',
      sku: 'CAL-TRAP-T101',
      name: 'CALAMINA TRAPEZOIDAL T101 INDUSTRIAL',
      profileType: 'TRAPEZOIDAL',
      description: 'Perfil estructural 5 trapecios para galpones, tinglados y cubiertas de baja pendiente.',
      usefulWidthM: 1.0,
      totalWidthM: 1.08,
      waveOrStepInfo: '5 Trapecios · Alto 38 mm · Ancho útil 1.00 m',
      basePricePerMeter: 45.0,
      cuttable: true,
      unitLabel: 'ml',
      minLengthM: 1.5,
      maxLengthM: 12.0,
      defaultLengthM: 6.0,
      availableColors: ['ZINC', 'RAL-5005', 'RAL-3009', 'RAL-9003', 'RAL-6005', 'RAL-7016', 'RAL-9005', 'RAL-2004'],
      availableGauges: ['24', '26', '28'],
      stockByBranch: { 'SUC-01': 3800, 'SUC-02': 1100, 'SUC-03': 950 },
      active: true,
    },
    {
      id: 'PROD-TRAP-02',
      sku: 'CAL-TRAP-T90',
      name: 'CALAMINA TRAPEZOIDAL T90 CUBIERTA LIVIANA',
      profileType: 'TRAPEZOIDAL',
      description: 'Perfil trapezoidal versátil para viviendas, mercados, depósitos y cerramientos laterales.',
      usefulWidthM: 0.9,
      totalWidthM: 0.98,
      waveOrStepInfo: '4 Trapecios · Alto 26 mm · Ancho útil 0.90 m',
      basePricePerMeter: 41.0,
      cuttable: true,
      unitLabel: 'ml',
      minLengthM: 1.2,
      maxLengthM: 10.0,
      defaultLengthM: 4.0,
      availableColors: ['ZINC', 'RAL-3009', 'RAL-5005', 'RAL-6005', 'RAL-9003'],
      availableGauges: ['26', '28', '30'],
      stockByBranch: { 'SUC-01': 2400, 'SUC-02': 760, 'SUC-03': 620 },
      active: true,
    },
    {
      id: 'PROD-TEJA-01',
      sku: 'TEJA-ESP-COLONIAL',
      name: 'TEJA ESPAÑOLA METÁLICA ESTAMPADA',
      profileType: 'TEJA_ESPANOLA',
      description: 'Lámina arquitectónica estampada tipo teja colonial, paso 35 cm, ultra liviana y hermética.',
      usefulWidthM: 1.0,
      totalWidthM: 1.08,
      waveOrStepInfo: 'Paso 350 mm · Alto 42 mm · Ancho útil 1.00 m',
      basePricePerMeter: 56.0,
      cuttable: true,
      unitLabel: 'ml',
      minLengthM: 1.4,
      maxLengthM: 8.4,
      defaultLengthM: 3.5,
      availableColors: ['RAL-3009', 'RAL-8004', 'RAL-3005', 'RAL-9005', 'RAL-7016', 'RAL-6005', 'RAL-8017'],
      availableGauges: ['24', '26', '28'],
      stockByBranch: { 'SUC-01': 2100, 'SUC-02': 840, 'SUC-03': 790 },
      active: true,
    },
    {
      id: 'PROD-TEJA-02',
      sku: 'TEJA-AMERICANA-MATE',
      name: 'TEJA AMERICANA TEXTURIZADA MATE',
      profileType: 'TEJA_ESPANOLA',
      description: 'Acabado texturizado anti-reflejo para condominios y arquitectura contemporánea.',
      usefulWidthM: 1.0,
      totalWidthM: 1.06,
      waveOrStepInfo: 'Paso 330 mm · Acabado Mate · Ancho útil 1.00 m',
      basePricePerMeter: 62.0,
      cuttable: true,
      unitLabel: 'ml',
      minLengthM: 1.5,
      maxLengthM: 7.5,
      defaultLengthM: 3.3,
      availableColors: ['RAL-9005', 'RAL-7016', 'RAL-3009', 'RAL-8004', 'RAL-8017'],
      availableGauges: ['26', '28'],
      stockByBranch: { 'SUC-01': 1180, 'SUC-02': 420, 'SUC-03': 310 },
      active: true,
    },
    ...createExtraProducts(),
    {
      id: 'PROD-CUMB-01',
      sku: 'CUMB-LISA-40',
      name: 'CUMBRERA LISA PLEGADA 40 CM (A MEDIDA)',
      profileType: 'CUMBRERA',
      description: 'Caballete plegado en el mismo color RAL de la calamina. Desarrollo 40 cm, largo estándar 2.00 m.',
      usefulWidthM: 0.4,
      totalWidthM: 0.4,
      waveOrStepInfo: 'Desarrollo 400 mm · Ángulo 135° · Plegado CNC',
      basePricePerMeter: 28.0,
      cuttable: true,
      unitLabel: 'ml',
      minLengthM: 1.0,
      maxLengthM: 3.0,
      defaultLengthM: 2.0,
      availableColors: ['ZINC', 'RAL-3009', 'RAL-5005', 'RAL-6005', 'RAL-8004', 'RAL-9003', 'RAL-9005', 'RAL-7016', 'RAL-3005', 'RAL-2004', 'RAL-8017'],
      availableGauges: ['26', '28'],
      stockByBranch: { 'SUC-01': 960, 'SUC-02': 380, 'SUC-03': 410 },
      active: true,
    },
    {
      id: 'PROD-CUMB-02',
      sku: 'CUMB-TEJA-ESP',
      name: 'CUMBRERA ESTAMPADA TEJA ESPAÑOLA',
      profileType: 'CUMBRERA',
      description: 'Cumbrera semicircular con terminación colonial combinable con Teja Española.',
      usefulWidthM: 0.45,
      totalWidthM: 0.45,
      waveOrStepInfo: 'Desarrollo 450 mm · Media Caña · Color a elección',
      basePricePerMeter: 39.0,
      cuttable: true,
      unitLabel: 'ml',
      minLengthM: 1.0,
      maxLengthM: 2.5,
      defaultLengthM: 2.0,
      availableColors: ['RAL-3009', 'RAL-8004', 'RAL-3005', 'RAL-9005', 'RAL-7016', 'RAL-8017'],
      availableGauges: ['26', '28'],
      stockByBranch: { 'SUC-01': 540, 'SUC-02': 220, 'SUC-03': 190 },
      active: true,
    },
    {
      id: 'PROD-CUMB-03',
      sku: 'CANAL-U-300',
      name: 'CANALETA PLUVIAL CUADRADA 300 MM',
      profileType: 'CUMBRERA',
      description: 'Canaleta recolectora de agua lluvia plegada en acero galvanizado o prepintado.',
      usefulWidthM: 0.3,
      totalWidthM: 0.3,
      waveOrStepInfo: 'Desarrollo 300 mm · Largo estándar 3.00 m',
      basePricePerMeter: 34.0,
      cuttable: true,
      unitLabel: 'ml',
      minLengthM: 1.0,
      maxLengthM: 3.0,
      defaultLengthM: 3.0,
      availableColors: ['ZINC', 'RAL-9003', 'RAL-3009', 'RAL-7016', 'RAL-9005'],
      availableGauges: ['24', '26', '28'],
      stockByBranch: { 'SUC-01': 620, 'SUC-02': 210, 'SUC-03': 180 },
      active: true,
    },
    {
      id: 'PROD-PERF-01',
      sku: 'COST-C-80X40',
      name: 'COSTANERA C GALVANIZADA 80x40x15 MM (6M)',
      profileType: 'PERFIL',
      description: 'Correa estructural galvanizada en frío para soporte de techos residenciales y tinglados.',
      usefulWidthM: 0.08,
      totalWidthM: 0.19,
      waveOrStepInfo: 'Tira 6.00 m · Espesor 1.5 mm',
      basePricePerMeter: 189.0,
      cuttable: false,
      unitLabel: 'tira 6m',
      minLengthM: 6.0,
      maxLengthM: 6.0,
      defaultLengthM: 6.0,
      availableColors: ['ZINC'],
      availableGauges: ['24'],
      stockByBranch: { 'SUC-01': 480, 'SUC-02': 195, 'SUC-03': 230 },
      active: true,
    },
    {
      id: 'PROD-PERF-02',
      sku: 'COST-C-100X50',
      name: 'COSTANERA C ESTRUCTURAL 100x50x15 MM (6M)',
      profileType: 'PERFIL',
      description: 'Correa pesada galvanizada para grandes luces en naves industriales y galpones.',
      usefulWidthM: 0.1,
      totalWidthM: 0.23,
      waveOrStepInfo: 'Tira 6.00 m · Espesor 2.0 mm',
      basePricePerMeter: 248.0,
      cuttable: false,
      unitLabel: 'tira 6m',
      minLengthM: 6.0,
      maxLengthM: 6.0,
      defaultLengthM: 6.0,
      availableColors: ['ZINC'],
      availableGauges: ['24'],
      stockByBranch: { 'SUC-01': 320, 'SUC-02': 110, 'SUC-03': 140 },
      active: true,
    },
    {
      id: 'PROD-ACC-01',
      sku: 'TORN-AUT-2.5',
      name: 'TORNILLO AUTOPERFORANTE 2 1/2" EPDM (BOLSA X 100)',
      profileType: 'ACCESORIO',
      description: 'Tornillo punta broca hexagonal con arandela vulcanizada EPDM anti-filtración.',
      usefulWidthM: 0,
      totalWidthM: 0,
      waveOrStepInfo: 'Bolsa x 100 unidades · Punta broca #12',
      basePricePerMeter: 48.0,
      cuttable: false,
      unitLabel: 'bolsa',
      minLengthM: 1,
      maxLengthM: 1,
      defaultLengthM: 1,
      availableColors: ['ZINC', 'RAL-3009', 'RAL-5005', 'RAL-9005'],
      availableGauges: ['28'],
      stockByBranch: { 'SUC-01': 850, 'SUC-02': 340, 'SUC-03': 410 },
      active: true,
    },
    {
      id: 'PROD-ACC-02',
      sku: 'SELL-POLI-300',
      name: 'SELLADOR POLIURETANO FLEXIBLE TECHOS (300 ML)',
      profileType: 'ACCESORIO',
      description: 'Masilla elástica impermeable resistente a rayos UV para juntas, botaguas y traslapes.',
      usefulWidthM: 0,
      totalWidthM: 0,
      waveOrStepInfo: 'Cartucho 300 ml · Alta elasticidad',
      basePricePerMeter: 42.0,
      cuttable: false,
      unitLabel: 'cartucho',
      minLengthM: 1,
      maxLengthM: 1,
      defaultLengthM: 1,
      availableColors: ['ZINC', 'RAL-9003', 'RAL-9005', 'RAL-3009'],
      availableGauges: ['28'],
      stockByBranch: { 'SUC-01': 310, 'SUC-02': 140, 'SUC-03': 120 },
      active: true,
    },
    {
      id: 'PROD-ACC-03',
      sku: 'AISL-TERM-10',
      name: 'AISLANTE TÉRMICO ALUMINIZADO DOBLE BURBUJA (ROLLO 40M2)',
      profileType: 'ACCESORIO',
      description: 'Membrana termoacústica bajo calamina que reduce hasta 8°C el calor y ruido de lluvia.',
      usefulWidthM: 1.2,
      totalWidthM: 1.2,
      waveOrStepInfo: 'Rollo 1.20m x 33.3m (40 m²)',
      basePricePerMeter: 520.0,
      cuttable: false,
      unitLabel: 'rollo',
      minLengthM: 1,
      maxLengthM: 1,
      defaultLengthM: 1,
      availableColors: ['ZINC'],
      availableGauges: ['28'],
      stockByBranch: { 'SUC-01': 95, 'SUC-02': 42, 'SUC-03': 38 },
      active: true,
    },
  ];

  const coils: CoilStock[] = [
    {
      id: 'COIL-01',
      coilCode: 'BOB-ZINC-28-A',
      branchId: 'SUC-01',
      colorCode: 'ZINC',
      gauge: '28',
      widthMm: 1200,
      initialMeters: 1600,
      remainingMeters: 1340,
      weightKg: 4200,
      supplier: 'Ternium / Acero Sur',
      lotNumber: 'LOT-2026-881',
      status: 'EN_MAQUINA',
      updatedAt: todayIso,
    },
    {
      id: 'COIL-02',
      coilCode: 'BOB-ROJO-28-A',
      branchId: 'SUC-01',
      colorCode: 'RAL-3009',
      gauge: '28',
      widthMm: 1200,
      initialMeters: 1400,
      remainingMeters: 1120,
      weightKg: 3750,
      supplier: 'Gerdau Laminados',
      lotNumber: 'LOT-2026-892',
      status: 'EN_MAQUINA',
      updatedAt: todayIso,
    },
    {
      id: 'COIL-03',
      coilCode: 'BOB-AZUL-26-A',
      branchId: 'SUC-01',
      colorCode: 'RAL-5005',
      gauge: '26',
      widthMm: 1200,
      initialMeters: 1100,
      remainingMeters: 890,
      weightKg: 3800,
      supplier: 'Aceros Arequipa',
      lotNumber: 'LOT-2026-901',
      status: 'DISPONIBLE',
      updatedAt: todayIso,
    },
    {
      id: 'COIL-04',
      coilCode: 'BOB-TERRA-26-A',
      branchId: 'SUC-01',
      colorCode: 'RAL-8004',
      gauge: '26',
      widthMm: 1200,
      initialMeters: 950,
      remainingMeters: 740,
      weightKg: 3250,
      supplier: 'Ternium / Acero Sur',
      lotNumber: 'LOT-2026-907',
      status: 'EN_MAQUINA',
      updatedAt: todayIso,
    },
    {
      id: 'COIL-05',
      coilCode: 'BOB-VERDE-28-A',
      branchId: 'SUC-01',
      colorCode: 'RAL-6005',
      gauge: '28',
      widthMm: 1200,
      initialMeters: 1200,
      remainingMeters: 980,
      weightKg: 3180,
      supplier: 'Importadora Pacífico',
      lotNumber: 'LOT-2026-912',
      status: 'DISPONIBLE',
      updatedAt: todayIso,
    },
    {
      id: 'COIL-06',
      coilCode: 'BOB-NEGRO-26-A',
      branchId: 'SUC-01',
      colorCode: 'RAL-9005',
      gauge: '26',
      widthMm: 1200,
      initialMeters: 900,
      remainingMeters: 620,
      weightKg: 3100,
      supplier: 'Gerdau Laminados',
      lotNumber: 'LOT-2026-918',
      status: 'DISPONIBLE',
      updatedAt: todayIso,
    },
    {
      id: 'COIL-07',
      coilCode: 'BOB-BLANCO-28-B',
      branchId: 'SUC-02',
      colorCode: 'RAL-9003',
      gauge: '28',
      widthMm: 1200,
      initialMeters: 800,
      remainingMeters: 590,
      weightKg: 2150,
      supplier: 'Ternium / Acero Sur',
      lotNumber: 'LOT-2026-925',
      status: 'DISPONIBLE',
      updatedAt: todayIso,
    },
  ];

  const clients: Client[] = [
    {
      id: 'CLI-00',
      name: 'VENTA MOSTRADOR (CONSUMIDOR FINAL)',
      nitCi: '0',
      phone: '-',
      email: '',
      address: 'Retiro en Planta / Mostrador',
      type: 'PARTICULAR',
      creditLimit: 0,
      currentDebt: 0,
    },
    {
      id: 'CLI-01',
      name: 'CONSTRUCTORA ORIENTE S.R.L.',
      nitCi: '3849201014',
      phone: '77012345',
      email: 'compras@orienteconstructora.bo',
      address: 'Av. Banzer 4to Anillo, Santa Cruz',
      type: 'CONSTRUCTORA',
      creditLimit: 45000,
      currentDebt: 8200,
    },
    {
      id: 'CLI-02',
      name: 'FERRETERÍA EL CONSTRUCTOR NORTE',
      nitCi: '4512984018',
      phone: '78541209',
      email: 'pedidos@elconstructor.bo',
      address: 'Av. Mutualista esq. 3er Anillo',
      type: 'FERRETERIA',
      creditLimit: 25000,
      currentDebt: 0,
    },
    {
      id: 'CLI-03',
      name: 'ESTANCIA GANADERA SAN JAVIER',
      nitCi: '1029384756',
      phone: '76311980',
      email: 'administracion@sanjavier.bo',
      address: 'Carretera Chiquitania Km 180',
      type: 'ESTANCIA',
      creditLimit: 30000,
      currentDebt: 4500,
    },
  ];

  const initialSale1: SaleRecord = {
    id: 'SALE-001',
    invoiceNumber: 'FAC-000101',
    createdAt: todayIso,
    branchId: 'SUC-01',
    branchName: 'Planta Industrial Parque Industrial',
    operatorId: 'USR-ADMIN',
    operatorName: 'Administrador Sistema',
    clientId: 'CLI-01',
    clientName: 'CONSTRUCTORA ORIENTE S.R.L.',
    clientNit: '3849201014',
    items: [
      {
        id: 'ITEM-1',
        productId: 'PROD-OND-02',
        sku: 'CAL-OND-COLOR',
        productName: 'CALAMINA ONDULADA PREPINTADA COLOR RAL',
        profileType: 'ONDULADA',
        cuttable: true,
        colorCode: 'RAL-3009',
        colorName: 'Rojo Teja',
        colorHex: '#7E281F',
        gauge: '28',
        lengthMeters: 3.6,
        quantity: 20,
        totalLinearMeters: 72,
        areaSqm: 57.6,
        weightKg: 242.68,
        unitPrice: 160.2,
        pricePerMeter: 44.5,
        subtotal: 3204.0,
        cutNote: 'Cortar en Roladora 1 - Paquete flejado',
      },
      {
        id: 'ITEM-2',
        productId: 'PROD-ACC-01',
        sku: 'TORN-AUT-2.5',
        productName: 'TORNILLO AUTOPERFORANTE 2 1/2" EPDM (BOLSA X 100)',
        profileType: 'ACCESORIO',
        cuttable: false,
        colorCode: 'RAL-3009',
        colorName: 'Rojo Teja',
        colorHex: '#7E281F',
        gauge: '28',
        lengthMeters: 1,
        quantity: 4,
        totalLinearMeters: 4,
        areaSqm: 0,
        weightKg: 1.6,
        unitPrice: 48.0,
        pricePerMeter: 48.0,
        subtotal: 192.0,
      },
    ],
    totalLinearMeters: 72,
    totalAreaSqm: 57.6,
    totalWeightKg: 244.28,
    subtotal: 3396.0,
    discount: 0,
    freightCost: 150,
    total: 3546.0,
    paymentMethod: 'QR_BNB',
    cashPaid: 0,
    qrPaid: 3546.0,
    creditAmount: 0,
    status: 'COMPLETADA',
    deliveryType: 'ENVIO_OBRA',
    dispatchStatus: 'CARGANDO_CAMION',
    cutOrderId: 'CORTE-001',
    qrTransaction: {
      qrId: 401,
      gloss: 'FAC-000101',
      amount: 3546.0,
      currency: 'BOB',
      expirationDate: todayIso.slice(0, 10),
      singleUse: true,
      additionalData: 'CONSTRUCTORA ORIENTE S.R.L.',
      destinationAccountId: '1',
      qrImageBase64: '',
      statusId: 2,
      voucherId: '3JAO702813',
      sourceBankId: 1,
      sourceBankName: 'Banco Nacional de Bolivia (BNB)',
      originName: 'CONSTRUCTORA ORIENTE S.R.L.',
      transactionDateTime: todayIso,
      generatedAt: todayIso,
      mode: 'SIMULADOR',
      saleId: 'SALE-001',
    },
  };

  const initialSale2: SaleRecord = {
    id: 'SALE-002',
    invoiceNumber: 'FAC-000102',
    createdAt: yesterdayIso,
    branchId: 'SUC-01',
    branchName: 'Planta Industrial Parque Industrial',
    operatorId: 'USR-ADMIN',
    operatorName: 'Administrador Sistema',
    clientId: 'CLI-00',
    clientName: 'VENTA MOSTRADOR (CONSUMIDOR FINAL)',
    clientNit: '0',
    items: [
      {
        id: 'ITEM-3',
        productId: 'PROD-TRAP-01',
        sku: 'CAL-TRAP-T101',
        productName: 'CALAMINA TRAPEZOIDAL T101 INDUSTRIAL',
        profileType: 'TRAPEZOIDAL',
        cuttable: true,
        colorCode: 'RAL-5005',
        colorName: 'Azul Zafiro',
        colorHex: '#1A3D7C',
        gauge: '26',
        lengthMeters: 6.0,
        quantity: 12,
        totalLinearMeters: 72,
        areaSqm: 72,
        weightKg: 307.15,
        unitPrice: 349.5,
        pricePerMeter: 58.25,
        subtotal: 4194.0,
      },
    ],
    totalLinearMeters: 72,
    totalAreaSqm: 72,
    totalWeightKg: 307.15,
    subtotal: 4194.0,
    discount: 94.0,
    freightCost: 0,
    total: 4100.0,
    paymentMethod: 'EFECTIVO',
    cashPaid: 4100.0,
    qrPaid: 0,
    creditAmount: 0,
    status: 'COMPLETADA',
    deliveryType: 'RETIRO_PLANTA',
    dispatchStatus: 'ENTREGADO',
    cutOrderId: 'CORTE-002',
  };

  const initialSale3: SaleRecord = {
    id: 'SALE-003',
    invoiceNumber: 'FAC-000103',
    createdAt: twoDaysAgoIso,
    branchId: 'SUC-02',
    branchName: 'Sucursal Norte Km 9 Banzer',
    operatorId: 'USR-VEN-1',
    operatorName: 'Carlos Mendoza',
    clientId: 'CLI-03',
    clientName: 'ESTANCIA GANADERA SAN JAVIER',
    clientNit: '1029384756',
    items: [
      {
        id: 'ITEM-4',
        productId: 'PROD-TEJA-01',
        sku: 'TEJA-ESP-COLONIAL',
        productName: 'TEJA ESPAÑOLA METÁLICA ESTAMPADA',
        profileType: 'TEJA_ESPANOLA',
        cuttable: true,
        colorCode: 'RAL-8004',
        colorName: 'Terracota Colonial',
        colorHex: '#9C4527',
        gauge: '26',
        lengthMeters: 4.2,
        quantity: 30,
        totalLinearMeters: 126,
        areaSqm: 126,
        weightKg: 537.52,
        unitPrice: 301.98,
        pricePerMeter: 71.9,
        subtotal: 9059.4,
      },
    ],
    totalLinearMeters: 126,
    totalAreaSqm: 126,
    totalWeightKg: 537.52,
    subtotal: 9059.4,
    discount: 59.4,
    freightCost: 350,
    total: 9350.0,
    paymentMethod: 'MIXTO',
    cashPaid: 4350.0,
    qrPaid: 5000.0,
    creditAmount: 0,
    status: 'COMPLETADA',
    deliveryType: 'ENVIO_OBRA',
    dispatchStatus: 'ENTREGADO',
    cutOrderId: 'CORTE-003',
  };

  const proformas: ProformaRecord[] = [
    {
      id: 'PROF-001',
      proformaNumber: 'PRO-00045',
      createdAt: todayIso,
      validUntil: new Date(now.getTime() + 7 * 86400000).toISOString(),
      branchId: 'SUC-01',
      branchName: 'Planta Industrial Parque Industrial',
      operatorName: 'Administrador Sistema',
      clientId: 'CLI-02',
      clientName: 'FERRETERÍA EL CONSTRUCTOR NORTE',
      clientNit: '4512984018',
      items: [
        {
          id: 'PITEM-1',
          productId: 'PROD-OND-01',
          sku: 'CAL-OND-ZINC',
          productName: 'CALAMINA ONDULADA ZINCALUM SINUSOIDAL',
          profileType: 'ONDULADA',
          cuttable: true,
          colorCode: 'ZINC',
          colorName: 'Zincalum Natural',
          colorHex: '#B8C4CC',
          gauge: '28',
          lengthMeters: 3.0,
          quantity: 50,
          totalLinearMeters: 150,
          areaSqm: 120,
          weightKg: 505.58,
          unitPrice: 108.0,
          pricePerMeter: 36.0,
          subtotal: 5400.0,
        },
      ],
      subtotal: 5400.0,
      discount: 200.0,
      freightCost: 0,
      total: 5200.0,
      status: 'VIGENTE',
      notes: 'Entrega coordinada con camión grúa',
    },
  ];

  const cutOrders: CutOrder[] = [
    {
      id: 'CORTE-001',
      orderNumber: 'OC-2026-0101',
      saleId: 'SALE-001',
      invoiceNumber: 'FAC-000101',
      branchId: 'SUC-01',
      branchName: 'Planta Industrial Parque Industrial',
      clientName: 'CONSTRUCTORA ORIENTE S.R.L.',
      createdAt: todayIso,
      status: 'EN_ROLADORA',
      machine: 'Roladora Sinusoidal R-01',
      priority: 'URGENTE',
      items: [
        {
          productName: 'CALAMINA ONDULADA PREPINTADA COLOR RAL',
          profileType: 'ONDULADA',
          colorCode: 'RAL-3009',
          colorName: 'Rojo Teja',
          colorHex: '#7E281F',
          gauge: '28',
          lengthMeters: 3.6,
          quantity: 20,
          totalLinearMeters: 72,
          cutNote: 'Cortar en Roladora 1 - Paquete flejado',
        },
      ],
      totalMeters: 72,
      operatorAssigned: 'Juan Mamani (Operador R-01)',
    },
    {
      id: 'CORTE-002',
      orderNumber: 'OC-2026-0102',
      saleId: 'SALE-002',
      invoiceNumber: 'FAC-000102',
      branchId: 'SUC-01',
      branchName: 'Planta Industrial Parque Industrial',
      clientName: 'VENTA MOSTRADOR (CONSUMIDOR FINAL)',
      createdAt: yesterdayIso,
      status: 'LISTO',
      machine: 'Roladora Trapezoidal T101',
      priority: 'NORMAL',
      items: [
        {
          productName: 'CALAMINA TRAPEZOIDAL T101 INDUSTRIAL',
          profileType: 'TRAPEZOIDAL',
          colorCode: 'RAL-5005',
          colorName: 'Azul Zafiro',
          colorHex: '#1A3D7C',
          gauge: '26',
          lengthMeters: 6.0,
          quantity: 12,
          totalLinearMeters: 72,
        },
      ],
      totalMeters: 72,
      operatorAssigned: 'Roberto Quispe',
    },
  ];

  const transfers: StockTransfer[] = [
    {
      id: 'TR-001',
      transferNumber: 'TRASP-0041',
      createdAt: yesterdayIso,
      fromBranchId: 'SUC-01',
      fromBranchName: 'Planta Industrial Parque Industrial',
      toBranchId: 'SUC-02',
      toBranchName: 'Sucursal Norte Km 9 Banzer',
      productId: 'PROD-OND-01',
      productName: 'CALAMINA ONDULADA ZINCALUM SINUSOIDAL',
      colorCode: 'ZINC',
      gauge: '28',
      quantityMetersOrUnits: 300,
      unitLabel: 'ml',
      requestedBy: 'Administrador Sistema',
      status: 'COMPLETADO',
      notes: 'Reposición semanal Sucursal Norte',
    },
  ];

  const purchases: PurchaseOrder[] = [
    {
      id: 'COMP-001',
      orderNumber: 'OC-PROV-708',
      createdAt: twoDaysAgoIso,
      supplier: 'Ternium / Acero Sur',
      branchId: 'SUC-01',
      branchName: 'Planta Industrial Parque Industrial',
      description: 'Bobina Madre Prepintada Rojo Teja RAL-3009 Cal. 28 x 1200mm',
      colorCode: 'RAL-3009',
      gauge: '28',
      metersBought: 1400,
      weightKg: 3750,
      totalCostBs: 34800,
      status: 'RECIBIDA',
    },
  ];

  const shifts: CashRegisterShift[] = [
    {
      id: 'SHIFT-001',
      shiftNumber: 1,
      branchId: 'SUC-01',
      openedAt: todayIso,
      openedBy: 'Administrador Sistema',
      initialCash: 1000.0,
      cashSales: 0,
      qrSales: 3546.0,
      creditSales: 0,
      movements: [
        {
          id: 'MOV-1',
          createdAt: todayIso,
          type: 'EGRESO',
          concept: 'Compra flejes metálicos y cinta de embalaje planta',
          amount: 102.0,
          operatorName: 'Administrador Sistema',
        },
      ],
      expectedCash: 898.0,
      status: 'ABIERTO',
    },
  ];

  const staff: StaffUser[] = [
    {
      id: 'USR-ADMIN',
      username: 'admin',
      fullName: 'Administrador Sistema',
      role: 'ADMIN',
      branchId: 'SUC-01',
      active: true,
      createdAt: twoDaysAgoIso,
    },
    {
      id: 'USR-VEN-1',
      username: 'carlos.ventas',
      fullName: 'Carlos Mendoza',
      role: 'VENDEDOR',
      branchId: 'SUC-02',
      active: true,
      createdAt: twoDaysAgoIso,
    },
    {
      id: 'USR-OP-1',
      username: 'juan.roladora',
      fullName: 'Juan Mamani',
      role: 'OPERADOR_CORTE',
      branchId: 'SUC-01',
      active: true,
      createdAt: twoDaysAgoIso,
    },
  ];

  const auditLogs: AuditLogEntry[] = [
    {
      id: 'AUD-1',
      timestamp: todayIso,
      module: 'BNB_QR',
      action: 'Pago QR Confirmado',
      detail: 'QR #401 pagado por CONSTRUCTORA ORIENTE S.R.L. (Voucher 3JAO702813 · Bs 3.546,00)',
      actorName: 'Webhook BNB',
      actorRole: 'API_MARKET',
    },
    {
      id: 'AUD-2',
      timestamp: yesterdayIso,
      module: 'INVENTARIO',
      action: 'Traspaso Multi-Sucursal',
      detail: 'TRASP-0041: 300 ml de Planta Industrial hacia Sucursal Norte Km 9',
      actorName: 'Administrador Sistema',
      actorRole: 'ADMIN',
    },
  ];

  return {
    adminClaimed: false,
    credentials: [],
    staff,
    branches,
    products,
    coils,
    clients,
    sales: [initialSale1, initialSale2, initialSale3],
    proformas,
    cutOrders,
    transfers,
    purchases,
    shifts,
    qrTransactions: initialSale1.qrTransaction ? [initialSale1.qrTransaction] : [],
    auditLogs,
    bnbConfig: {
      mode: process.env.BNB_ACCOUNT_ID && process.env.BNB_AUTHORIZATION_ID ? 'BNB_API' : 'SIMULADOR',
      baseUrl: process.env.BNB_BASE_URL || 'http://test.bnb.com.bo',
      accountId: process.env.BNB_ACCOUNT_ID || '',
      authorizationId: process.env.BNB_AUTHORIZATION_ID || '',
      destinationAccountId: '1',
    },
    nextQrId: 402,
    nextInvoiceSeq: 104,
    nextCutSeq: 103,
    nextProformaSeq: 46,
  };
}

let cachedDb: DatabaseState | null = null;

export function getDb(): DatabaseState {
  if (cachedDb) return cachedDb;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as DatabaseState;
      if (!Array.isArray(parsed.auditLogs)) {
        parsed.auditLogs = [];
      }
      // Ensure new calamina products (translucent, thermal panel, botaguas) are available if upgrading
      const existingIds = new Set(parsed.products.map((p) => p.id));
      for (const extra of createExtraProducts()) {
        if (!existingIds.has(extra.id)) {
          parsed.products.push(extra);
        }
      }
      cachedDb = parsed;
      return cachedDb;
    }
  } catch {
    // Fall back to fresh in-memory seed
  }
  cachedDb = createInitialSeed();
  saveDb(cachedDb);
  return cachedDb;
}

export function saveDb(db: DatabaseState): void {
  cachedDb = db;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tmpPath = `${DB_PATH}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tmpPath, DB_PATH);
  } catch {
    // Keep cachedDb in memory if disk write is restricted
  }
}

export function appendAuditLog(
  module: AuditLogEntry['module'],
  action: string,
  detail: string,
  actorName: string,
  actorRole: string
): void {
  const db = getDb();
  db.auditLogs.unshift({
    id: `AUD-${Date.now().toString(36).toUpperCase()}`,
    timestamp: new Date().toISOString(),
    module,
    action,
    detail,
    actorName,
    actorRole,
  });
  if (db.auditLogs.length > 250) {
    db.auditLogs = db.auditLogs.slice(0, 250);
  }
  saveDb(db);
}
