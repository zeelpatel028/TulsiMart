import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/UiHelpers';
import InvoiceModal from '../../components/invoices/InvoiceModal';
import { GullaAlertModal } from '../../components/pos/GullaAlertModal';
import { 
  Store, 
  Search, 
  Barcode, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Clock, 
  UserPlus, 
  CheckCircle2, 
  Percent, 
  Sparkles, 
  Printer, 
  RotateCcw, 
  PauseCircle, 
  PlayCircle,
  Tag,
  Receipt,
  User,
  Phone,
  Layers,
  ArrowRight,
  Calculator,
  ShieldCheck,
  AlertCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  Truck,
  History,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Eye,
  FileText,
  Filter,
  Coins
} from 'lucide-react';
import { inventoryApi, customersApi, ordersApi, offersApi, gullaApi, suppliersApi, expensesApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';


export const BillingPage = () => {
  const navigate = useNavigate();
  const { user, storeSettings } = useAuth();
  const { showToast } = useNotification();

  // Active Held Carts (Supports up to 5 concurrent held customer carts)
  const [activeCartIndex, setActiveCartIndex] = useState(0);
  const [carts, setCarts] = useState([
    { id: 1, name: 'Bill #1 (Active)', items: [], customer: null, discountAmount: 0, couponCode: '', notes: '' }
  ]);

  // Catalog Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  // Customer Management
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustomerData, setNewCustomerData] = useState({ name: '', phone: '', email: '', address: '' });
  const [savingCustomer, setSavingCustomer] = useState(false);

  // Payment & Checkout
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [cashTendered, setCashTendered] = useState('');
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [lastCreatedOrder, setLastCreatedOrder] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Offers & Coupons
  const [coupons, setCoupons] = useState([]);
  const [couponInput, setCouponInput] = useState('');
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);

  // Suppliers & Expenses for Gulla Pay Out Connection
  const [suppliers, setSuppliers] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);

  // Today's Gulla (Cash Drawer / Register) State & Cash Tendered Log State
  const [gullaData, setGullaData] = useState({
    today_date: 'Today',
    net_cash_in_gulla: 0,
    total_cash_in: 0,
    total_cash_out: 0,
    breakdown: {
      cash_bill_sales: 0,
      cash_bills_count: 0,
      khata_cash_collected: 0,
      opening_and_added_cash: 0,
      supplier_cash_paid: 0,
      expense_cash_paid: 0,
      cash_withdrawn: 0,
      upi_digital_sales: 0,
      card_digital_sales: 0,
      total_digital_collected: 0,
    },
    cash_tender_summary: {
      total_tendered: 0,
      total_change_returned: 0,
      net_cash_retained: 0,
      count: 0,
    },
    cash_tender_logs: [],
    recent_entries: []
  });
  const [loadingGulla, setLoadingGulla] = useState(false);
  const [isGullaModalOpen, setIsGullaModalOpen] = useState(false);
  const [isGullaHistoryOpen, setIsGullaHistoryOpen] = useState(false);
  const [isCashTenderModalOpen, setIsCashTenderModalOpen] = useState(false);
  const [isDenominationModalOpen, setIsDenominationModalOpen] = useState(false);
  const [isChangeNoteModalOpen, setIsChangeNoteModalOpen] = useState(false);
  const [gullaHistoryTab, setGullaHistoryTab] = useState('ALL'); // 'ALL' | 'CASH_TENDER' | 'MANUAL'
  const [gullaLogViewTab, setGullaLogViewTab] = useState('TABLE'); // 'TABLE' | 'DENOMINATIONS'
  const [cashTenderSearch, setCashTenderSearch] = useState('');
  const [noteInputMode, setNoteInputMode] = useState('REPLACE'); // 'REPLACE' or 'ADD'
  const [noteCounts, setNoteCounts] = useState({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    2: 0,
    1: 0
  });
  const [changeNotes, setChangeNotes] = useState({
    500: 0,
    200: 0,
    100: 0,
    50: 0,
    20: 0,
    10: 0,
    5: 0,
    2: 0,
    1: 0
  });

  const [gullaDrawerNotes, setGullaDrawerNotes] = useState({});
  const [gullaAlertModal, setGullaAlertModal] = useState({ isOpen: false, title: '', message: '', denom: null });

  const calculateDenominationTotal = (counts) => {
    return Object.entries(counts).reduce((sum, [denom, count]) => sum + (Number(denom) * (Number(count) || 0)), 0);
  };

  // Smart Greedy Currency Denominations Algorithm with Gulla Live Drawer Availability Check (Pure Helper)
  const autoCalculateDenominations = (amount) => {
    let remaining = Math.max(0, Math.round(Number(amount) || 0));
    const denoms = [500, 200, 100, 50, 20, 10, 5, 2, 1];
    const breakdown = { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0 };
    const missingNotes = [];

    for (const d of denoms) {
      if (remaining >= d) {
        const needed = Math.floor(remaining / d);
        const avail = gullaDrawerNotes[d] !== undefined ? gullaDrawerNotes[d] : (gullaDrawerNotes[String(d)] || 999);

        if (avail <= 0) {
          missingNotes.push(d);
          continue; // Skip notes that are 0 in Gulla drawer!
        }

        const canGive = Math.min(needed, avail);
        breakdown[d] = canGive;
        remaining -= (canGive * d);
      }
    }

    return {
      breakdown,
      remaining,
      missingNotes
    };
  };

  const getDenominationBreakdownSummary = (counts) => {
    const parts = Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([denom, count]) => `${count}×₹${denom}`);
    return parts.join(' + ') || '0 notes';
  };

  const handleAutoSelectAndOpenNotes = (amount, openModal = false) => {
    const rounded = Math.ceil(amount || 0);
    const res = autoCalculateDenominations(rounded);
    setNoteCounts(res.breakdown);
    setCashTendered(rounded > 0 ? String(rounded) : '');
    if (openModal) {
      setIsDenominationModalOpen(true);
    }
  };

  // Generate smart tender suggestions for customer notes (e.g. for ₹2200 -> Exact ₹2200, ₹2500, ₹3000)
  const getSmartTenderSuggestions = (amount) => {
    const rounded = Math.ceil(amount);
    if (rounded <= 0) return [];
    const suggestions = [];

    // Exact
    const exactRes = autoCalculateDenominations(rounded);
    suggestions.push({
      label: `Exact ₹${rounded}`,
      breakdownSummary: getDenominationBreakdownSummary(exactRes.breakdown),
      amount: rounded,
      breakdown: exactRes.breakdown,
      isExact: true
    });

    // If rounded > 500, suggest next 500 increments
    if (rounded >= 500) {
      const next500 = Math.ceil(rounded / 500) * 500;
      if (next500 > rounded) {
        suggestions.push({
          label: `₹${next500}`,
          breakdownSummary: `${next500 / 500}×₹500`,
          amount: next500,
          breakdown: { ...autoCalculateDenominations(next500) }
        });
      }
      const nextNext500 = (next500 > rounded ? next500 : rounded) + 500;
      suggestions.push({
        label: `₹${nextNext500}`,
        breakdownSummary: `${nextNext500 / 500}×₹500`,
        amount: nextNext500,
        breakdown: { ...autoCalculateDenominations(nextNext500) }
      });
    } else {
      if (rounded < 100) suggestions.push({ label: '₹100', breakdownSummary: '1×₹100', amount: 100, breakdown: autoCalculateDenominations(100) });
      if (rounded < 200) suggestions.push({ label: '₹200', breakdownSummary: '1×₹200', amount: 200, breakdown: autoCalculateDenominations(200) });
      if (rounded < 500) suggestions.push({ label: '₹500', breakdownSummary: '1×₹500', amount: 500, breakdown: autoCalculateDenominations(500) });
    }

    const unique = [];
    const seen = new Set();
    for (const s of suggestions) {
      if (!seen.has(s.amount)) {
        seen.add(s.amount);
        unique.push(s);
      }
    }
    return unique.slice(0, 4);
  };

  const handleSelectSmartSuggestion = (suggestion, openModal = false) => {
    setNoteCounts(suggestion.breakdown);
    setCashTendered(String(suggestion.amount));
    if (openModal) {
      setIsDenominationModalOpen(true);
    }
  };

  const handleNoteCountChange = (denom, newCount) => {
    const sanitizedCount = Math.max(0, parseInt(newCount) || 0);
    const updated = { ...noteCounts, [denom]: sanitizedCount };
    setNoteCounts(updated);
    const total = calculateDenominationTotal(updated);
    setCashTendered(total > 0 ? String(total) : '');
  };

  const handleCashTenderedInputChange = (val) => {
    setCashTendered(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setNoteCounts(autoCalculateDenominations(num));
    } else {
      setNoteCounts({ 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0 });
    }
  };

  const handleAddNoteQuick = (amt) => {
    const nextCounts = { ...noteCounts, [amt]: (noteCounts[amt] || 0) + 1 };
    setNoteCounts(nextCounts);
    const total = calculateDenominationTotal(nextCounts);
    setCashTendered(total > 0 ? String(total) : '');
  };

  const handleRemoveNoteQuick = (amt, e) => {
    if (e) e.stopPropagation();
    const currentCount = noteCounts[amt] || 0;
    if (currentCount <= 0) return;
    const nextCounts = { ...noteCounts, [amt]: currentCount - 1 };
    setNoteCounts(nextCounts);
    const total = calculateDenominationTotal(nextCounts);
    setCashTendered(total > 0 ? String(total) : '');
  };

  const handleClearNotes = () => {
    setCashTendered('');
    setNoteCounts({ 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0 });
  };

  const [gullaForm, setGullaForm] = useState({
    actionType: 'CASH_IN', // 'CASH_IN' | 'CASH_OUT' | 'SUPPLIER_PAYMENT' | 'KHATA_PAYMENT' | 'EXPENSE' | 'OPENING_FLOAT'
    amount: '',
    notes: '',
    supplier_id: '',
    customer_id: '',
    expense_title: '',
    expense_category_id: ''
  });
  const [submittingGulla, setSubmittingGulla] = useState(false);

  // Live Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  const barcodeInputRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Products, Categories, Customers & Gulla Data on mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadGullaSummary = async () => {
    try {
      setLoadingGulla(true);
      const res = await gullaApi.getGullaSummary();
      setGullaData(res.data);
      const netNotes = res.data?.notes_and_coins_summary?.net_drawer_notes || {};
      const formatted = {};
      [500, 200, 100, 50, 20, 10, 5, 2, 1].forEach((d) => {
        formatted[d] = Math.max(0, parseInt(netNotes[d] || netNotes[String(d)] || 0, 10));
      });
      setGullaDrawerNotes(formatted);
    } catch (err) {
      console.error('Failed to load Gulla summary', err);
    } finally {
      setLoadingGulla(false);
    }
  };

  const loadInitialData = async () => {
    try {
      setLoadingCatalog(true);
      const [prodRes, catRes, custRes, coupRes, gullaRes, suppRes, expCatRes] = await Promise.allSettled([
        inventoryApi.getProducts({ page_size: 100 }),
        inventoryApi.getCategories(),
        customersApi.getCustomers({ page_size: 100 }),
        offersApi.getCoupons(),
        gullaApi.getGullaSummary(),
        suppliersApi.getSuppliers(),
        expensesApi.getCategories()
      ]);

      if (prodRes.status === 'fulfilled') setProducts(prodRes.value.data?.results || prodRes.value.data || []);
      if (catRes.status === 'fulfilled') setCategories(catRes.value.data?.results || catRes.value.data || []);
      if (custRes.status === 'fulfilled') setCustomers(custRes.value.data?.results || custRes.value.data || []);
      if (coupRes.status === 'fulfilled') setCoupons(coupRes.value.data?.results || coupRes.value.data || []);
      if (gullaRes.status === 'fulfilled') {
        setGullaData(gullaRes.value.data);
        const netNotes = gullaRes.value.data?.notes_and_coins_summary?.net_drawer_notes || {};
        const formatted = {};
        [500, 200, 100, 50, 20, 10, 5, 2, 1].forEach((d) => {
          formatted[d] = Math.max(0, parseInt(netNotes[d] || netNotes[String(d)] || 0, 10));
        });
        setGullaDrawerNotes(formatted);
      }
      if (suppRes.status === 'fulfilled') setSuppliers(suppRes.value.data?.results || suppRes.value.data || []);
      if (expCatRes.status === 'fulfilled') setExpenseCategories(expCatRes.value.data?.results || expCatRes.value.data || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load catalog or customers', 'error');
    } finally {
      setLoadingCatalog(false);
    }
  };

  const openGullaModal = (type = 'CASH_IN') => {
    setGullaForm({
      actionType: type,
      amount: '',
      notes: '',
      supplier_id: suppliers.length > 0 ? suppliers[0].id : '',
      customer_id: customers.length > 0 ? customers[0].id : '',
      expense_title: '',
      expense_category_id: expenseCategories.length > 0 ? expenseCategories[0].id : ''
    });
    setIsGullaModalOpen(true);
  };

  const handleSubmitGullaAction = async (e) => {
    e.preventDefault();
    const amountVal = parseFloat(gullaForm.amount);
    if (isNaN(amountVal) || amountVal <= 0) {
      showToast('Please enter a valid amount greater than ₹0', 'warning');
      return;
    }

    try {
      setSubmittingGulla(true);

      if (gullaForm.actionType === 'KHATA_PAYMENT') {
        if (!gullaForm.customer_id) {
          showToast('Please select a customer for Khata collection', 'warning');
          return;
        }
        await customersApi.recordKhataPayment(gullaForm.customer_id, {
          amount: amountVal,
          payment_method: 'CASH',
          notes: gullaForm.notes || 'Khata received into Gulla'
        });
        showToast(`Collected ₹${amountVal} Khata into Gulla!`, 'success');
      } else if (gullaForm.actionType === 'SUPPLIER_PAYMENT') {
        if (!gullaForm.supplier_id) {
          showToast('Please select a supplier', 'warning');
          return;
        }
        await gullaApi.createGullaEntry({
          entry_type: 'SUPPLIER_PAYMENT',
          amount: amountVal,
          supplier_id: gullaForm.supplier_id,
          notes: gullaForm.notes
        });
        showToast(`Paid ₹${amountVal} to supplier from Gulla!`, 'success');
      } else if (gullaForm.actionType === 'EXPENSE') {
        await gullaApi.createGullaEntry({
          entry_type: 'EXPENSE',
          amount: amountVal,
          category_id: gullaForm.expense_category_id,
          title: gullaForm.expense_title || 'Store Cash Expense',
          notes: gullaForm.notes
        });
        showToast(`Recorded ₹${amountVal} expense from Gulla!`, 'success');
      } else {
        await gullaApi.createGullaEntry({
          entry_type: gullaForm.actionType,
          amount: amountVal,
          notes: gullaForm.notes
        });
        showToast(
          gullaForm.actionType === 'CASH_IN' || gullaForm.actionType === 'OPENING_FLOAT'
            ? `Added ₹${amountVal} cash to Gulla!`
            : `Withdrew ₹${amountVal} cash from Gulla!`,
          'success'
        );
      }

      setIsGullaModalOpen(false);
      loadGullaSummary();
      customersApi.getCustomers({ page_size: 100 }).then(r => setCustomers(r.data?.results || r.data || []));
      suppliersApi.getSuppliers().then(r => setSuppliers(r.data?.results || r.data || []));
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to complete Gulla operation', 'error');
    } finally {
      setSubmittingGulla(false);
    }
  };


  // Current active cart reference
  const currentCart = carts[activeCartIndex] || carts[0];
  const cartItems = currentCart.items;

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // F2: Focus Barcode Scanner
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
      // F4: Clear Current Cart
      if (e.key === 'F4') {
        e.preventDefault();
        handleClearCart();
      }
      // F8: Open Coupon Modal
      if (e.key === 'F8') {
        e.preventDefault();
        setIsCouponModalOpen(true);
      }
      // F9: Complete Order Checkout
      if (e.key === 'F9') {
        e.preventDefault();
        if (cartItems.length > 0 && !submittingOrder) {
          handleCompleteCheckout();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, submittingOrder, currentCart, paymentMethod, cashTendered]);

  // Barcode Submission Handler
  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    const query = barcodeInput.trim().toLowerCase();
    const matchedProduct = products.find(
      (p) => (p.barcode && p.barcode.toLowerCase() === query) || (p.sku && p.sku.toLowerCase() === query)
    );

    if (matchedProduct) {
      handleAddToCart(matchedProduct);
      setBarcodeInput('');
    } else {
      showToast(`No product found with barcode/SKU "${barcodeInput}"`, 'error');
      setBarcodeInput('');
    }
  };

  // Add Item to Active Cart
  const handleAddToCart = (product) => {
    if (product.stock_quantity <= 0) {
      showToast(`${product.name} is out of stock!`, 'error');
      return;
    }

    const updatedCarts = [...carts];
    const targetCart = { ...updatedCarts[activeCartIndex] };
    const existingIndex = targetCart.items.findIndex((item) => item.product.id === product.id);

    if (existingIndex > -1) {
      const currentQty = targetCart.items[existingIndex].quantity;
      if (currentQty + 1 > product.stock_quantity) {
        showToast(`Cannot add more than ${product.stock_quantity} units of ${product.name}`, 'warning');
        return;
      }
      targetCart.items[existingIndex].quantity += 1;
    } else {
      targetCart.items.push({
        product,
        quantity: 1,
        unitPrice: parseFloat(product.selling_price || product.price || 0),
        mrp: parseFloat(product.mrp || product.selling_price || product.price || 0),
        gstPercent: parseFloat(product.gst_percent !== undefined && product.gst_percent !== null ? product.gst_percent : (product.tax_percentage || 0))
      });
    }

    updatedCarts[activeCartIndex] = targetCart;
    setCarts(updatedCarts);
    showToast(`Added ${product.name} to bill`, 'success');
  };

  // Update Item Quantity
  const handleUpdateQuantity = (productId, newQty) => {
    const updatedCarts = [...carts];
    const targetCart = { ...updatedCarts[activeCartIndex] };
    const itemIndex = targetCart.items.findIndex((item) => item.product.id === productId);

    if (itemIndex > -1) {
      const item = targetCart.items[itemIndex];
      if (newQty <= 0) {
        targetCart.items.splice(itemIndex, 1);
      } else {
        if (newQty > item.product.stock_quantity) {
          showToast(`Max available stock is ${item.product.stock_quantity}`, 'warning');
          return;
        }
        item.quantity = newQty;
      }
    }

    updatedCarts[activeCartIndex] = targetCart;
    setCarts(updatedCarts);
  };

  // Update Item Unit Price for Current Bill Only (Does NOT modify catalog master records)
  const handleUpdateUnitPrice = (productId, newPrice) => {
    const parsedPrice = parseFloat(newPrice);
    const updatedCarts = [...carts];
    const targetCart = { ...updatedCarts[activeCartIndex] };
    const item = targetCart.items.find((i) => i.product.id === productId);
    if (item) {
      item.unitPrice = isNaN(parsedPrice) ? 0 : parsedPrice;
      item.customPrice = true;
    }
    updatedCarts[activeCartIndex] = targetCart;
    setCarts(updatedCarts);
  };

  // Remove Item
  const handleRemoveItem = (productId) => {

    const updatedCarts = [...carts];
    const targetCart = { ...updatedCarts[activeCartIndex] };
    targetCart.items = targetCart.items.filter((item) => item.product.id !== productId);
    updatedCarts[activeCartIndex] = targetCart;
    setCarts(updatedCarts);
  };

  // Clear Active Cart
  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    const updatedCarts = [...carts];
    updatedCarts[activeCartIndex] = {
      ...updatedCarts[activeCartIndex],
      items: [],
      discountAmount: 0,
      couponCode: '',
      customer: null
    };
    setCarts(updatedCarts);
    showToast('Cart cleared', 'info');
  };

  // Hold Current Cart & Create New Tab
  const handleHoldCart = () => {
    if (carts.length >= 5) {
      showToast('Maximum 5 held carts allowed simultaneously', 'warning');
      return;
    }
    const newCartId = Date.now();
    const newCart = {
      id: newCartId,
      name: `Bill #${carts.length + 1} (${cartItems.length} items held)`,
      items: [],
      customer: null,
      discountAmount: 0,
      couponCode: '',
      notes: ''
    };
    setCarts([...carts, newCart]);
    setActiveCartIndex(carts.length);
    showToast('Current cart held. Opened fresh bill tab!', 'info');
  };

  // Close a Held Cart Tab
  const handleCloseCartTab = (index, e) => {
    e.stopPropagation();
    if (carts.length === 1) {
      handleClearCart();
      return;
    }
    const updatedCarts = carts.filter((_, i) => i !== index);
    setCarts(updatedCarts);
    setActiveCartIndex(Math.max(0, index - 1));
  };

  // Customer Assignment
  const handleSelectCustomer = (cust) => {
    const updatedCarts = [...carts];
    updatedCarts[activeCartIndex] = {
      ...updatedCarts[activeCartIndex],
      customer: cust
    };
    setCarts(updatedCarts);
    setIsCustomerDropdownOpen(false);
    showToast(`Customer attached: ${cust.name}`, 'info');
  };

  const handleRemoveCustomer = () => {
    const updatedCarts = [...carts];
    updatedCarts[activeCartIndex] = {
      ...updatedCarts[activeCartIndex],
      customer: null
    };
    setCarts(updatedCarts);
    setCustomerSearch('');
    showToast('Customer detached (Set to Walk-in)', 'info');
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerData.name || !newCustomerData.phone) {
      showToast('Name and phone number are required', 'warning');
      return;
    }
    try {
      setSavingCustomer(true);
      const res = await customersApi.createCustomer(newCustomerData);
      setCustomers([res.data, ...customers]);
      handleSelectCustomer(res.data);
      setIsNewCustomerModalOpen(false);
      setNewCustomerData({ name: '', phone: '', email: '', address: '' });
      showToast('New customer created & attached to bill!', 'success');
    } catch (err) {
      showToast('Failed to create customer', 'error');
    } finally {
      setSavingCustomer(false);
    }
  };

  // Apply Coupon
  const handleApplyCoupon = (code) => {
    const foundCoupon = coupons.find((c) => c.code.toUpperCase() === code.toUpperCase() && c.is_active);
    if (!foundCoupon) {
      showToast('Invalid or expired coupon code', 'error');
      return;
    }

    const subtotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
    if (foundCoupon.min_order_value && subtotal < parseFloat(foundCoupon.min_order_value)) {
      showToast(`Minimum order amount of ₹${foundCoupon.min_order_value} required for this coupon`, 'warning');
      return;
    }

    let discount = 0;
    if (foundCoupon.discount_type === 'PERCENT') {
      discount = (subtotal * parseFloat(foundCoupon.discount_value)) / 100;
      if (foundCoupon.max_discount_amount) {
        discount = Math.min(discount, parseFloat(foundCoupon.max_discount_amount));
      }
    } else {
      discount = parseFloat(foundCoupon.discount_value);
    }

    const updatedCarts = [...carts];
    updatedCarts[activeCartIndex] = {
      ...updatedCarts[activeCartIndex],
      discountAmount: discount,
      couponCode: foundCoupon.code
    };
    setCarts(updatedCarts);
    setIsCouponModalOpen(false);
    setCouponInput('');
    showToast(`Coupon applied! Saved ₹${discount.toFixed(2)}`, 'success');
  };

  // Financial Calculations (Grocery retail prices are inclusive of GST)
  const grossTotal = cartItems.reduce((acc, item) => acc + item.mrp * item.quantity, 0);
  const netSubtotal = cartItems.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const totalMrpSavings = Math.max(0, grossTotal - netSubtotal);
  const couponDiscount = currentCart.discountAmount || 0;
  
  // Tax breakdown: Extracted from inclusive selling prices (Retail GST Standard)
  const taxAmount = cartItems.reduce((acc, item) => {
    const lineTotal = item.unitPrice * item.quantity;
    const gstRate = parseFloat(item.gstPercent || 0);
    if (gstRate > 0) {
      const baseVal = lineTotal / (1 + gstRate / 100);
      return acc + (lineTotal - baseVal);
    }
    return acc;
  }, 0);
  const taxableSubtotal = Math.max(0, netSubtotal - taxAmount);
  const grandTotal = Math.max(0, netSubtotal - couponDiscount);

  // Cash Change Calculation
  const cashAmountNumber = parseFloat(cashTendered) || 0;
  const changeToReturn = Math.max(0, cashAmountNumber - grandTotal);

  // Auto-sync suggested change notes when change to return updates
  useEffect(() => {
    if (changeToReturn > 0) {
      const res = autoCalculateDenominations(changeToReturn);
      setChangeNotes(res.breakdown);
    } else {
      setChangeNotes({ 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0 });
    }
  }, [changeToReturn, gullaDrawerNotes]);

  const handleChangeNoteCountChange = (denom, newCount) => {
    const sanitizedCount = Math.max(0, parseInt(newCount) || 0);
    const avail = gullaDrawerNotes[denom] !== undefined ? gullaDrawerNotes[denom] : (gullaDrawerNotes[String(denom)] || 0);

    // Rule A: Out of Stock in Gulla Check
    if (sanitizedCount > 0 && avail <= 0) {
      showToast(`⚠️ ગલ્લા (Gulla) માં ₹${denom} ની નોટ ઉપલબ્ધ નથી! (પ્રાપ્ય: 0). કૃપા કરીને Cash In વડે નોટ ઉમેરો.`, 'error');
      setGullaAlertModal({
        isOpen: true,
        title: `⚠️ Gulla Alert: ₹${denom} ની નોટ ગલ્લામાં નથી`,
        message: `તમારી પાસે ગલ્લા (Gulla Drawer) માં ₹${denom} ની નોટ ઉપલબ્ધ નથી (પ્રાપ્ય: 0). કૃપા કરીને Opening Float અથવા Cash In વડે નોટો એડ કરો.`,
        denom: denom
      });
      return;
    }

    // Rule B: Available Count in Drawer Check
    if (sanitizedCount > avail) {
      showToast(`⚠️ ગલ્લા (Gulla) માં માત્ર ${avail} જ ₹${denom} ની નોટો છે! (તમે ${sanitizedCount} સિલેક્ટ કરી છે).`, 'error');
      setGullaAlertModal({
        isOpen: true,
        title: `⚠️ Gulla Alert: ₹${denom} ની નોટો ઓછી છે`,
        message: `તમારી પાસે ગલ્લામાં માત્ર ${avail} જ ₹${denom} ની નોટો છે, જ્યારે તમે ${sanitizedCount} સિલેક્ટ કરી છે. કૃપા કરીને કેશ એડ કરો.`,
        denom: denom
      });
      return;
    }

    // Rule C: Change Exceeds Target Check (User Request: note > remaining change cannot be selected)
    const currentOtherTotal = Object.entries(changeNotes).reduce((sum, [dStr, cnt]) => {
      return Number(dStr) === Number(denom) ? sum : sum + (Number(dStr) * (Number(cnt) || 0));
    }, 0);
    const newTotal = currentOtherTotal + (Number(denom) * sanitizedCount);

    if (newTotal > changeToReturn && sanitizedCount > (changeNotes[denom] || 0)) {
      const remainingAllowed = Math.max(0, changeToReturn - currentOtherTotal);
      showToast(`⚠️ આ ₹${denom} ની નોટ ઉમેરવાથી પાછો આપવાનો કેશ ₹${changeToReturn.toFixed(2)} વટાવી જશે! (બાકી પૂરવા માટે જરૂરિયાત: ₹${remainingAllowed.toFixed(2)})`, 'warning');
      return;
    }

    setChangeNotes((prev) => ({ ...prev, [denom]: sanitizedCount }));
  };

  const handleChangeNoteQuickAdd = (amt) => {
    const currentCount = changeNotes[amt] || 0;
    handleChangeNoteCountChange(amt, currentCount + 1);
  };

  const handleResetChangeNotes = () => {
    if (changeToReturn > 0) {
      const res = autoCalculateDenominations(changeToReturn);
      setChangeNotes(res.breakdown);
      if (res.remaining > 0) {
        showToast(`⚠️ ગલ્લામાં કેશ નોટો ઓછી છે (બાકી: ₹${res.remaining})`, 'error');
        setGullaAlertModal({
          isOpen: true,
          title: '⚠️ Gulla Live Drawer Cash Alert',
          message: `ગુલ્લા (Gulla) માં ₹${changeToReturn} નો પાછો કેશ આપવા માટે પૂરતી નોટો નથી! (બાકી રકમ: ₹${res.remaining}). કૃપા કરીને Opening Float અથવા Cash In વડે ગલ્લામાં કેશ ઉમેરો.`,
          denom: res.missingNotes[0] || null
        });
      }
    } else {
      setChangeNotes({ 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0 });
    }
  };

  // Filter Catalog
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.category_name === selectedCategory || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.brand_name && p.brand_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // Complete Order & Checkout Handler
  const handleCompleteCheckout = async () => {
    if (cartItems.length === 0) {
      showToast('Please add items to cart before completing bill', 'warning');
      return;
    }

    if (paymentMethod === 'CASH' && changeVal > 0) {
      for (const [denomStr, count] of Object.entries(changeNotes)) {
        const d = Number(denomStr);
        const c = Number(count) || 0;
        if (c > 0) {
          const avail = gullaDrawerNotes[d] !== undefined ? gullaDrawerNotes[d] : (gullaDrawerNotes[String(d)] || 0);
          if (avail < c) {
            setSubmittingOrder(false);
            showToast(`⚠️ ગલ્લામાં ₹${d} ની નોટ નથી / ઓછી છે! (પ્રાપ્ય: ${avail}, જરૂરિયાત: ${c}). કૃપા કરીને કેશ એડ કરો.`, 'error');
            setGullaAlertModal({
              isOpen: true,
              title: `⚠️ Gulla Drawer Cash Error`,
              message: `તમારી પાસે ગલ્લામાં ₹${d} ની નોટ નથી / ઓછી છે! (પ્રાપ્ય: ${avail}, આપવાના: ${c}). કૃપા કરીને Opening Float વડે કેશ ઉમેરો અથવા બીજી નોટમાં ચેન્જ આપો.`,
              denom: d
            });
            return;
          }
        }
      }
    }

    try {
      setSubmittingOrder(true);

      const tenderedVal = paymentMethod === 'CASH'
        ? (cashAmountNumber > 0 ? parseFloat(cashAmountNumber.toFixed(2)) : parseFloat(grandTotal.toFixed(2)))
        : null;
      const changeVal = paymentMethod === 'CASH'
        ? parseFloat(changeToReturn.toFixed(2))
        : 0;

      const payload = {
        customer: currentCart.customer?.id || null,
        customer_name: currentCart.customer?.name || 'Walk-in Customer',
        customer_phone: currentCart.customer?.phone || '9999999999',
        customer_address: currentCart.customer?.address || 'Counter POS Sale',
        order_type: 'STORE_POS',
        payment_method: paymentMethod,
        payment_status: paymentMethod === 'KHATA' ? 'PENDING' : 'PAID',
        status: 'DELIVERED',
        subtotal: parseFloat(netSubtotal.toFixed(2)),
        tax_amount: parseFloat(taxAmount.toFixed(2)),
        discount_amount: parseFloat(couponDiscount.toFixed(2)),
        total_amount: parseFloat(grandTotal.toFixed(2)),
        cash_tendered: tenderedVal,
        change_returned: changeVal,
        tendered_notes: paymentMethod === 'CASH' ? noteCounts : null,
        change_notes: paymentMethod === 'CASH' && changeVal > 0 ? changeNotes : null,
        coupon_code: currentCart.couponCode || '',
        items: cartItems.map((item) => ({
          product: item.product.id,
          product_name: item.product.name,
          sku: item.product.sku || '',
          quantity: item.quantity,
          unit_price: parseFloat(item.unitPrice.toFixed(2)),
          gst_percent: parseFloat(item.gstPercent.toFixed(2)),
          total_price: parseFloat((item.unitPrice * item.quantity).toFixed(2))
        }))
      };

      const res = await ordersApi.createOrder(payload);
      setLastCreatedOrder(res.data);
      setIsInvoiceModalOpen(true);
      
      if (paymentMethod === 'CASH' && changeVal > 0) {
        const changeStr = getDenominationBreakdownSummary(changeNotes);
        showToast(`Bill #${res.data?.order_number || ''} completed! Hand over ₹${changeVal.toFixed(2)} change (${changeStr}) to customer.`, 'success');
      } else if (paymentMethod === 'CASH') {
        showToast(`Bill #${res.data?.order_number || ''} completed! Received ₹${tenderedVal.toFixed(2)} cash into Gulla.`, 'success');
      } else {
        showToast('Bill completed and invoice generated!', 'success');
      }

      // Refresh live Gulla drawer balance immediately
      loadGullaSummary();

      // Refresh products to update live stock numbers
      inventoryApi.getProducts({ page_size: 100 }).then((r) => {
        setProducts(r.data?.results || r.data || []);
      });


      // Reset Current Cart
      handleClearCart();
      setCashTendered('');
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to complete order. Check stock availability.', 'error');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="space-y-3 font-sans pb-12">
      {/* 🌟 Compact & Modern POS Top Bar - Tulsi Mart Brand Palette */}
      <div className="bg-linear-to-r from-[#384959] to-[#2B3844] text-white px-4 py-3 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 border border-white/10">
        {/* Left: Terminal Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 border border-[#88BDF2]/40 flex items-center justify-center text-[#88BDF2]">
            <Store className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-black tracking-tight text-white font-heading">
                POS Billing Terminal
              </h1>
              <span className="bg-[#88BDF2] text-[#384959] text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider">
                Counter #1
              </span>
            </div>
            <p className="text-[11px] text-[#BDDDFC]/80">
              Cashier: <strong className="text-white">{user?.first_name ? `${user.first_name} ${user.last_name || ''}` : (user?.username || 'Super Admin')}</strong>
            </p>
          </div>
        </div>

        {/* Center: Held Multi-Bill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan py-0.5">
          {carts.map((cart, idx) => (
            <button
              key={cart.id}
              onClick={() => setActiveCartIndex(idx)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                activeCartIndex === idx
                  ? 'bg-[#88BDF2] text-[#384959] border-[#88BDF2] shadow-xs font-extrabold'
                  : 'bg-white/10 text-white/90 border-white/15 hover:bg-white/20'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{cart.items.length > 0 ? `Bill #${idx + 1} (${cart.items.length})` : `Bill #${idx + 1}`}</span>
              {carts.length > 1 && (
                <span
                  onClick={(e) => handleCloseCartTab(idx, e)}
                  className="hover:text-rose-300 ml-0.5 p-0.5 rounded-full"
                  title="Close Tab"
                >
                  ×
                </span>
              )}
            </button>
          ))}
          <button
            onClick={handleHoldCart}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-[#BDDDFC] hover:text-white border border-white/15 rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
            title="Hold current cart & open new bill tab"
          >
            <Plus className="w-3.5 h-3.5 text-[#88BDF2]" /> Hold Bill
          </button>
        </div>

        {/* Right: Quick Gulla Status & Digital Clock */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Single Clean Gulla Drawer Status Button */}
          <button
            type="button"
            onClick={() => navigate('/gulla')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-xl border border-white/15 text-xs font-bold text-[#88BDF2] transition-colors cursor-pointer"
            title="Gulla Cash in Drawer • Click to open Gulla Management Page"
          >
            <Wallet className="w-3.5 h-3.5 text-[#88BDF2]" />
            <span>Gulla: ₹{gullaData.net_cash_in_gulla?.toFixed(0) || '0'}</span>
          </button>

          {/* Live Digital Clock */}
          <div className="hidden sm:flex items-center gap-1 bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/15 text-xs font-mono font-bold text-[#BDDDFC]">
            <Clock className="w-3.5 h-3.5 text-[#88BDF2]" />
            <span>{currentTime.toLocaleTimeString('en-IN', { hour12: true })}</span>
          </div>
        </div>
      </div>

      {/* 🚀 Main 2-Column POS Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ================= LEFT COLUMN: CATALOG & BARCODE SCANNER (7 COLS) ================= */}
        <div className="lg:col-span-7 space-y-3">
          {/* Barcode Scanner & Search Hub */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
            <div className="flex items-center gap-2">
              {/* Barcode Fast Scan Input */}
              <form onSubmit={handleBarcodeSubmit} className="relative flex-1">
                <div className="absolute left-3 top-2.5 text-slate-400 flex items-center">
                  <Barcode className="w-4 h-4 text-[#6A89A7] dark:text-[#88BDF2]" />
                </div>
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode or SKU [F2]..."
                  className="w-full pl-9 pr-16 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-[#88BDF2] rounded-xl text-xs font-semibold outline-hidden focus:bg-white dark:focus:bg-slate-800 text-[#384959] dark:text-slate-100 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 px-2.5 py-1 bg-[#384959] hover:bg-[#2B3844] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Scan
                </button>
              </form>

              {/* Keyword Search */}
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, brand..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-[#88BDF2] rounded-xl text-xs outline-hidden text-[#384959] dark:text-slate-100 placeholder:text-slate-400"
                />
              </div>

              {(searchQuery || selectedCategory !== 'ALL') && (
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('ALL'); }}
                  className="px-2.5 py-2 text-xs font-bold text-slate-500 hover:text-rose-500 bg-slate-100 dark:bg-slate-800 rounded-xl cursor-pointer shrink-0"
                  title="Clear search filters"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Filter Pills Bar */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan pt-0.5">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors shrink-0 cursor-pointer ${
                  selectedCategory === 'ALL'
                    ? 'bg-[#384959] dark:bg-[#88BDF2] text-white dark:text-[#384959] shadow-2xs font-extrabold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                All ({products.length})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.name)}
                  className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-colors shrink-0 cursor-pointer ${
                    selectedCategory === c.name
                      ? 'bg-[#384959] dark:bg-[#88BDF2] text-white dark:text-[#384959] shadow-2xs font-extrabold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
            {loadingCatalog ? (
              <div className="py-20 text-center text-xs text-slate-400">
                Loading products catalog...
              </div>
            ) : filteredProducts.length === 0 ? (
              <EmptyState
                variant="compact"
                icon={ShoppingBag}
                title="No Products Found"
                description="Try another search keyword or category."
                secondaryActionLabel={searchQuery || selectedCategory !== 'ALL' ? 'Clear Filters' : undefined}
                onSecondaryAction={() => {
                  setSearchQuery('');
                  setSelectedCategory('ALL');
                }}
              />
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-[580px] overflow-y-auto custom-scrollbar touch-pan pr-1">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stock_quantity <= 0;
                  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= (product.min_stock_alert || 5);
                  const price = parseFloat(product.selling_price || product.price || 0);
                  const mrp = parseFloat(product.mrp || price);
                  const hasDiscount = mrp > price;

                  return (
                    <button
                      key={product.id}
                      disabled={isOutOfStock}
                      onClick={() => handleAddToCart(product)}
                      className={`text-left p-3 rounded-xl border transition-all duration-150 flex flex-col justify-between group cursor-pointer relative ${
                        isOutOfStock
                          ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200/90 dark:border-slate-700/80 hover:border-[#88BDF2] hover:shadow-sm hover:-translate-y-0.5 active:scale-95'
                      }`}
                    >
                      <div>
                        {/* Top Category & Discount row */}
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className="text-[9px] font-bold text-[#6A89A7] dark:text-[#88BDF2] uppercase tracking-wider truncate">
                            {product.category_name || 'Grocery'}
                          </span>
                          {hasDiscount && (
                            <span className="bg-[#BDDDFC]/30 dark:bg-[#384959] text-[#384959] dark:text-[#88BDF2] border border-[#88BDF2]/40 text-[9px] font-black px-1.5 py-0.2 rounded shrink-0">
                              {Math.round(((mrp - price) / mrp) * 100)}% OFF
                            </span>
                          )}
                        </div>

                        {/* Product Title */}
                        <h4 className="text-xs font-bold text-[#384959] dark:text-slate-100 line-clamp-2 leading-tight group-hover:text-[#6A89A7] dark:group-hover:text-[#88BDF2]">
                          {product.name}
                        </h4>

                        {/* Unit / Pack Size */}
                        <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                          {product.unit_name || product.unit || '1 Unit'}
                        </div>
                      </div>

                      {/* Price & Stock Row */}
                      <div className="mt-2 pt-1.5 border-t border-slate-100 dark:border-slate-700/60 flex items-end justify-between">
                        <div>
                          <div className="text-xs font-black text-[#384959] dark:text-slate-100 font-heading">
                            ₹{price.toFixed(2)}
                          </div>
                          {hasDiscount && (
                            <div className="text-[9px] text-slate-400 line-through">
                              ₹{mrp.toFixed(2)}
                            </div>
                          )}
                        </div>

                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isOutOfStock
                            ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                            : isLowStock
                            ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}>
                          {isOutOfStock ? 'Out' : `Qty ${product.stock_quantity}`}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: ACTIVE BILL CART & CHECKOUT (5 COLS) ================= */}
        <div className="lg:col-span-5 space-y-3">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            {/* Customer Attachment Strip */}
            <div className="p-2.5 bg-slate-50 dark:bg-slate-800/70 rounded-xl border border-slate-200/80 dark:border-slate-700 relative">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <User className="w-3 h-3 text-[#6A89A7]" /> Customer Details
                </span>
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(true)}
                  className="text-[11px] font-bold text-[#384959] dark:text-[#88BDF2] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Customer
                </button>
              </div>

              {currentCart.customer ? (
                <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-[#384959] dark:text-slate-100 truncate">
                      {currentCart.customer.name}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      {currentCart.customer.phone || 'No phone'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCustomer}
                    className="text-xs font-bold text-slate-400 hover:text-rose-500 cursor-pointer px-1.5"
                    title="Remove customer (Set to Walk-in)"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    placeholder="Walk-in Customer (Search name or phone)..."
                    className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100 placeholder:text-slate-400 font-medium"
                  />
                  {isCustomerDropdownOpen && customerSearch && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-20 max-h-44 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                      {customers
                        .filter((c) =>
                          c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
                          (c.phone && c.phone.includes(customerSearch))
                        )
                        .slice(0, 5)
                        .map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => handleSelectCustomer(c)}
                            className="w-full text-left p-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs flex items-center justify-between cursor-pointer"
                          >
                            <div>
                              <div className="font-bold text-[#384959] dark:text-slate-100">{c.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{c.phone}</div>
                            </div>
                            <span className="text-[10px] font-bold text-[#384959] dark:text-[#88BDF2] bg-[#BDDDFC]/20 px-2 py-0.5 rounded">
                              Select
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bill Cart Items Section */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-[#384959] dark:text-slate-100">
                <span>Cart Items ({cartItems.length})</span>
                {cartItems.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="text-[11px] font-bold text-rose-500 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Clear [F4]
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="py-8 text-center bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 space-y-1">
                  <ShoppingBag className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-xs font-medium dark:text-slate-300">Cart is empty</p>
                  <p className="text-[10px] text-slate-400">Scan barcodes or click products on the left</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto custom-scrollbar-thin touch-pan space-y-1.5 pr-1">
                  {cartItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="p-2 bg-slate-50/80 dark:bg-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <h5 className="text-xs font-bold text-[#384959] dark:text-slate-100 truncate">
                          {item.product.name}
                        </h5>
                        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                          {/* Unit Price Modifier */}
                          <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 px-1 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px]">
                            <span className="text-slate-400 font-bold text-[10px]">₹</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.unitPrice === 0 ? '' : item.unitPrice}
                              onChange={(e) => handleUpdateUnitPrice(item.product.id, e.target.value)}
                              placeholder="0.00"
                              className="w-12 text-[11px] font-black text-[#384959] dark:text-slate-100 bg-transparent outline-hidden"
                            />
                            <span className="text-[9px] text-slate-400">/{item.product.unit_name || item.product.unit || 'unit'}</span>
                          </div>

                          <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold px-1 rounded text-[9px]">
                            GST {item.gstPercent}%
                          </span>
                        </div>
                      </div>

                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity - 1)}
                          className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[10px] cursor-pointer"
                        >
                          -
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-[#384959] dark:text-slate-100">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(item.product.id, item.quantity + 1)}
                          className="w-4 h-4 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center font-bold text-[10px] cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Line Total & Remove */}
                      <div className="text-right shrink-0">
                        <div className="text-xs font-extrabold text-[#384959] dark:text-slate-100 font-mono">
                          ₹{(item.unitPrice * item.quantity).toFixed(2)}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.product.id)}
                          className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
                          title="Remove item"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bill Summary & Net Total Card - Tulsi Mart Brand Colors */}
            <div className="p-3 bg-linear-to-br from-[#384959] to-[#2B3844] text-white rounded-xl space-y-2 shadow-sm">
              <div className="flex items-center justify-between text-xs text-[#BDDDFC]">
                <span>Subtotal ({cartItems.length} items): ₹{netSubtotal.toFixed(2)}</span>
                <button
                  type="button"
                  onClick={() => setIsCouponModalOpen(true)}
                  className="text-[11px] font-bold text-[#88BDF2] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Tag className="w-3 h-3" /> {currentCart.couponCode ? `Code: ${currentCart.couponCode}` : 'Promo [F8]'}
                </button>
              </div>

              {taxAmount > 0 && (
                <div className="flex items-center justify-between text-[11px] text-[#BDDDFC]/80">
                  <span>Taxable Base: ₹{taxableSubtotal.toFixed(2)}</span>
                  <span className="font-mono text-[#88BDF2] font-semibold">Incl. GST: ₹{taxAmount.toFixed(2)}</span>
                </div>
              )}

              {couponDiscount > 0 && (
                <div className="flex justify-between text-[#88BDF2] text-xs font-bold">
                  <span>Coupon Discount:</span>
                  <span>-₹{couponDiscount.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-white/15 flex justify-between items-baseline">
                <span className="text-xs font-bold text-[#BDDDFC] uppercase tracking-wider">Net Total:</span>
                <span className="text-2xl font-black text-[#88BDF2] font-heading">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector Grid */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Payment Mode
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                {[
                  { id: 'CASH', label: 'Cash', icon: Banknote },
                  { id: 'UPI', label: 'UPI / QR', icon: QrCode },
                  { id: 'CARD', label: 'Card', icon: CreditCard },
                  { id: 'KHATA', label: 'Khata', icon: Receipt },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = paymentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPaymentMethod(item.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#384959] text-white border-[#384959] shadow-2xs font-extrabold'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[11px]">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Tendered & Denominations Area (When CASH Mode is Selected) */}
            {paymentMethod === 'CASH' && (
              <div className="p-3 bg-[#BDDDFC]/15 dark:bg-slate-800/80 rounded-xl border border-[#88BDF2]/40 space-y-2.5 shadow-2xs">
                {/* Cash Input & Exact / Denomination Buttons */}
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-2 text-sm font-black text-[#384959] dark:text-[#88BDF2]">₹</span>
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => handleCashTenderedInputChange(e.target.value)}
                      placeholder={`Amount (e.g. ${Math.ceil(grandTotal)})`}
                      className="w-full pl-6 pr-2 py-1.5 text-sm font-black bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 focus:border-[#88BDF2] rounded-lg outline-hidden text-[#384959] dark:text-slate-100 font-mono"
                    />
                  </div>

                  {grandTotal > 0 && (
                    <button
                      type="button"
                      onClick={() => handleAutoSelectAndOpenNotes(grandTotal, false)}
                      className="px-2.5 py-2 bg-[#384959] hover:bg-[#2B3844] text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer shadow-2xs transition-colors"
                      title="Exact bill amount"
                    >
                      Exact (₹{Math.ceil(grandTotal)})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsDenominationModalOpen(true)}
                    className="px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[#384959] dark:text-[#88BDF2] hover:bg-slate-50 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-colors flex items-center gap-1"
                    title="Open Denomination Notes Counter"
                  >
                    <Calculator className="w-3.5 h-3.5" /> Notes
                  </button>

                  {cashTendered && (
                    <button
                      type="button"
                      onClick={handleClearNotes}
                      className="p-1.5 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                      title="Clear Cash Tendered"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Quick Currency Note & Coin Chips With Live Count Badges and Increment/Decrement */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                    <span className="font-bold">Customer Notes Received (ગ્રાહકે આપેલ નોટ પર ક્લિક કરો):</span>
                    {parseFloat(cashTendered) > 0 && (
                      <span className="font-mono font-bold text-[#384959] dark:text-[#88BDF2]">
                        {getDenominationBreakdownSummary(noteCounts)}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-5 sm:grid-cols-9 gap-1 text-center">
                    {[500, 200, 100, 50, 20, 10, 5, 2, 1].map((amt) => {
                      const count = noteCounts[amt] || 0;
                      const hasCount = count > 0;
                      return (
                        <div
                          key={amt}
                          onClick={() => handleAddNoteQuick(amt)}
                          className={`py-1 px-1 rounded-lg text-[11px] font-extrabold border transition-all cursor-pointer relative flex flex-col items-center justify-center select-none ${
                            hasCount
                              ? 'bg-[#384959] text-white border-[#384959] shadow-2xs ring-2 ring-[#88BDF2]/60'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-[#384959] dark:text-slate-200 hover:border-[#88BDF2]'
                          }`}
                          title={`Click to add +1 note/coin of ₹${amt}`}
                        >
                          {hasCount && (
                            <span className="absolute -top-1.5 -right-1 bg-[#88BDF2] text-[#384959] text-[9px] font-black px-1 rounded-full shadow-2xs">
                              {count}×
                            </span>
                          )}
                          <span>₹{amt}</span>
                          {hasCount && (
                            <button
                              type="button"
                              onClick={(e) => handleRemoveNoteQuick(amt, e)}
                              className="mt-0.5 text-[8px] bg-white/20 hover:bg-rose-500 hover:text-white px-1 rounded text-slate-200 cursor-pointer"
                              title="Remove 1 note"
                            >
                              −1
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Return Change Banner & Change Notes Selector Prompt */}
                {changeToReturn > 0 && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-300 dark:border-amber-700/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-600" />
                        Change Due: <strong className="font-mono text-sm font-black text-amber-800 dark:text-amber-300 ml-1">₹{changeToReturn.toFixed(2)}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsChangeNoteModalOpen(true)}
                        className="px-2 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded-md text-[10px] font-bold cursor-pointer transition-colors"
                        title="Customize change notes handed over"
                      >
                        Change Notes ({getDenominationBreakdownSummary(changeNotes)}) ✎
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* UPI Dynamic QR Preview */}
            {paymentMethod === 'UPI' && (
              <div className="p-2.5 bg-[#BDDDFC]/20 border border-[#88BDF2]/40 rounded-xl flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-[#384959]">Scan & Pay via any UPI App</h5>
                  <p className="text-[10px] text-slate-500">GPay, PhonePe, Paytm</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUpiModalOpen(true)}
                  className="px-2.5 py-1 bg-[#384959] text-white text-xs font-bold rounded-lg hover:bg-[#2B3844] cursor-pointer flex items-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" /> Show QR
                </button>
              </div>
            )}

            {/* Complete & Print Checkout Button - High Contrast & High Visibility */}
            <Button
              variant="primary"
              size="lg"
              onClick={handleCompleteCheckout}
              loading={submittingOrder}
              disabled={cartItems.length === 0}
              className={`w-full py-3.5 text-sm font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.99] ${
                cartItems.length === 0
                  ? 'bg-slate-200! dark:bg-slate-800! text-slate-500! dark:text-slate-400! border border-slate-300 dark:border-slate-700 cursor-not-allowed opacity-75'
                  : 'bg-linear-to-r from-[#384959] via-[#2B3844] to-[#1E293B] hover:from-[#2B3844] hover:to-[#0F172A] text-white! dark:text-white! border border-[#88BDF2]/40 shadow-lg cursor-pointer'
              }`}
            >
              <Printer className={`w-4 h-4 ${cartItems.length === 0 ? 'text-slate-400 dark:text-slate-500' : 'text-[#88BDF2]'}`} />
              <span className={cartItems.length === 0 ? 'text-slate-500! dark:text-slate-400! font-bold' : 'text-white! dark:text-white! font-extrabold'}>
                Complete & Print Bill ({grandTotal > 0 ? `₹${grandTotal.toFixed(2)}` : 'Cart Empty'}) [Enter]
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* UPI QR Modal */}
      <Modal
        isOpen={isUpiModalOpen}
        onClose={() => setIsUpiModalOpen(false)}
        title="Dynamic UPI QR Payment"
        subtitle={`Scan with any UPI app to pay ₹${grandTotal.toFixed(2)}`}
        maxWidth="max-w-sm"
      >
        <div className="text-center space-y-4 py-3">
          <div className="w-48 h-48 mx-auto bg-white p-3 border-2 border-slate-800 rounded-2xl shadow-md flex items-center justify-center">
            {/* Dynamic QR Code generator using standard QR API */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=upi://pay?pa=tulsimart@upi%26pn=Tulsi%20Mart%26am=${grandTotal.toFixed(2)}%26cu=INR`}
              alt="UPI QR Code"
              className="w-full h-full object-contain"
            />
          </div>
          <p className="text-xs text-slate-600 font-medium">
            UPI ID: <strong className="text-[#384959] font-mono">tulsimart@upi</strong>
          </p>
          <Button variant="primary" size="md" onClick={() => setIsUpiModalOpen(false)} className="w-full">
            Payment Confirmed →
          </Button>
        </div>
      </Modal>

      {/* Coupon Selection Modal */}
      <Modal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        title="Available Offers & Coupons"
        subtitle="Select a discount promo code to apply to current order"
        maxWidth="max-w-md"
      >
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="Enter coupon code (e.g. WELCOME100)"
              className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono uppercase font-bold text-[#384959]"
            />
            <Button variant="primary" size="sm" onClick={() => handleApplyCoupon(couponInput)}>
              Apply
            </Button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar touch-pan pt-2">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2"
              >
                <div>
                  <span className="font-extrabold text-xs text-[#384959] font-mono bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {c.code}
                  </span>
                  <p className="text-[11px] text-slate-600 mt-1">{c.description || `${c.discount_value}${c.discount_type === 'PERCENT' ? '%' : '₹'} Discount`}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleApplyCoupon(c.code)}>
                  Use Code
                </Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>

      {/* New Customer Quick Registration Modal */}
      <Modal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        title="Register New Customer"
        subtitle="Create account for loyalty points and order history"
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="md" onClick={() => setIsNewCustomerModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleCreateCustomer} loading={savingCustomer}>
              Create & Attach
            </Button>
          </div>
        }
      >
        <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
          <div>
            <label className="block font-bold text-[#384959] uppercase tracking-wider mb-1">Customer Full Name *</label>
            <input
              type="text"
              required
              value={newCustomerData.name}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, name: e.target.value })}
              placeholder="e.g. Ramesh Patel"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#88BDF2]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#384959] uppercase tracking-wider mb-1">Mobile Phone Number *</label>
            <input
              type="tel"
              required
              value={newCustomerData.phone}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, phone: e.target.value })}
              placeholder="+91 98XXX XXXXX"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl font-mono outline-hidden focus:border-[#88BDF2]"
            />
          </div>

          <div>
            <label className="block font-bold text-[#384959] uppercase tracking-wider mb-1">Delivery Address</label>
            <textarea
              rows={2}
              value={newCustomerData.address}
              onChange={(e) => setNewCustomerData({ ...newCustomerData, address: e.target.value })}
              placeholder="House/Flat number, building, landmark"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:border-[#88BDF2]"
            />
          </div>
        </form>
      </Modal>

      {/* Gulla Cash Operation Modal */}
      <Modal
        isOpen={isGullaModalOpen}
        onClose={() => setIsGullaModalOpen(false)}
        title="Gulla Cash Register Operation"
        subtitle="Manage cash flow, supplier payments, khata receipts, or store expenses"
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="md" onClick={() => setIsGullaModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={handleSubmitGullaAction} loading={submittingGulla}>
              Confirm & Save
            </Button>
          </div>
        }
      >
        <form onSubmit={handleSubmitGullaAction} className="space-y-4 text-xs">
          {/* Action Type Tabs */}
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1.5">
              Select Operation Type
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 font-bold">
              {[
                { id: 'CASH_IN', label: '+ Add Cash' },
                { id: 'CASH_OUT', label: '− Cash Out' },
                { id: 'SUPPLIER_PAYMENT', label: 'Pay Supplier' },
                { id: 'KHATA_PAYMENT', label: 'Khata Receipt' },
                { id: 'EXPENSE', label: 'Store Expense' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setGullaForm({ ...gullaForm, actionType: tab.id })}
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer text-[11px] ${
                    gullaForm.actionType === tab.id
                      ? 'bg-[#384959] dark:bg-[#88BDF2] text-white dark:text-[#384959] border-[#384959] dark:border-[#88BDF2] shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Fields: Supplier Selector */}
          {gullaForm.actionType === 'SUPPLIER_PAYMENT' && (
            <div>
              <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                Select Supplier *
              </label>
              <select
                required
                value={gullaForm.supplier_id}
                onChange={(e) => setGullaForm({ ...gullaForm, supplier_id: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100 font-medium"
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.company_name || s.phone})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Conditional Fields: Customer Selector */}
          {gullaForm.actionType === 'KHATA_PAYMENT' && (
            <div>
              <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                Select Customer (Khata Due) *
              </label>
              <select
                required
                value={gullaForm.customer_id}
                onChange={(e) => {
                  const custId = e.target.value;
                  const selectedCust = customers.find(c => String(c.id) === String(custId));
                  setGullaForm({
                    ...gullaForm,
                    customer_id: custId,
                    amount: selectedCust?.pending_payments ? String(selectedCust.pending_payments) : gullaForm.amount
                  });
                }}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100 font-medium"
              >
                <option value="">-- Choose Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.pending_payments > 0 ? `(Khata Due: ₹${c.pending_payments})` : `(${c.phone})`}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Conditional Fields: Expense Title & Category */}
          {gullaForm.actionType === 'EXPENSE' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  value={gullaForm.expense_title}
                  onChange={(e) => setGullaForm({ ...gullaForm, expense_title: e.target.value })}
                  placeholder="e.g. Daily Tea & Refreshment"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={gullaForm.expense_category_id}
                  onChange={(e) => setGullaForm({ ...gullaForm, expense_category_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100"
                >
                  <option value="">-- Select Category --</option>
                  {expenseCategories.map((ec) => (
                    <option key={ec.id} value={ec.id}>
                      {ec.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Amount (₹) Input & Quick Denomination Chips */}
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
              Amount (₹) *
            </label>
            <input
              type="number"
              step="0.01"
              required
              min="1"
              value={gullaForm.amount}
              onChange={(e) => setGullaForm({ ...gullaForm, amount: e.target.value })}
              placeholder="0.00"
              className="w-full px-3 py-2.5 text-base font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100"
            />
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {[500, 200, 100, 50, 20, 10, 5, 2, 1, 1000, 2000, 5000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setGullaForm({ ...gullaForm, amount: String(amt) })}
                  className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-[#384959] dark:text-slate-200 cursor-pointer"
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Notes / Reason / Remarks */}
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider mb-1">
              Notes / Reason / Remarks
            </label>
            <input
              type="text"
              value={gullaForm.notes}
              onChange={(e) => setGullaForm({ ...gullaForm, notes: e.target.value })}
              placeholder="e.g. Opening float / Owner withdrawal / Milk supplier invoice #44"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-hidden focus:border-[#88BDF2] text-[#384959] dark:text-slate-100"
            />
          </div>
        </form>
      </Modal>

      {/* Gulla Today's Activity Log Modal with Tabbed Views */}
      <Modal
        isOpen={isGullaHistoryOpen}
        onClose={() => setIsGullaHistoryOpen(false)}
        title="Today's Gulla Timeline & Cash Ledger (આજના ગલ્લાની વિગત)"
        subtitle={`Summary for ${gullaData.today_date} • Live Cash in Drawer: ₹${gullaData.net_cash_in_gulla?.toFixed(2)}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-4">
          {/* Top Quick Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Cash In</span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                +₹{gullaData.total_cash_in?.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Total Cash Out</span>
              <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                -₹{gullaData.total_cash_out?.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Cash Tendered (Gross)</span>
              <span className="text-sm font-black text-[#384959] dark:text-[#88BDF2]">
                ₹{(gullaData.cash_tender_summary?.total_tendered || 0).toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Current Gulla</span>
              <span className="text-sm font-black text-emerald-700 dark:text-emerald-300 font-heading">
                ₹{gullaData.net_cash_in_gulla?.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-2">
            {[
              { id: 'ALL', label: 'All Gulla Flow', count: (gullaData.recent_entries?.length || 0) + (gullaData.cash_tender_logs?.length || 0) },
              { id: 'CASH_TENDER', label: 'Customer Cash Tendered', count: gullaData.cash_tender_logs?.length || 0, icon: Banknote },
              { id: 'MANUAL', label: 'Manual Entries', count: gullaData.recent_entries?.length || 0 }
            ].map((tab) => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setGullaHistoryTab(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    gullaHistoryTab === tab.id
                      ? 'bg-[#384959] dark:bg-[#88BDF2] text-white dark:text-[#384959] shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {TabIcon && <TabIcon className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                    gullaHistoryTab === tab.id
                      ? 'bg-white/20 text-white dark:bg-slate-900/40 dark:text-[#384959]'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tab 1: ALL Combined Activity or Tab 3: MANUAL Entries */}
          {(gullaHistoryTab === 'ALL' || gullaHistoryTab === 'MANUAL') && (
            <div className="space-y-2">
              {gullaHistoryTab === 'ALL' && (
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                  <span>Manual Drawer Operations & Payouts</span>
                  <span className="text-[10px] text-slate-400">Total: {gullaData.recent_entries?.length || 0} entries</span>
                </div>
              )}

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 space-y-1 pr-1">
                {(!gullaData.recent_entries || gullaData.recent_entries.length === 0) ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No manual drawer operations recorded yet today.
                  </div>
                ) : (
                  gullaData.recent_entries.map((entry) => {
                    const isOut = ['CASH_OUT', 'SUPPLIER_PAYMENT', 'EXPENSE'].includes(entry.entry_type);
                    return (
                      <div key={entry.id} className="py-2.5 px-2 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-800/60 flex items-center justify-between text-xs gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isOut
                                ? 'bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400'
                                : 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                            }`}>
                              {entry.entry_type_label || entry.entry_type}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {entry.notes && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                              {entry.notes}
                            </p>
                          )}
                        </div>

                        <div className="text-right shrink-0">
                          <span className={`text-xs font-black ${
                            isOut ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                          }`}>
                            {isOut ? '-' : '+'}₹{parseFloat(entry.amount).toFixed(2)}
                          </span>
                          {entry.user_name && (
                            <span className="text-[9px] text-slate-400 block">
                              by {entry.user_name}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Tab 2: CASH TENDER LOG (or displayed inside ALL) */}
          {(gullaHistoryTab === 'CASH_TENDER' || gullaHistoryTab === 'ALL') && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400 px-1">
                <span className="flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-600" /> Customer Cash Tendered & Change History
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsGullaHistoryOpen(false);
                    setIsCashTenderModalOpen(true);
                  }}
                  className="text-[11px] text-[#88BDF2] hover:underline cursor-pointer font-bold"
                >
                  Expand Full Log →
                </button>
              </div>

              {/* Cash Tendered Sub-Table */}
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 space-y-1 pr-1">
                {(!gullaData.cash_tender_logs || gullaData.cash_tender_logs.length === 0) ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    No cash sales completed yet today.
                  </div>
                ) : (
                  gullaData.cash_tender_logs.map((log) => (
                    <div key={log.id} className="py-2.5 px-2 rounded-xl hover:bg-slate-50/80 dark:hover:bg-slate-800/60 flex items-center justify-between text-xs gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#384959] dark:text-slate-200 font-mono">
                            {log.order_number}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {log.time_str}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                          <strong>{log.customer_name}</strong> {log.customer_phone ? `(${log.customer_phone})` : ''} • Cashier: {log.cashier_name}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-right shrink-0">
                        <div>
                          <div className="text-xs font-black text-[#384959] dark:text-slate-100">
                            Bill: ₹{log.total_amount?.toFixed(2)}
                          </div>
                          <div className="flex items-center justify-end gap-1 mt-0.5 text-[10px]">
                            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                              Tendered: ₹{log.cash_tendered?.toFixed(2)}
                            </span>
                            {log.change_returned > 0 && (
                              <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.5 rounded font-bold">
                                Change: ₹{log.change_returned?.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            ordersApi.getOrder(log.id).then((res) => {
                              setLastCreatedOrder(res.data);
                              setIsInvoiceModalOpen(true);
                            }).catch(() => {
                              setLastCreatedOrder(log);
                              setIsInvoiceModalOpen(true);
                            });
                          }}
                          className="p-1.5 text-slate-400 hover:text-[#384959] dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                          title="View Invoice"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 💵 Customer Cash Tendered Notes Breakdown Calculator Modal */}
      <Modal
        isOpen={isDenominationModalOpen}
        onClose={() => setIsDenominationModalOpen(false)}
        title="Customer Cash Notes Counter (ગ્રાહકે આપેલ રોકડ નોટો)"
        subtitle={`Select physical notes received from customer for Bill Total: ₹${grandTotal.toFixed(2)}`}
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAutoSelectAndOpenNotes(grandTotal, false)}
            >
              Exact Bill Breakdown
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsDenominationModalOpen(false)}
              className="bg-[#384959] hover:bg-[#2B3844] text-white"
            >
              Done (Received ₹{calculateDenominationTotal(noteCounts).toFixed(2)})
            </Button>
          </div>
        }
      >
        <div className="space-y-4 font-sans">
          {/* Smart Suggestion Chips */}
          {getSmartTenderSuggestions(grandTotal).length > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                Quick Smart Suggestions
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {getSmartTenderSuggestions(grandTotal).map((sugg) => (
                  <button
                    key={sugg.amount}
                    type="button"
                    onClick={() => handleSelectSmartSuggestion(sugg, false)}
                    className="px-2.5 py-1.5 bg-white dark:bg-slate-900 hover:bg-[#BDDDFC]/20 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-bold text-[#384959] dark:text-[#88BDF2] cursor-pointer flex items-center gap-1"
                  >
                    <span>{sugg.label}</span>
                    <span className="text-[10px] text-slate-400 font-normal">({sugg.breakdownSummary})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tender Summary Card */}
          <div className="p-3.5 bg-[#BDDDFC]/20 dark:bg-slate-800 rounded-2xl border-2 border-[#88BDF2]/60 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-[#384959] dark:text-[#88BDF2] uppercase tracking-wider block">
                Bill Net Amount
              </span>
              <span className="text-2xl font-black text-[#384959] dark:text-slate-100 font-heading">
                ₹{grandTotal.toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Cash Tendered Total
              </span>
              <span className="text-xl font-black text-[#384959] dark:text-[#88BDF2] font-heading">
                ₹{calculateDenominationTotal(noteCounts).toFixed(2)}
              </span>
              {calculateDenominationTotal(noteCounts) > grandTotal && (
                <span className="text-[10px] block font-bold text-amber-700 dark:text-amber-400 mt-0.5">
                  Change: ₹{(calculateDenominationTotal(noteCounts) - grandTotal).toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Denomination Counter for Tender */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto pr-1">
            {[500, 200, 100, 50, 20, 10, 5, 2, 1].map((amt) => {
              const count = noteCounts[amt] || 0;
              const lineTotal = amt * count;
              const isNote = amt >= 10;
              return (
                <div key={amt} className="py-2 flex items-center justify-between text-xs gap-2">
                  <div className="flex items-center gap-2 w-24">
                    <span className={`px-2 py-1 rounded-lg text-xs font-black font-heading ${
                      isNote
                        ? 'bg-[#BDDDFC]/30 dark:bg-[#384959] text-[#384959] dark:text-[#88BDF2] border border-[#88BDF2]/40'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}>
                      ₹{amt}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {isNote ? 'Note' : 'Coin'}
                    </span>
                  </div>

                  {/* Stepper & Direct Count Input */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleNoteCountChange(amt, count - 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center cursor-pointer"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={count === 0 ? '' : count}
                      onChange={(e) => handleNoteCountChange(amt, e.target.value)}
                      placeholder="0"
                      className="w-14 text-center py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm text-[#384959] dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleNoteCountChange(amt, count + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center cursor-pointer"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddNoteQuick(amt)}
                      className="px-1.5 py-1 text-[10px] font-bold text-[#384959] dark:text-[#88BDF2] bg-[#BDDDFC]/20 hover:bg-[#BDDDFC]/40 rounded-md border border-[#88BDF2]/40 cursor-pointer"
                      title={`Add 1 note of ₹${amt}`}
                    >
                      +1
                    </button>
                  </div>

                  <div className="w-20 text-right font-black text-[#384959] dark:text-slate-100 font-mono">
                    ₹{lineTotal.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* 💰 Dedicated Change Notes Hand-over Modal */}
      <Modal
        isOpen={isChangeNoteModalOpen}
        onClose={() => setIsChangeNoteModalOpen(false)}
        title="Select Change Notes to Return (ગ્રાહકને આપવાના છૂટા પૈસા)"
        subtitle={`Select which physical currency notes/coins to return for Change: ₹${changeToReturn.toFixed(2)}`}
        maxWidth="max-w-lg"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="outline" size="sm" onClick={handleResetChangeNotes}>
              Auto Calculate Best
            </Button>
            <Button variant="primary" size="md" onClick={() => setIsChangeNoteModalOpen(false)} className="bg-[#384959] hover:bg-[#2B3844] text-white">
              Done (Change ₹{calculateDenominationTotal(changeNotes).toFixed(2)})
            </Button>
          </div>
        }
      >
        <div className="space-y-4 font-sans">
          {/* Change Summary Card */}
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border-2 border-amber-300 dark:border-amber-700/80 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block">
                Required Change to Return
              </span>
              <span className="text-2xl font-black text-amber-900 dark:text-amber-200 font-heading">
                ₹{changeToReturn.toFixed(2)}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Selected Change Notes Total
              </span>
              <span className={`text-base font-black font-heading ${
                calculateDenominationTotal(changeNotes) === changeToReturn
                  ? 'text-[#384959] dark:text-[#88BDF2]'
                  : 'text-rose-600 dark:text-rose-400'
              }`}>
                ₹{calculateDenominationTotal(changeNotes).toFixed(2)}
              </span>
              <span className="text-[10px] block font-bold mt-0.5">
                {calculateDenominationTotal(changeNotes) === changeToReturn ? (
                  <span className="text-[#384959] dark:text-[#88BDF2]">✓ Exact Match</span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400">
                    Diff: ₹{Math.abs(calculateDenominationTotal(changeNotes) - changeToReturn).toFixed(2)}
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Denomination Counter for Change */}
          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto pr-1">
            {[500, 200, 100, 50, 20, 10, 5, 2, 1].map((amt) => {
              const count = changeNotes[amt] || 0;
              const lineTotal = amt * count;
              const isNote = amt >= 10;
              const avail = gullaDrawerNotes[amt] !== undefined ? gullaDrawerNotes[amt] : (gullaDrawerNotes[String(amt)] || 0);
              const isZero = avail <= 0;

              // Compute remaining change needed excluding this denomination's count
              const currentOtherTotal = Object.entries(changeNotes).reduce((sum, [dStr, cnt]) => {
                return Number(dStr) === Number(amt) ? sum : sum + (Number(dStr) * (Number(cnt) || 0));
              }, 0);
              const remainingNeeded = Math.max(0, changeToReturn - currentOtherTotal);
              const isExceeding = amt > remainingNeeded;

              return (
                <div key={amt} className={`py-2 flex items-center justify-between text-xs gap-2 p-1.5 rounded-xl transition-all ${
                  isZero
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/60'
                    : isExceeding
                    ? 'bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800'
                    : ''
                }`}>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-black font-heading ${
                      isZero
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                        : isNote
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                    }`}>
                      ₹{amt}
                    </span>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">
                        {isNote ? 'Note' : 'Coin'}
                      </span>
                      {isZero ? (
                        <span className="text-[10px] font-mono font-bold text-rose-600 dark:text-rose-400 block">
                          ⚠️ Out of Stock (નોટ નથી)
                        </span>
                      ) : isExceeding ? (
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block">
                          ⛔ નોટ ₹{amt} બાકી ચેન્જ (₹{remainingNeeded.toFixed(0)}) થી મોટી છે
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 block">
                          In Gulla: {avail} {isNote ? 'notes' : 'coins'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Stepper & Direct Count Input */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={count <= 0}
                      onClick={() => handleChangeNoteCountChange(amt, count - 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="0"
                      value={count === 0 ? '' : count}
                      onChange={(e) => handleChangeNoteCountChange(amt, e.target.value)}
                      placeholder="0"
                      className="w-14 text-center py-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-sm text-[#384959] dark:text-slate-100"
                    />
                    <button
                      type="button"
                      disabled={isZero || isExceeding}
                      onClick={() => handleChangeNoteCountChange(amt, count + 1)}
                      className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title={isExceeding ? `Note ₹${amt} exceeds remaining change ₹${remainingNeeded.toFixed(2)}` : ''}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      disabled={isZero || isExceeding}
                      onClick={() => handleChangeNoteQuickAdd(amt)}
                      className={`px-1.5 py-1 text-[10px] font-bold rounded-md border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        isZero
                          ? 'text-rose-700 bg-rose-100 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800'
                          : 'text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 border-amber-200 dark:border-amber-800'
                      }`}
                      title={isExceeding ? `Note ₹${amt} exceeds remaining change ₹${remainingNeeded.toFixed(2)}` : `Add 1 note of ₹${amt}`}
                    >
                      +1
                    </button>
                  </div>

                  <div className="w-20 text-right font-black text-[#384959] dark:text-slate-100 font-mono">
                    ₹{lineTotal.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>

      {/* ⚠️ Gulla Drawer Cash Alert Modal */}
      <GullaAlertModal
        isOpen={gullaAlertModal.isOpen}
        onClose={() => setGullaAlertModal((prev) => ({ ...prev, isOpen: false }))}
        title={gullaAlertModal.title}
        message={gullaAlertModal.message}
        denom={gullaAlertModal.denom}
        gullaDrawerNotes={gullaDrawerNotes}
        onAddCashIn={() => {
          setIsGullaModalOpen(true);
        }}
      />

      {/* Invoice Modal after Checkout */}
      {lastCreatedOrder && (
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          order={lastCreatedOrder}
          store={storeSettings}
        />
      )}

    </div>
  );
};

export default BillingPage;
