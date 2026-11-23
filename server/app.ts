import crypto from 'crypto';
import dotenv from 'dotenv';
import express, { Express, NextFunction, Request, Response } from 'express';
import {
  cancelBnbQr,
  checkBnbQrStatus,
  generateBnbQr,
  getBnbBearerToken,
  processBnbNotification,
  simulateBnbPayment,
  updateBnbRemoteCredentials,
} from './bnbService';
import { buildLaravelProjectZip } from './laravelExport';
import { appendAuditLog, getDb, hashPassword, saveDb, verifyPassword } from './store';
import type {
  BnbPublicConfig,
  CartItem,
  CashRegisterShift,
  Client,
  CoilStock,
  CutOrder,
  CutOrderStatus,
  DispatchStatus,
  PaymentMethod,
  Product,
  ProformaRecord,
  PurchaseOrder,
  SaleRecord,
  StaffUser,
  StockTransfer,
} from '../src/types/calaminas';

dotenv.config();

const IS_VERCEL = Boolean(process.env.VERCEL || process.env.VERCEL_ENV);

function resolveSessionSecret(): string {
  const envSecret = (process.env.SESSION_SECRET || '').trim();
  if (envSecret) return envSecret;
  if (IS_VERCEL) {
    // Stable across cold-start instances in the same Vercel deployment
    const seed =
      process.env.VERCEL_PROJECT_ID ||
      process.env.VERCEL_URL ||
      'acerocal-vercel-runtime-secret';
    return crypto.createHash('sha256').update(`acerocal:${seed}`).digest('hex');
  }
  return crypto.randomBytes(32).toString('hex');
}

const SESSION_SECRET = resolveSessionSecret();
const SESSION_COOKIE_NAME = 'acerocal_session';

interface SessionPayload {
  userId: string;
  username: string;
  fullName: string;
  role: StaffUser['role'];
  branchId: string;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  user?: SessionPayload;
  authViaCookie?: boolean;
}

function signSession(payload: SessionPayload): string {
  const data = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  return `${data}.${sig}`;
}

function verifySession(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [data, sig] = parts;
  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(data).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const decoded = JSON.parse(Buffer.from(data, 'base64url').toString('utf-8')) as SessionPayload;
    if (!decoded.exp || Date.now() > decoded.exp) return null;
    return decoded;
  } catch {
    return null;
  }
}

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie;
  if (!header) return {};
  const result: Record<string, string> = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > -1) {
      const k = part.slice(0, idx).trim();
      const v = decodeURIComponent(part.slice(idx + 1).trim());
      result[k] = v;
    }
  }
  return result;
}

function checkCookieCsrf(req: Request): boolean {
  const method = req.method.toUpperCase();
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true;
  const origin = req.headers.origin;
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host;
  if (origin && host) {
    try {
      const originHost = new URL(origin).host;
      return originHost === host;
    } catch {
      return false;
    }
  }
  return req.headers['x-requested-with'] === 'XMLHttpRequest';
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  let token: string | null = null;
  let viaCookie = false;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else {
    const cookies = parseCookies(req);
    if (cookies[SESSION_COOKIE_NAME]) {
      token = cookies[SESSION_COOKIE_NAME];
      viaCookie = true;
    }
  }

  if (!token) {
    res.status(401).json({ error: 'Sesión no iniciada o expirada.' });
    return;
  }

  if (viaCookie && !checkCookieCsrf(req)) {
    res.status(403).json({ error: 'Validación de origen CSRF denegada.' });
    return;
  }

  const payload = verifySession(token);
  if (!payload) {
    res.status(401).json({ error: 'Token de sesión inválido o expirado.' });
    return;
  }

  req.user = payload;
  req.authViaCookie = viaCookie;
  next();
}

function isHttpsRequest(req: Request): boolean {
  return req.secure || req.headers['x-forwarded-proto'] === 'https' || IS_VERCEL;
}

function setSessionCookie(req: Request, res: Response, token: string): void {
  const maxAge = 7 * 24 * 60 * 60;
  if (isHttpsRequest(req)) {
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=${maxAge}`
    );
  } else {
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}`
    );
  }
}

function clearSessionCookie(req: Request, res: Response): void {
  if (isHttpsRequest(req)) {
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=None; Partitioned; Max-Age=0`
    );
  } else {
    res.setHeader(
      'Set-Cookie',
      `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
    );
  }
}

function getBnbPublicConfig(): BnbPublicConfig {
  const db = getDb();
  const hasEnvAccount = Boolean(process.env.BNB_ACCOUNT_ID);
  const hasEnvAuth = Boolean(process.env.BNB_AUTHORIZATION_ID);
  return {
    mode: db.bnbConfig.mode,
    baseUrl: process.env.BNB_BASE_URL || db.bnbConfig.baseUrl || 'http://test.bnb.com.bo',
    destinationAccountId: db.bnbConfig.destinationAccountId || '1',
    hasAccountId: hasEnvAccount || Boolean(db.bnbConfig.accountId),
    hasAuthorizationId: hasEnvAuth || Boolean(db.bnbConfig.authorizationId),
    webhookPath: '/api/bnb/ReceiveNotification',
    lastTokenCheckAt: db.bnbConfig.lastTokenCheckAt,
  };
}

function recalcShiftExpectedCash(shift: CashRegisterShift): void {
  const income = shift.movements
    .filter((m) => m.type === 'INGRESO')
    .reduce((acc, m) => acc + m.amount, 0);
  const expense = shift.movements
    .filter((m) => m.type === 'EGRESO')
    .reduce((acc, m) => acc + m.amount, 0);
  shift.expectedCash = Number((shift.initialCash + shift.cashSales + income - expense).toFixed(2));
}

export function createExpressApp(): Express {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '4mb' }));

  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'acerocal-pos',
      runtime: IS_VERCEL ? 'vercel-serverless' : 'node-server',
    });
  });

  // Download Complete Laravel 11 Project (.zip)
  app.get('/api/export/laravel-zip', async (_req, res) => {
    try {
      const zipBuffer = await buildLaravelProjectZip();
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="acerocal-laravel-11.zip"');
      res.setHeader('Content-Length', String(zipBuffer.length));
      res.send(zipBuffer);
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : 'No se pudo generar el archivo Laravel .zip.',
      });
    }
  });

  // ---------------------------------------------------------------------------
  // Authentication & First-Run Admin Claim
  // ---------------------------------------------------------------------------
  app.get('/api/auth/status', (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const envPasscode = (process.env.ADMIN_PASSCODE || '').trim();
    const requiresInitialSetup = !envPasscode && !db.adminClaimed;

    let currentUser: SessionPayload | null = null;
    const authHeader = req.headers.authorization;
    const cookies = parseCookies(req);
    const rawToken = authHeader?.startsWith('Bearer ')
      ? authHeader.slice(7).trim()
      : cookies[SESSION_COOKIE_NAME];
    if (rawToken) {
      currentUser = verifySession(rawToken);
    }

    res.json({
      requiresInitialSetup,
      adminClaimed: db.adminClaimed || Boolean(envPasscode),
      authenticated: Boolean(currentUser),
      user: currentUser
        ? {
            id: currentUser.userId,
            username: currentUser.username,
            fullName: currentUser.fullName,
            role: currentUser.role,
            branchId: currentUser.branchId,
          }
        : null,
    });
  });

  app.post('/api/auth/setup-admin', (req, res) => {
    const db = getDb();
    const envPasscode = (process.env.ADMIN_PASSCODE || '').trim();
    if (envPasscode || db.adminClaimed) {
      res.status(409).json({ error: 'La cuenta de administrador ya fue configurada.' });
      return;
    }

    const username = String(req.body?.username || 'admin').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const fullName = String(req.body?.fullName || 'Administrador Sistema').trim();
    const rememberMe = Boolean(req.body?.rememberMe);

    if (!username || username.length < 3) {
      res.status(400).json({ error: 'El usuario debe tener al menos 3 caracteres.' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'La clave inicial debe tener al menos 6 caracteres.' });
      return;
    }

    let adminUser = db.staff.find((u) => u.id === 'USR-ADMIN');
    if (!adminUser) {
      adminUser = {
        id: 'USR-ADMIN',
        username,
        fullName,
        role: 'ADMIN',
        branchId: 'SUC-01',
        active: true,
        createdAt: new Date().toISOString(),
      };
      db.staff.unshift(adminUser);
    } else {
      adminUser.username = username;
      adminUser.fullName = fullName || adminUser.fullName;
    }

    db.credentials = db.credentials.filter((c) => c.userId !== adminUser!.id);
    db.credentials.push({
      userId: adminUser.id,
      username,
      passwordHash: hashPassword(password),
    });
    db.adminClaimed = true;
    saveDb(db);
    appendAuditLog(
      'SEGURIDAD',
      'Administrador Activado',
      `Cuenta maestra @${adminUser.username} reclamada e iniciada`,
      adminUser.fullName,
      adminUser.role
    );

    const payload: SessionPayload = {
      userId: adminUser.id,
      username: adminUser.username,
      fullName: adminUser.fullName,
      role: adminUser.role,
      branchId: adminUser.branchId,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    const token = signSession(payload);
    if (rememberMe) {
      setSessionCookie(req, res, token);
    }

    res.json({
      token,
      user: {
        id: adminUser.id,
        username: adminUser.username,
        fullName: adminUser.fullName,
        role: adminUser.role,
        branchId: adminUser.branchId,
      },
    });
  });

  app.post('/api/auth/login', (req, res) => {
    const db = getDb();
    const username = String(req.body?.username || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    const rememberMe = Boolean(req.body?.rememberMe);

    if (!username || !password) {
      res.status(400).json({ error: 'Ingresa usuario y clave de acceso.' });
      return;
    }

    const envPasscode = (process.env.ADMIN_PASSCODE || '').trim();
    const staffMember = db.staff.find((s) => s.username.toLowerCase() === username && s.active);

    if (!staffMember) {
      res.status(401).json({ error: 'Credenciales incorrectas o usuario inactivo.' });
      return;
    }

    let verified = false;
    if (staffMember.role === 'ADMIN' && envPasscode) {
      const pBuf = Buffer.from(password, 'utf-8');
      const eBuf = Buffer.from(envPasscode, 'utf-8');
      if (pBuf.length === eBuf.length && crypto.timingSafeEqual(pBuf, eBuf)) {
        verified = true;
      }
    }

    if (!verified) {
      const cred = db.credentials.find(
        (c) => c.userId === staffMember.id || c.username.toLowerCase() === username
      );
      if (cred && verifyPassword(password, cred.passwordHash)) {
        verified = true;
      }
    }

    if (!verified) {
      res.status(401).json({ error: 'Usuario o clave de acceso incorrectos.' });
      return;
    }

    const payload: SessionPayload = {
      userId: staffMember.id,
      username: staffMember.username,
      fullName: staffMember.fullName,
      role: staffMember.role,
      branchId: staffMember.branchId,
      exp: Date.now() + 7 * 24 * 60 * 60 * 1000,
    };
    const token = signSession(payload);
    if (rememberMe) {
      setSessionCookie(req, res, token);
    }
    appendAuditLog(
      'SEGURIDAD',
      'Inicio de Sesión',
      `Ingreso al sistema desde @${staffMember.username}`,
      staffMember.fullName,
      staffMember.role
    );

    res.json({
      token,
      user: {
        id: staffMember.id,
        username: staffMember.username,
        fullName: staffMember.fullName,
        role: staffMember.role,
        branchId: staffMember.branchId,
      },
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  // ---------------------------------------------------------------------------
  // Public Webhook for BNB Open Banking QR Notification V2
  // ---------------------------------------------------------------------------
  app.post('/api/bnb/ReceiveNotification', (req, res) => {
    const webhookSecret = (process.env.BNB_WEBHOOK_SECRET || '').trim();
    if (webhookSecret) {
      const provided = String(req.headers['x-bnb-secret'] || req.query.secret || '');
      const a = Buffer.from(provided);
      const b = Buffer.from(webhookSecret);
      if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
        res.status(401).json({ success: false, message: 'Firma webhook inválida.' });
        return;
      }
    }

    const result = processBnbNotification(req.body || {});
    if (result.success && result.transaction) {
      appendAuditLog(
        'BNB_QR',
        'Notificación ReceiveNotification',
        `QR #${result.transaction.qrId} pagado por ${result.transaction.originName} (Voucher ${result.transaction.voucherId})`,
        'Webhook BNB',
        'API_MARKET'
      );
    }
    res.status(result.success ? 200 : 400).json({
      success: result.success,
      message: result.message,
    });
  });

  // ---------------------------------------------------------------------------
  // Protected Bootstrap & ERP Endpoints
  // ---------------------------------------------------------------------------
  app.get('/api/bootstrap', requireAuth, (_req, res) => {
    const db = getDb();
    res.json({
      branches: db.branches,
      products: db.products,
      coils: db.coils,
      clients: db.clients,
      sales: db.sales,
      proformas: db.proformas,
      cutOrders: db.cutOrders,
      transfers: db.transfers,
      purchases: db.purchases,
      shifts: db.shifts,
      qrTransactions: db.qrTransactions,
      auditLogs: db.auditLogs,
      staff: db.staff,
      bnbConfig: getBnbPublicConfig(),
    });
  });

  // Products CRUD
  app.post('/api/products', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const body = req.body as Partial<Product>;
    if (!body.name || !body.sku || !body.profileType) {
      res.status(400).json({ error: 'Nombre, SKU y perfil son obligatorios.' });
      return;
    }
    const newProd: Product = {
      id: `PROD-${Date.now().toString(36).toUpperCase()}`,
      sku: String(body.sku).trim().toUpperCase(),
      name: String(body.name).trim().toUpperCase(),
      profileType: body.profileType,
      description: String(body.description || ''),
      usefulWidthM: Number(body.usefulWidthM ?? 0.8),
      totalWidthM: Number(body.totalWidthM ?? 1.0),
      waveOrStepInfo: String(body.waveOrStepInfo || 'Corte a medida en planta'),
      basePricePerMeter: Number(body.basePricePerMeter ?? 38),
      cuttable: body.cuttable ?? true,
      unitLabel: String(body.unitLabel || (body.cuttable === false ? 'unidad' : 'ml')),
      minLengthM: Number(body.minLengthM ?? 1),
      maxLengthM: Number(body.maxLengthM ?? 12),
      defaultLengthM: Number(body.defaultLengthM ?? 3),
      availableColors:
        Array.isArray(body.availableColors) && body.availableColors.length > 0
          ? body.availableColors
          : ['ZINC'],
      availableGauges:
        Array.isArray(body.availableGauges) && body.availableGauges.length > 0
          ? body.availableGauges
          : ['28'],
      stockByBranch: body.stockByBranch || { 'SUC-01': 500, 'SUC-02': 100, 'SUC-03': 100 },
      active: true,
    };
    db.products.unshift(newProd);
    saveDb(db);
    res.json(newProd);
  });

  app.patch('/api/products/:id', requireAuth, (req, res) => {
    const db = getDb();
    const prod = db.products.find((p) => p.id === req.params.id);
    if (!prod) {
      res.status(404).json({ error: 'Producto no encontrado.' });
      return;
    }
    const patch = req.body as Partial<Product>;
    if (patch.name !== undefined) prod.name = String(patch.name).trim().toUpperCase();
    if (patch.basePricePerMeter !== undefined) prod.basePricePerMeter = Number(patch.basePricePerMeter);
    if (patch.description !== undefined) prod.description = String(patch.description);
    if (patch.availableColors !== undefined) prod.availableColors = patch.availableColors;
    if (patch.availableGauges !== undefined) prod.availableGauges = patch.availableGauges;
    if (patch.stockByBranch !== undefined) prod.stockByBranch = patch.stockByBranch;
    if (patch.active !== undefined) prod.active = Boolean(patch.active);
    saveDb(db);
    res.json(prod);
  });

  // Coils CRUD
  app.post('/api/coils', requireAuth, (req, res) => {
    const db = getDb();
    const b = req.body as Partial<CoilStock>;
    if (!b.coilCode || !b.colorCode || !b.gauge || !b.branchId) {
      res.status(400).json({ error: 'Código de bobina, color, calibre y sucursal son requeridos.' });
      return;
    }
    const coil: CoilStock = {
      id: `COIL-${Date.now().toString(36).toUpperCase()}`,
      coilCode: String(b.coilCode).trim().toUpperCase(),
      branchId: String(b.branchId),
      colorCode: String(b.colorCode),
      gauge: String(b.gauge),
      widthMm: Number(b.widthMm || 1200),
      initialMeters: Number(b.initialMeters || 1200),
      remainingMeters: Number(b.remainingMeters ?? b.initialMeters ?? 1200),
      weightKg: Number(b.weightKg || 3200),
      supplier: String(b.supplier || 'Ternium / Acero Sur'),
      lotNumber: String(b.lotNumber || `LOT-${new Date().getFullYear()}`),
      status: b.status || 'DISPONIBLE',
      updatedAt: new Date().toISOString(),
    };
    db.coils.unshift(coil);
    saveDb(db);
    res.json(coil);
  });

  app.patch('/api/coils/:id', requireAuth, (req, res) => {
    const db = getDb();
    const coil = db.coils.find((c) => c.id === req.params.id);
    if (!coil) {
      res.status(404).json({ error: 'Bobina no encontrada.' });
      return;
    }
    const b = req.body as Partial<CoilStock>;
    if (b.status) coil.status = b.status;
    if (b.remainingMeters !== undefined) coil.remainingMeters = Math.max(0, Number(b.remainingMeters));
    if (b.branchId) coil.branchId = b.branchId;
    coil.updatedAt = new Date().toISOString();
    saveDb(db);
    res.json(coil);
  });

  // Sales Checkout
  app.post('/api/sales', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const body = req.body as {
      branchId: string;
      clientId: string;
      items: CartItem[];
      discount?: number;
      freightCost?: number;
      paymentMethod: PaymentMethod;
      cashPaid?: number;
      qrPaid?: number;
      creditAmount?: number;
      qrId?: number;
      proformaId?: string;
      deliveryType?: 'RETIRO_PLANTA' | 'ENVIO_OBRA';
      deliveryAddress?: string;
      notes?: string;
      priority?: 'NORMAL' | 'URGENTE';
    };

    if (!Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ error: 'El pedido no contiene productos.' });
      return;
    }

    const branch = db.branches.find((b) => b.id === body.branchId) || db.branches[0];
    const client = db.clients.find((c) => c.id === body.clientId) || db.clients[0];

    const subtotal = Number(body.items.reduce((acc, it) => acc + it.subtotal, 0).toFixed(2));
    const discount = Math.max(0, Number(body.discount || 0));
    const freightCost = Math.max(0, Number(body.freightCost || 0));
    const total = Number(Math.max(0, subtotal - discount + freightCost).toFixed(2));

    const cashPaid = Number(body.cashPaid ?? (body.paymentMethod === 'EFECTIVO' ? total : 0));
    const qrPaid = Number(body.qrPaid ?? (body.paymentMethod === 'QR_BNB' ? total : 0));
    const creditAmount = Number(body.creditAmount ?? (body.paymentMethod === 'CREDITO' ? total : 0));

    if (body.paymentMethod === 'CREDITO' && client.id === 'CLI-00') {
      res.status(400).json({ error: 'Las ventas a crédito requieren seleccionar un cliente registrado.' });
      return;
    }

    const invoiceSeq = db.nextInvoiceSeq++;
    const invoiceNumber = `FAC-${String(invoiceSeq).padStart(6, '0')}`;
    const saleId = `SALE-${Date.now().toString(36).toUpperCase()}`;

    const linkedQr = body.qrId ? db.qrTransactions.find((q) => q.qrId === body.qrId) : undefined;
    if (linkedQr) {
      linkedQr.saleId = saleId;
    }

    for (const item of body.items) {
      const prod = db.products.find((p) => p.id === item.productId);
      if (prod) {
        const currentStock = prod.stockByBranch[branch.id] || 0;
        const deduct = prod.cuttable ? item.totalLinearMeters : item.quantity;
        prod.stockByBranch[branch.id] = Number(Math.max(0, currentStock - deduct).toFixed(2));
      }
      if (item.cuttable && item.totalLinearMeters > 0) {
        const matchingCoil =
          db.coils.find(
            (c) =>
              c.branchId === branch.id &&
              c.colorCode === item.colorCode &&
              c.gauge === item.gauge &&
              c.remainingMeters > 0
          ) ||
          db.coils.find(
            (c) => c.branchId === branch.id && c.colorCode === item.colorCode && c.remainingMeters > 0
          );
        if (matchingCoil) {
          matchingCoil.remainingMeters = Number(
            Math.max(0, matchingCoil.remainingMeters - item.totalLinearMeters).toFixed(2)
          );
          if (matchingCoil.remainingMeters <= 0) {
            matchingCoil.status = 'AGOTADA';
          }
          matchingCoil.updatedAt = new Date().toISOString();
        }
      }
    }

    const cuttableItems = body.items.filter((i) => i.cuttable);
    let cutOrderId: string | undefined;
    let createdCutOrder: CutOrder | undefined;
    if (cuttableItems.length > 0) {
      const cutSeq = db.nextCutSeq++;
      cutOrderId = `CORTE-${Date.now().toString(36).toUpperCase()}`;
      const hasTrap = cuttableItems.some((i) => i.profileType === 'TRAPEZOIDAL');
      const hasTeja = cuttableItems.some((i) => i.profileType === 'TEJA_ESPANOLA');
      const machine = hasTeja
        ? 'Estampadora Teja Española'
        : hasTrap
        ? 'Roladora Trapezoidal T101'
        : 'Roladora Sinusoidal R-01';

      createdCutOrder = {
        id: cutOrderId,
        orderNumber: `OC-${new Date().getFullYear()}-${String(cutSeq).padStart(4, '0')}`,
        saleId,
        invoiceNumber,
        branchId: branch.id,
        branchName: branch.name,
        clientName: client.name,
        createdAt: new Date().toISOString(),
        status: 'PENDIENTE',
        machine,
        priority: body.priority || 'NORMAL',
        items: cuttableItems.map((i) => ({
          productName: i.productName,
          profileType: i.profileType,
          colorCode: i.colorCode,
          colorName: i.colorName,
          colorHex: i.colorHex,
          gauge: i.gauge,
          lengthMeters: i.lengthMeters,
          quantity: i.quantity,
          totalLinearMeters: i.totalLinearMeters,
          cutNote: i.cutNote,
        })),
        totalMeters: Number(cuttableItems.reduce((a, i) => a + i.totalLinearMeters, 0).toFixed(2)),
      };
      db.cutOrders.unshift(createdCutOrder);
    }

    const totalLinearMeters = Number(
      body.items.reduce((a, i) => a + (i.cuttable ? i.totalLinearMeters : 0), 0).toFixed(2)
    );
    const totalAreaSqm = Number(body.items.reduce((a, i) => a + i.areaSqm, 0).toFixed(2));
    const totalWeightKg = Number(body.items.reduce((a, i) => a + i.weightKg, 0).toFixed(2));

    const sale: SaleRecord = {
      id: saleId,
      invoiceNumber,
      createdAt: new Date().toISOString(),
      branchId: branch.id,
      branchName: branch.name,
      operatorId: req.user?.userId || 'USR-ADMIN',
      operatorName: req.user?.fullName || 'Operador',
      clientId: client.id,
      clientName: client.name,
      clientNit: client.nitCi,
      items: body.items,
      totalLinearMeters,
      totalAreaSqm,
      totalWeightKg,
      subtotal,
      discount,
      freightCost,
      total,
      paymentMethod: body.paymentMethod,
      cashPaid,
      qrPaid,
      creditAmount,
      status: 'COMPLETADA',
      deliveryType: body.deliveryType || 'RETIRO_PLANTA',
      dispatchStatus: 'EN_PLANTA',
      qrTransaction: linkedQr ? { ...linkedQr } : undefined,
      cutOrderId,
      proformaId: body.proformaId,
      deliveryAddress: body.deliveryAddress || client.address,
      notes: body.notes,
    };

    if (body.proformaId) {
      const prof = db.proformas.find((p) => p.id === body.proformaId);
      if (prof) prof.status = 'CONVERTIDA';
    }

    if (creditAmount > 0) {
      client.currentDebt = Number((client.currentDebt + creditAmount).toFixed(2));
    }

    const openShift =
      db.shifts.find((s) => s.status === 'ABIERTO' && s.branchId === branch.id) ||
      db.shifts.find((s) => s.status === 'ABIERTO');
    if (openShift) {
      openShift.cashSales = Number((openShift.cashSales + cashPaid).toFixed(2));
      openShift.qrSales = Number((openShift.qrSales + qrPaid).toFixed(2));
      openShift.creditSales = Number((openShift.creditSales + creditAmount).toFixed(2));
      recalcShiftExpectedCash(openShift);
    }

    db.sales.unshift(sale);
    saveDb(db);
    appendAuditLog(
      'VENTAS',
      `Venta ${sale.invoiceNumber}`,
      `${sale.clientName} · Bs ${sale.total.toFixed(2)} (${sale.paymentMethod})`,
      sale.operatorName,
      req.user?.role || 'VENDEDOR'
    );
    res.json({ sale, cutOrder: createdCutOrder });
  });

  app.patch('/api/sales/:id/dispatch', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const sale = db.sales.find((s) => s.id === req.params.id);
    if (!sale) {
      res.status(404).json({ error: 'Venta no encontrada.' });
      return;
    }
    const { dispatchStatus } = req.body as { dispatchStatus: DispatchStatus };
    sale.dispatchStatus = dispatchStatus;
    saveDb(db);
    appendAuditLog(
      'VENTAS',
      `Despacho ${sale.invoiceNumber}`,
      `Estado actualizado a ${dispatchStatus}`,
      req.user?.fullName || 'Operador',
      req.user?.role || 'OPERADOR'
    );
    res.json(sale);
  });

  app.post('/api/sales/:id/cancel', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const sale = db.sales.find((s) => s.id === req.params.id);
    if (!sale) {
      res.status(404).json({ error: 'Venta no encontrada.' });
      return;
    }
    if (sale.status === 'ANULADA') {
      res.status(400).json({ error: 'La venta ya se encuentra anulada.' });
      return;
    }

    sale.status = 'ANULADA';
    for (const item of sale.items) {
      const prod = db.products.find((p) => p.id === item.productId);
      if (prod) {
        const restore = prod.cuttable ? item.totalLinearMeters : item.quantity;
        prod.stockByBranch[sale.branchId] = Number(
          ((prod.stockByBranch[sale.branchId] || 0) + restore).toFixed(2)
        );
      }
    }
    if (sale.creditAmount > 0) {
      const client = db.clients.find((c) => c.id === sale.clientId);
      if (client) {
        client.currentDebt = Number(Math.max(0, client.currentDebt - sale.creditAmount).toFixed(2));
      }
    }
    const openShift = db.shifts.find((s) => s.status === 'ABIERTO');
    if (openShift) {
      openShift.cashSales = Number(Math.max(0, openShift.cashSales - sale.cashPaid).toFixed(2));
      openShift.qrSales = Number(Math.max(0, openShift.qrSales - sale.qrPaid).toFixed(2));
      recalcShiftExpectedCash(openShift);
    }
    saveDb(db);
    appendAuditLog(
      'VENTAS',
      `Anulación ${sale.invoiceNumber}`,
      `Venta anulada y stock restaurado (${sale.clientName})`,
      req.user?.fullName || 'Operador',
      req.user?.role || 'ADMIN'
    );
    res.json(sale);
  });

  // Proformas
  app.post('/api/proformas', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const body = req.body as {
      branchId: string;
      clientId: string;
      items: CartItem[];
      discount?: number;
      freightCost?: number;
      notes?: string;
    };
    if (!Array.isArray(body.items) || body.items.length === 0) {
      res.status(400).json({ error: 'Agrega productos antes de guardar la proforma.' });
      return;
    }
    const branch = db.branches.find((b) => b.id === body.branchId) || db.branches[0];
    const client = db.clients.find((c) => c.id === body.clientId) || db.clients[0];
    const subtotal = Number(body.items.reduce((a, i) => a + i.subtotal, 0).toFixed(2));
    const discount = Math.max(0, Number(body.discount || 0));
    const freightCost = Math.max(0, Number(body.freightCost || 0));
    const total = Number(Math.max(0, subtotal - discount + freightCost).toFixed(2));
    const seq = db.nextProformaSeq++;

    const prof: ProformaRecord = {
      id: `PROF-${Date.now().toString(36).toUpperCase()}`,
      proformaNumber: `PRO-${String(seq).padStart(5, '0')}`,
      createdAt: new Date().toISOString(),
      validUntil: new Date(Date.now() + 7 * 86400000).toISOString(),
      branchId: branch.id,
      branchName: branch.name,
      operatorName: req.user?.fullName || 'Vendedor',
      clientId: client.id,
      clientName: client.name,
      clientNit: client.nitCi,
      items: body.items,
      subtotal,
      discount,
      freightCost,
      total,
      status: 'VIGENTE',
      notes: body.notes,
    };
    db.proformas.unshift(prof);
    saveDb(db);
    res.json(prof);
  });

  app.delete('/api/proformas/:id', requireAuth, (req, res) => {
    const db = getDb();
    db.proformas = db.proformas.filter((p) => p.id !== req.params.id);
    saveDb(db);
    res.json({ ok: true });
  });

  // Cut Orders
  app.patch('/api/cut-orders/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const order = db.cutOrders.find((c) => c.id === req.params.id);
    if (!order) {
      res.status(404).json({ error: 'Orden de corte no encontrada.' });
      return;
    }
    const { status, operatorAssigned } = req.body as {
      status?: CutOrderStatus;
      operatorAssigned?: string;
    };
    if (status) order.status = status;
    if (operatorAssigned !== undefined) order.operatorAssigned = operatorAssigned;
    else if (!order.operatorAssigned && req.user) order.operatorAssigned = req.user.fullName;
    saveDb(db);
    res.json(order);
  });

  // Transfers
  app.post('/api/transfers', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const body = req.body as {
      fromBranchId: string;
      toBranchId: string;
      productId: string;
      colorCode: string;
      gauge: string;
      quantity: number;
      notes?: string;
    };

    if (body.fromBranchId === body.toBranchId) {
      res.status(400).json({ error: 'La sucursal de origen y destino deben ser diferentes.' });
      return;
    }
    const qty = Number(body.quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      res.status(400).json({ error: 'La cantidad a traspasar debe ser mayor a cero.' });
      return;
    }
    const fromB = db.branches.find((b) => b.id === body.fromBranchId);
    const toB = db.branches.find((b) => b.id === body.toBranchId);
    const prod = db.products.find((p) => p.id === body.productId);
    if (!fromB || !toB || !prod) {
      res.status(404).json({ error: 'Sucursal o producto no encontrado.' });
      return;
    }

    const originStock = prod.stockByBranch[fromB.id] || 0;
    if (originStock < qty) {
      res.status(400).json({
        error: `Stock insuficiente en ${fromB.name} (${originStock} ${prod.unitLabel} disponibles).`,
      });
      return;
    }

    prod.stockByBranch[fromB.id] = Number((originStock - qty).toFixed(2));
    prod.stockByBranch[toB.id] = Number(((prod.stockByBranch[toB.id] || 0) + qty).toFixed(2));

    const transfer: StockTransfer = {
      id: `TR-${Date.now().toString(36).toUpperCase()}`,
      transferNumber: `TRASP-${String(db.transfers.length + 42).padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
      fromBranchId: fromB.id,
      fromBranchName: fromB.name,
      toBranchId: toB.id,
      toBranchName: toB.name,
      productId: prod.id,
      productName: prod.name,
      colorCode: body.colorCode || 'ZINC',
      gauge: body.gauge || '28',
      quantityMetersOrUnits: qty,
      unitLabel: prod.unitLabel,
      requestedBy: req.user?.fullName || 'Operador',
      status: 'COMPLETADO',
      notes: body.notes,
    };
    db.transfers.unshift(transfer);
    saveDb(db);
    appendAuditLog(
      'INVENTARIO',
      `Traspaso ${transfer.transferNumber}`,
      `${qty} ${prod.unitLabel} de ${prod.name} (${fromB.code} → ${toB.code})`,
      req.user?.fullName || 'Operador',
      req.user?.role || 'ALMACENERO'
    );
    res.json(transfer);
  });

  // Purchases
  app.post('/api/purchases', requireAuth, (req, res) => {
    const db = getDb();
    const b = req.body as {
      supplier: string;
      branchId: string;
      description: string;
      colorCode: string;
      gauge: string;
      metersBought: number;
      weightKg: number;
      totalCostBs: number;
    };
    const branch = db.branches.find((br) => br.id === b.branchId) || db.branches[0];
    const purchase: PurchaseOrder = {
      id: `COMP-${Date.now().toString(36).toUpperCase()}`,
      orderNumber: `OC-PROV-${710 + db.purchases.length}`,
      createdAt: new Date().toISOString(),
      supplier: String(b.supplier || 'Ternium / Acero Sur'),
      branchId: branch.id,
      branchName: branch.name,
      description: String(b.description || `Bobina ${b.colorCode} Cal. ${b.gauge}`),
      colorCode: b.colorCode || 'ZINC',
      gauge: b.gauge || '28',
      metersBought: Number(b.metersBought || 1000),
      weightKg: Number(b.weightKg || 3000),
      totalCostBs: Number(b.totalCostBs || 28000),
      status: 'RECIBIDA',
    };
    db.purchases.unshift(purchase);

    const newCoil: CoilStock = {
      id: `COIL-${Date.now().toString(36).toUpperCase()}`,
      coilCode: `BOB-${purchase.colorCode}-${purchase.gauge}-${String(db.coils.length + 1).padStart(2, '0')}`,
      branchId: branch.id,
      colorCode: purchase.colorCode,
      gauge: purchase.gauge,
      widthMm: 1200,
      initialMeters: purchase.metersBought,
      remainingMeters: purchase.metersBought,
      weightKg: purchase.weightKg,
      supplier: purchase.supplier,
      lotNumber: `LOT-${new Date().getFullYear()}-${930 + db.coils.length}`,
      status: 'DISPONIBLE',
      updatedAt: new Date().toISOString(),
    };
    db.coils.unshift(newCoil);

    saveDb(db);
    res.json({ purchase, coil: newCoil });
  });

  // Clients
  app.post('/api/clients', requireAuth, (req, res) => {
    const db = getDb();
    const b = req.body as Partial<Client>;
    if (!b.name) {
      res.status(400).json({ error: 'El nombre o razón social es obligatorio.' });
      return;
    }
    const client: Client = {
      id: `CLI-${Date.now().toString(36).toUpperCase()}`,
      name: String(b.name).trim().toUpperCase(),
      nitCi: String(b.nitCi || '0').trim(),
      phone: String(b.phone || '-').trim(),
      email: String(b.email || '').trim(),
      address: String(b.address || '').trim(),
      type: b.type || 'PARTICULAR',
      creditLimit: Number(b.creditLimit || 0),
      currentDebt: 0,
    };
    db.clients.push(client);
    saveDb(db);
    res.json(client);
  });

  // Staff Management
  app.post('/api/staff', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Solo los administradores pueden crear usuarios.' });
      return;
    }
    const db = getDb();
    const b = req.body as {
      username: string;
      fullName: string;
      role: StaffUser['role'];
      branchId: string;
      password: string;
    };
    const uname = String(b.username || '').trim().toLowerCase();
    if (!uname || !b.fullName || !b.password || b.password.length < 6) {
      res.status(400).json({
        error: 'Usuario, nombre completo y clave (mín. 6 caracteres) son obligatorios.',
      });
      return;
    }
    if (db.staff.some((s) => s.username.toLowerCase() === uname)) {
      res.status(409).json({ error: 'El nombre de usuario ya existe.' });
      return;
    }
    const user: StaffUser = {
      id: `USR-${Date.now().toString(36).toUpperCase()}`,
      username: uname,
      fullName: String(b.fullName).trim(),
      role: b.role || 'VENDEDOR',
      branchId: b.branchId || 'SUC-01',
      active: true,
      createdAt: new Date().toISOString(),
    };
    db.staff.push(user);
    db.credentials.push({
      userId: user.id,
      username: uname,
      passwordHash: hashPassword(b.password),
    });
    saveDb(db);
    res.json(user);
  });

  app.patch('/api/staff/:id', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Solo administradores pueden modificar permisos.' });
      return;
    }
    const db = getDb();
    const member = db.staff.find((s) => s.id === req.params.id);
    if (!member) {
      res.status(404).json({ error: 'Usuario no encontrado.' });
      return;
    }
    if (req.body.active !== undefined) member.active = Boolean(req.body.active);
    if (req.body.role) member.role = req.body.role;
    saveDb(db);
    res.json(member);
  });

  // Cash Register Shift
  app.post('/api/cash-shift/open', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const { branchId, initialCash } = req.body as { branchId: string; initialCash: number };
    if (db.shifts.some((s) => s.status === 'ABIERTO' && s.branchId === branchId)) {
      res.status(400).json({ error: 'Ya existe un turno de caja abierto para esta sucursal.' });
      return;
    }
    const shift: CashRegisterShift = {
      id: `SHIFT-${Date.now().toString(36).toUpperCase()}`,
      shiftNumber: db.shifts.length + 1,
      branchId: branchId || 'SUC-01',
      openedAt: new Date().toISOString(),
      openedBy: req.user?.fullName || 'Operador',
      initialCash: Number(initialCash || 0),
      cashSales: 0,
      qrSales: 0,
      creditSales: 0,
      movements: [],
      expectedCash: Number(initialCash || 0),
      status: 'ABIERTO',
    };
    db.shifts.unshift(shift);
    saveDb(db);
    res.json(shift);
  });

  app.post('/api/cash-shift/movement', requireAuth, (req: AuthenticatedRequest, res) => {
    const db = getDb();
    const { shiftId, type, concept, amount } = req.body as {
      shiftId: string;
      type: 'INGRESO' | 'EGRESO';
      concept: string;
      amount: number;
    };
    const shift = db.shifts.find((s) => s.id === shiftId && s.status === 'ABIERTO');
    if (!shift) {
      res.status(404).json({ error: 'Turno de caja abierto no encontrado.' });
      return;
    }
    const amt = Number(amount);
    if (!Number.isFinite(amt) || amt <= 0 || !concept) {
      res.status(400).json({ error: 'Concepto y monto válido son obligatorios.' });
      return;
    }
    shift.movements.unshift({
      id: `MOV-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      type,
      concept: String(concept).trim(),
      amount: amt,
      operatorName: req.user?.fullName || 'Operador',
    });
    recalcShiftExpectedCash(shift);
    saveDb(db);
    res.json(shift);
  });

  app.post('/api/cash-shift/close', requireAuth, (req, res) => {
    const db = getDb();
    const { shiftId, countedCash, closeNotes } = req.body as {
      shiftId: string;
      countedCash: number;
      closeNotes?: string;
    };
    const shift = db.shifts.find((s) => s.id === shiftId && s.status === 'ABIERTO');
    if (!shift) {
      res.status(404).json({ error: 'Turno de caja abierto no encontrado.' });
      return;
    }
    shift.status = 'CERRADO';
    shift.closedAt = new Date().toISOString();
    shift.countedCash = Number(countedCash || 0);
    shift.difference = Number((shift.countedCash - shift.expectedCash).toFixed(2));
    shift.closeNotes = closeNotes;
    saveDb(db);
    res.json(shift);
  });

  // BNB Open Banking Pago QR Routes
  app.post('/api/bnb/config', requireAuth, (req: AuthenticatedRequest, res) => {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Solo administradores pueden configurar BNB QR.' });
      return;
    }
    const db = getDb();
    const { mode, baseUrl, accountId, authorizationId, destinationAccountId } = req.body as {
      mode?: 'SIMULADOR' | 'BNB_API';
      baseUrl?: string;
      accountId?: string;
      authorizationId?: string;
      destinationAccountId?: string;
    };
    if (mode) db.bnbConfig.mode = mode;
    if (baseUrl) db.bnbConfig.baseUrl = String(baseUrl).trim();
    if (destinationAccountId) db.bnbConfig.destinationAccountId = String(destinationAccountId).trim();
    if (accountId !== undefined && accountId.trim() !== '') db.bnbConfig.accountId = accountId.trim();
    if (authorizationId !== undefined && authorizationId.trim() !== '') {
      db.bnbConfig.authorizationId = authorizationId.trim();
    }
    saveDb(db);
    res.json(getBnbPublicConfig());
  });

  app.post('/api/bnb/test-token', requireAuth, async (_req, res) => {
    const db = getDb();
    if (db.bnbConfig.mode === 'SIMULADOR') {
      db.bnbConfig.lastTokenCheckAt = new Date().toISOString();
      saveDb(db);
      res.json({
        success: true,
        mode: 'SIMULADOR',
        message: 'Emulador BNB Open Banking activo (Service 5 /auth/token simulado OK).',
      });
      return;
    }
    const result = await getBnbBearerToken();
    res.status(result.success ? 200 : 400).json({
      success: result.success,
      mode: 'BNB_API',
      message: result.success ? 'Token Bearer BNB generado correctamente.' : result.error,
    });
  });

  app.post('/api/bnb/update-credentials', requireAuth, async (req: AuthenticatedRequest, res) => {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ error: 'Solo administradores pueden rotar credenciales BNB.' });
      return;
    }
    const { actualAuthorizationId, newAuthorizationId } = req.body as {
      actualAuthorizationId: string;
      newAuthorizationId: string;
    };
    if (!newAuthorizationId || newAuthorizationId.length < 15) {
      res.status(400).json({
        error:
          'El nuevo authorizationId debe tener mínimo 15 caracteres, letra, número y símbolo especial.',
      });
      return;
    }
    const result = await updateBnbRemoteCredentials(actualAuthorizationId, newAuthorizationId);
    res.status(result.success ? 200 : 400).json(result);
  });

  app.post('/api/bnb/generate-qr', requireAuth, async (req, res) => {
    const { amount, gloss, additionalData, currency, singleUse, expirationDate } = req.body as {
      amount: number;
      gloss: string;
      additionalData?: string;
      currency?: 'BOB' | 'USD';
      singleUse?: boolean;
      expirationDate?: string;
    };
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) {
      res.status(400).json({ error: 'El monto para el QR debe ser mayor a cero.' });
      return;
    }
    const result = await generateBnbQr({
      amount: Number(amount),
      gloss: String(gloss || 'Venta ACEROCAL'),
      additionalData,
      currency,
      singleUse,
      expirationDate,
    });
    if (!result.success) {
      res.status(400).json({ error: result.error || 'Error al generar QR BNB.' });
      return;
    }
    res.json(result.transaction);
  });

  app.get('/api/bnb/qr-status/:qrId', requireAuth, async (req, res) => {
    const qrId = Number(req.params.qrId);
    const status = await checkBnbQrStatus(qrId);
    res.json(status);
  });

  app.post('/api/bnb/cancel-qr/:qrId', requireAuth, async (req, res) => {
    const qrId = Number(req.params.qrId);
    const result = await cancelBnbQr(qrId);
    res.status(result.success ? 200 : 400).json(result);
  });

  app.post('/api/bnb/simulate-payment/:qrId', requireAuth, (req, res) => {
    const qrId = Number(req.params.qrId);
    const { originName, sourceBankId } = req.body as { originName?: string; sourceBankId?: number };
    const result = simulateBnbPayment(qrId, originName, sourceBankId);
    res.status(result.success ? 200 : 400).json(result);
  });

  return app;
}
