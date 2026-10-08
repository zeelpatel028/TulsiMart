import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { useNotification } from '../../context/NotificationContext';

// Icons
import { 
  Building2, 
  Plus, 
  FileText, 
  Receipt, 
  Truck,
  ArrowLeft,
  LayoutGrid,
  List,
  ShoppingCart,
  PackageCheck,
  Calendar,
  Filter
} from 'lucide-react';

import { SearchInput } from '../../components/common/UiHelpers';

// API
import { suppliersApi, inventoryApi, gullaApi } from '../../api';
import { extractList } from '../../utils/apiHelpers';

// Sub-components
import SuppliersDirectoryTab from './components/SuppliersDirectoryTab';
import PurchaseOrdersTab from './components/PurchaseOrdersTab';
import ReceivedOrdersTab from './components/ReceivedOrdersTab';
import PaymentsLedgerTab from './components/PaymentsLedgerTab';

// Modals
import SupplierFormModal from './modals/SupplierFormModal';
import SupplierProfileDrawer from './modals/SupplierProfileDrawer';
import PurchaseOrderModal from './modals/PurchaseOrderModal';
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

const getTodayDateString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const SupplierList = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();
  const [activeTab, setActiveTab] = useState('suppliers');
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [products, setProducts] = useState([]);
  const [gullaSummary, setGullaSummary] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [directoryViewMode, setDirectoryViewMode] = useState('grid');

  const todayStr = getTodayDateString();

  // Controls state for other tabs
  const [poSearch, setPoSearch] = useState('');
  const [poStatusFilter, setPoStatusFilter] = useState('ALL');
  const [poViewMode, setPoViewMode] = useState('grid');

  const [receivedSearch, setReceivedSearch] = useState('');
  const [filterDateInput, setFilterDateInput] = useState(todayStr);
  const [appliedDate, setAppliedDate] = useState(todayStr);

  const [paymentSearch, setPaymentSearch] = useState('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('ALL');

  // Modals state
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [viewingSupplierProfile, setViewingSupplierProfile] = useState(null);
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState(null);

  // Forms state
  const [supplierForm, setSupplierForm] = useState({
    name: '', company_name: '', phone: '', email: '', gstin: '',
    address: '', city: 'Mumbai', category: 'FMCG & Branded Grocery',
    payment_terms: 'Net 15', credit_limit: 100000, rating: 5, notes: ''
  });

  const [poForm, setPoForm] = useState({
    po_number: `PO-${new Date().getFullYear()}-0001`,
    supplier: '', expected_delivery: '', gst_mode: 'EXCLUSIVE', tax_type: 'INTRA_STATE',
    items: [{ product: '', product_name: '', quantity: 10, unit_cost: 0, discount_rate: 0, tax_rate: 0 }]
  });

  const [paymentForm, setPaymentForm] = useState({
    purchase_order: '', amount: '', payment_method: 'BANK_TRANSFER', reference_number: '',
    payment_date: new Date().toISOString().split('T')[0], notes: ''
  });

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
    } catch (err) {
      console.error('Failed to load procurement data:', err);
      showToast('Error loading procurement data from backend', 'error');
    }
  };

  const handleApplyDateFilter = () => {
    setAppliedDate(filterDateInput);
  };

  const handleSelectToday = () => {
    const today = getTodayDateString();
    setFilterDateInput(today);
    setAppliedDate(today);
  };

  const handleClearDateFilter = () => {
    setFilterDateInput('');
    setAppliedDate('');
  };

  // Filtered Purchase Orders
  const filteredPurchaseOrders = useMemo(() => {
    let list = Array.isArray(purchaseOrders) ? purchaseOrders : [];
    if (poStatusFilter !== 'ALL') {
      list = list.filter(po => po && po.status === poStatusFilter);
    }
    if (appliedDate) {
      list = list.filter(po => {
        const poDate = po.order_date || (po.created_at ? po.created_at.split('T')[0] : '');
        return poDate === appliedDate;
      });
    }
    if (poSearch.trim()) {
      const q = poSearch.toLowerCase();
      list = list.filter(po => 
        (po.po_number && po.po_number.toLowerCase().includes(q)) ||
        (po.supplier_name && po.supplier_name.toLowerCase().includes(q)) ||
        (po.supplier_company && po.supplier_company.toLowerCase().includes(q)) ||
        (po.status && po.status.toLowerCase().includes(q))
      );
    }
    return list;
  }, [purchaseOrders, poStatusFilter, appliedDate, poSearch]);

  // Filtered Received Orders
  const filteredReceivedOrders = useMemo(() => {
    let list = Array.isArray(purchaseOrders) ? purchaseOrders : [];
    list = list.filter(po => po && (po.status?.toUpperCase() === 'RECEIVED' || po.is_received));
    if (appliedDate) {
      list = list.filter(po => {
        const rDate = po.received_date || (po.updated_at ? po.updated_at.split('T')[0] : po.order_date);
        return rDate === appliedDate;
      });
    }
    if (receivedSearch.trim()) {
      const q = receivedSearch.toLowerCase();
      list = list.filter(po => 
        (po.po_number && po.po_number.toLowerCase().includes(q)) ||
        (po.supplier_name && po.supplier_name.toLowerCase().includes(q)) ||
        (po.supplier_company && po.supplier_company.toLowerCase().includes(q))
      );
    }
    return list;
  }, [purchaseOrders, appliedDate, receivedSearch]);

  // Filtered Payments
  const filteredPaymentsList = useMemo(() => {
    let list = Array.isArray(paymentsList) ? paymentsList : [];
    if (paymentMethodFilter !== 'ALL') {
      list = list.filter(p => p && p.payment_method === paymentMethodFilter);
    }
    if (appliedDate) {
      list = list.filter(p => {
        const pDate = p.payment_date || (p.created_at ? p.created_at.split('T')[0] : '');
        return pDate === appliedDate;
      });
    }
    if (paymentSearch.trim()) {
      const q = paymentSearch.toLowerCase();
      list = list.filter(p => 
        (p.reference_number && p.reference_number.toLowerCase().includes(q)) ||
        (p.supplier_name && p.supplier_name.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q)) ||
        (p.payment_date && p.payment_date.includes(q))
      );
    }
    return list;
  }, [paymentsList, paymentMethodFilter, appliedDate, paymentSearch]);

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
        supplier_id: parseInt(poForm.supplier, 10),
        supplier: parseInt(poForm.supplier, 10),
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery: poForm.expected_delivery || null,
        gst_mode: poForm.gst_mode,
        tax_type: poForm.tax_type,
        status: 'ORDERED',
        total_amount: totals.grandTotal,
        items: poForm.items.map(it => ({
          product_id: it.product ? parseInt(it.product, 10) : null,
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

  // Mark PO as Received & Move to Received Orders tab
  const handleMarkPOAsReceived = async (po) => {
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      // Optimistic update
      setPurchaseOrders(prevPOs => 
        prevPOs.map(p => 
          String(p.id) === String(po.id) 
            ? { ...p, status: 'RECEIVED', received_date: todayStr } 
            : p
        )
      );

      await suppliersApi.updatePOStatus(po.id, 'RECEIVED');
      showToast(`Purchase Order ${po.po_number} marked as Received! Moved to Received Orders tab.`, 'success');
      setActiveTab('received');
      fetchProcurementData();
    } catch (err) {
      console.error('Error marking PO as received:', err);
      showToast('Failed to mark PO as received', 'error');
      fetchProcurementData();
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

  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: '', company_name: '', phone: '', email: '', gstin: '',
      address: '', city: 'Mumbai', category: 'FMCG & Branded Grocery',
      payment_terms: 'Net 15', credit_limit: 100000, rating: 5, notes: ''
    });
    setIsSupplierModalOpen(true);
  };

  const handleOpenPurchaseProduct = () => {
    const year = new Date().getFullYear();
    const prefix = `PO-${year}-`;
    let maxSeq = 0;
    (purchaseOrders || []).forEach(po => {
      if (po && po.po_number && String(po.po_number).startsWith(prefix)) {
        const seqStr = String(po.po_number).replace(prefix, '');
        const seqNum = parseInt(seqStr, 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      }
    });
    const nextSeq = maxSeq + 1;
    const autoPoNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

    setPoForm(prev => ({
      ...prev,
      po_number: autoPoNumber
    }));
    setIsPoModalOpen(true);
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 animate-fade-in font-sans">
      {/* 📱 MOBILE / TABLET COMPACT PASTEL MINT HEADER */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#E3F6F4] dark:bg-slate-900 text-slate-900 dark:text-white px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-b-[18px] shadow-xs border-b border-teal-200/50 dark:border-slate-800 relative overflow-hidden min-h-[72px] sm:min-h-[82px] flex items-center -mx-3 -mt-3 sm:-mx-5 sm:-mt-5 mb-3">
        <div className="w-full max-w-full flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-9 h-9 rounded-full bg-white dark:bg-slate-800 text-[#134E48] dark:text-teal-300 flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 border border-teal-100/80 dark:border-slate-700"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.6]" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight font-heading leading-tight truncate">
                Supplier & <span className="text-[#00695C] dark:text-[#4DB6AC]">Procurement</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleOpenPurchaseProduct}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-[#00796b] hover:bg-[#004d40] active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              title="Purchase Product"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Purchase</span>
            </button>

            <button
              onClick={handleOpenAddSupplier}
              className="flex items-center gap-1 px-2.5 py-1.5 bg-gradient-to-r from-[#00796b] to-[#004d40] hover:from-[#00695c] hover:to-[#00382e] active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              title="Add Supplier"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Supplier</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 Tulsi Mart POS Top Header Banner (Desktop Only) */}
      <div className="hidden lg:block -mx-8 -mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-5 lg:px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        <div className="flex items-center justify-between gap-4 relative z-10">
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
                Wholesale vendor management, Purchase Orders & Gulla Cash payouts
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <Button 
              variant="primary" 
              size="sm" 
              icon={ShoppingCart} 
              onClick={handleOpenPurchaseProduct} 
              className="bg-gradient-to-r from-teal-600 to-[#00796b] hover:from-teal-700 hover:to-[#004d40] text-white font-extrabold rounded-xl shadow-xs cursor-pointer shrink-0"
            >
              Purchase Product
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={handleOpenAddSupplier}
              className="bg-gradient-to-r from-[#00796b] to-[#004d40] hover:from-[#00695c] hover:to-[#00382e] text-white font-extrabold shadow-xs rounded-xl cursor-pointer shrink-0"
            >
              Add Supplier
            </Button>
          </div>
        </div>
      </div>

      {/* 🌟 Unified Single Control Box (Tabs + Search + Filters) */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-xs space-y-3.5">
        
        {/* Navigation Tabs Bar */}
        <div className={`flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 ${activeTab === 'suppliers' ? 'pb-3 border-b border-slate-100 dark:border-slate-800/80' : ''}`}>
          {[
            { id: 'suppliers', label: 'Suppliers Directory', icon: Building2, count: suppliers.length },
            { id: 'orders', label: 'Purchase Orders', icon: FileText, count: purchaseOrders.filter(po => po.status !== 'RECEIVED').length },
            { id: 'received', label: 'Received Orders', icon: PackageCheck, count: purchaseOrders.filter(po => po.status === 'RECEIVED').length },
            { id: 'payments', label: 'Supplier Payments', icon: Receipt, count: paymentsList.length }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#00796b] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black font-mono ${
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

        {/* 1️⃣ Suppliers Directory Controls */}
        {activeTab === 'suppliers' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-0.5">
            <div className="flex-1 min-w-0">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search vendor name, company, GSTIN..."
              />
            </div>

            <div className="flex items-center gap-2.5 justify-between sm:justify-end shrink-0">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-[#00796b]/20 cursor-pointer"
              >
                <option value="ALL">All Wholesale Categories</option>
                {SUPPLIER_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 shrink-0">
                <button
                  onClick={() => setDirectoryViewMode('grid')}
                  title="Grid View (Cards)"
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    directoryViewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-[#00796b] dark:text-[#80cbc4] shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDirectoryViewMode('table')}
                  title="Table View (List)"
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    directoryViewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-[#00796b] dark:text-[#80cbc4] shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2️⃣ Purchase Orders Controls */}
        {activeTab === 'orders' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-0.5">
            <div className="flex-1 min-w-0">
              <SearchInput
                value={poSearch}
                onChange={setPoSearch}
                placeholder="Search PO number, vendor name, status..."
              />
            </div>

            <div className="flex items-center gap-2.5 justify-between sm:justify-end shrink-0 flex-wrap sm:flex-nowrap">
              {/* 📅 Bill Management Style Date Filter Strip */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
                <input
                  type="date"
                  value={filterDateInput}
                  onChange={(e) => setFilterDateInput(e.target.value)}
                  className="min-w-[120px] px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold focus:outline-hidden focus:border-[#00796b] cursor-pointer h-[36px]"
                  title="Select Date"
                />

                <button
                  type="button"
                  onClick={handleApplyDateFilter}
                  className="px-3 py-1.5 bg-[#00796b] hover:bg-[#004d40] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-center gap-1 shrink-0 h-[36px]"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter</span>
                </button>

                <button
                  type="button"
                  onClick={handleSelectToday}
                  className="px-2.5 py-1.5 bg-teal-50 dark:bg-slate-800 text-[#00796b] dark:text-[#80cbc4] hover:bg-teal-100 dark:hover:bg-slate-700 text-xs font-extrabold rounded-xl transition-colors cursor-pointer shrink-0 border border-teal-200 dark:border-slate-700 h-[36px]"
                  title="Show Today's items"
                >
                  Today
                </button>

                {appliedDate && (
                  <button
                    type="button"
                    onClick={handleClearDateFilter}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 h-[36px]"
                    title="Show All Dates"
                  >
                    All Dates
                  </button>
                )}
              </div>

              <select
                value={poStatusFilter}
                onChange={(e) => setPoStatusFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-[#00796b]/20 cursor-pointer h-[36px]"
              >
                <option value="ALL">All PO Statuses</option>
                <option value="ORDERED">ORDERED</option>
                <option value="RECEIVED">RECEIVED</option>
                <option value="CANCELLED">CANCELLED</option>
              </select>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 shrink-0">
                <button
                  onClick={() => setPoViewMode('grid')}
                  title="Grid View (Cards)"
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    poViewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-[#00796b] dark:text-[#80cbc4] shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPoViewMode('table')}
                  title="Table View (List)"
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    poViewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-[#00796b] dark:text-[#80cbc4] shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3️⃣ Received Orders Controls */}
        {activeTab === 'received' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-0.5">
            <div className="flex-1 min-w-0">
              <SearchInput
                value={receivedSearch}
                onChange={setReceivedSearch}
                placeholder="Search received PO, vendor name..."
              />
            </div>

            <div className="flex items-center gap-2.5 justify-between sm:justify-end shrink-0 flex-wrap sm:flex-nowrap">
              {/* 📅 Bill Management Style Date Filter Strip */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
                <input
                  type="date"
                  value={filterDateInput}
                  onChange={(e) => setFilterDateInput(e.target.value)}
                  className="min-w-[120px] px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold focus:outline-hidden focus:border-[#00796b] cursor-pointer h-[36px]"
                  title="Select Date"
                />

                <button
                  type="button"
                  onClick={handleApplyDateFilter}
                  className="px-3 py-1.5 bg-[#00796b] hover:bg-[#004d40] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-center gap-1 shrink-0 h-[36px]"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter</span>
                </button>

                <button
                  type="button"
                  onClick={handleSelectToday}
                  className="px-2.5 py-1.5 bg-teal-50 dark:bg-slate-800 text-[#00796b] dark:text-[#80cbc4] hover:bg-teal-100 dark:hover:bg-slate-700 text-xs font-extrabold rounded-xl transition-colors cursor-pointer shrink-0 border border-teal-200 dark:border-slate-700 h-[36px]"
                  title="Show Today's items"
                >
                  Today
                </button>

                {appliedDate && (
                  <button
                    type="button"
                    onClick={handleClearDateFilter}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 h-[36px]"
                    title="Show All Dates"
                  >
                    All Dates
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200/80 dark:border-slate-700 shrink-0">
                <button
                  onClick={() => setPoViewMode('grid')}
                  title="Grid View (Cards)"
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    poViewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-[#00796b] dark:text-[#80cbc4] shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPoViewMode('table')}
                  title="Table View (List)"
                  className={`p-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    poViewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-[#00796b] dark:text-[#80cbc4] shadow-xs font-bold'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4️⃣ Supplier Payments Controls */}
        {activeTab === 'payments' && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-0.5">
            <div className="flex-1 min-w-0">
              <SearchInput
                value={paymentSearch}
                onChange={setPaymentSearch}
                placeholder="Search payment reference, supplier, notes..."
              />
            </div>

            <div className="flex items-center gap-2.5 justify-between sm:justify-end shrink-0 flex-wrap sm:flex-nowrap">
              {/* 📅 Bill Management Style Date Filter Strip */}
              <div className="flex items-center gap-1.5 shrink-0 flex-wrap sm:flex-nowrap">
                <input
                  type="date"
                  value={filterDateInput}
                  onChange={(e) => setFilterDateInput(e.target.value)}
                  className="min-w-[120px] px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold focus:outline-hidden focus:border-[#00796b] cursor-pointer h-[36px]"
                  title="Select Date"
                />

                <button
                  type="button"
                  onClick={handleApplyDateFilter}
                  className="px-3 py-1.5 bg-[#00796b] hover:bg-[#004d40] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs hover:shadow-xs flex items-center gap-1 shrink-0 h-[36px]"
                >
                  <Filter className="w-3.5 h-3.5" />
                  <span>Filter</span>
                </button>

                <button
                  type="button"
                  onClick={handleSelectToday}
                  className="px-2.5 py-1.5 bg-teal-50 dark:bg-slate-800 text-[#00796b] dark:text-[#80cbc4] hover:bg-teal-100 dark:hover:bg-slate-700 text-xs font-extrabold rounded-xl transition-colors cursor-pointer shrink-0 border border-teal-200 dark:border-slate-700 h-[36px]"
                  title="Show Today's items"
                >
                  Today
                </button>

                {appliedDate && (
                  <button
                    type="button"
                    onClick={handleClearDateFilter}
                    className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer shrink-0 h-[36px]"
                    title="Show All Dates"
                  >
                    All Dates
                  </button>
                )}
              </div>

              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-[#00796b]/20 cursor-pointer h-[36px]"
              >
                <option value="ALL">All Payment Methods</option>
                <option value="BANK_TRANSFER">BANK TRANSFER</option>
                <option value="CASH">CASH</option>
                <option value="UPI">UPI</option>
                <option value="CHEQUE">CHEQUE</option>
              </select>
            </div>
          </div>
        )}

      </div>

      {/* Main Tab Views */}
      {activeTab === 'suppliers' && (
        <SuppliersDirectoryTab
          suppliers={suppliers}
          purchaseOrders={purchaseOrders}
          search={search}
          setSearch={setSearch}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          supplierCategories={SUPPLIER_CATEGORIES}
          viewMode={directoryViewMode}
          onAddSupplier={handleOpenAddSupplier}
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
          purchaseOrders={filteredPurchaseOrders}
          onCreatePO={handleOpenPurchaseProduct}
          onMarkAsReceived={handleMarkPOAsReceived}
          onPayPO={handlePaySpecificPO}
          viewMode={poViewMode}
        />
      )}

      {activeTab === 'received' && (
        <ReceivedOrdersTab
          purchaseOrders={filteredReceivedOrders}
          onPayPO={handlePaySpecificPO}
          viewMode={poViewMode}
        />
      )}

      {activeTab === 'payments' && (
        <PaymentsLedgerTab paymentsList={filteredPaymentsList} />
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
