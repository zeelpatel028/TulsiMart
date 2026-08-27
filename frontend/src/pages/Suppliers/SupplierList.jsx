import React, { useState, useEffect, useMemo } from 'react';
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
  Wallet
} from 'lucide-react';

// API
import { suppliersApi, inventoryApi, gullaApi } from '../../api';

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

      const fetchedSuppliers = suppliersRes.data?.results || suppliersRes.data || [];
      const fetchedPOs = poRes.data?.results || poRes.data || [];
      const fetchedPayments = paymentsRes.data?.results || paymentsRes.data || [];
      const fetchedProducts = productsRes.data?.results || productsRes.data || [];

      setSuppliers(fetchedSuppliers);
      setPurchaseOrders(fetchedPOs);
      setPaymentsList(fetchedPayments);
      setProducts(fetchedProducts);
      if (gullaRes) setGullaSummary(gullaRes.data || gullaRes);

      // Generate GRN records
      const grns = fetchedPOs
        .filter(po => po.status === 'RECEIVED')
        .map(po => ({
          id: `GRN-${po.id}`,
          grn_number: `GRN-${po.po_number.replace('PO-', '')}`,
          po_number: po.po_number,
          supplier_name: po.supplier_name,
          received_date: po.updated_at ? po.updated_at.split('T')[0] : po.order_date,
          total_items: po.items?.length || 1,
          total_valuation: po.total_amount,
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
    const totalSuppliers = suppliers.length;
    const activeSuppliers = suppliers.filter(s => s.is_active !== false).length;
    const pendingPOs = purchaseOrders.filter(po => po.status === 'ORDERED' || po.status === 'DRAFT').length;
    
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7);

    const todayPurchases = purchaseOrders
      .filter(po => po.order_date === today)
      .reduce((sum, po) => sum + parseFloat(po.total_amount || 0), 0);

    const monthlyPurchases = purchaseOrders
      .filter(po => po.order_date && po.order_date.startsWith(currentMonth))
      .reduce((sum, po) => sum + parseFloat(po.total_amount || 0), 0);

    const pendingPayments = suppliers.reduce((sum, s) => sum + parseFloat(s.pending_balance || 0), 0);
    const overduePayments = suppliers.filter(s => s.payment_terms === 'Net 7' || s.payment_terms === 'Net 15')
      .reduce((sum, s) => sum + parseFloat(s.pending_balance || 0) * 0.4, 0);

    const productsOnOrder = purchaseOrders
      .filter(po => po.status === 'ORDERED')
      .reduce((acc, po) => acc + (po.items?.length || 1), 0);

    const lowStockReorderCount = products.filter(p => p.stock_quantity <= (p.reorder_level || 10)).length;

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
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-white via-slate-50 to-white dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#384959] dark:text-slate-100 font-heading">
              Supplier & Procurement Suite
            </h1>
            <Badge variant="accent" size="sm" className="font-mono uppercase tracking-wider font-bold">v3.5 Enterprise</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Wholesale vendor management, Order-wise Payouts, Gulla Cash Register Outflow & GRN Ledger
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Live Gulla Cash Register Indicator */}
          {gullaSummary && (
            <div className="flex items-center gap-2 px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-800 dark:text-emerald-300 text-xs font-black shadow-xs">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></div>
              <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Gulla: ₹{Number(gullaSummary.cash_in_hand ?? gullaSummary.net_cash_in_gulla ?? 0).toLocaleString('en-IN')}</span>
            </div>
          )}

          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchProcurementData} className="rounded-xl font-bold">
            Sync
          </Button>
          <Button variant="outline" size="sm" icon={FileText} onClick={() => setIsPoModalOpen(true)} className="rounded-xl font-bold">
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
            className="bg-[#384959] hover:bg-[#273440] dark:bg-[#88BDF2] dark:hover:bg-[#a3cbfa] dark:text-[#384959] font-black rounded-xl shadow-sm"
          >
            Add Supplier
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <ProcurementKpiCards kpis={kpis} />

      {/* Tabs */}
      <div className="bg-slate-100/80 dark:bg-slate-900/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
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
                  ? 'bg-white dark:bg-slate-800 text-[#384959] dark:text-[#88BDF2] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-800/40'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? 'text-sky-600 dark:text-[#88BDF2]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black font-mono ${
                  isActive
                    ? 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
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
