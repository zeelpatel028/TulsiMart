import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { SearchInput, EmptyState } from '../../components/common/UiHelpers';
import { 
  FileText, 
  Download, 
  Printer, 
  Calendar, 
  Filter, 
  Receipt, 
  TrendingUp, 
  Layers, 
  Users, 
  Truck, 
  ShoppingBag,
  Sparkles,
  FileSpreadsheet,
  LayoutGrid,
  List
} from 'lucide-react';
import { analyticsApi, inventoryApi } from '../../api';
import { useNotification } from '../../context/NotificationContext';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ReportsPage = () => {
  const { showToast } = useNotification();

  const [reportType, setReportType] = useState('sales');
  const [reportData, setReportData] = useState({ summary: {}, data: [] });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' (Image 2 style) or 'table'

  // Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [search, setSearch] = useState('');

  const reportTypes = [
    { id: 'sales', label: 'Sales Report', icon: TrendingUp },
    { id: 'gst', label: 'GST Tax Report', icon: Receipt },
    { id: 'inventory', label: 'Inventory Valuation', icon: Layers },
    { id: 'profit', label: 'Profit & Loss (P&L)', icon: Sparkles },
    { id: 'expense', label: 'Operating Expenses', icon: Receipt },
    { id: 'customer', label: 'Customer Growth', icon: Users },
    { id: 'purchase', label: 'Procurement & PO', icon: Truck },
  ];

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadReport();
  }, [reportType, dateFrom, dateTo, selectedCategory, search]);

  const loadCategories = async () => {
    try {
      const res = await inventoryApi.getCategories();
      setCategories(res.data?.results || res.data || []);
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
      setReportData(res.data || { summary: {}, data: [] });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (!reportData.data || reportData.data.length === 0) {
      showToast('No report records available to export', 'error');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(reportData.data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, `${reportType.toUpperCase()}_Report`);
    XLSX.writeFile(wb, `TulsiMart_${reportType}_report_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('Excel report generated & downloaded!', 'success');
  };

  // Export to PDF
  const handleExportPDF = () => {
    if (!reportData.data || reportData.data.length === 0) {
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

    const headers = Object.keys(reportData.data[0]);
    const rows = reportData.data.map(row => headers.map(h => row[h]));

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

  // Card renderer for Image 2 style POS Card View
  const renderReportCard = (row, index) => {
    const keys = Object.keys(row);
    if (keys.length === 0) return null;

    const titleKey = keys.find(k => /number|code|id|name|title/i.test(k)) || keys[0];
    const titleVal = String(row[titleKey] || 'Entry #' + (index + 1));

    const subTitleKey = keys.find(k => k !== titleKey && /customer|supplier|product|category|description|name/i.test(k));
    const subTitleVal = subTitleKey ? String(row[subTitleKey]) : null;

    const dateKey = keys.find(k => /date|created|time/i.test(k));
    const dateVal = dateKey ? String(row[dateKey]) : null;

    const amountKey = keys.find(k => /amount|total|profit|revenue|valuation|value|spent|cost|expense|taxable|gst/i.test(k));
    const amountVal = amountKey && typeof row[amountKey] === 'number' ? row[amountKey] : (amountKey && !isNaN(parseFloat(row[amountKey])) ? parseFloat(row[amountKey]) : null);

    const badgeKey = keys.find(k => /status|type|mode|method|category/i.test(k));
    const badgeVal = badgeKey ? String(row[badgeKey]) : null;

    return (
      <div
        key={index}
        className="bg-white dark:bg-slate-900 rounded-2xl border border-teal-200/80 dark:border-slate-800 p-4 space-y-3 shadow-2xs hover:shadow-md hover:border-[#00796b] dark:hover:border-[#80cbc4] transition-all flex flex-col justify-between"
      >
        {/* Top Header: Title / Ref & Status Badge */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-mono font-black text-sm text-[#00796b] dark:text-[#80cbc4] tracking-tight">
              {titleVal}
            </p>
            {subTitleVal && subTitleVal !== titleVal && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-0.5 truncate max-w-[200px]">
                {subTitleVal}
              </p>
            )}
          </div>
          {badgeVal && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 shadow-2xs">
              {badgeVal}
            </span>
          )}
        </div>

        {/* Middle Body: Key Metrics & Details */}
        <div className="flex items-center justify-between text-xs py-2.5 my-1 border-t border-b border-teal-100/60 dark:border-slate-800">
          <div className="min-w-0 pr-2 space-y-1">
            {keys.filter(k => k !== titleKey && k !== subTitleKey && k !== dateKey && k !== amountKey && k !== badgeKey).slice(0, 2).map((k, i) => (
              <p key={i} className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                <span className="font-bold capitalize">{k.replace(/_/g, ' ')}:</span>{' '}
                <span className="font-semibold text-slate-800 dark:text-slate-200">{String(row[k])}</span>
              </p>
            ))}
          </div>
          {amountVal !== null && !isNaN(amountVal) && (
            <div className="text-right shrink-0">
              <span className="text-lg font-black text-[#00796b] dark:text-[#80cbc4] font-heading block">
                ₹{Number(amountVal).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                {amountKey ? amountKey.replace(/_/g, ' ') : 'Amount'}
              </span>
            </div>
          )}
        </div>

        {/* Bottom Footer: Date & Entry Indicator */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500">
            {dateVal || `Record #${index + 1}`}
          </span>
          <span className="text-xs font-extrabold text-[#00796b] dark:text-[#80cbc4] bg-teal-50 dark:bg-slate-800 px-3 py-1 rounded-xl">
            {reportType.toUpperCase()} Log
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 font-sans text-slate-800 dark:text-slate-100 selection:bg-[#80cbc4] selection:text-[#004d40]">
      {/* 🌟 Tulsi Mart POS Top Header Banner - Full Width Edge-to-Edge Background like Bill Page */}
      <div className="-mx-3 -mt-3 sm:-mx-5 sm:-mt-5 lg:-mx-8 lg:-mt-8 mb-6 bg-gradient-to-r from-teal-50/90 via-emerald-50/60 to-teal-50/90 dark:from-slate-900 dark:via-slate-850 dark:to-slate-900 text-slate-800 dark:text-white p-3.5 sm:p-5 lg:px-8 border-b border-teal-200/70 dark:border-slate-800 relative overflow-hidden shadow-2xs">
        {/* Subtle Decorative Background Glow */}
        <div className="absolute -top-12 -left-12 w-40 h-40 bg-teal-300/20 dark:bg-teal-900/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Banner Grid Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          {/* Left: FileText Icon & Title with Status Badge */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-[#00796b] to-[#004d40] text-white p-2.5 sm:p-3 border border-[#004d40]/20 flex items-center justify-center shrink-0 shadow-md shadow-teal-900/10">
              <FileText className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white font-heading">
                  Reports & <span className="text-[#00796b] dark:text-[#80cbc4]">Analytics</span>
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-teal-100/90 text-[#00695c] dark:bg-teal-950/80 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  GST & P&L Ready
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
                Generate compliant GST, Sales, Procurement, and P&L statements with 1-click Excel and PDF export.
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

      {/* Report Types Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan bg-white dark:bg-slate-900 p-1.5 sm:p-2 rounded-2xl border border-teal-100 dark:border-slate-800 text-xs shadow-2xs">
        {reportTypes.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.id}
              onClick={() => setReportType(r.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3.5 py-2 rounded-xl font-extrabold shrink-0 transition-all cursor-pointer ${
                reportType === r.id
                  ? 'bg-[#00796b] text-white shadow-sm shadow-teal-900/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-teal-50/70 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {r.label}
            </button>
          );
        })}
      </div>

      {/* Summary KPI Highlights */}
      {reportData.summary && Object.keys(reportData.summary).length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(reportData.summary).map(([key, val], idx) => (
            <div key={idx} className="p-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs rounded-2xl border border-teal-100 dark:border-slate-800 shadow-2xs hover:border-teal-300 dark:hover:border-slate-700 transition-all">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider truncate block leading-none mb-1.5">{key}</span>
              <p className="text-base sm:text-lg font-black text-[#00796b] dark:text-[#80cbc4] font-heading leading-tight">{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter Row & View Switcher */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-3.5 sm:p-4 rounded-2xl border border-teal-100 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
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
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:border-[#00796b]"
              title="From"
            />
            <span className="text-slate-400 font-bold shrink-0 text-xs">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full sm:w-auto px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-teal-200/80 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100 font-medium focus:outline-none focus:border-[#00796b]"
              title="To"
            />
          </div>

          {/* View Switcher: Card Grid vs Table */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#00796b] text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
              }`}
              title="Card Grid View (Image 2 style)"
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

      {/* Report Records Rendering */}
      {loading ? (
        <div className="p-12 text-center text-slate-400">
          <div className="w-8 h-8 rounded-full border-2 border-[#00796b] border-t-transparent animate-spin mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-400">Compiling Financial Statement...</p>
        </div>
      ) : !reportData.data || reportData.data.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No Report Records Found"
          description="No transaction or sales entries match the selected report type and date range."
          variant="default"
        />
      ) : viewMode === 'grid' ? (
        /* 🌟 Card Grid View (Image 2 POS Style) */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5 sm:gap-4">
          {reportData.data.map((row, rIdx) => renderReportCard(row, rIdx))}
        </div>
      ) : (
        /* Table View */
        <Card className="p-0 overflow-hidden border border-teal-100 dark:border-slate-800 rounded-2xl shadow-sm bg-white dark:bg-slate-900">
          <div className="overflow-x-auto max-h-[640px] overflow-y-auto custom-scrollbar touch-pan">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs shadow-2xs">
                <tr className="border-b border-teal-100 dark:border-slate-700/80 text-[#00796b] dark:text-[#80cbc4] font-black uppercase tracking-wider text-[11px] whitespace-nowrap">
                  {Object.keys(reportData.data[0]).map((h, i) => (
                    <th key={i} className="py-3 px-4 capitalize">{h.replace(/_/g, ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-teal-50 dark:divide-slate-800/80 font-medium">
                {reportData.data.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 transition-colors">
                    {Object.values(row).map((val, cIdx) => (
                      <td key={cIdx} className="py-3 px-4 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                        {typeof val === 'number' && val > 99 ? `₹${val.toLocaleString('en-IN')}` : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ReportsPage;
