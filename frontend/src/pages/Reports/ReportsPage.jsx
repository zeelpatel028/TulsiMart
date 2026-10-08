import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { SearchInput, EmptyState } from '../../components/common/UiHelpers';
import { 
  FileText, 
  Download, 
  Calendar, 
  Filter, 
  Receipt, 
  TrendingUp, 
  Layers, 
  Users, 
  Truck, 
  Sparkles,
  FileSpreadsheet,
  LayoutGrid,
  List,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Building2,
  DollarSign
} from 'lucide-react';
import { analyticsApi, inventoryApi } from '../../api';
import { extractList } from '../../utils/apiHelpers';
import { useNotification } from '../../context/NotificationContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ReportsPage = () => {
  const navigate = useNavigate();
  const { showToast } = useNotification();

  const [reportType, setReportType] = useState('gst');
  const [reportData, setReportData] = useState({ summary: {}, data: [] });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');
  const [activeDatePreset, setActiveDatePreset] = useState('all');
  const [groupByDay, setGroupByDay] = useState(false);

  const reportTypes = [
    { id: 'gst', label: 'Bill GST Bill', icon: Receipt },
    { id: 'purchase', label: 'Purchase Order GST', icon: Truck },
  ];

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getThisWeekStartStr = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    const year = start.getFullYear();
    const month = String(start.getMonth() + 1).padStart(2, '0');
    const dayStr = String(start.getDate()).padStart(2, '0');
    return `${year}-${month}-${dayStr}`;
  };

  const getThisMonthStartStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  };

  const handleSelectPreset = (preset) => {
    const today = getTodayStr();
    if (preset === 'today') {
      setDateFrom(today);
      setDateTo(today);
    } else if (preset === 'yesterday') {
      const yest = getYesterdayStr();
      setDateFrom(yest);
      setDateTo(yest);
    } else if (preset === 'week') {
      setDateFrom(getThisWeekStartStr());
      setDateTo(today);
    } else if (preset === 'month') {
      setDateFrom(getThisMonthStartStr());
      setDateTo(today);
    } else if (preset === 'all') {
      setDateFrom('');
      setDateTo('');
    }
    setActiveDatePreset(preset);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadReport();
  }, [reportType, dateFrom, dateTo, selectedCategory, search]);

  const loadCategories = async () => {
    try {
      const res = await inventoryApi.getCategories();
      setCategories(extractList(res));
    } catch (err) {
      console.error(err);
    }
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await analyticsApi.getReports({
        type: reportType,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        category: selectedCategory || undefined,
        search: search || undefined
      });
      const payload = res.data?.data || res.data || {};
      const summary = typeof payload.summary === 'object' && payload.summary !== null && !Array.isArray(payload.summary) 
        ? payload.summary 
        : (typeof res.data?.summary === 'object' && res.data?.summary !== null ? res.data.summary : {});
      const rawRows = payload.data || payload.results || payload.records || (Array.isArray(payload) ? payload : []);
      const rows = extractList(rawRows);
      setReportData({ summary, data: rows });
    } catch (err) {
      console.error(err);
      setReportData({ summary: {}, data: [] });
    } finally {
      setLoading(false);
    }
  };

  const dayGroups = React.useMemo(() => {
    const rows = Array.isArray(reportData?.data) ? reportData.data : [];
    if (!rows.length) return {};
    const groups = {};
    const today = getTodayStr();
    const yest = getYesterdayStr();
    rows.forEach(r => {
      const rawDate = r.date || r.order_date || r.expense_date || r.registered_on || 'Unspecified';
      const cleanDate = rawDate.split(' ')[0] || rawDate;
      let label = cleanDate;
      if (cleanDate === today) label = `Today (${cleanDate})`;
      else if (cleanDate === yest) label = `Yesterday (${cleanDate})`;

      if (!groups[label]) groups[label] = [];
      groups[label].push(r);
    });
    return groups;
  }, [reportData.data]);

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    const rows = Array.isArray(reportData?.data) ? reportData.data : [];
    if (rows.length === 0) {
      showToast('No report records available to export', 'error');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${reportType.toUpperCase()}_Report`);
    XLSX.writeFile(wb, `TulsiMart_${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Excel report generated & downloaded!', 'success');
  };

  // Export to PDF
  const handleExportPDF = () => {
    const reportRows = Array.isArray(reportData?.data) ? reportData.data : [];
    if (reportRows.length === 0) {
      showToast('No report records available to export', 'error');
      return;
    }

    const doc = new jsPDF('landscape');
    
    // Header
    doc.setFontSize(18);
    doc.setTextColor(0, 121, 107);
    doc.text(`TULSI MART - ${reportType.toUpperCase()} REPORT`, 14, 18);

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')} | Store: Tulsi Mart POS`, 14, 24);

    const headers = Object.keys(reportRows[0] || {});
    const rows = reportRows.map(row => headers.map(h => row[h]));

    autoTable(doc, {
      startY: 30,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [0, 121, 107], textColor: [255, 255, 255] },
      styles: { fontSize: 7.5 },
    });

    doc.save(`TulsiMart_${reportType}_report.pdf`);
    showToast('PDF report downloaded!', 'success');
  };

  // Card renderer for POS Card View
  const renderReportCard = (row, index) => {
    const keys = Object.keys(row);
    if (keys.length === 0) return null;

    const titleKey = keys.find(k => /number|code|id|title/i.test(k)) || keys[0];
    const titleVal = String(row[titleKey] || 'Entry #' + (index + 1));

    const subTitleKey = keys.find(k => k !== titleKey && /customer|supplier|product|category|description|name/i.test(k));
    const subTitleVal = subTitleKey ? String(row[subTitleKey]) : null;

    const dateKey = keys.find(k => /date|created|time/i.test(k));
    const dateVal = dateKey ? String(row[dateKey]) : null;

    const badgeKey = keys.find(k => /status|type|mode|method|category/i.test(k));
    const badgeVal = badgeKey ? String(row[badgeKey]) : null;

    const taxableVal = row.taxable_amount !== undefined ? parseFloat(row.taxable_amount) : null;
    const gstVal = row.gst_tax_amount !== undefined ? parseFloat(row.gst_tax_amount) : null;
    const totalVal = row.total_amount !== undefined ? parseFloat(row.total_amount) : (row.total_valuation !== undefined ? parseFloat(row.total_valuation) : null);

    const handledKeys = [titleKey, subTitleKey, dateKey, badgeKey, 'taxable_amount', 'gst_tax_amount', 'total_amount', 'total_valuation'];
    const otherKeys = keys.filter(k => !handledKeys.includes(k));

    return (
      <div key={index} className="flex flex-col group relative overflow-hidden rounded-3xl transition-all duration-300 shadow-sm hover:shadow-xl hover:border-teal-400/50">
        {/* Top Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#00695C] via-[#009688] to-[#4DB6AC] rounded-t-3xl" />
        
        <div className="bg-white dark:bg-slate-900 rounded-b-3xl border-x border-b border-teal-100/80 dark:border-slate-800 p-5 flex flex-col justify-between space-y-4 flex-1">
          {/* Top Header: Title & Status Badge */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="font-mono font-black text-sm sm:text-base text-[#00796b] dark:text-[#80cbc4] tracking-tight block truncate">
                {titleVal}
              </span>
              {subTitleVal && subTitleVal !== titleVal && (
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5 truncate max-w-[200px]">
                  {subTitleVal}
                </p>
              )}
            </div>
            {badgeVal && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50 shadow-2xs shrink-0">
                {badgeVal}
              </span>
            )}
          </div>

          {/* Middle Body: Key Metrics & Financial Breakdown */}
          <div className="py-3 px-3.5 bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl border border-teal-50 dark:border-slate-800/80 space-y-2">
            {/* Other meta info if present */}
            {otherKeys.map((k, i) => {
              const cellVal = row[k];
              if (cellVal === null || cellVal === undefined || typeof cellVal === 'object') return null;
              return (
                <div key={i} className="flex items-center justify-between text-xs pb-1 border-b border-slate-200/40 dark:border-slate-700/40">
                  <span className="text-slate-400 dark:text-slate-500 font-bold capitalize truncate mr-2">
                    {k.replace(/_/g, ' ')}:
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-200 truncate">
                    {String(cellVal)}
                  </span>
                </div>
              );
            })}

            {/* Taxable Subtotal */}
            {taxableVal !== null && !isNaN(taxableVal) && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-bold">Taxable Subtotal:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  ₹{Number(taxableVal).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {/* GST Tax Amount */}
            {gstVal !== null && !isNaN(gstVal) && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-bold">GST Tax Amount:</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  + ₹{Number(gstVal).toLocaleString('en-IN')}
                </span>
              </div>
            )}

            {/* Total Amount */}
            {totalVal !== null && !isNaN(totalVal) && (
              <div className="flex items-center justify-between text-xs pt-1.5 border-t border-teal-100 dark:border-slate-700">
                <span className="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Total Amount:</span>
                <span className="text-base font-black text-[#00796b] dark:text-[#80cbc4] font-heading">
                  ₹{Number(totalVal).toLocaleString('en-IN')}
                </span>
              </div>
            )}
          </div>

          {/* Bottom Footer: Date & Tag */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <span className="text-slate-400 dark:text-slate-500 font-semibold">
              {dateVal || `Record #${index + 1}`}
            </span>
            <span className="text-[11px] font-extrabold text-[#00796b] dark:text-[#80cbc4] bg-teal-50 dark:bg-slate-800 px-3 py-1 rounded-xl">
              {reportType === 'gst' ? 'Bill GST' : 'PO GST'}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 animate-fade-in font-sans text-slate-800 dark:text-slate-100 selection:bg-[#80cbc4] selection:text-[#004d40]">
      {/* 📱 Mobile & Tablet Top App Header - Pastel Mint Theme */}
      <div className="lg:hidden sticky top-0 z-30 bg-[#E3F6F4] dark:bg-slate-900 text-slate-900 dark:text-white px-3.5 py-2.5 sm:px-5 sm:py-3.5 rounded-b-[18px] shadow-xs border-b border-teal-200/50 dark:border-slate-800 relative overflow-hidden min-h-[72px] sm:min-h-[82px] flex items-center -mx-3 -mt-3 sm:-mx-5 sm:-mt-5 mb-3">
        {/* SVG Decorative Bottom-Left Wave */}
        <svg className="absolute bottom-0 left-0 w-36 sm:w-52 h-auto pointer-events-none text-[#C4EFE9]/70 dark:text-teal-950/40" viewBox="0 0 200 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 40C50 60 120 70 200 45V80H0V40Z" fill="currentColor" />
        </svg>

        {/* SVG Decorative Bottom-Right Mound Curve */}
        <svg className="absolute bottom-0 right-0 w-28 sm:w-40 h-auto pointer-events-none text-[#B5ECE5]/80 dark:text-teal-900/40" viewBox="0 0 160 90" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 90C40 40 100 20 160 30V90H20Z" fill="currentColor" />
        </svg>

        {/* Header Content */}
        <div className="w-full max-w-3xl mx-auto flex items-center justify-between gap-2.5 relative z-10">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-slate-800 text-[#134E48] dark:text-teal-300 flex items-center justify-center shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0 border border-teal-100/80 dark:border-slate-700"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-4 h-4 stroke-[2.6]" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="text-base sm:text-xl font-black text-slate-900 dark:text-white tracking-tight font-heading leading-tight truncate">
                GST Reports & <span className="text-[#00695C] dark:text-[#4DB6AC]">Analytics</span>
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-[#267B70] dark:text-slate-300 truncate mt-0.5">
                Bill GST Bill & Purchase Order GST
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={handleExportExcel}
              className="p-2 bg-white dark:bg-slate-800 text-[#00796b] dark:text-[#80cbc4] border border-teal-200 dark:border-slate-700 rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Export Excel"
            >
              <FileSpreadsheet className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportPDF}
              className="p-2 bg-gradient-to-r from-[#00796b] to-[#004d40] text-white rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer"
              title="Download PDF"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 🌟 Tulsi Mart POS Top Header Banner - Full Width Edge-to-Edge Background (Desktop Only) */}
      <div className="hidden lg:block -mx-8 -mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-5 lg:px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-teal-300/20 dark:bg-teal-900/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Banner Grid Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          {/* Left: Icon & Title with Status Badge */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white p-2.5 sm:p-3 border border-[#004d40]/20 flex items-center justify-center shrink-0 shadow-md shadow-teal-900/10">
              <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
                  GST Reports & <span className="text-[#00796b] dark:text-[#80cbc4]">Analytics</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  GSTR-1 & GSTR-2 Ready
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Generate compliant Bill GST (Sales Bills) and Purchase Order GST statements with 1-click Excel and PDF export.
              </p>
            </div>
          </div>

          {/* Right: Export Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              icon={FileSpreadsheet} 
              onClick={handleExportExcel}
              className="border-teal-300 dark:border-slate-700 text-[#00796b] dark:text-[#80cbc4] hover:bg-teal-50 dark:hover:bg-slate-800 font-bold rounded-xl shadow-2xs cursor-pointer"
            >
              Export Excel
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              icon={Download} 
              onClick={handleExportPDF}
              className="bg-gradient-to-r from-[#00796b] to-[#004d40] hover:from-[#00695c] hover:to-[#00382e] text-white font-extrabold shadow-sm shadow-teal-900/20 rounded-xl cursor-pointer"
            >
              Download PDF
            </Button>
          </div>
        </div>
      </div>

      {/* 🌟 Unified Single Control Box (Tabs + Search + Filters) */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-xs space-y-3.5">
        
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          {reportTypes.map((r) => {
            const Icon = r.icon;
            const isActive = reportType === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setReportType(r.id)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-extrabold rounded-xl transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-[#00796b] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{r.label}</span>
              </button>
            );
          })}
        </div>

        {/* 📅 Per-Day Filter Presets (Super Page Style) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 min-w-0 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#00796b]" /> Per-Day Filter:
          </span>
          {[
            { id: 'all', label: 'All Time' },
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'week', label: 'This Week' },
            { id: 'month', label: 'This Month' }
          ].map((p) => {
            const isActive = activeDatePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPreset(p.id)}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#00796b] text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-72">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search report entries..."
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto">
            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 sm:flex-initial px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-bold focus:outline-none focus:border-[#00796b]"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}

            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setActiveDatePreset('custom');
                }}
                className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:border-[#00796b]"
                title="From"
              />
              <span className="text-slate-400 font-bold shrink-0 text-xs">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setActiveDatePreset('custom');
                }}
                className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:border-[#00796b]"
                title="To"
              />
            </div>

            {/* Day-Wise Grouping Toggle Button */}
            <button
              type="button"
              onClick={() => setGroupByDay(!groupByDay)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                groupByDay
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700'
                  : 'bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
              }`}
              title="Group Entries Day-Wise"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Group Day-Wise</span>
            </button>

            {/* View Switcher: Card Grid vs Table */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#00796b] text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table'
                    ? 'bg-[#00796b] text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Highlights */}
      {reportData.summary && typeof reportData.summary === 'object' && Object.keys(reportData.summary).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {Object.entries(reportData.summary)
            .filter(([_, val]) => val !== null && val !== undefined && typeof val !== 'object')
            .map(([key, val], idx) => (
              <div key={idx} className="bg-gradient-to-br from-white to-teal-50/30 dark:from-slate-900 dark:to-slate-800/40 p-4 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-xs hover:border-teal-300 dark:hover:border-slate-700 transition-all relative overflow-hidden group">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider truncate block leading-none mb-1.5">{key.replace(/_/g, ' ')}</span>
                <p className="text-lg sm:text-xl font-black text-[#00796b] dark:text-[#80cbc4] font-heading leading-tight">
                  {typeof val === 'number' && val > 99 ? `₹${val.toLocaleString('en-IN')}` : String(val)}
                </p>
              </div>
            ))}
        </div>
      )}

      {/* Report Records Rendering */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-[#00796b] border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Compiling Financial Statement...</p>
        </div>
      ) : (!Array.isArray(reportData?.data) || reportData.data.length === 0) ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No Report Records Found"
          description="No transaction or sales entries match the selected report type and date range."
          variant="default"
        />
      ) : groupByDay ? (
        /* 📅 Day-Wise Grouped View (Super Page Style) */
        <div className="space-y-6">
          {Object.entries(dayGroups).map(([dateKey, groupItems], gIdx) => {
            const dayTotal = groupItems.reduce((sum, item) => sum + (parseFloat(item.total_amount || item.total_valuation || 0)), 0);
            const dayTaxable = groupItems.reduce((sum, item) => sum + (parseFloat(item.taxable_amount || 0)), 0);
            const dayGst = groupItems.reduce((sum, item) => sum + (parseFloat(item.gst_tax_amount || 0)), 0);

            return (
              <div key={gIdx} className="space-y-3">
                {/* Day Header Banner */}
                <div className="bg-slate-100/90 dark:bg-slate-800/80 px-4 py-2.5 rounded-2xl border border-teal-200/60 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-[#00796b] dark:text-[#80cbc4]" />
                    <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-wider">
                      {dateKey}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-[#00695c] dark:bg-slate-700 dark:text-teal-300">
                      {groupItems.length} {groupItems.length === 1 ? 'Record' : 'Records'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs font-extrabold flex-wrap">
                    {dayTaxable > 0 && (
                      <span className="text-slate-600 dark:text-slate-300">
                        Taxable: <span className="font-mono text-slate-900 dark:text-white">₹{dayTaxable.toLocaleString('en-IN')}</span>
                      </span>
                    )}
                    {dayGst > 0 && (
                      <span className="text-amber-600 dark:text-amber-400">
                        GST: <span className="font-mono">₹{dayGst.toLocaleString('en-IN')}</span>
                      </span>
                    )}
                    {dayTotal > 0 && (
                      <span className="text-[#00796b] dark:text-[#80cbc4] bg-white dark:bg-slate-900 px-3 py-1 rounded-xl shadow-2xs">
                        Total: ₹{dayTotal.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Day Items Rendering */}
                {viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
                    {groupItems.map((row, rIdx) => renderReportCard(row, rIdx))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg overflow-hidden">
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto custom-scrollbar">
                      <table className="w-full min-w-[700px] text-left text-xs border-collapse">
                        <thead className="sticky top-0 z-10 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs shadow-2xs">
                          <tr className="border-b border-teal-100 dark:border-slate-700/80 text-[#00796b] dark:text-[#80cbc4] font-black uppercase tracking-wider text-[11px] whitespace-nowrap">
                            {Object.keys(groupItems[0] || {}).map((h, i) => (
                              <th key={i} className="py-3.5 px-4 capitalize">{h.replace(/_/g, ' ')}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-teal-50 dark:divide-slate-800/80 font-medium">
                          {groupItems.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 transition-colors">
                              {Object.values(row).map((val, cIdx) => (
                                <td key={cIdx} className="py-3 px-4 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                  {val === null || val === undefined 
                                    ? '-' 
                                    : typeof val === 'object' 
                                      ? JSON.stringify(val) 
                                      : typeof val === 'number' && val > 99 
                                        ? `₹${val.toLocaleString('en-IN')}` 
                                        : String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : viewMode === 'grid' ? (
        /* 🌟 Flat Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
          {reportData.data.map((row, rIdx) => renderReportCard(row, rIdx))}
        </div>
      ) : (
        /* 🌟 Flat Table View */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[640px] overflow-y-auto custom-scrollbar">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs shadow-2xs">
                <tr className="border-b border-teal-100 dark:border-slate-700/80 text-[#00796b] dark:text-[#80cbc4] font-black uppercase tracking-wider text-[11px] whitespace-nowrap">
                  {Object.keys(reportData.data[0] || {}).map((h, i) => (
                    <th key={i} className="py-3.5 px-4 capitalize">{h.replace(/_/g, ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-50 dark:divide-slate-800/80 font-medium">
                {reportData.data.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 transition-colors">
                    {Object.values(row).map((val, cIdx) => (
                      <td key={cIdx} className="py-3 px-4 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {val === null || val === undefined 
                          ? '-' 
                          : typeof val === 'object' 
                            ? JSON.stringify(val) 
                            : typeof val === 'number' && val > 99 
                              ? `₹${val.toLocaleString('en-IN')}` 
                              : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;

