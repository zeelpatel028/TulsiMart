import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useNotification } from '../../context/NotificationContext';

// Icons
import { 
  Building2, 
  Plus, 
  FileText, 
  Package, 
  Receipt, 
  BarChart3, 
  RefreshCw,
  Wallet,
  Truck,
  ArrowLeft
} from 'lucide-react';

// API
import { suppliersApi, inventoryApi, gullaApi } from '../../api';
import { extractList } from '../../utils/apiHelpers';

// Sub-components
import ProcurementKpiCards from './components/ProcurementKpiCards';
import SuppliersDirectoryTab from './components/SuppliersDirectoryTab';
import PurchaseOrdersTab from './components/PurchaseOrdersTab';
import GrnLedgerTab from './components/GrnLedgerTab';
import PaymentsLedgerTab from './components/PaymentsLedgerTab';
import ProcurementAnalyticsTab from './components/ProcurementAnalyticsTab';

// Modals
import SupplierFormModal from './modals/SupplierFormModal';
import SupplierProfileDrawer from './modals/SupplierProfileDrawer';
import PurchaseOrderModal from './modals/PurchaseOrderModal';
import GoodsReceiveModal from './modals/GoodsReceiveModal';
import SupplierPaymentModal from './modals/SupplierPaymentModal';

const SUPPLIER_CATEGORIES = [
  'Dairy & Milk Products',
  'FMCG & Branded Grocery',
  'Grain & Pulses Wholesale',
  'Spices & Edible Oils',
  'Beverages & Soft Drinks',
  'Personal Care & Hygiene',
  'Snacks & Confectionery',
  'Packaging & Store Supplies'
];

export const SupplierList = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState('suppliers');
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [grnList, setGrnList] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [products, setProducts] = useState([]);
  const [gullaSummary, setGullaSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');

  // Modals state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [viewingSupplierProfile, setViewingSupplierProfile] = useState(null);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState(null);
  const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
  const [selectedPOForReceive, setSelectedPOForReceive] = useState(null);

  // Forms state
  const [supplierForm, setSupplierForm] = useState({
    name: '', company_name: '', phone: '', email: '', gstin: '',
    address: '', city: 'Mumbai', category: 'FMCG & Branded Grocery',
    payment_terms: 'Net 15', credit_limit: 100000, rating: 5, notes: ''
  });

  const [poForm, setPoForm] = useState({
    po_number: `PO-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    supplier: '', expected_delivery: '', gst_mode: 'EXCLUSIVE', tax_type: 'INTRA_STATE',
    items: [{ product: '', product_name: '', quantity: 10, unit_cost: 0, discount_rate: 0, tax_rate: 0 }]
  });

  const [paymentForm, setPaymentForm] = useState({
    purchase_order: '', amount: '', payment_method: 'BANK_TRANSFER', reference_number: '',
    payment_date: new Date().toISOString().split('T')[0], notes: ''
  });

  const [receiveItems, setReceiveItems] = useState([]);
  const [showDenominations, setShowDenominations] = useState(false);
  const [denominations, setDenominations] = useState({
    500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, coins: 0
  });

  useEffect(() => {
    fetchProcurementData();
  }, []);

  const fetchProcurementData = async () => {
    try {
      const [suppliersRes, poRes, paymentsRes, productsRes, gullaRes] = await Promise.all([
        suppliersApi.getSuppliers(),
        suppliersApi.getPurchaseOrders(),
        suppliersApi.getSupplierPayments(),
        inventoryApi.getProducts(),
        gullaApi.getGullaSummary().catch(() => null)
      ]);

      const fetchedSuppliers = extractList(suppliersRes);
      const fetchedPOs = extractList(poRes);
      const fetchedPayments = extractList(paymentsRes);
      const fetchedProducts = extractList(productsRes);

      setSuppliers(fetchedSuppliers);
      setPurchaseOrders(fetchedPOs);
      setPaymentsList(fetchedPayments);
      setProducts(fetchedProducts);
      if (gullaRes) setGullaSummary(gullaRes.data || gullaRes);

      // Generate GRN records
      const grns = fetchedPOs
        .filter(po => po && po.status === 'RECEIVED')
        .map(po => ({
          id: `GRN-${po.id}`,
          grn_number: `GRN-${po.po_number ? po.po_number.replace('PO-', '') : po.id}`,
          po_number: po.po_number || `PO-${po.id}`,
          supplier_name: po.supplier_name || 'N/A',
          received_date: po.updated_at ? po.updated_at.split('T')[0] : (po.order_date || 'N/A'),
          total_items: po.items?.length || 1,
          total_valuation: po.total_amount || 0,
          status: 'VERIFIED'
        }));
      setGrnList(grns);
    } catch (err) {
      console.error('Failed to load procurement data:', err);
      showToast('Error loading procurement data from backend', 'error');
    }
  };

  // KPI calculations
  const kpis = useMemo(() => {
    const suppArray = Array.isArray(suppliers) ? suppliers : [];
    const poArray = Array.isArray(purchaseOrders) ? purchaseOrders : [];
    const prodArray = Array.isArray(products) ? products : [];

    const totalSuppliers = suppArray.length;
    const activeSuppliers = suppArray.filter(s => s && s.is_active !== false).length;
    const pendingPOs = poArray.filter(po => po && (po.status === 'ORDERED' || po.status === 'DRAFT')).length;
    
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);

    const todayPurchases = poArray
      .filter(po => po && po.order_date === today)
      .reduce((sum, po) => sum + parseFloat(po.total_amount || 0), 0);

    const monthlyPurchases = poArray
      .filter(po => po && po.order_date && po.order_date.startsWith(currentMonth))
      .reduce((sum, po) => sum + parseFloat(po.total_amount || 0), 0);

    const pendingPayments = suppArray.reduce((sum, s) => sum + parseFloat(s?.pending_balance || 0), 0);
    const overduePayments = suppArray.filter(s => s && (s.payment_terms === 'Net 7' || s.payment_terms === 'Net 15'))
      .reduce((sum, s) => sum + parseFloat(s?.pending_balance || 0) * 0.4, 0);

    const productsOnOrder = poArray
      .filter(po => po && po.status === 'ORDERED')
      .reduce((acc, po) => acc + (po.items?.length || 1), 0);

    const lowStockReorderCount = prodArray.filter(p => p && p.stock_quantity <= (p.reorder_level || 10)).length;

    return {
      totalSuppliers, activeSuppliers, pendingPOs, todayPurchases,
      monthlyPurchases, pendingPayments, overduePayments, productsOnOrder, lowStockReorderCount
    };
  }, [suppliers, purchaseOrders, products]);

  // PO Totals Calculation Helper
  const calculatePOTotals = (items, gstMode = 'EXCLUSIVE', taxType = 'INTRA_STATE') => {
    let subtotal = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    items.forEach(item => {
      const qty = parseFloat(item.quantity || 0);
      const cost = parseFloat(item.unit_cost || 0);
      const disc = parseFloat(item.discount_rate || 0);
      const tax = parseFloat(item.tax_rate || 0);

      const baseVal = qty * cost;
      const discVal = (baseVal * disc) / 100;
      const afterDisc = baseVal - discVal;
      
      let itemTax = 0;
      if (gstMode === 'EXCLUSIVE') {
        itemTax = (afterDisc * tax) / 100;
      } else {
        itemTax = afterDisc - (afterDisc / (1 + (tax / 100)));
      }

      subtotal += baseVal;
      totalDiscount += discVal;
      totalTax += itemTax;
    });

    const taxableAmount = subtotal - totalDiscount;
    const grandTotal = gstMode === 'EXCLUSIVE' ? taxableAmount + totalTax : taxableAmount;
    
    return {
      subtotal,
      totalDiscount,
      taxableAmount,
      totalTax,
      cgst: taxType === 'INTRA_STATE' ? totalTax / 2 : 0,
      sgst: taxType === 'INTRA_STATE' ? totalTax / 2 : 0,
      igst: taxType === 'INTER_STATE' ? totalTax : 0,
      grandTotal
    };
  };

  // Save Supplier
  const handleSaveSupplier = async (e) => {
    if (e) e.preventDefault();
    try {
      if (editingSupplier) {
        await suppliersApi.updateSupplier(editingSupplier.id, supplierForm);
        showToast('Supplier profile updated successfully!');
      } else {
        await suppliersApi.createSupplier(supplierForm);
        showToast('New Wholesale Supplier registered!');
      }
      setIsSupplierModalOpen(false);
      setEditingSupplier(null);
      fetchProcurementData();
    } catch (err) {
      console.error('Error saving supplier:', err);
      showToast('Failed to save supplier. Check backend server.', 'error');
    }
  };

  // Save Purchase Order
  const handleSavePO = async (e) => {
    if (e) e.preventDefault();
    if (!poForm.supplier) {
      showToast('Please select a supplier for the purchase order', 'error');
      return;
    }

    try {
      const totals = calculatePOTotals(poForm.items, poForm.gst_mode, poForm.tax_type);
      const payload = {
        po_number: poForm.po_number,
        supplier: parseInt(poForm.supplier, 10),
        expected_delivery: poForm.expected_delivery || null,
        gst_mode: poForm.gst_mode,
        tax_type: poForm.tax_type,
        status: 'ORDERED',
        total_amount: totals.grandTotal,
        items: poForm.items.map(it => ({
          product: it.product ? parseInt(it.product, 10) : null,
          product_name: it.product_name || 'Generic Item',
          quantity: parseInt(it.quantity || 1, 10),
          unit_cost: parseFloat(it.unit_cost || 0),
          discount_rate: parseFloat(it.discount_rate || 0),
          tax_rate: parseFloat(it.tax_rate || 0),
          subtotal: parseFloat(it.quantity || 1) * parseFloat(it.unit_cost || 0)
        }))
      };

      await suppliersApi.createPurchaseOrder(payload);
      showToast(`Purchase Order ${poForm.po_number} issued!`);
      setIsPoModalOpen(false);
      fetchProcurementData();
    } catch (err) {
      console.error('Error creating PO:', err);
      showToast('Failed to create purchase order', 'error');
    }
  };

  // Open Receive PO Modal
  const handleOpenReceiveModal = (po) => {
    setSelectedPOForReceive(po);
    const itemsPrep = (po.items || []).map(i => ({
      id: i.id,
      product_id: i.product,
      product_name: i.product_name,
      ordered_quantity: i.quantity,
      received_quantity: i.quantity,
      unit_cost: i.unit_cost,
      damaged_quantity: 0,
      batch_number: `BAT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      mfg_date: new Date().toISOString().split('T')[0],
      expiry_date: ''
    }));
    setReceiveItems(itemsPrep);
    setIsReceiveModalOpen(true);
  };

  // Confirm Goods Receipt & Restock
  const handleConfirmManualReceive = async () => {
    if (!selectedPOForReceive) return;
    try {
      await suppliersApi.updatePOStatus(selectedPOForReceive.id, 'RECEIVED', receiveItems);
      showToast(`PO #${selectedPOForReceive.po_number} marked Received & Store Stock updated!`);
      setIsReceiveModalOpen(false);
      fetchProcurementData();
    } catch (err) {
      console.error('Error receiving PO:', err);
      showToast('Failed to receive purchase order', 'error');
    }
  };

  // Cash Denomination Counter Helper
  const calculateDenominationTotal = (denoms) => {
    return (
      (denoms[500] || 0) * 500 +
      (denoms[200] || 0) * 200 +
      (denoms[100] || 0) * 100 +
      (denoms[50] || 0) * 50 +
      (denoms[20] || 0) * 20 +
      (denoms[10] || 0) * 10 +
      (denoms[5] || 0) * 5 +
      (denoms['coins'] || 0) * 1
    );
  };

  // Record Payment (Order-wise & Gulla Cash system)
  const handleSavePayment = async (e) => {
    if (e) e.preventDefault();
    if (!payingSupplier || !paymentForm.amount) {
      showToast('Please enter payout amount', 'error');
      return;
    }

    try {
      const pAmount = parseFloat(paymentForm.amount);
      const payload = {
        supplier: payingSupplier.id,
        purchase_order: paymentForm.purchase_order ? parseInt(paymentForm.purchase_order, 10) : null,
        amount: pAmount,
        payment_method: paymentForm.payment_method,
        reference_number: paymentForm.reference_number || `REF-${Date.now()}`,
        payment_date: paymentForm.payment_date,
        notes: paymentForm.notes,
        denomination_counts: paymentForm.payment_method === 'CASH' ? denominations : null
      };

      // 1. Post Supplier Payment Receipt
      await suppliersApi.createSupplierPayment(payload);

      // 2. If Cash payment, record in Gulla Cash Register Outflow
      if (paymentForm.payment_method === 'CASH') {
        try {
          await gullaApi.createGullaEntry({
            entry_type: 'SUPPLIER_PAYMENT',
            amount: pAmount,
            supplier_id: payingSupplier.id,
            notes: paymentForm.notes || `Supplier cash payout to ${payingSupplier.company_name || payingSupplier.name}`,
            denomination_counts: denominations
          });
        } catch (gullaErr) {
          const gMsg = gullaErr.response?.data?.message || gullaErr.response?.data?.detail || gullaErr.message;
          showToast(gMsg || '⚠️ Gulla Note Warning: Cash deducted but check drawer note count.', 'warning');
        }
      }

      showToast(`Payout of ₹${pAmount} recorded for ${payingSupplier.company_name || payingSupplier.name}!${paymentForm.payment_method === 'CASH' ? ' Cash deducted from Gulla.' : ''}`);
      setIsPaymentModalOpen(false);
      fetchProcurementData();
    } catch (err) {
      console.error('Error recording payment:', err);
      showToast(err.response?.data?.message || err.response?.data?.detail || 'Failed to record supplier payment', 'error');
    }
  };

  // Handle direct Order-wise Pay PO button from PurchaseOrdersTab
  const handlePaySpecificPO = (po) => {
    const supp = suppliers.find(s => s.id === po.supplier || s.name === po.supplier_name);
    const due = Math.max(0, parseFloat(po.total_amount || 0) - parseFloat(po.paid_amount || 0));

    setPayingSupplier(supp || { id: po.supplier, name: po.supplier_name, company_name: po.supplier_company, pending_balance: due });
    setPaymentForm({
      purchase_order: po.id,
      amount: due,
      payment_method: 'BANK_TRANSFER',
      reference_number: '',
      payment_date: new Date().toISOString().split('T')[0],
      notes: `Order-wise payout for PO #${po.po_number}`
    });
    setIsPaymentModalOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 animate-fade-in font-sans">
      {/* 📱 MOBILE / TABLET COMPACT PASTEL MINT HEADER */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#E3F6F4] dark:bg-slate-900 text-slate-900 dark:text-white px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-b-[18px] shadow-xs border-b border-teal-200/50 dark:border-slate-800 relative overflow-hidden min-h-[72px] sm:min-h-[82px] flex items-center -mx-3 -mt-3 sm:-mx-5 sm:-mt-5 mb-3">
        {/* SVG Decorative Bottom-Left Wave */}
        <svg
          className="absolute bottom-0 left-0 w-36 sm:w-52 h-auto pointer-events-none text-[#C4EFE9]/70 dark:text-teal-950/40"
          viewBox="0 0 200 80"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0 40C50 60 120 70 200 45V80H0V40Z"
            fill="currentColor"
          />
        </svg>

        {/* SVG Decorative Bottom-Right Mound Curve */}
        <svg
          className="absolute bottom-0 right-0 w-28 sm:w-40 h-auto pointer-events-none text-[#B5ECE5]/80 dark:text-teal-900/40"
          viewBox="0 0 160 90"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M20 90C40 40 100 20 160 30V90H20Z"
            fill="currentColor"
          />
        </svg>

        {/* Decorative Floating Mint Dots */}
        <div className="absolute top-2 right-6 w-1.5 h-1.5 rounded-full bg-[#83D9CC] opacity-60 pointer-events-none" />
        <div className="absolute bottom-4 right-20 w-2 h-2 rounded-full bg-[#83D9CC] opacity-50 pointer-events-none" />

        <div className="w-full max-w-3xl mx-auto flex items-center justify-between gap-2.5 relative z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* 1. Pure White Circular Back Button */}
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/dashboard');
                }
              }}
              className="w-9.5 h-9.5 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 text-[#134E48] dark:text-teal-300 flex items-center justify-center shadow-md shadow-teal-900/10 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 border border-teal-100/80 dark:border-slate-700"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-4.5 h-4.5 stroke-[2.6]" />
            </button>

            {/* 2. Title & Subtitle */}
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight font-heading leading-tight truncate">
                Supplier & <span className="text-[#00695C] dark:text-[#4DB6AC]">Procurement</span>
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-[#267B70] dark:text-slate-300 truncate mt-0.5">
                Vendor directory, purchase orders & GRN ledgers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 Tulsi Mart POS Top Header Banner (Desktop Only) */}
      <div className="hidden lg:block -mx-8 -mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-5 lg:px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-teal-300/20 dark:bg-teal-900/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Banner Grid Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          {/* Left: Truck Icon & Title with Status Badge */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white p-2.5 sm:p-3 border border-[#004d40]/20 flex items-center justify-center shrink-0 shadow-md shadow-teal-900/10">
              <Truck className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
                  Supplier & <span className="text-[#00796b] dark:text-[#80cbc4]">Procurement</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Vendors & PO
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Wholesale vendor management, Purchase Orders, Gulla Cash payouts & GRN Stock receiving
              </p>
            </div>
          </div>

          {/* Right Action Buttons & Gulla Register */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap shrink-0">
            {gullaSummary && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white/90 dark:bg-slate-800/90 border border-teal-200 dark:border-slate-700/80 rounded-xl text-[#00796b] dark:text-[#80cbc4] text-xs font-black shadow-2xs">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <Wallet className="w-3.5 h-3.5 text-[#00796b] dark:text-[#80cbc4]" />
                <span>Gulla: ₹{Number(gullaSummary.cash_in_hand ?? gullaSummary.net_cash_in_gulla ?? 0).toLocaleString('en-IN')}</span>
              </div>
            )}

            <Button 
              variant="outline" 
              size="sm" 
              icon={RefreshCw} 
              onClick={fetchProcurementData} 
              className="border-teal-300 dark:border-slate-700 text-[#00796b] dark:text-[#80cbc4] hover:bg-teal-50 dark:hover:bg-slate-800 font-bold rounded-xl shadow-2xs cursor-pointer"
            >
              Sync
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              icon={FileText} 
              onClick={() => setIsPoModalOpen(true)} 
              className="border-teal-300 dark:border-slate-700 text-[#00796b] dark:text-[#80cbc4] hover:bg-teal-50 dark:hover:bg-slate-800 font-bold rounded-xl shadow-2xs cursor-pointer"
            >
              Create PO
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={() => {
                setEditingSupplier(null);
                setSupplierForm({
                  name: '', company_name: '', phone: '', email: '', gstin: '',
                  address: '', city: 'Mumbai', category: 'FMCG & Branded Grocery',
                  payment_terms: 'Net 15', credit_limit: 100000, rating: 5, notes: ''
                });
                setIsSupplierModalOpen(true);
              }}
              className="bg-gradient-to-r from-[#00796b] to-[#004d40] hover:from-[#00695c] hover:to-[#00382e] text-white font-extrabold shadow-sm shadow-teal-900/20 rounded-xl cursor-pointer"
            >
              Add Supplier
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <ProcurementKpiCards kpis={kpis} />

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-teal-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shadow-2xs">
        {[
          { id: 'suppliers', label: 'Suppliers Directory', icon: Building2, count: suppliers.length },
          { id: 'orders', label: 'Purchase Orders', icon: FileText, count: purchaseOrders.length },
          { id: 'grn', label: 'Goods Receiving (GRN)', icon: Package, count: grnList.length },
          { id: 'payments', label: 'Supplier Payments', icon: Receipt, count: paymentsList.length },
          { id: 'analytics', label: 'Procurement Analytics', icon: BarChart3 }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-extrabold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[#00796b] text-white shadow-sm shadow-teal-900/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-teal-50/70 dark:hover:bg-slate-800'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono ${
                  isActive
                    ? 'bg-teal-800 text-teal-100'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Tab Views */}
      {activeTab === 'suppliers' && (
        <SuppliersDirectoryTab
          suppliers={suppliers}
          search={search}
          setSearch={setSearch}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          supplierCategories={SUPPLIER_CATEGORIES}
          onAddSupplier={() => {
            setEditingSupplier(null);
            setIsSupplierModalOpen(true);
          }}
          onEditSupplier={(s) => {
            setEditingSupplier(s);
            setSupplierForm(s);
            setIsSupplierModalOpen(true);
          }}
          onDeleteSupplier={async (id, name) => {
            if (window.confirm(`Are you sure you want to delete supplier "${name}"?`)) {
              try {
                await suppliersApi.deleteSupplier(id);
                showToast(`Supplier ${name} deleted!`);
                fetchProcurementData();
              } catch (err) {
                showToast('Failed to delete supplier', 'error');
              }
            }
          }}
          onViewProfile={(s) => setViewingSupplierProfile(s)}
          onPaySupplier={(s) => {
            setPayingSupplier(s);
            setPaymentForm({
              purchase_order: '',
              amount: s.pending_balance || '',
              payment_method: 'BANK_TRANSFER',
              reference_number: '',
              payment_date: new Date().toISOString().split('T')[0],
              notes: `Payment for ${s.company_name || s.name}`
            });
            setIsPaymentModalOpen(true);
          }}
        />
      )}

      {activeTab === 'orders' && (
        <PurchaseOrdersTab
          purchaseOrders={purchaseOrders}
          onCreatePO={() => setIsPoModalOpen(true)}
          onOpenReceiveModal={handleOpenReceiveModal}
          onPayPO={handlePaySpecificPO}
        />
      )}

      {activeTab === 'grn' && (
        <GrnLedgerTab grnList={grnList} />
      )}

      {activeTab === 'payments' && (
        <PaymentsLedgerTab paymentsList={paymentsList} />
      )}

      {activeTab === 'analytics' && (
        <ProcurementAnalyticsTab
          suppliers={suppliers}
          onShowToast={(msg) => showToast(msg)}
        />
      )}

      {/* Modals */}
      <SupplierFormModal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        editingSupplier={editingSupplier}
        supplierForm={supplierForm}
        setSupplierForm={setSupplierForm}
        supplierCategories={SUPPLIER_CATEGORIES}
        onSaveSupplier={handleSaveSupplier}
      />

      <SupplierProfileDrawer
        viewingSupplierProfile={viewingSupplierProfile}
        onClose={() => setViewingSupplierProfile(null)}
        purchaseOrders={purchaseOrders}
      />

      <PurchaseOrderModal
        isOpen={isPoModalOpen}
        onClose={() => setIsPoModalOpen(false)}
        poForm={poForm}
        setPoForm={setPoForm}
        suppliers={suppliers}
        products={products}
        calculatePOTotals={calculatePOTotals}
        onSavePO={handleSavePO}
      />

      <GoodsReceiveModal
        isOpen={isReceiveModalOpen}
        onClose={() => setIsReceiveModalOpen(false)}
        selectedPOForReceive={selectedPOForReceive}
        receiveItems={receiveItems}
        setReceiveItems={setReceiveItems}
        onConfirmManualReceive={handleConfirmManualReceive}
      />

      <SupplierPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        payingSupplier={payingSupplier}
        paymentForm={paymentForm}
        setPaymentForm={setPaymentForm}
        purchaseOrders={purchaseOrders}
        gullaSummary={gullaSummary}
        showDenominations={showDenominations}
        setShowDenominations={setShowDenominations}
        denominations={denominations}
        setDenominations={setDenominations}
        calculateDenominationTotal={calculateDenominationTotal}
        onSavePayment={handleSavePayment}
      />
    </div>
  );
};

export default SupplierList;
