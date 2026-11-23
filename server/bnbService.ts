import QRCode from 'qrcode';
import type { BnbQrTransaction } from '../src/types/calaminas';
import { getDb, saveDb } from './store';

interface BnbAuthCache {
  token: string;
  expiresAtMs: number;
}

let bnbTokenCache: BnbAuthCache | null = null;

const SOURCE_BANK_NAMES: Record<number, string> = {
  1: 'Banco Nacional de Bolivia (BNB)',
  2: 'Banco Mercantil Santa Cruz',
  3: 'Banco Bisa',
  4: 'Banco de Crédito (BCP)',
  5: 'Banco Unión',
  6: 'Banco Ganadero',
  7: 'Banco Económico',
  8: 'Banco Sol',
};

function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, '');
}

function generateVoucherCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 10; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Service 5: POST /ClientAuthentication.API/api/v1/auth/token
 */
export async function getBnbBearerToken(): Promise<{ success: boolean; token?: string; error?: string }> {
  const db = getDb();
  const accountId = process.env.BNB_ACCOUNT_ID || db.bnbConfig.accountId;
  const authorizationId = process.env.BNB_AUTHORIZATION_ID || db.bnbConfig.authorizationId;
  const baseUrl = normalizeBaseUrl(process.env.BNB_BASE_URL || db.bnbConfig.baseUrl || 'http://test.bnb.com.bo');

  if (!accountId || !authorizationId) {
    return { success: false, error: 'Credenciales BNB (accountId / authorizationId) no configuradas.' };
  }

  if (bnbTokenCache && Date.now() < bnbTokenCache.expiresAtMs) {
    return { success: true, token: bnbTokenCache.token };
  }

  try {
    const resp = await fetch(`${baseUrl}/ClientAuthentication.API/api/v1/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, authorizationId }),
    });
    const data = (await resp.json()) as { success?: boolean; message?: string };
    if (!resp.ok || !data.success || !data.message) {
      return { success: false, error: data.message || `Error HTTP ${resp.status} al autenticar con BNB.` };
    }
    bnbTokenCache = {
      token: data.message,
      expiresAtMs: Date.now() + 50 * 60 * 1000,
    };
    db.bnbConfig.lastTokenCheckAt = new Date().toISOString();
    saveDb(db);
    return { success: true, token: data.message };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'No se pudo conectar al servidor BNB.',
    };
  }
}

/**
 * Service 6: POST /ClientAuthentication.API/api/v1/auth/UpdateCredentials
 */
export async function updateBnbRemoteCredentials(
  actualAuthorizationId: string,
  newAuthorizationId: string
): Promise<{ success: boolean; message: string }> {
  const db = getDb();
  const accountId = process.env.BNB_ACCOUNT_ID || db.bnbConfig.accountId;
  const baseUrl = normalizeBaseUrl(process.env.BNB_BASE_URL || db.bnbConfig.baseUrl || 'http://test.bnb.com.bo');

  if (db.bnbConfig.mode === 'SIMULADOR') {
    db.bnbConfig.authorizationId = newAuthorizationId;
    saveDb(db);
    return { success: true, message: 'Credenciales actualizadas en modo simulador.' };
  }

  const auth = await getBnbBearerToken();
  if (!auth.success || !auth.token) {
    return { success: false, message: auth.error || 'Error de autenticación BNB.' };
  }

  try {
    const resp = await fetch(`${baseUrl}/ClientAuthentication.API/api/v1/auth/UpdateCredentials`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${auth.token}`,
        'cache-control': 'no-cache',
      },
      body: JSON.stringify({
        AccountId: accountId,
        actualAuthorizationId,
        newAuthorizationId,
      }),
    });
    const data = (await resp.json()) as { success?: boolean; message?: string };
    if (data.success) {
      db.bnbConfig.authorizationId = newAuthorizationId;
      bnbTokenCache = null;
      saveDb(db);
    }
    return { success: Boolean(data.success), message: data.message || '' };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : 'Error de red BNB.' };
  }
}

/**
 * Service 7: POST /QRSimple.API/api/v1/main/getQRWithImageAsync
 */
export async function generateBnbQr(params: {
  amount: number;
  gloss: string;
  additionalData?: string;
  currency?: 'BOB' | 'USD';
  singleUse?: boolean;
  expirationDate?: string;
  saleId?: string;
}): Promise<{ success: boolean; transaction?: BnbQrTransaction; error?: string }> {
  const db = getDb();
  const currency = params.currency || 'BOB';
  const singleUse = params.singleUse ?? true;
  const expirationDate =
    params.expirationDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const destinationAccountId = db.bnbConfig.destinationAccountId || '1';
  const additionalData = params.additionalData || 'ACEROCAL Fábrica de Calaminas';

  if (db.bnbConfig.mode === 'BNB_API') {
    const auth = await getBnbBearerToken();
    if (auth.success && auth.token) {
      const baseUrl = normalizeBaseUrl(process.env.BNB_BASE_URL || db.bnbConfig.baseUrl);
      try {
        const resp = await fetch(`${baseUrl}/QRSimple.API/api/v1/main/getQRWithImageAsync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
            'cache-control': 'no-cache',
          },
          body: JSON.stringify({
            currency,
            gloss: params.gloss,
            amount: Number(params.amount.toFixed(2)),
            singleUse,
            expirationDate,
            additionalData,
            destinationAccountId,
          }),
        });
        const data = (await resp.json()) as {
          id?: string | number;
          qr?: string;
          success?: boolean;
          message?: string;
        };
        if (resp.ok && data.success && data.qr) {
          const tx: BnbQrTransaction = {
            qrId: Number(data.id) || db.nextQrId++,
            gloss: params.gloss,
            amount: Number(params.amount.toFixed(2)),
            currency,
            expirationDate,
            singleUse,
            additionalData,
            destinationAccountId,
            qrImageBase64: data.qr,
            statusId: 1,
            voucherId: null,
            sourceBankId: null,
            sourceBankName: null,
            originName: null,
            transactionDateTime: null,
            generatedAt: new Date().toISOString(),
            mode: 'BNB_API',
            saleId: params.saleId,
          };
          db.qrTransactions.unshift(tx);
          saveDb(db);
          return { success: true, transaction: tx };
        }
        return { success: false, error: data.message || 'BNB no pudo generar el código QR.' };
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : 'Error al conectar con BNB API.' };
      }
    }
  }

  // Local faithful BNB Open Banking QR Simple Sandbox Simulator
  const qrId = db.nextQrId++;
  const emvPayload = [
    '000201',
    '010212',
    `26360010BO.BNB.QRS0108${String(qrId).padStart(8, '0')}`,
    `52045211`, // Building materials MCC
    `5303${currency === 'BOB' ? '068' : '840'}`,
    `54${String(params.amount.toFixed(2).length).padStart(2, '0')}${params.amount.toFixed(2)}`,
    '5802BO',
    '5918ACEROCAL CALAMINAS',
    '6010SANTA CRUZ',
    `622405${String(params.gloss.slice(0, 16).length).padStart(2, '0')}${params.gloss.slice(0, 16)}`,
  ].join('');

  const dataUrl = await QRCode.toDataURL(emvPayload, {
    width: 320,
    margin: 2,
    color: { dark: '#0B1324', light: '#FFFFFF' },
  });
  const base64Only = dataUrl.replace(/^data:image\/png;base64,/, '');

  const tx: BnbQrTransaction = {
    qrId,
    gloss: params.gloss,
    amount: Number(params.amount.toFixed(2)),
    currency,
    expirationDate,
    singleUse,
    additionalData,
    destinationAccountId,
    qrImageBase64: base64Only,
    statusId: 1, // 1 = No Usado
    voucherId: null,
    sourceBankId: null,
    sourceBankName: null,
    originName: null,
    transactionDateTime: null,
    generatedAt: new Date().toISOString(),
    mode: 'SIMULADOR',
    saleId: params.saleId,
  };

  db.qrTransactions.unshift(tx);
  saveDb(db);
  return { success: true, transaction: tx };
}

/**
 * Service 9: POST /QRSimple.API/api/v1/main/getQRStatusAsync
 */
export async function checkBnbQrStatus(qrId: number): Promise<{
  id: number;
  statusId: 1 | 2 | 3 | 4;
  expirationDate: string;
  voucherId: string | null;
  success: boolean;
  message: string | null;
  transaction?: BnbQrTransaction;
}> {
  const db = getDb();
  const tx = db.qrTransactions.find((q) => q.qrId === qrId);

  if (tx && tx.mode === 'BNB_API' && db.bnbConfig.mode === 'BNB_API') {
    const auth = await getBnbBearerToken();
    if (auth.success && auth.token) {
      const baseUrl = normalizeBaseUrl(process.env.BNB_BASE_URL || db.bnbConfig.baseUrl);
      try {
        const resp = await fetch(`${baseUrl}/QRSimple.API/api/v1/main/getQRStatusAsync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
            'cache-control': 'no-cache',
          },
          body: JSON.stringify({ qrId }),
        });
        const data = (await resp.json()) as {
          id?: number;
          statusId?: 1 | 2 | 3 | 4;
          expirationDate?: string;
          voucherId?: string | null;
          success?: boolean;
          message?: string | null;
        };
        if (resp.ok && data.success && data.statusId) {
          tx.statusId = data.statusId;
          if (data.voucherId) tx.voucherId = data.voucherId;
          saveDb(db);
          return {
            id: qrId,
            statusId: tx.statusId,
            expirationDate: tx.expirationDate,
            voucherId: tx.voucherId,
            success: true,
            message: null,
            transaction: tx,
          };
        }
      } catch {
        // Fallback to cached local record
      }
    }
  }

  if (!tx) {
    return {
      id: qrId,
      statusId: 4,
      expirationDate: '',
      voucherId: null,
      success: false,
      message: 'QR no encontrado en el registro.',
    };
  }

  return {
    id: tx.qrId,
    statusId: tx.statusId,
    expirationDate: tx.expirationDate,
    voucherId: tx.voucherId,
    success: true,
    message: null,
    transaction: tx,
  };
}

/**
 * Service 10: POST /QRSimple.API/api/v1/main/CancelQRByIdAsync
 */
export async function cancelBnbQr(qrId: number): Promise<{ success: boolean; message: string | null }> {
  const db = getDb();
  const tx = db.qrTransactions.find((q) => q.qrId === qrId);
  if (!tx) {
    return { success: false, message: 'Identificador QR no encontrado.' };
  }
  if (tx.statusId === 2) {
    return { success: false, message: 'No se puede anular un QR que ya fue pagado.' };
  }

  if (tx.mode === 'BNB_API' && db.bnbConfig.mode === 'BNB_API') {
    const auth = await getBnbBearerToken();
    if (auth.success && auth.token) {
      const baseUrl = normalizeBaseUrl(process.env.BNB_BASE_URL || db.bnbConfig.baseUrl);
      try {
        await fetch(`${baseUrl}/QRSimple.API/api/v1/main/CancelQRByIdAsync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth.token}`,
            'cache-control': 'no-cache',
          },
          body: JSON.stringify({ qrId }),
        });
      } catch {
        // Continue local cancel
      }
    }
  }

  tx.statusId = 3; // Anulado / Expirado
  saveDb(db);
  return { success: true, message: null };
}

/**
 * Webhook: POST ReceiveNotification (BNB Open Banking QR Notification V2)
 * Payload: { QRId, Gloss, sourceBankId, originName, VoucherId, TransactionDateTime, additionalData }
 */
export function processBnbNotification(payload: {
  QRId: string | number;
  Gloss?: string;
  sourceBankId?: number;
  originName?: string;
  VoucherId?: string;
  TransactionDateTime?: string;
  additionalData?: string;
}): { success: boolean; message: string; transaction?: BnbQrTransaction } {
  const db = getDb();
  const qrIdNum = Number(payload.QRId);
  if (!Number.isFinite(qrIdNum)) {
    return { success: false, message: 'QRId inválido' };
  }

  const tx = db.qrTransactions.find((q) => q.qrId === qrIdNum);
  if (!tx) {
    return { success: false, message: `QRId ${qrIdNum} no encontrado` };
  }

  if (tx.statusId === 3) {
    return { success: false, message: 'El QR se encuentra expirado o anulado' };
  }

  tx.statusId = 2; // 2 = Usado / Pagado
  tx.voucherId = payload.VoucherId || generateVoucherCode();
  tx.sourceBankId = payload.sourceBankId ?? 1;
  tx.sourceBankName = SOURCE_BANK_NAMES[tx.sourceBankId] || `Entidad Financiera #${tx.sourceBankId}`;
  tx.originName = payload.originName || 'PAGADOR QR SIMPLE';
  tx.transactionDateTime = payload.TransactionDateTime || new Date().toISOString();

  // Update linked pending sale if any
  if (tx.saleId) {
    const sale = db.sales.find((s) => s.id === tx.saleId);
    if (sale) {
      sale.qrTransaction = { ...tx };
      if (sale.status === 'PENDIENTE_QR') {
        sale.status = 'COMPLETADA';
      }
    }
  }

  saveDb(db);
  return { success: true, message: 'OK', transaction: tx };
}

export function simulateBnbPayment(
  qrId: number,
  originName = 'CARLOS ALBERTO ROJAS',
  sourceBankId = 1
): { success: boolean; message: string; transaction?: BnbQrTransaction } {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = now.getFullYear();
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');

  const db = getDb();
  const tx = db.qrTransactions.find((q) => q.qrId === qrId);

  return processBnbNotification({
    QRId: String(qrId),
    Gloss: tx?.gloss || '',
    sourceBankId,
    originName,
    VoucherId: generateVoucherCode(),
    TransactionDateTime: `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`,
    additionalData: tx?.additionalData || '',
  });
}
