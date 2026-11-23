import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Calculator,
  CheckCircle2,
  CreditCard,
  FileText,
  Layers,
  MapPin,
  Minus,
  Percent,
  Plus,
  QrCode,
  Ruler,
  Scissors,
  Search,
  ShoppingCart,
  Split,
  Sun,
  Trash2,
  Truck,
  UserPlus,
  Wallet,
  Wrench,
  X,
} from 'lucide-react';
import { apiFetch } from '../lib/api';
import {
  BnbQrTransaction,
  CALAMINA_COLORS,
  CartItem,
  CashRegisterShift,
  Client,
  computeSheetPricing,
  CutOrder,
  formatBs,
  GAUGE_SPECS,
  getColorByCode,
  getGaugeSpec,
  PaymentMethod,
  Product,
  PROFILE_LABELS,
  ProfileType,
  ProformaRecord,
  SaleRecord,
} from '../types/calaminas';
import { BnbQrModal } from './BnbQrModal';
import { CalaminaProfileSVG } from './CalaminaProfileSVG';
import { RoofVisualizerSVG } from './RoofVisualizerSVG';

interface PosViewProps {
  products: Product[];
  clients: Client[];
  proformas: ProformaRecord[];
  activeShift: CashRegisterShift | undefined;
  activeBranchId: string;
  initialProfileFilter?: ProfileType | 'ALL';
  onOpenCashShiftModal: () => void;
  onSaleCompleted: (sale: SaleRecord, cutOrder?: CutOrder) => Promise<void>;
  onOpenPrintModal: (opts: { sale?: SaleRecord; proforma?: ProformaRecord }) => void;
  onRefreshData: () => Promise<void>;
}

const LENGTH_PRESETS = [1.8, 2.4, 3.0, 3.6, 4.0, 5.0, 6.0];

export const PosView: React.FC<PosViewProps> = ({
  products,
  clients,
  proformas,
  activeShift,
  activeBranchId,
  initialProfileFilter = 'ALL',
  onOpenCashShiftModal,
  onSaleCompleted,
  onOpenPrintModal,
  onRefreshData,
}) => {
  const [search, setSearch] = useState('');
  const [profileFilter, setProfileFilter] = useState<ProfileType | 'ALL'>(initialProfileFilter);
  const [colorFilter, setColorFilter] = useState<string>('ALL');
  const [cardPreviewColors, setCardPreviewColors] = useState<Record<string, string>>({});

  // Cart & Checkout State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('CLI-00');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('EFECTIVO');
  const [discount, setDiscount] = useState<number>(0);
  const [freightCost, setFreightCost] = useState<number>(0);
  const [mixedCash, setMixedCash] = useState<number>(0);
  const [priority, setPriority] = useState<'NORMAL' | 'URGENTE'>('NORMAL');
  const [deliveryType, setDeliveryType] = useState<'RETIRO_PLANTA' | 'ENVIO_OBRA'>('RETIRO_PLANTA');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [activeProformaId, setActiveProformaId] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Sheet Cut & Color Configurator Modal
  const [configProduct, setConfigProduct] = useState<Product | null>(null);
  const [cfgColor, setCfgColor] = useState<string>('ZINC');
  const [cfgGauge, setCfgGauge] = useState<string>('28');
  const [cfgLength, setCfgLength] = useState<number>(3.0);
  const [cfgQty, setCfgQty] = useState<number>(10);
  const [cfgNote, setCfgNote] = useState<string>('');
  const [cfgPreviewMode, setCfgPreviewMode] = useState<'SHEET' | 'ROOF'>('SHEET');

  // Roof Calculator Modal
  const [roofCalcOpen, setRoofCalcOpen] = useState(false);
  const [roofWidth, setRoofWidth] = useState(8.0);
  const [roofSlopeLen, setRoofSlopeLen] = useState(4.5);
  const [roofSlopes, setRoofSlopes] = useState<1 | 2>(2);
  const [roofProductId, setRoofProductId] = useState<string>('PROD-OND-02');
  const [roofColor, setRoofColor] = useState<string>('RAL-3009');
  const [roofGauge, setRoofGauge] = useState<string>('28');
  const [roofIncludeSkylight, setRoofIncludeSkylight] = useState<boolean>(true);

  // Proformas Drawer & Quick Client Modal & BNB QR Modal
  const [proformasOpen, setProformasOpen] = useState(false);
  const [quickClientOpen, setQuickClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientNit, setNewClientNit] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientType, setNewClientType] = useState<Client['type']>('CONSTRUCTORA');

  const [bnbQrOpen, setBnbQrOpen] = useState(false);
  const [qrTargetAmount, setQrTargetAmount] = useState(0);

  useEffect(() => {
    setProfileFilter(initialProfileFilter);
  }, [initialProfileFilter]);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (!p.active) return false;
      if (profileFilter !== 'ALL' && p.profileType !== profileFilter) return false;
      if (colorFilter !== 'ALL' && !p.availableColors.includes(colorFilter)) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [products, search, profileFilter, colorFilter]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) || clients[0],
    [clients, selectedClientId]
  );

  const cartStats = useMemo(() => {
    const totalUnits = cart.reduce((a, i) => a + i.quantity, 0);
    const totalMeters = Number(
      cart.reduce((a, i) => a + (i.cuttable ? i.totalLinearMeters : 0), 0).toFixed(2)
    );
    const subtotal = Number(cart.reduce((a, i) => a + i.subtotal, 0).toFixed(2));
    const total = Number(Math.max(0, subtotal - discount + freightCost).toFixed(2));
    return { totalUnits, totalMeters, subtotal, total };
  }, [cart, discount, freightCost]);

  const openConfigurator = (product: Product) => {
    const preferredColor =
      colorFilter !== 'ALL' && product.availableColors.includes(colorFilter)
        ? colorFilter
        : cardPreviewColors[product.id] || product.availableColors[0] || 'ZINC';

    if (!product.cuttable) {
      // Quick add non-cuttable accessories / standard 6m purlins directly or allow quantity edit
      const pricing = computeSheetPricing(product, preferredColor, product.availableGauges[0] || '28', product.defaultLengthM);
      const color = getColorByCode(preferredColor);
      addToCart({
        id: `CART-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        productId: product.id,
        sku: product.sku,
        productName: product.name,
        profileType: product.profileType,
        cuttable: false,
        colorCode: color.code,
        colorName: color.name,
        colorHex: color.hex,
        gauge: product.availableGauges[0] || '28',
        lengthMeters: product.defaultLengthM,
        quantity: 1,
        totalLinearMeters: product.defaultLengthM,
        areaSqm: pricing.areaSqm,
        weightKg: pricing.weightKg,
        unitPrice: pricing.unitPrice,
        pricePerMeter: pricing.pricePerMeter,
        subtotal: pricing.unitPrice,
      });
      return;
    }

    setConfigProduct(product);
    setCfgColor(preferredColor);
    setCfgGauge(
      product.availableGauges.includes('28')
        ? '28'
        : product.availableGauges[0] || '28'
    );
    setCfgLength(product.defaultLengthM);
    setCfgQty(10);
    setCfgNote('');
  };

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex(
        (c) =>
          c.productId === item.productId &&
          c.colorCode === item.colorCode &&
          c.gauge === item.gauge &&
          Math.abs(c.lengthMeters - item.lengthMeters) < 0.01 &&
          (c.cutNote || '') === (item.cutNote || '')
      );
      if (existingIdx > -1) {
        const updated = [...prev];
        const cur = updated[existingIdx];
        const newQty = cur.quantity + item.quantity;
        const perUnitMeters = cur.cuttable ? cur.lengthMeters : 1;
        updated[existingIdx] = {
          ...cur,
          quantity: newQty,
          totalLinearMeters: Number((newQty * perUnitMeters).toFixed(2)),
          subtotal: Number((newQty * cur.unitPrice).toFixed(2)),
        };
        return updated;
      }
      return [...prev, item];
    });
    setFeedback(null);
  };

  const handleConfirmConfigure = () => {
    if (!configProduct) return;
    const len = Math.max(
      configProduct.minLengthM,
      Math.min(configProduct.maxLengthM, Number(cfgLength) || configProduct.defaultLengthM)
    );
    const qty = Math.max(1, Math.round(Number(cfgQty) || 1));
    const pricing = computeSheetPricing(configProduct, cfgColor, cfgGauge, len);
    const color = getColorByCode(cfgColor);

    addToCart({
      id: `CART-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      productId: configProduct.id,
      sku: configProduct.sku,
      productName: configProduct.name,
      profileType: configProduct.profileType,
      cuttable: true,
      colorCode: color.code,
      colorName: color.name,
      colorHex: color.hex,
      gauge: cfgGauge,
      lengthMeters: Number(len.toFixed(2)),
      quantity: qty,
      totalLinearMeters: Number((len * qty).toFixed(2)),
      areaSqm: Number((pricing.areaSqm * qty).toFixed(2)),
      weightKg: Number((pricing.weightKg * qty).toFixed(2)),
      unitPrice: pricing.unitPrice,
      pricePerMeter: pricing.pricePerMeter,
      subtotal: Number((pricing.unitPrice * qty).toFixed(2)),
      cutNote: cfgNote.trim() || undefined,
    });
    setConfigProduct(null);
  };

  const updateCartQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id !== itemId) return item;
          const nextQty = item.quantity + delta;
          if (nextQty <= 0) return null;
          const perUnitMeters = item.cuttable ? item.lengthMeters : 1;
          return {
            ...item,
            quantity: nextQty,
            totalLinearMeters: Number((nextQty * perUnitMeters).toFixed(2)),
            subtotal: Number((nextQty * item.unitPrice).toFixed(2)),
          };
        })
        .filter((x): x is CartItem => x !== null)
    );
  };

  const submitSale = async (qrTx?: BnbQrTransaction) => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const cashPaid =
        paymentMethod === 'EFECTIVO'
          ? cartStats.total
          : paymentMethod === 'MIXTO'
          ? Math.min(cartStats.total, Math.max(0, mixedCash))
          : 0;
      const qrPaid =
        paymentMethod === 'QR_BNB'
          ? cartStats.total
          : paymentMethod === 'MIXTO'
          ? Number(Math.max(0, cartStats.total - cashPaid).toFixed(2))
          : 0;
      const creditAmount = paymentMethod === 'CREDITO' ? cartStats.total : 0;

      const res = await apiFetch<{ sale: SaleRecord; cutOrder?: CutOrder }>('/api/sales', {
        method: 'POST',
        body: JSON.stringify({
          branchId: activeBranchId,
          clientId: selectedClientId,
          items: cart,
          discount,
          freightCost,
          paymentMethod,
          cashPaid,
          qrPaid,
          creditAmount,
          qrId: qrTx?.qrId,
          proformaId: activeProformaId,
          deliveryType,
          deliveryAddress:
            deliveryType === 'ENVIO_OBRA' ? deliveryAddress.trim() || undefined : undefined,
          priority,
        }),
      });

      setCart([]);
      setDiscount(0);
      setFreightCost(0);
      setMixedCash(0);
      setDeliveryType('RETIRO_PLANTA');
      setDeliveryAddress('');
      setActiveProformaId(undefined);
      setBnbQrOpen(false);

      await onSaleCompleted(res.sale, res.cutOrder);
      setFeedback({
        type: 'ok',
        text: `Venta ${res.sale.invoiceNumber} registrada${
          res.cutOrder ? ` · Orden de corte ${res.cutOrder.orderNumber} enviada a roladora` : ''
        }.`,
      });
      onOpenPrintModal({ sale: res.sale });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Error al procesar venta.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckoutClick = () => {
    if (cart.length === 0) return;
    setFeedback(null);
    if (paymentMethod === 'CREDITO' && selectedClientId === 'CLI-00') {
      setFeedback({
        type: 'err',
        text: 'Selecciona un cliente registrado (Constructora/Ferretería) para vender a crédito.',
      });
      return;
    }

    if (paymentMethod === 'QR_BNB') {
      setQrTargetAmount(cartStats.total);
      setBnbQrOpen(true);
      return;
    }

    if (paymentMethod === 'MIXTO') {
      const qrPart = Number(Math.max(0, cartStats.total - mixedCash).toFixed(2));
      if (qrPart > 0) {
        setQrTargetAmount(qrPart);
        setBnbQrOpen(true);
        return;
      }
    }

    submitSale();
  };

  const handleSaveProforma = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const prof = await apiFetch<ProformaRecord>('/api/proformas', {
        method: 'POST',
        body: JSON.stringify({
          branchId: activeBranchId,
          clientId: selectedClientId,
          items: cart,
          discount,
          freightCost,
          notes: deliveryAddress || undefined,
        }),
      });
      await onRefreshData();
      setFeedback({
        type: 'ok',
        text: `Proforma ${prof.proformaNumber} guardada con éxito.`,
      });
      onOpenPrintModal({ proforma: prof });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Error al guardar proforma.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLoadProforma = (prof: ProformaRecord) => {
    setCart(prof.items);
    setSelectedClientId(prof.clientId);
    setDiscount(prof.discount);
    setFreightCost(prof.freightCost);
    setActiveProformaId(prof.id);
    setProformasOpen(false);
    setFeedback({
      type: 'ok',
      text: `Proforma ${prof.proformaNumber} cargada al mostrador.`,
    });
  };

  const handleCreateQuickClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;
    try {
      const created = await apiFetch<Client>('/api/clients', {
        method: 'POST',
        body: JSON.stringify({
          name: newClientName,
          nitCi: newClientNit || '0',
          phone: newClientPhone || '-',
          type: newClientType,
        }),
      });
      await onRefreshData();
      setSelectedClientId(created.id);
      setQuickClientOpen(false);
      setNewClientName('');
      setNewClientNit('');
      setNewClientPhone('');
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Error al crear cliente.',
      });
    }
  };

  // Roof Calculator Calculations
  const roofCalcResult = useMemo(() => {
    const prod = products.find((p) => p.id === roofProductId) || products[0];
    const usefulW = prod?.usefulWidthM || 0.8;
    const sheetsPerSide = Math.ceil(roofWidth / usefulW);
    const totalSheets = sheetsPerSide * roofSlopes;
    const skylightCount = roofIncludeSkylight ? Math.max(1, Math.round(totalSheets * 0.1)) : 0;
    const mainSheets = Math.max(1, totalSheets - skylightCount);
    const sheetLength = Number((roofSlopeLen + 0.15).toFixed(2));
    const pricing = prod
      ? computeSheetPricing(prod, roofColor, roofGauge, sheetLength)
      : { unitPrice: 120, pricePerMeter: 40, areaSqm: 3, weightKg: 10 };

    const skylightSku = prod?.profileType === 'TRAPEZOIDAL' ? 'TRASL-T101-PC' : 'TRASL-OND-PC';
    const skylightProd = products.find((p) => p.sku === skylightSku) || products.find((p) => p.profileType === 'TRASLUCIDA');
    const skylightPricing = skylightProd
      ? computeSheetPricing(skylightProd, 'TRANS', '28', sheetLength)
      : { unitPrice: 58 * sheetLength, pricePerMeter: 58, areaSqm: 2.5, weightKg: 3 };

    const ridgeQty = roofSlopes === 2 ? Math.ceil(roofWidth / 1.9) : 0; // 2m cumbrera with 10cm overlap
    const screwBags = Math.max(1, Math.ceil((roofWidth * roofSlopeLen * roofSlopes * 6) / 100));
    const estimatedTotal =
      mainSheets * pricing.unitPrice +
      skylightCount * skylightPricing.unitPrice +
      ridgeQty * 56 +
      screwBags * 48;

    return {
      prod,
      skylightProd,
      sheetsPerSide,
      totalSheets,
      mainSheets,
      skylightCount,
      sheetLength,
      pricing,
      skylightPricing,
      ridgeQty,
      screwBags,
      estimatedTotal,
    };
  }, [products, roofProductId, roofWidth, roofSlopeLen, roofSlopes, roofColor, roofGauge, roofIncludeSkylight]);

  const handleApplyRoofCalculation = () => {
    const {
      prod,
      skylightProd,
      mainSheets,
      skylightCount,
      sheetLength,
      pricing,
      skylightPricing,
      ridgeQty,
      screwBags,
    } = roofCalcResult;
    if (!prod) return;
    const color = getColorByCode(roofColor);

    addToCart({
      id: `CART-ROOF-${Date.now()}`,
      productId: prod.id,
      sku: prod.sku,
      productName: prod.name,
      profileType: prod.profileType,
      cuttable: true,
      colorCode: color.code,
      colorName: color.name,
      colorHex: color.hex,
      gauge: roofGauge,
      lengthMeters: sheetLength,
      quantity: mainSheets,
      totalLinearMeters: Number((mainSheets * sheetLength).toFixed(2)),
      areaSqm: Number((pricing.areaSqm * mainSheets).toFixed(2)),
      weightKg: Number((pricing.weightKg * mainSheets).toFixed(2)),
      unitPrice: pricing.unitPrice,
      pricePerMeter: pricing.pricePerMeter,
      subtotal: Number((pricing.unitPrice * mainSheets).toFixed(2)),
      cutNote: `Techo ${roofWidth}m x ${roofSlopeLen}m (${roofSlopes} agua/s)`,
    });

    if (skylightCount > 0 && skylightProd) {
      const transColor = getColorByCode('TRANS');
      addToCart({
        id: `CART-SKY-${Date.now()}`,
        productId: skylightProd.id,
        sku: skylightProd.sku,
        productName: skylightProd.name,
        profileType: skylightProd.profileType,
        cuttable: true,
        colorCode: transColor.code,
        colorName: transColor.name,
        colorHex: transColor.hex,
        gauge: '28',
        lengthMeters: sheetLength,
        quantity: skylightCount,
        totalLinearMeters: Number((skylightCount * sheetLength).toFixed(2)),
        areaSqm: Number((skylightPricing.areaSqm * skylightCount).toFixed(2)),
        weightKg: Number((skylightPricing.weightKg * skylightCount).toFixed(2)),
        unitPrice: skylightPricing.unitPrice,
        pricePerMeter: skylightPricing.pricePerMeter,
        subtotal: Number((skylightPricing.unitPrice * skylightCount).toFixed(2)),
        cutNote: 'Tragaluz iluminación natural (~10% cubierta)',
      });
    }

    const cumbreraProd = products.find((p) => p.profileType === 'CUMBRERA');
    if (ridgeQty > 0 && cumbreraProd) {
      const cPricing = computeSheetPricing(cumbreraProd, roofColor, '28', 2.0);
      addToCart({
        id: `CART-CUMB-${Date.now()}`,
        productId: cumbreraProd.id,
        sku: cumbreraProd.sku,
        productName: cumbreraProd.name,
        profileType: cumbreraProd.profileType,
        cuttable: true,
        colorCode: color.code,
        colorName: color.name,
        colorHex: color.hex,
        gauge: '28',
        lengthMeters: 2.0,
        quantity: ridgeQty,
        totalLinearMeters: ridgeQty * 2.0,
        areaSqm: Number((cPricing.areaSqm * ridgeQty).toFixed(2)),
        weightKg: Number((cPricing.weightKg * ridgeQty).toFixed(2)),
        unitPrice: cPricing.unitPrice,
        pricePerMeter: cPricing.pricePerMeter,
        subtotal: Number((cPricing.unitPrice * ridgeQty).toFixed(2)),
      });
    }

    const screwProd = products.find((p) => p.sku === 'TORN-AUT-2.5');
    if (screwProd) {
      addToCart({
        id: `CART-TORN-${Date.now()}`,
        productId: screwProd.id,
        sku: screwProd.sku,
        productName: screwProd.name,
        profileType: screwProd.profileType,
        cuttable: false,
        colorCode: color.code,
        colorName: color.name,
        colorHex: color.hex,
        gauge: '28',
        lengthMeters: 1,
        quantity: screwBags,
        totalLinearMeters: screwBags,
        areaSqm: 0,
        weightKg: screwBags * 0.4,
        unitPrice: screwProd.basePricePerMeter,
        pricePerMeter: screwProd.basePricePerMeter,
        subtotal: Number((screwProd.basePricePerMeter * screwBags).toFixed(2)),
      });
    }

    setRoofCalcOpen(false);
    setFeedback({
      type: 'ok',
      text: `Cálculo de techo cargado: ${mainSheets} planchas${
        skylightCount > 0 ? ` + ${skylightCount} traslúcidas` : ''
      } de ${sheetLength}m + accesorios.`,
    });
  };

  // Configurator live calculation
  const cfgPricing = useMemo(() => {
    if (!configProduct) return null;
    const len = Math.max(0.5, Number(cfgLength) || 1);
    const qty = Math.max(1, Number(cfgQty) || 1);
    const p = computeSheetPricing(configProduct, cfgColor, cfgGauge, len);
    return {
      ...p,
      totalMeters: Number((len * qty).toFixed(2)),
      totalArea: Number((p.areaSqm * qty).toFixed(2)),
      totalWeight: Number((p.weightKg * qty).toFixed(2)),
      subtotal: Number((p.unitPrice * qty).toFixed(2)),
    };
  }, [configProduct, cfgColor, cfgGauge, cfgLength, cfgQty]);

  return (
    <div className="space-y-4">
      {/* Top Cash Shift Banner matching Screenshot 3 */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-5 py-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${
              activeShift ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
          />
          <div>
            <div className="text-[11px] font-bold tracking-wider uppercase text-slate-400">
              {activeShift ? `TURNO DE CAJA #${activeShift.shiftNumber} ACTIVO` : 'CAJA CERRADA'}
            </div>
            <div className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {activeShift ? (
                <>
                  Efectivo Esperado en Caja:{' '}
                  <span className="font-mono-tabular text-emerald-600 dark:text-emerald-400">
                    {formatBs(activeShift.expectedCash)}
                  </span>
                </>
              ) : (
                <span className="text-amber-600">Abre un turno para registrar arqueo</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setRoofCalcOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/50 border border-orange-200 dark:border-orange-800 text-xs font-bold text-[#c2410c] dark:text-orange-400 hover:bg-orange-100 cursor-pointer whitespace-nowrap"
          >
            <Ruler className="w-3.5 h-3.5" />
            <span>CALCULADORA TECHO</span>
          </button>

          <button
            type="button"
            onClick={() => setProformasOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer whitespace-nowrap"
          >
            <FileText className="w-3.5 h-3.5 text-[#c2410c]" />
            <span>PROFORMAS ({proformas.filter((p) => p.status === 'VIGENTE').length})</span>
          </button>

          <button
            type="button"
            onClick={onOpenCashShiftModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold tracking-wider uppercase cursor-pointer whitespace-nowrap shadow-2xs"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>ARQUEO DE CAJA</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`rounded-xl px-4 py-3 text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'ok'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
              : 'bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
          }`}
        >
          <span>{feedback.text}</span>
          <button type="button" onClick={() => setFeedback(null)} className="cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2-Column POS Layout matching Screenshot 3 */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        {/* Left: Search, Filters, Color Swatch Bar & 3-Column Calaminas Catalog */}
        <div className="xl:col-span-7 2xl:col-span-8 space-y-4">
          {/* Search + Profile & Color Filter Panel */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 space-y-3 shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-7 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por código, perfil, calibre o color..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                />
              </div>

              <div className="sm:col-span-5">
                <select
                  value={profileFilter}
                  onChange={(e) => setProfileFilter(e.target.value as ProfileType | 'ALL')}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold uppercase text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="ALL">TODAS LAS CATEGORÍAS</option>
                  {Object.entries(PROFILE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>
                      {label.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Profile Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setProfileFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase cursor-pointer transition-colors ${
                  profileFilter === 'ALL'
                    ? 'bg-[#c2410c] text-white'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-400'
                }`}
              >
                TODOS
              </button>
              {(Object.keys(PROFILE_LABELS) as ProfileType[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setProfileFilter(key)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider uppercase cursor-pointer transition-colors ${
                    profileFilter === key
                      ? 'bg-[#c2410c] text-white'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-400'
                  }`}
                >
                  {PROFILE_LABELS[key]}
                </button>
              ))}
            </div>

            {/* Interactive RAL Color Filter Bar */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                COLOR LÁMINA:
              </span>
              <button
                type="button"
                onClick={() => setColorFilter('ALL')}
                className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase cursor-pointer ${
                  colorFilter === 'ALL'
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                Todos
              </button>
              {CALAMINA_COLORS.map((col) => {
                const active = colorFilter === col.code;
                return (
                  <button
                    key={col.code}
                    type="button"
                    onClick={() => setColorFilter(active ? 'ALL' : col.code)}
                    title={`${col.name} (${col.code})`}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-semibold border cursor-pointer transition-all ${
                      active
                        ? 'border-[#c2410c] bg-orange-50 dark:bg-orange-950/50 text-[#c2410c] dark:text-orange-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full border border-slate-300 shrink-0"
                      style={{ backgroundColor: col.hex }}
                    />
                    <span className="hidden sm:inline">{col.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3-Column Product Grid matching Screenshot 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3.5">
            {filteredProducts.map((product) => {
              const branchStock = product.stockByBranch[activeBranchId] || 0;
              const previewColorCode =
                colorFilter !== 'ALL' && product.availableColors.includes(colorFilter)
                  ? colorFilter
                  : cardPreviewColors[product.id] || product.availableColors[0] || 'ZINC';
              const previewColor = getColorByCode(previewColorCode);
              const previewPricing = computeSheetPricing(
                product,
                previewColorCode,
                product.availableGauges.includes('28') ? '28' : product.availableGauges[0] || '28',
                1
              );

              return (
                <div
                  key={product.id}
                  className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 flex flex-col justify-between hover:border-orange-300 dark:hover:border-orange-700 transition-colors shadow-2xs"
                >
                  <div>
                    {/* Top Code + Profile Tag */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-mono-tabular font-bold text-[10px] text-slate-600 dark:text-slate-300">
                        {product.sku}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-sky-50 dark:bg-sky-950/50 border border-sky-200/70 dark:border-sky-800 font-bold text-[10px] tracking-wider uppercase text-sky-700 dark:text-sky-300">
                        {PROFILE_LABELS[product.profileType]}
                      </span>
                    </div>

                    {/* Dynamic Colored Profile Preview */}
                    <div className="my-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 px-3 py-1.5 border border-slate-100 dark:border-slate-800">
                      <CalaminaProfileSVG
                        profileType={product.profileType}
                        colorCode={previewColorCode}
                        className="w-full h-16"
                        showCrossSection={false}
                      />
                    </div>

                    <h3 className="font-display font-bold text-xs text-slate-900 dark:text-white uppercase leading-snug line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                      {product.waveOrStepInfo}
                    </p>

                    {/* Selectable Color Swatches directly on card */}
                    <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                      {product.availableColors.map((cCode) => {
                        const c = getColorByCode(cCode);
                        const selected = cCode === previewColorCode;
                        return (
                          <button
                            key={cCode}
                            type="button"
                            title={`${c.name} (${c.code})`}
                            onClick={() =>
                              setCardPreviewColors((prev) => ({
                                ...prev,
                                [product.id]: cCode,
                              }))
                            }
                            className={`w-4 h-4 rounded-full border cursor-pointer transition-transform ${
                              selected
                                ? 'ring-2 ring-[#c2410c] ring-offset-1 scale-110 border-white'
                                : 'border-slate-300 dark:border-slate-600'
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        );
                      })}
                      <span className="text-[10px] text-slate-400 ml-1 truncate">
                        {previewColor.name}
                      </span>
                    </div>
                  </div>

                  {/* Price, Stock & Add Button */}
                  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between gap-2">
                    <div>
                      <div className="font-display font-extrabold text-base text-slate-900 dark:text-white tabular-nums leading-none">
                        {formatBs(previewPricing.pricePerMeter)}
                        <span className="text-[10px] font-normal text-slate-400">
                          /{product.unitLabel}
                        </span>
                      </div>
                      <div
                        className={`text-[11px] font-bold mt-1 tabular-nums ${
                          branchStock > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'
                        }`}
                      >
                        {branchStock > 0
                          ? `Stock: ${branchStock.toLocaleString('es-BO')} ${product.unitLabel}`
                          : 'Sin Stock (0)'}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={branchStock <= 0}
                      onClick={() => openConfigurator(product)}
                      className="px-3 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/60 hover:bg-[#c2410c] text-[#c2410c] dark:text-orange-400 hover:text-white border border-orange-200 dark:border-orange-800 disabled:opacity-40 disabled:cursor-not-allowed font-display font-bold text-[11px] tracking-wider uppercase transition-colors cursor-pointer whitespace-nowrap"
                    >
                      {product.cuttable ? '+ CORTE / COLOR' : '+ AGREGAR'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: MOSTRADOR DE CALAMINAS (Cart & Checkout Panel matching Screenshot 3) */}
        <div className="xl:col-span-5 2xl:col-span-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden sticky top-20">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#c2410c] text-white flex items-center justify-center shrink-0">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display italic font-extrabold text-base text-slate-900 dark:text-white uppercase leading-tight">
                MOSTRADOR DE CALAMINAS
              </h2>
              <p className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 tabular-nums">
                {cart.length} ÍTEMS · {cartStats.totalUnits} UDS · {cartStats.totalMeters} ML
              </p>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Client Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
                  CLIENTE / CONSTRUCTORA / FERRETERÍA
                </label>
                <button
                  type="button"
                  onClick={() => setQuickClientOpen(true)}
                  className="inline-flex items-center gap-1 text-[10px] font-bold uppercase text-[#c2410c] hover:underline cursor-pointer"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>Nuevo</span>
                </button>
              </div>
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.nitCi !== '0' ? `(NIT ${c.nitCi})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Cart Items List or Empty State */}
            {cart.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 py-10 px-4 flex flex-col items-center justify-center text-center">
                <Wrench className="w-7 h-7 text-orange-200 dark:text-orange-900 mb-2" />
                <span className="font-display font-bold text-xs tracking-wider uppercase text-slate-400">
                  PEDIDO VACÍO
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  Selecciona una calamina, su color RAL y largo de corte en el catálogo.
                </p>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2.5 pr-1">
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/70 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-300 shrink-0 mt-0.5"
                          style={{ backgroundColor: item.colorHex }}
                          title={item.colorName}
                        />
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white leading-tight truncate">
                            {item.productName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            {item.colorName} · Cal. {item.gauge}
                            {item.cuttable
                              ? ` · Largo ${item.lengthMeters.toFixed(2)}m (${item.totalLinearMeters} ml)`
                              : ''}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.id, -item.quantity)}
                        className="text-slate-400 hover:text-red-500 p-1 cursor-pointer shrink-0"
                        title="Quitar ítem"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="mt-2.5 flex items-center justify-between">
                      <div className="inline-flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, -1)}
                          className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono-tabular font-bold text-xs">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.id, 1)}
                          className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-mono-tabular">
                          {formatBs(item.unitPrice)} c/u
                        </div>
                        <div className="font-mono-tabular font-extrabold text-slate-900 dark:text-white">
                          {formatBs(item.subtotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Delivery Type, Discount, Freight & Priority */}
            {cart.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDeliveryType('RETIRO_PLANTA')}
                    className={`py-2 px-2.5 rounded-xl border text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      deliveryType === 'RETIRO_PLANTA'
                        ? 'bg-[#0b1324] text-white border-[#0b1324]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Retiro en Planta</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType('ENVIO_OBRA')}
                    className={`py-2 px-2.5 rounded-xl border text-[10px] font-bold uppercase flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                      deliveryType === 'ENVIO_OBRA'
                        ? 'bg-[#c2410c] text-white border-[#c2410c]'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Envío a Obra</span>
                  </button>
                </div>

                {deliveryType === 'ENVIO_OBRA' && (
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-[#c2410c] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Dirección de obra / referencia de camión..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                    />
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] font-bold uppercase text-slate-400">
                        Desc. (Bs)
                      </label>
                      <button
                        type="button"
                        onClick={() => setDiscount(Number((cartStats.subtotal * 0.05).toFixed(2)))}
                        title="Aplicar descuento mayorista 5%"
                        className="inline-flex items-center gap-0.5 text-[9px] font-bold text-[#c2410c] hover:underline cursor-pointer"
                      >
                        <Percent className="w-2.5 h-2.5" />
                        <span>5%</span>
                      </button>
                    </div>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={discount || ''}
                      onChange={(e) => setDiscount(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-mono-tabular text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Flete (Bs)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="10"
                      value={freightCost || ''}
                      onChange={(e) => setFreightCost(Math.max(0, Number(e.target.value) || 0))}
                      placeholder="0"
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs font-mono-tabular text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Corte
                    </label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as 'NORMAL' | 'URGENTE')}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-1.5 text-xs font-bold text-slate-800 dark:text-white"
                    >
                      <option value="NORMAL">Normal</option>
                      <option value="URGENTE">Urgente</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Totals matching Screenshot 3 */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold uppercase tracking-wider">
                  SUBTOTAL ({cartStats.totalUnits} UDS)
                </span>
                <span className="font-mono-tabular font-bold text-slate-800 dark:text-slate-200">
                  {formatBs(cartStats.subtotal)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-display font-extrabold text-xs tracking-wider uppercase text-slate-900 dark:text-white">
                  TOTAL A COBRAR
                </span>
                <span className="font-display font-extrabold text-2xl text-[#c2410c] dark:text-orange-400 tabular-nums">
                  {formatBs(cartStats.total)}
                </span>
              </div>
            </div>

            {/* 4 Payment Method Buttons matching Screenshot 3 */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { key: 'EFECTIVO' as PaymentMethod, label: 'EFECTIVO', icon: Wallet },
                { key: 'QR_BNB' as PaymentMethod, label: 'PAGO QR', icon: QrCode },
                { key: 'MIXTO' as PaymentMethod, label: 'MIXTO', icon: Split },
                { key: 'CREDITO' as PaymentMethod, label: 'CRÉDITO', icon: CreditCard },
              ].map((m) => {
                const active = paymentMethod === m.key;
                const Icon = m.icon;
                return (
                  <button
                    key={m.key}
                    type="button"
                    onClick={() => setPaymentMethod(m.key)}
                    className={`py-2.5 px-1.5 rounded-xl border flex flex-col items-center justify-center gap-1 text-[10px] font-bold tracking-wider uppercase cursor-pointer transition-colors ${
                      active
                        ? 'bg-[#c2410c] border-[#c2410c] text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-orange-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>

            {paymentMethod === 'MIXTO' && cart.length > 0 && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Efectivo (Bs)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={cartStats.total}
                    value={mixedCash}
                    onChange={(e) => setMixedCash(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 font-mono-tabular font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Saldo QR BNB (Bs)
                  </label>
                  <div className="px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 font-mono-tabular font-bold text-emerald-700 dark:text-emerald-300">
                    {formatBs(Math.max(0, cartStats.total - mixedCash))}
                  </div>
                </div>
              </div>
            )}

            {paymentMethod === 'CREDITO' && selectedClient && (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-800 dark:text-amber-300">
                Límite crédito: <strong>{formatBs(selectedClient.creditLimit)}</strong> · Deuda
                actual: <strong>{formatBs(selectedClient.currentDebt)}</strong>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={cart.length === 0 || submitting}
                onClick={handleCheckoutClick}
                className="w-full py-3.5 px-4 rounded-xl bg-[#c2410c] hover:bg-[#9a3412] disabled:opacity-45 disabled:cursor-not-allowed text-white font-display font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
              >
                {paymentMethod === 'QR_BNB' ? (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>GENERAR QR BNB Y COBRAR</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{submitting ? 'PROCESANDO...' : 'COBRAR Y ENVIAR A CORTE'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                disabled={cart.length === 0 || submitting}
                onClick={handleSaveProforma}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-45 text-slate-700 dark:text-slate-200 font-display font-bold text-[11px] tracking-wider uppercase flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>GUARDAR COMO PROFORMA</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sheet Color, Gauge & Custom Cut Length Configurator Modal */}
      {configProduct && cfgPricing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 bg-[#0b1324] text-white flex items-center justify-between">
              <div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-orange-400">
                  CONFIGURADOR DE CORTE EN ROLADORA · {configProduct.sku}
                </div>
                <h3 className="font-display italic font-extrabold text-lg uppercase">
                  {configProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConfigProduct(null)}
                className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Live SVG Preview in chosen Color: Plancha 3D vs Simulador de Techo */}
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-0.5">
                    <button
                      type="button"
                      onClick={() => setCfgPreviewMode('SHEET')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer ${
                        cfgPreviewMode === 'SHEET'
                          ? 'bg-[#c2410c] text-white'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Plancha 3D
                    </button>
                    <button
                      type="button"
                      onClick={() => setCfgPreviewMode('ROOF')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer ${
                        cfgPreviewMode === 'ROOF'
                          ? 'bg-[#c2410c] text-white'
                          : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Simulador de Techo
                    </button>
                  </div>
                  <div className="font-mono-tabular font-bold text-[#c2410c] dark:text-orange-400 text-xs">
                    {formatBs(cfgPricing.pricePerMeter)} / ml · {formatBs(cfgPricing.unitPrice)} / plancha
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  <div className="w-full sm:w-64 shrink-0">
                    {cfgPreviewMode === 'ROOF' ? (
                      <RoofVisualizerSVG
                        profileType={configProduct.profileType}
                        colorCode={cfgColor}
                        includeSkylight={configProduct.profileType === 'TRASLUCIDA'}
                        className="w-full h-32 rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
                      />
                    ) : (
                      <CalaminaProfileSVG
                        profileType={configProduct.profileType}
                        colorCode={cfgColor}
                        className="w-full h-24"
                      />
                    )}
                  </div>
                  <div className="flex-1 text-xs space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-4 h-4 rounded-full border border-slate-300"
                        style={{ backgroundColor: getColorByCode(cfgColor).hex }}
                      />
                      <span className="font-bold text-sm text-slate-900 dark:text-white">
                        {getColorByCode(cfgColor).name} ({cfgColor})
                      </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400">
                      {configProduct.waveOrStepInfo} · {getGaugeSpec(cfgGauge).label}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Ancho útil: <strong>{configProduct.usefulWidthM}m</strong> · Ancho total:{' '}
                      <strong>{configProduct.totalWidthM}m</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. Color Picker */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  1. Seleccionar Color de la Calamina (RAL / Zincalum)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {configProduct.availableColors.map((cCode) => {
                    const c = getColorByCode(cCode);
                    const active = cfgColor === cCode;
                    return (
                      <button
                        key={cCode}
                        type="button"
                        onClick={() => setCfgColor(cCode)}
                        className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 cursor-pointer transition-all ${
                          active
                            ? 'border-[#c2410c] bg-orange-50 dark:bg-orange-950/40 ring-1 ring-[#c2410c]'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <span
                          className="w-6 h-6 rounded-lg border border-slate-300 dark:border-slate-600 shrink-0 shadow-2xs"
                          style={{ backgroundColor: c.hex }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {c.name}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono-tabular">
                            {c.code} · {c.surchargePerMeter > 0 ? `+Bs ${c.surchargePerMeter}/ml` : 'Base'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Gauge (Calibre) Picker */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  2. Calibre / Espesor de Lámina
                </label>
                <div className="flex flex-wrap gap-2">
                  {configProduct.availableGauges.map((g) => {
                    const spec = getGaugeSpec(g);
                    const active = cfgGauge === g;
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setCfgGauge(g)}
                        className={`px-3.5 py-2 rounded-xl border text-xs font-bold cursor-pointer transition-colors ${
                          active
                            ? 'bg-[#0b1324] dark:bg-orange-600 text-white border-[#0b1324] dark:border-orange-600'
                            : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-400'
                        }`}
                      >
                        Cal. {g} ({spec.thicknessMm}mm)
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 3. Custom Cut Length & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    3. Largo de Corte Exacto (metros)
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {LENGTH_PRESETS.filter(
                      (l) => l >= configProduct.minLengthM && l <= configProduct.maxLengthM
                    ).map((l) => (
                      <button
                        key={l}
                        type="button"
                        onClick={() => setCfgLength(l)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-mono-tabular font-bold border cursor-pointer ${
                          Math.abs(cfgLength - l) < 0.01
                            ? 'bg-[#c2410c] text-white border-[#c2410c]'
                            : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {l.toFixed(2)}m
                      </button>
                    ))}
                  </div>
                  <input
                    type="number"
                    step="0.05"
                    min={configProduct.minLengthM}
                    max={configProduct.maxLengthM}
                    value={cfgLength}
                    onChange={(e) => setCfgLength(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono-tabular font-bold text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                    4. Cantidad de Planchas (Uds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={cfgQty}
                    onChange={(e) => setCfgQty(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm font-mono-tabular font-bold text-slate-900 dark:text-white mb-2"
                  />
                  <input
                    type="text"
                    value={cfgNote}
                    onChange={(e) => setCfgNote(e.target.value)}
                    placeholder="Nota de corte para operador (opcional)"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-xs text-slate-800 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Engineering & Price Summary */}
              <div className="rounded-xl bg-slate-900 text-white p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Metraje Total</div>
                  <div className="font-mono-tabular font-bold text-base">
                    {cfgPricing.totalMeters} ml
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Área Útil</div>
                  <div className="font-mono-tabular font-bold text-base">
                    {cfgPricing.totalArea} m²
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase">Peso Est.</div>
                  <div className="font-mono-tabular font-bold text-base">
                    {cfgPricing.totalWeight} kg
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-orange-400 uppercase">Subtotal Ítem</div>
                  <div className="font-mono-tabular font-extrabold text-base text-orange-400">
                    {formatBs(cfgPricing.subtotal)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfigProduct(null)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleConfirmConfigure}
                  className="px-6 py-2.5 rounded-xl bg-[#c2410c] hover:bg-[#9a3412] text-white font-display font-bold text-xs tracking-wider uppercase flex items-center gap-2 cursor-pointer"
                >
                  <Scissors className="w-4 h-4" />
                  <span>Agregar Corte al Mostrador</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Roof Estimator Modal (Calculadora de Techo) */}
      {roofCalcOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 bg-[#c2410c] text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Ruler className="w-5 h-5" />
                <div>
                  <h3 className="font-display font-bold text-base uppercase">
                    CALCULADORA DE TECHO Y CUBIERTA
                  </h3>
                  <p className="text-[11px] text-orange-100">
                    Calcula planchas exactas, cumbreras y tornillos según medidas de obra
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setRoofCalcOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-500 mb-1">
                    Ancho Frente (m)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={roofWidth}
                    onChange={(e) => setRoofWidth(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono-tabular font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-500 mb-1">
                    Caída / Agua (m)
                  </label>
                  <input
                    type="number"
                    step="0.2"
                    min="1"
                    value={roofSlopeLen}
                    onChange={(e) => setRoofSlopeLen(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-mono-tabular font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-500 mb-1">
                    Caídas
                  </label>
                  <select
                    value={roofSlopes}
                    onChange={(e) => setRoofSlopes(Number(e.target.value) as 1 | 2)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-bold"
                  >
                    <option value={1}>1 Agua</option>
                    <option value={2}>2 Aguas</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold uppercase text-slate-500 mb-1">
                    Perfil de Calamina
                  </label>
                  <select
                    value={roofProductId}
                    onChange={(e) => setRoofProductId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-bold"
                  >
                    {products
                      .filter((p) => p.cuttable && p.profileType !== 'CUMBRERA')
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-500 mb-1">Calibre</label>
                  <select
                    value={roofGauge}
                    onChange={(e) => setRoofGauge(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 font-bold"
                  >
                    {GAUGE_SPECS.map((g) => (
                      <option key={g.gauge} value={g.gauge}>
                        Cal. {g.gauge} ({g.thicknessMm}mm)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold uppercase text-slate-500 mb-1.5">
                  Color RAL
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {CALAMINA_COLORS.map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => setRoofColor(c.code)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold cursor-pointer ${
                        roofColor === c.code
                          ? 'border-[#c2410c] bg-orange-50 dark:bg-orange-950/40 text-[#c2410c]'
                          : 'border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full border border-slate-300"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={roofIncludeSkylight}
                  onChange={(e) => setRoofIncludeSkylight(e.target.checked)}
                  className="rounded border-slate-300 text-[#c2410c] focus:ring-[#c2410c]"
                />
                <Sun className="w-4 h-4 text-sky-600 shrink-0" />
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  Incluir calaminas traslúcidas de policarbonato (~10% iluminación natural)
                </span>
              </label>

              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 space-y-2">
                <div className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">
                  Resumen Automático de Materiales
                </div>
                <div className="flex justify-between">
                  <span>
                    Planchas metálicas de {roofCalcResult.sheetLength} m (incl. 15cm alero):
                  </span>
                  <strong className="font-mono-tabular">
                    {roofCalcResult.mainSheets} planchas
                  </strong>
                </div>
                {roofCalcResult.skylightCount > 0 && (
                  <div className="flex justify-between text-sky-700 dark:text-sky-300">
                    <span>Calaminas traslúcidas tragaluz ({roofCalcResult.sheetLength} m):</span>
                    <strong className="font-mono-tabular">{roofCalcResult.skylightCount} planchas</strong>
                  </div>
                )}
                {roofCalcResult.ridgeQty > 0 && (
                  <div className="flex justify-between">
                    <span>Cumbreras de 2.00 m mismo color:</span>
                    <strong className="font-mono-tabular">{roofCalcResult.ridgeQty} piezas</strong>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Tornillos autoperforantes EPDM (bolsa x100):</span>
                  <strong className="font-mono-tabular">{roofCalcResult.screwBags} bolsas</strong>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-extrabold">
                  <span>Inversión Estimada:</span>
                  <span className="font-mono-tabular text-[#c2410c]">
                    {formatBs(roofCalcResult.estimatedTotal)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleApplyRoofCalculation}
                className="w-full py-3 rounded-xl bg-[#c2410c] hover:bg-[#9a3412] text-white font-display font-bold text-xs tracking-wider uppercase cursor-pointer"
              >
                Cargar Todo al Mostrador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proformas Modal */}
      {proformasOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-display italic font-extrabold text-base uppercase text-slate-900 dark:text-white">
                PROFORMAS GUARDADAS ({proformas.length})
              </h3>
              <button
                type="button"
                onClick={() => setProformasOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto space-y-3">
              {proformas.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No hay proformas registradas todavía.
                </div>
              ) : (
                proformas.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono-tabular font-bold text-[#c2410c]">
                          {p.proformaNumber}
                        </span>
                        <span className="font-bold text-slate-800 dark:text-white">
                          {p.clientName}
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700">
                          {p.status}
                        </span>
                      </div>
                      <div className="text-slate-500 mt-1">
                        {p.items.length} ítems · {formatBs(p.total)} · Válida hasta{' '}
                        {new Date(p.validUntil).toLocaleDateString('es-BO')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenPrintModal({ proforma: p })}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-bold hover:bg-white cursor-pointer"
                      >
                        Imprimir
                      </button>
                      {p.status === 'VIGENTE' && (
                        <button
                          type="button"
                          onClick={() => handleLoadProforma(p)}
                          className="px-3 py-1.5 rounded-lg bg-[#c2410c] text-white font-bold cursor-pointer"
                        >
                          Cargar a Venta
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Create Client Modal */}
      {quickClientOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base uppercase text-slate-900 dark:text-white">
                Registrar Cliente / Constructora
              </h3>
              <button
                type="button"
                onClick={() => setQuickClientOpen(false)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateQuickClient} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold uppercase text-slate-500 mb-1">
                  Nombre / Razón Social
                </label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="Ej. Constructora Los Tajibos S.R.L."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase text-slate-500 mb-1">NIT / CI</label>
                  <input
                    type="text"
                    value={newClientNit}
                    onChange={(e) => setNewClientNit(e.target.value)}
                    placeholder="1234567018"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block font-bold uppercase text-slate-500 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="77001122"
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-mono-tabular"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold uppercase text-slate-500 mb-1">Tipo</label>
                <select
                  value={newClientType}
                  onChange={(e) => setNewClientType(e.target.value as Client['type'])}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2.5 font-bold"
                >
                  <option value="CONSTRUCTORA">Constructora</option>
                  <option value="FERRETERIA">Ferretería</option>
                  <option value="ESTANCIA">Estancia / Agro</option>
                  <option value="PARTICULAR">Particular</option>
                </select>
              </div>
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#c2410c] text-white font-display font-bold uppercase tracking-wider cursor-pointer"
              >
                Guardar y Seleccionar
              </button>
            </form>
          </div>
        </div>
      )}

      {/* BNB Open Banking QR Simple Payment Modal */}
      <BnbQrModal
        open={bnbQrOpen}
        amount={qrTargetAmount}
        gloss={`ACEROCAL-${new Date().getTime().toString().slice(-6)}`}
        clientName={selectedClient?.name || 'VENTA MOSTRADOR'}
        onClose={() => setBnbQrOpen(false)}
        onPaymentConfirmed={(tx) => submitSale(tx)}
      />
    </div>
  );
};
