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
  ShoppingCart,
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
  Coins,
  ArrowLeft
} from 'lucide-react';
import { inventoryApi, customersApi, ordersApi, offersApi, gullaApi, suppliersApi, expensesApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { getUnitConversionRatio } from '../../utils/unitConversion';
import { extractList, formatUnit, formatCategory, formatCustomer, formatSupplier } from '../../utils/apiHelpers';

// Helper to detect loose weight or volume units
const isWeightOrVolumeUnit = (unit) => {
  if (!unit) return false;
  const u = String(unit).toLowerCase().trim();
  return ['kg', 'g', 'mg', 'l', 'ml', 'q', 't'].includes(u);
};

// Calculate exact numerical quantity for preset weight labels (100g, 200g, 250g, 500g, 1kg, 200mg)
const getQtyForPresetWeight = (presetLabel, baseUnit) => {
  const unit = (baseUnit || 'kg').toLowerCase().trim();

  if (unit === 'kg' || unit === 'l') {
    switch (presetLabel) {
      case '200mg': return 0.0002;
      case '100g': return 0.1;
      case '200g': return 0.2;
      case '250g': return 0.25;
      case '500g': return 0.5;
      case '1kg': return 1.0;
      default: return 1.0;
    }
  } else if (unit === 'g' || unit === 'ml') {
    switch (presetLabel) {
      case '200mg': return 0.2;
      case '100g': return 100;
      case '200g': return 200;
      case '250g': return 250;
      case '500g': return 500;
      case '1kg': return 1000;
      default: return 1;
    }
  } else if (unit === 'mg') {
    switch (presetLabel) {
      case '200mg': return 200;
      case '100g': return 100000;
      case '200g': return 200000;
      case '250g': return 250000;
      case '500g': return 500000;
      case '1kg': return 1000000;
      default: return 1;
    }
  }
  return 1.0;
};





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
  const [allCatalogProducts, setAllCatalogProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const filterCatalogLocally = (searchVal, catName, masterList) => {
    let source = masterList || allCatalogProducts;
    if (!source || source.length === 0) return [];

    if (catName && catName !== 'ALL') {
      const catLower = catName.toLowerCase();
      source = source.filter(p => {
        const cName = (p.category?.name || p.category_name || p.category || '').toString().toLowerCase();
        return cName === catLower;
      });
    }

    if (searchVal && searchVal.trim()) {
      const q = searchVal.trim().toLowerCase();
      source = source.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.sku && p.sku.toLowerCase().includes(q)) ||
        (p.barcode && p.barcode.toLowerCase().includes(q)) ||
        (p.product_code && p.product_code.toLowerCase().includes(q))
      );
    }
    return source;
  };

  // Mobile view switcher state ('catalog' | 'cart')
  const [mobileTab, setMobileTab] = useState('catalog');

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
        inventoryApi.getProducts({ page_size: 1000 }),
        inventoryApi.getCategories(),
        customersApi.getCustomers({ page_size: 100 }),
        offersApi.getCoupons(),
        gullaApi.getGullaSummary(),
        suppliersApi.getSuppliers(),
        expensesApi.getCategories()
      ]);

      if (prodRes.status === 'fulfilled') {
        const catalogList = extractList(prodRes.value);
        setAllCatalogProducts(catalogList);
        setProducts(catalogList);
      }
      if (catRes.status === 'fulfilled') setCategories(extractList(catRes.value));
      if (custRes.status === 'fulfilled') setCustomers(extractList(custRes.value));
      if (coupRes.status === 'fulfilled') setCoupons(extractList(coupRes.value));
      if (gullaRes.status === 'fulfilled') {
        const gBody = gullaRes.value.data?.data || gullaRes.value.data;
        setGullaData(gBody);
        const netNotes = gBody?.notes_and_coins_summary?.net_drawer_notes || {};
        const formatted = {};
        [500, 200, 100, 50, 20, 10, 5, 2, 1].forEach((d) => {
          formatted[d] = Math.max(0, parseInt(netNotes[d] || netNotes[String(d)] || 0, 10));
        });
        setGullaDrawerNotes(formatted);
      }
      if (suppRes.status === 'fulfilled') setSuppliers(extractList(suppRes.value));
      if (expCatRes.status === 'fulfilled') setExpenseCategories(extractList(expCatRes.value));

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
      await Promise.allSettled([
        loadGullaSummary(),
        (async () => {
          const r = await customersApi.getCustomers({ page_size: 100 });
          setCustomers(extractList(r));
        })(),
        (async () => {
          const r = await suppliersApi.getSuppliers();
          setSuppliers(extractList(r));
        })()
      ]);
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

  // Debounced Product Search & Category Selection for Make Bill POS
  const searchTimeoutRef = useRef(null);

  const handleSearchInputChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    // Instant local memory filtering for ultra-fast POS search (0ms UI lag)
    if (allCatalogProducts.length > 0) {
      setProducts(filterCatalogLocally(val, selectedCategory, allCatalogProducts));
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const params = { page_size: 1000 };
        if (val.trim()) params.search = val.trim();
        if (selectedCategory && selectedCategory !== 'ALL') params.category = selectedCategory;

        const res = await inventoryApi.getProducts(params);
        const fetched = extractList(res);
        if (fetched && fetched.length > 0) {
          setProducts(fetched);
        }
      } catch (err) {
        console.error('Failed to search billing products', err);
      }
    }, 300);
  };

  const handleSelectCategory = async (catName) => {
    setSelectedCategory(catName);

    // Instant local memory filtering for ultra-fast category switching (0ms UI lag)
    if (allCatalogProducts.length > 0) {
      setProducts(filterCatalogLocally(searchQuery, catName, allCatalogProducts));
    }

    try {
      const params = { page_size: 1000 };
      if (catName !== 'ALL') params.category = catName;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await inventoryApi.getProducts(params);
      const fetched = extractList(res);
      if (fetched && fetched.length > 0) {
        setProducts(fetched);
      }
    } catch (err) {
      console.error('Failed to filter by category', err);
    }
  };

  // Barcode Submission Handler (Fast B-Tree Indexed Lookup)
  const handleBarcodeSubmit = async (e) => {
    e.preventDefault();
    const query = barcodeInput.trim();
    if (!query) return;

    // 1. Instant check in currently loaded products state
    const safeProds = extractList(products);
    let matchedProduct = safeProds.find(
      (p) => (p.barcode && p.barcode.toLowerCase() === query.toLowerCase()) || 
             (p.sku && p.sku.toLowerCase() === query.toLowerCase())
    );

    // 2. If not found in loaded 30 products, perform fast exact indexed backend lookup
    if (!matchedProduct) {
      try {
        const res = await inventoryApi.getProducts({ barcode: query, page_size: 1 });
        const items = extractList(res);

        if (items.length > 0) {
          matchedProduct = items[0];
        } else {
          // Fallback to SKU lookup
          const skuRes = await inventoryApi.getProducts({ sku: query, page_size: 1 });
          const skuItems = extractList(skuRes);
          if (skuItems.length > 0) {
            matchedProduct = skuItems[0];
          }
        }
      } catch (err) {
        console.error('Barcode lookup error:', err);
      }
    }

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

    const prodUnit = product.unit || product.product_unit;
    const sellUnit = product.selling_unit || product.unit;
    const ratio = getUnitConversionRatio(prodUnit, sellUnit);

    const baseSellingPrice = parseFloat(product.selling_price || product.price || 0);
    const baseMrp = parseFloat(product.mrp || product.selling_price || product.price || 0);

    const unitPricePerSellingUnit = ratio > 0 ? (baseSellingPrice / ratio) : baseSellingPrice;
    const mrpPerSellingUnit = ratio > 0 ? (baseMrp / ratio) : baseMrp;

    const initialQty = (ratio >= 1000) ? 1000 : 1;

    if (existingIndex > -1) {
      const currentQty = targetCart.items[existingIndex].quantity;
      const step = (ratio >= 1000) ? 100 : 1;
      targetCart.items[existingIndex].quantity += step;
    } else {
      targetCart.items.push({
        product,
        quantity: initialQty,
        unitPrice: unitPricePerSellingUnit,
        mrp: mrpPerSellingUnit,
        gstPercent: parseFloat(
          product.selling_gst_percent !== undefined && product.selling_gst_percent !== null
            ? product.selling_gst_percent
            : (product.gst_percent !== undefined && product.gst_percent !== null
                ? product.gst_percent
                : (product.tax_percentage || 0))
        ),
        sellingUnitShort: sellUnit ? (typeof sellUnit === 'object' ? sellUnit.short_name : (product.selling_unit_name || 'pc')) : 'pc',
        productUnitShort: prodUnit ? (typeof prodUnit === 'object' ? prodUnit.short_name : (product.unit_name || 'pc')) : 'pc',
        ratio: ratio
      });
    }

    updatedCarts[activeCartIndex] = targetCart;
    setCarts(updatedCarts);
  };

  // Update Item Quantity (supports floating points e.g. 0.2, 0.0002 for loose items)
  const handleUpdateQuantity = (productId, newQty) => {
    const updatedCarts = [...carts];
    const targetCart = { ...updatedCarts[activeCartIndex] };
    const itemIndex = targetCart.items.findIndex((item) => item.product.id === productId);

    if (itemIndex > -1) {
      const item = targetCart.items[itemIndex];
      if (newQty === '' || newQty === undefined || newQty === null) {
        item.quantity = '';
      } else {
        const parsed = parseFloat(newQty);
        if (!isNaN(parsed) && parsed <= 0) {
          targetCart.items.splice(itemIndex, 1);
        } else {
          if (!isNaN(parsed) && item.product.stock_quantity > 0 && parsed > item.product.stock_quantity) {
            showToast(`Max available stock is ${item.product.stock_quantity}`, 'warning');
            return;
          }
          item.quantity = isNaN(parsed) ? newQty : parsed;
        }
      }
    }

    updatedCarts[activeCartIndex] = targetCart;
    setCarts(updatedCarts);
  };

  // Update Item Unit Price for Current Bill Only
  const handleUpdateUnitPrice = (productId, newPrice) => {
    const parsedPrice = parseFloat(newPrice);
    const updatedCarts = [...carts];
    const targetCart = { ...updatedCarts[activeCartIndex] };
    const item = targetCart.items.find((i) => i.product.id === productId);
    if (item) {
      item.unitPrice = newPrice === '' ? '' : (isNaN(parsedPrice) ? 0 : parsedPrice);
      item.customPrice = true;
    }
    updatedCarts[activeCartIndex] = targetCart;
    setCarts(updatedCarts);
  };

  // Update Item GST Percent
  const handleUpdateGstPercent = (productId, newGst) => {
    const parsedGst = parseFloat(newGst);
    const updatedCarts = [...carts];
    const targetCart = { ...updatedCarts[activeCartIndex] };
    const item = targetCart.items.find((i) => i.product.id === productId);
    if (item) {
      item.gstPercent = isNaN(parsedGst) ? 0 : parsedGst;
    }
    updatedCarts[activeCartIndex] = targetCart;
    setCarts(updatedCarts);
  };

  // Calculate quantity from target rupee amount (e.g. ₹180 of Kaju)
  const handleSetItemTargetAmount = (productId, targetAmount) => {
    const parsedAmt = parseFloat(targetAmount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) return;
    const updatedCarts = [...carts];
    const targetCart = { ...updatedCarts[activeCartIndex] };
    const item = targetCart.items.find((i) => i.product.id === productId);
    if (item && parseFloat(item.unitPrice) > 0) {
      const calculatedQty = parseFloat((parsedAmt / parseFloat(item.unitPrice)).toFixed(4));
      item.quantity = calculatedQty;
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

  // Remove Coupon / Promo Code
  const handleRemoveCoupon = () => {
    const updatedCarts = [...carts];
    updatedCarts[activeCartIndex] = {
      ...updatedCarts[activeCartIndex],
      discountAmount: 0,
      couponCode: ''
    };
    setCarts(updatedCarts);
    showToast('Promo code removed', 'info');
  };

  // Financial Calculations (Grocery retail prices are inclusive of GST)
  const grossTotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.mrp) || 0) * (parseFloat(item.quantity) || 0), 0);
  const netSubtotal = cartItems.reduce((acc, item) => acc + (parseFloat(item.unitPrice) || 0) * (parseFloat(item.quantity) || 0), 0);
  const totalMrpSavings = Math.max(0, grossTotal - netSubtotal);
  const couponDiscount = currentCart.discountAmount || 0;

  // Tax breakdown: Extracted from inclusive selling prices (Retail GST Standard)
  const taxAmount = cartItems.reduce((acc, item) => {
    const lineTotal = (parseFloat(item.unitPrice) || 0) * (parseFloat(item.quantity) || 0);
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
      showToast(`⚠️ Insufficient ₹${denom} notes in Gulla! (Available: 0). Please add cash via Cash In.`, 'error');
      setGullaAlertModal({
        isOpen: true,
        title: `⚠️ Gulla Alert: Insufficient ₹${denom} notes in Gulla`,
        message: `You do not have ₹${denom} notes in Gulla drawer (Available: 0). Please add notes via Opening Float or Cash In.`,
        denom: denom
      });
      return;
    }

    // Rule B: Available Count in Drawer Check
    if (sanitizedCount > avail) {
      showToast(`⚠️ Only ${avail} ₹${denom} notes in Gulla! (Selected: ${sanitizedCount}).`, 'error');
      setGullaAlertModal({
        isOpen: true,
        title: `⚠️ Gulla Alert: Insufficient ₹${denom} notes`,
        message: `You only have ${avail} ₹${denom} notes in Gulla drawer, but selected ${sanitizedCount}. Please add cash.`,
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
      showToast(`⚠️ Adding this ₹${denom} note exceeds remaining change ₹${changeToReturn.toFixed(2)}! (Needed: ₹${remainingAllowed.toFixed(2)})`, 'warning');
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
        showToast(`⚠️ Insufficient cash notes in Gulla (Short: ₹${res.remaining})`, 'error');
        setGullaAlertModal({
          isOpen: true,
          title: '⚠️ Gulla Live Drawer Cash Alert',
          message: `Not enough notes in Gulla to return ₹${changeToReturn} change! (Remaining amount: ₹${res.remaining}). Please add cash via Opening Float or Cash In.`,
          denom: res.missingNotes[0] || null
        });
      }
    } else {
      setChangeNotes({ 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, 2: 0, 1: 0 });
    }
  };

  // Filter Catalog
  const safeProducts = extractList(products);
  const filteredProducts = safeProducts.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.category_name === selectedCategory || p.category === selectedCategory;
    const matchesSearch =
      !searchQuery ||
      (p.name && p.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
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

    const tenderedVal = paymentMethod === 'CASH'
      ? (cashAmountNumber > 0 ? parseFloat(cashAmountNumber.toFixed(2)) : parseFloat(grandTotal.toFixed(2)))
      : null;
    const changeVal = paymentMethod === 'CASH'
      ? parseFloat(changeToReturn.toFixed(2))
      : 0;

    if (paymentMethod === 'CASH' && changeVal > 0) {
      for (const [denomStr, count] of Object.entries(changeNotes)) {
        const d = Number(denomStr);
        const c = Number(count) || 0;
        if (c > 0) {
          const avail = gullaDrawerNotes[d] !== undefined ? gullaDrawerNotes[d] : (gullaDrawerNotes[String(d)] || 0);
          if (avail < c) {
            setSubmittingOrder(false);
            showToast(`⚠️ Insufficient ₹${d} notes in Gulla! (Available: ${avail}, Needed: ${c}). Please add cash.`, 'error');
            setGullaAlertModal({
              isOpen: true,
              title: `⚠️ Gulla Drawer Cash Error`,
              message: `You do not have enough ₹${d} notes in Gulla! (Available: ${avail}, Needed: ${c}). Please add cash via Opening Float or choose different notes.`,
              denom: d
            });
            return;
          }
        }
      }
    }

    try {
      setSubmittingOrder(true);

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
        items: cartItems.map((item) => {
          const lineSubtotal = parseFloat((item.unitPrice * item.quantity).toFixed(2));
          return {
            product_id: item.product.id,
            product: item.product.id,
            product_name: item.product.name,
            sku: item.product.sku || '',
            quantity: item.quantity,
            unit_price: parseFloat(item.unitPrice.toFixed(2)),
            gst_percent: parseFloat(item.gstPercent.toFixed(2)),
            subtotal: lineSubtotal,
            total_price: lineSubtotal
          };
        })
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

      // Refresh live Gulla drawer balance & product stock numbers asynchronously
      await Promise.allSettled([
        loadGullaSummary(),
        (async () => {
          const r = await inventoryApi.getProducts({ page_size: 1000 });
          setProducts(extractList(r));
        })()
      ]);


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
                Make <span className="text-[#00695C] dark:text-[#4DB6AC]">Bill</span>
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-[#267B70] dark:text-slate-300 truncate mt-0.5">
                Quick Checkout & Digital Billing Terminal
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 🌟 Tulsi Mart POS Top Header Banner (Desktop Only) */}
      <div className="hidden lg:block -mx-8 -mt-8 mb-4 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-5 lg:px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-teal-300/20 dark:bg-teal-900/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Banner Grid Layout */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 relative z-10">
          {/* Left: Bill Icon & Title with Status Badge */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white p-2.5 sm:p-3 border border-[#004d40]/20 flex items-center justify-center shrink-0 shadow-md shadow-teal-900/10">
              <Receipt className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
                  Make <span className="text-[#00796b] dark:text-[#80cbc4]">Bill's</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Counter Active
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate mt-0.5">
                Quick Checkout & Digital Billing Terminal
              </p>
            </div>
          </div>

          {/* Center Graphic: Grocery Basket */}
          <div className="hidden xl:flex items-center justify-center shrink-0 -my-3">
            <img 
              src="/grocery_basket.png" 
              alt="Grocery Basket Illustration" 
              className="h-24 object-contain drop-shadow-md pointer-events-none opacity-90"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>

          {/* Right: 3 Quick Stat Cards (Current Bill, Total Amount, Current Time) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 shrink-0 w-full sm:w-auto">
            {/* Stat Card 1: Current Bill # */}
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border border-teal-100 dark:border-slate-700/80 rounded-2xl p-2.5 sm:px-3.5 sm:py-2.5 shadow-2xs flex items-center gap-2.5 transition-all">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-teal-100/80 dark:bg-teal-950/80 text-[#00796b] dark:text-[#80cbc4] flex items-center justify-center shrink-0">
                <Receipt className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block leading-none mb-1 whitespace-nowrap">
                  CURRENT BILL
                </span>
                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 font-heading leading-none block whitespace-nowrap">
                  #{activeCartIndex + 1}
                </span>
              </div>
            </div>

            {/* Stat Card 2: Total Amount */}
            <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border border-teal-100 dark:border-slate-700/80 rounded-2xl p-2.5 sm:px-3.5 sm:py-2.5 shadow-2xs flex items-center gap-2.5 transition-all">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-100/80 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block leading-none mb-1 whitespace-nowrap">
                  TOTAL AMOUNT
                </span>
                <span className="text-sm sm:text-base font-black text-[#00796b] dark:text-[#80cbc4] leading-none block whitespace-nowrap">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Stat Card 3: Current Time */}
            <div className="col-span-2 sm:col-span-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xs border border-amber-100 dark:border-slate-700/80 rounded-2xl p-2.5 sm:px-3.5 sm:py-2.5 shadow-2xs flex items-center gap-2.5 transition-all">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-100/80 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-400 uppercase tracking-wider block leading-none mb-1.5 whitespace-nowrap">
                  CURRENT TIME
                </span>
                <div className="flex items-center gap-1.5 whitespace-nowrap leading-none">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">
                    {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-400">
                    • {currentTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🏷️ Horizontal Category Filter Pills Bar - Full Width Edge-to-Edge */}
      <div className="-mx-3 sm:-mx-5 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2.5 bg-white dark:bg-slate-900 border-y border-slate-200 dark:border-slate-800 shadow-2xs flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar touch-pan flex-1">
          <button
            onClick={() => handleSelectCategory('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              selectedCategory === 'ALL'
                ? 'bg-[#00796b] text-white shadow-xs font-extrabold'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200/80 dark:border-slate-700'
            }`}
          >
            All Products ({products.length})
          </button>
          
          {[
            { id: 'Atta', name: '🌾 Atta, Rice & Dal' },
            { id: 'Oil', name: '🛢️ Oil, Ghee & Spices' },
            { id: 'Dairy', name: '🥛 Dairy, Milk & Bakery' },
            { id: 'Snacks', name: '🍪 Snacks & Biscuits' },
            { id: 'Beverages', name: '🥤 Beverages & Drinks' },
            { id: 'Household', name: '🧴 Household' }
          ].map((cat) => {
            const isActive = selectedCategory === cat.id || selectedCategory === cat.name;
            return (
              <button
                key={cat.id}
                onClick={() => handleSelectCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#00796b] text-white shadow-xs font-extrabold'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200/80 dark:border-slate-700'
                }`}
              >
                {cat.name}
              </button>
            );
          })}

          {categories.filter(c => !['Atta', 'Oil', 'Dairy', 'Snacks', 'Beverages', 'Household'].includes(c.name)).map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectCategory(c.name)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                selectedCategory === c.name
                  ? 'bg-[#00796b] text-white shadow-xs font-extrabold'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200/80 dark:border-slate-700'
              }`}
            >
              📦 {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile View Switcher (Only visible on screens < lg) */}
      <div className="flex lg:hidden items-center bg-white dark:bg-slate-800 p-1.5 rounded-2xl gap-1.5 border border-slate-200 dark:border-slate-700 shadow-2xs">
        <button
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'catalog'
              ? 'bg-[#00796b] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <Store className="w-3.5 h-3.5" />
          Catalog ({filteredProducts.length})
        </button>
        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'cart'
              ? 'bg-[#00796b] text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          Cart ({currentCart.items.length})
          {grandTotal > 0 && (
            <span className="bg-[#80cbc4] text-[#004d40] font-black text-[10px] px-2 py-0.5 rounded-full shadow-2xs">
              ₹{grandTotal.toFixed(0)}
            </span>
          )}
        </button>
      </div>

      {/* 🚀 Main 2-Column POS Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ================= LEFT COLUMN: CATALOG & BARCODE SCANNER (8 COLS) ================= */}
        <div className={`lg:col-span-8 space-y-3 ${mobileTab === 'catalog' ? 'block' : 'hidden lg:block'}`}>
          {/* Barcode Scanner & Search Hub Header */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5">
              {/* Left Barcode Scan Box with Green Button */}
              <form onSubmit={handleBarcodeSubmit} className="relative flex-1 w-full flex items-center">
                <div className="absolute left-3 text-slate-400 flex items-center pointer-events-none">
                  <Barcode className="w-4 h-4 text-[#00796b]" />
                </div>
                <input
                  ref={barcodeInputRef}
                  type="text"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  placeholder="Scan barcode or SKU (F2)..."
                  className="w-full pl-9 pr-20 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-[#00796b] rounded-xl text-xs font-semibold outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400"
                />
                <button
                  type="submit"
                  className="absolute right-1 px-3 py-1.5 bg-[#00796b] hover:bg-[#004d40] text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Scan
                </button>
              </form>

              {/* Middle Product Keyword Search Box */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInputChange}
                  placeholder="Search product name, brand..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-[#00796b] rounded-xl text-xs outline-hidden text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-medium"
                />
              </div>

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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[620px] overflow-y-auto custom-scrollbar touch-pan pr-1">
                {filteredProducts.map((product) => {
                  const isOutOfStock = product.stock_quantity <= 0;
                  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= (product.min_stock_alert || 5);
                  const price = parseFloat(product.selling_price || product.price || 0);
                  const mrp = parseFloat(product.mrp || price);
                  const hasDiscount = mrp > price;

                  return (
                    <div
                      key={product.id}
                      onClick={() => !isOutOfStock && handleAddToCart(product)}
                      className={`p-3 rounded-2xl border transition-all duration-150 flex flex-col justify-between group bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-2xs hover:shadow-md hover:border-[#00796b] dark:hover:border-[#80cbc4] relative ${
                        isOutOfStock ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]'
                      }`}
                    >
                      <div>
                        {/* Card Top Row: Discount Tag (Left) + Wishlist Heart (Right) */}
                        <div className="flex items-center justify-between gap-1 mb-2">
                          {hasDiscount ? (
                            <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md shadow-2xs uppercase tracking-wider">
                              {Math.round(((mrp - price) / mrp) * 100)}% OFF
                            </span>
                          ) : (
                            <span className="text-[9px] font-extrabold text-[#00796b] dark:text-[#80cbc4] uppercase tracking-wider truncate">
                              {formatCategory(product.category_name || product.category)}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="text-slate-300 hover:text-rose-500 transition-colors cursor-pointer p-0.5"
                            title="Add to wishlist"
                          >
                            ♡
                          </button>
                        </div>

                        {/* Product Title */}
                        <h4 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight group-hover:text-[#00796b]">
                          {product.name}
                        </h4>

                        {/* Pack size / Unit */}
                        <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                          {formatUnit(product.unit_name || product.unit)}
                        </div>

                      </div>

                      {/* Stock Quantity Tag & Price Row */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-xs sm:text-sm font-black text-[#00796b] dark:text-[#80cbc4] font-mono">
                              ₹{price.toFixed(2)}
                            </div>
                            {hasDiscount && (
                              <div className="text-[10px] text-slate-400 line-through leading-none">
                                ₹{mrp.toFixed(2)}
                              </div>
                            )}
                          </div>

                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-md ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-600'
                              : 'bg-[#e0f2f1] dark:bg-teal-950/80 text-[#00796b] dark:text-[#80cbc4]'
                          }`}>
                            {isOutOfStock ? 'Out' : `Qty ${product.stock_quantity}`}
                          </span>
                        </div>

                        {/* Add to Bill Button */}
                        <button
                          disabled={isOutOfStock}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isOutOfStock) handleAddToCart(product);
                          }}
                          className={`w-full py-1.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isOutOfStock
                              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-[#00796b] hover:bg-[#004d40] text-white shadow-2xs hover:shadow-xs'
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================= RIGHT COLUMN: ACTIVE BILL CART & CHECKOUT (4 COLS) ================= */}
        <div className={`lg:col-span-4 space-y-3 ${mobileTab === 'cart' ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3.5">
            {/* Customer Attachment Strip */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 relative space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#00796b]" /> Customer Details
                </span>
                <button
                  type="button"
                  onClick={() => setIsNewCustomerModalOpen(true)}
                  className="text-xs font-extrabold text-[#00796b] dark:text-[#80cbc4] hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  + Add Customer
                </button>
              </div>

              {currentCart.customer ? (
                <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {currentCart.customer.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {currentCart.customer.phone || 'No phone'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCustomer}
                    className="text-xs font-bold text-slate-400 hover:text-rose-500 cursor-pointer px-1.5"
                    title="Remove customer"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={customerSearch}
                    onChange={(e) => {
                      setCustomerSearch(e.target.value);
                      setIsCustomerDropdownOpen(true);
                    }}
                    onFocus={() => setIsCustomerDropdownOpen(true)}
                    placeholder="Walk-In Customer (Search name or phone)..."
                    className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-hidden focus:border-[#00796b] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 font-medium"
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute right-3 pointer-events-none" />

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
                            className="w-full text-left p-2.5 hover:bg-[#e0f2f1] dark:hover:bg-slate-800 text-xs flex items-center justify-between cursor-pointer"
                          >
                            <div>
                              <div className="font-bold text-slate-800 dark:text-slate-100">{c.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{c.phone}</div>
                            </div>
                            <span className="text-[10px] font-bold text-[#00796b] bg-[#e0f2f1] px-2 py-0.5 rounded border border-[#b2dfdb]">
                              Select
                            </span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Bill Cart Items Section Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-100">
                <span>Cart Items ({cartItems.length})</span>
                {cartItems.length > 0 && (
                  <button
                    onClick={handleClearCart}
                    className="text-xs font-bold text-slate-400 hover:text-rose-500 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                  </button>
                )}
              </div>

              {cartItems.length === 0 ? (
                <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 text-slate-400 space-y-2">
                  <ShoppingCart className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-extrabold text-slate-600 dark:text-slate-300">Cart is empty</p>
                  <p className="text-xs text-slate-400">Scan barcodes or click products to add items</p>
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto custom-scrollbar-thin touch-pan space-y-2 pr-1">
                  {cartItems.map((item) => {
                    const unitShort = formatUnit(item.productUnitShort || item.sellingUnitShort || item.product?.unit_name || item.product?.unit);

                    const qty = parseFloat(item.quantity) || 0;
                    const price = parseFloat(item.unitPrice) || 0;
                    const lineTotal = price * qty;
                    const isLoose = isWeightOrVolumeUnit(unitShort);

                    return (
                      <div
                        key={item.product.id}
                        className="p-3 bg-slate-50/90 dark:bg-slate-800/80 hover:bg-[#e0f2f1]/30 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2.5 transition-all shadow-2xs"
                      >
                        {/* Top Line: Item Name & Line Total */}
                        <div className="flex items-center justify-between gap-2">
                          <h5 className="text-xs font-black text-slate-800 dark:text-slate-100 truncate" title={item.product.name}>
                            {item.product.name}
                          </h5>
                          <div className="text-sm font-black text-[#00695C] dark:text-[#4DB6AC] font-mono shrink-0">
                            ₹{lineTotal.toFixed(2)}
                          </div>
                        </div>

                        {/* Middle Controls: Rate Input, GST Dropdown, Stepper & Trash */}
                        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {/* Unit Price Input */}
                            <div className="flex items-center gap-0.5 bg-white dark:bg-slate-900 px-2 py-1 rounded-xl border border-[#B2DFDB] dark:border-slate-700 text-xs shadow-2xs">
                              <span className="text-[#607D8B] font-extrabold text-[11px]">₹</span>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={item.unitPrice === '' ? '' : item.unitPrice}
                                onChange={(e) => handleUpdateUnitPrice(item.product.id, e.target.value)}
                                placeholder="0.00"
                                className="w-14 text-xs font-black text-[#00695C] dark:text-[#4DB6AC] bg-transparent outline-hidden"
                              />
                              <span className="text-[10px] font-bold text-[#607D8B]">/{unitShort}</span>
                            </div>

                            {/* GST Select Pill */}
                            <div className="flex items-center gap-0.5 bg-[#E0F2F1] dark:bg-slate-700 text-[#00695C] dark:text-slate-200 font-extrabold px-2 py-1 rounded-xl border border-[#B2DFDB] dark:border-slate-600 text-xs shadow-2xs">
                              <span className="text-[10px] text-[#00695C] dark:text-slate-300">GST</span>
                              <select
                                value={item.gstPercent ?? 0}
                                onChange={(e) => handleUpdateGstPercent(item.product.id, e.target.value)}
                                className="bg-transparent text-xs font-black focus:outline-hidden cursor-pointer pl-0.5 text-[#00695C] dark:text-slate-100"
                              >
                                <option value="0" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">0%</option>
                                <option value="5" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">5%</option>
                                <option value="12" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">12%</option>
                                <option value="18" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">18%</option>
                                <option value="28" className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100">28%</option>
                              </select>
                            </div>
                          </div>

                          {/* Stepper + Remove */}
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 px-1.5 py-1 rounded-xl border border-[#B2DFDB] dark:border-slate-700 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => {
                                  const current = parseFloat(item.quantity) || 0;
                                  const step = isLoose ? (['kg', 'l'].includes(unitShort.toLowerCase()) ? 0.1 : 1) : 1;
                                  const next = Math.max(0, parseFloat((current - step).toFixed(4)));
                                  handleUpdateQuantity(item.product.id, next);
                                }}
                                className="w-5 h-5 rounded-lg bg-[#E0F2F1] dark:bg-slate-800 text-[#00695C] dark:text-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-[#b2dfdb] transition-colors"
                                title="Decrease quantity"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                step="any"
                                min="0"
                                value={item.quantity}
                                onChange={(e) => handleUpdateQuantity(item.product.id, e.target.value)}
                                className="w-12 text-center text-xs font-black text-[#263238] dark:text-slate-100 bg-transparent outline-hidden"
                                placeholder="Qty"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const current = parseFloat(item.quantity) || 0;
                                  const step = isLoose ? (['kg', 'l'].includes(unitShort.toLowerCase()) ? 0.1 : 1) : 1;
                                  const next = parseFloat((current + step).toFixed(4));
                                  handleUpdateQuantity(item.product.id, next);
                                }}
                                className="w-5 h-5 rounded-lg bg-[#E0F2F1] dark:bg-slate-800 text-[#00695C] dark:text-slate-200 flex items-center justify-center font-bold text-xs cursor-pointer hover:bg-[#b2dfdb] transition-colors"
                                title="Increase quantity"
                              >
                                +
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.product.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Bottom Line: Quick Weight Chips without ugly scrollbar arrows */}
                        {isLoose && (
                          <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 overflow-x-auto [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                            <span className="text-[10px] font-bold text-slate-400 shrink-0">Quick Weight:</span>
                            {['200mg', '100g', '200g', '250g', '500g', '1kg'].map((preset) => {
                              const targetQty = getQtyForPresetWeight(preset, unitShort);
                              const isActive = Math.abs((parseFloat(item.quantity) || 0) - targetQty) < 0.00001;
                              return (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => handleUpdateQuantity(item.product.id, targetQty)}
                                  className={`px-2 py-0.5 text-[10px] font-extrabold rounded-lg border transition-all cursor-pointer shrink-0 ${
                                    isActive
                                      ? 'bg-[#00695C] text-white border-[#00695C] shadow-2xs'
                                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#00695C] hover:text-[#00695C]'
                                  }`}
                                >
                                  {preset}
                                </button>
                              );
                            })}

                            <button
                              type="button"
                              onClick={() => {
                                const inputVal = window.prompt(`Enter desired ₹ amount for ${item.product.name} (Rate: ₹${price}/${unitShort}):`);
                                if (inputVal) {
                                  handleSetItemTargetAmount(item.product.id, inputVal);
                                }
                              }}
                              className="px-2 py-0.5 text-[10px] font-black rounded-lg border bg-[#E0F2F1] dark:bg-slate-700 text-[#00695C] dark:text-[#4DB6AC] border-[#B2DFDB] dark:border-slate-600 hover:bg-[#b2dfdb] transition-all cursor-pointer shrink-0"
                              title="Set quantity by ₹ Amount"
                            >
                              ₹ Amt
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bill Summary & Net Total Card */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2 shadow-2xs">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 font-semibold">
                <span>Subtotal ({cartItems.length} items)</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-100">₹{netSubtotal.toFixed(2)}</span>
              </div>

              {/* Promo Code Section (Add / Remove) */}
              {currentCart.couponCode ? (
                <div className="flex items-center justify-between text-xs p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Tag className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-bold text-emerald-900 dark:text-emerald-200 truncate">
                      Promo: <span className="font-mono uppercase">{currentCart.couponCode}</span>
                    </span>
                    <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-400">
                      (-₹{couponDiscount.toFixed(2)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveCoupon}
                    className="px-2 py-0.5 text-[10px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 rounded-lg border border-rose-200 dark:border-rose-800 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1"
                    title="Remove promo code"
                  >
                    <span>Remove</span>
                    <span className="font-black text-xs">✕</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-xs text-[#00796b] dark:text-[#80cbc4]">
                  <button
                    type="button"
                    onClick={() => setIsCouponModalOpen(true)}
                    className="font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Tag className="w-3.5 h-3.5" /> Promo Code
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCouponModalOpen(true)}
                    className="font-bold text-xs bg-teal-50 dark:bg-teal-950/60 text-[#00796b] dark:text-[#80cbc4] hover:bg-teal-100 dark:hover:bg-teal-900 px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800 transition-all cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Apply Promo Code
                  </button>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-baseline">
                <span className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">NET TOTAL</span>
                <span className="text-2xl font-black text-[#00796b] dark:text-[#80cbc4] font-mono">
                  ₹{grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector Pills Grid */}
            <div className="space-y-1.5">
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                Payment Mode
              </span>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
                {[
                  { id: 'CASH', label: 'Cash', icon: '💵' },
                  { id: 'UPI', label: 'UPI', icon: '📲' },
                  { id: 'CARD', label: 'Card', icon: '💳' },
                  { id: 'KHATA', label: 'Khatu', icon: '👛' },
                ].map((item) => {
                  const isSelected = paymentMethod === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPaymentMethod(item.id)}
                      className={`py-2 px-1 rounded-xl border flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#00796b] text-white border-[#00796b] shadow-2xs font-extrabold'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs">{item.icon}</span>
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Cash Tendered & Denominations Area */}
            {paymentMethod === 'CASH' && (
              <div className="p-3 bg-[#e0f2f1]/40 dark:bg-slate-800/80 rounded-2xl border border-[#b2dfdb] dark:border-slate-700 space-y-2.5 shadow-2xs">
                {/* Cash Input & Exact / Denomination Buttons */}
                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <span className="absolute left-2.5 top-2 text-sm font-black text-[#00796b]">₹</span>
                    <input
                      type="number"
                      value={cashTendered}
                      onChange={(e) => handleCashTenderedInputChange(e.target.value)}
                      placeholder={`Amount (e.g. ${Math.ceil(grandTotal)})`}
                      className="w-full pl-6 pr-2 py-1.5 text-sm font-black bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-[#00796b] rounded-lg outline-hidden text-slate-800 dark:text-slate-100 font-mono"
                    />
                  </div>

                  {grandTotal > 0 && (
                    <button
                      type="button"
                      onClick={() => handleAutoSelectAndOpenNotes(grandTotal, false)}
                      className="px-2.5 py-2 bg-[#00796b] hover:bg-[#004d40] text-white rounded-lg text-xs font-bold shrink-0 cursor-pointer shadow-2xs transition-colors"
                      title="Exact bill amount"
                    >
                      Exact (₹{Math.ceil(grandTotal)})
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsDenominationModalOpen(true)}
                    className="px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#00796b] dark:text-[#80cbc4] hover:bg-slate-100 rounded-lg text-xs font-bold shrink-0 cursor-pointer transition-colors flex items-center gap-1"
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

                {/* Quick Currency Note Chips */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-400">
                    <span className="font-bold">Customer Notes Received:</span>
                    {parseFloat(cashTendered) > 0 && (
                      <span className="font-mono font-bold text-[#00796b] dark:text-[#80cbc4]">
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
                              ? 'bg-[#00796b] text-white border-[#00796b] shadow-2xs ring-2 ring-[#80cbc4]/60'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-[#00796b]'
                          }`}
                          title={`Click to add +1 note/coin of ₹${amt}`}
                        >
                          {hasCount && (
                            <span className="absolute -top-1.5 -right-1 bg-[#80cbc4] text-[#004d40] text-[9px] font-black px-1 rounded-full shadow-2xs">
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

                {/* Return Change Banner */}
                {changeToReturn > 0 && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-300 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                        <Coins className="w-3.5 h-3.5 text-amber-500" />
                        Change Due: <strong className="font-mono text-sm font-black text-[#00796b] ml-1">₹{changeToReturn.toFixed(2)}</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsChangeNoteModalOpen(true)}
                        className="px-2 py-0.5 bg-[#00796b] hover:bg-[#004d40] text-white rounded-md text-[10px] font-bold cursor-pointer transition-colors"
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
              <div className="p-2.5 bg-[#e0f2f1] border border-[#b2dfdb] rounded-xl flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-800">Scan & Pay via any UPI App</h5>
                  <p className="text-[10px] text-slate-500">GPay, PhonePe, Paytm</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsUpiModalOpen(true)}
                  className="px-2.5 py-1 bg-[#00796b] text-white text-xs font-bold rounded-lg hover:bg-[#004d40] cursor-pointer flex items-center gap-1"
                >
                  <QrCode className="w-3.5 h-3.5" /> Show QR
                </button>
              </div>
            )}

            {/* Generate Bill Button - Matching reference screenshot */}
            <button
              onClick={handleCompleteCheckout}
              disabled={cartItems.length === 0 || submittingOrder}
              className={`w-full py-3.5 px-4 rounded-2xl text-sm font-black shadow-md flex items-center justify-between transition-all cursor-pointer ${
                cartItems.length === 0 || submittingOrder
                  ? 'bg-emerald-200 text-emerald-600/70 border border-emerald-300 cursor-not-allowed'
                  : 'bg-[#00796b] hover:bg-[#004d40] text-white shadow-lg active:scale-[0.99]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-200" />
                <span>{submittingOrder ? 'Processing...' : 'Generate Bill'}</span>
              </div>
              <span className="bg-white/20 text-white text-xs font-extrabold px-2 py-0.5 rounded-md">
                F8
              </span>
            </button>
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
                  className={`p-2 rounded-xl border text-center transition-all cursor-pointer text-[11px] ${gullaForm.actionType === tab.id
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
        title="Today's Gulla Timeline & Cash Ledger"
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
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${gullaHistoryTab === tab.id
                      ? 'bg-[#384959] dark:bg-[#88BDF2] text-white dark:text-[#384959] shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                >
                  {TabIcon && <TabIcon className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${gullaHistoryTab === tab.id
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
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${isOut
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
                          <span className={`text-xs font-black ${isOut ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
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
                          onClick={async () => {
                            try {
                              const res = await ordersApi.getOrder(log.id);
                              setLastCreatedOrder(res.data);
                            } catch {
                              setLastCreatedOrder(log);
                            } finally {
                              setIsInvoiceModalOpen(true);
                            }
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
        title="Customer Cash Notes Counter"
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
                    <span className={`px-2 py-1 rounded-lg text-xs font-black font-heading ${isNote
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
        title="Select Change Notes to Return"
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
              <span className={`text-base font-black font-heading ${calculateDenominationTotal(changeNotes) === changeToReturn
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
                <div key={amt} className={`py-2 flex items-center justify-between text-xs gap-2 p-1.5 rounded-xl transition-all ${isZero
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/60'
                    : isExceeding
                      ? 'bg-slate-50/50 dark:bg-slate-800/40 border border-slate-200/40 dark:border-slate-800'
                      : ''
                  }`}>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-lg text-xs font-black font-heading ${isZero
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
                          ⚠️ Out of Stock
                        </span>
                      ) : isExceeding ? (
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 block">
                          ⛔ Note ₹{amt} is larger than remaining change needed (₹{remainingNeeded.toFixed(0)})
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
                      className={`px-1.5 py-1 text-[10px] font-bold rounded-md border cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${isZero
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
