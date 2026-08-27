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
  FileSpreadsheet
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
    doc.setTextColor(56, 73, 89);
    doc.text(`TULSI MART - ${reportType.toUpperCase()} REPORT`, 14, 18);

    doc.setFontSize(9);
    doc.setTextColor(106, 137, 167);
    doc.text(`Generated on: ${new Date().toLocaleString('en-IN')} | Store: Tulsi Mart`, 14, 24);

    const headers = Object.keys(reportData.data[0]);
    const rows = reportData.data.map(row => headers.map(h => row[h]));

    autoTable(doc, {
      startY: 30,
      head: [headers],
      body: rows,
      theme: 'grid',
      headStyles: { fillColor: [56, 73, 89], textColor: [255, 255, 255] },
      styles: { fontSize: 7.5 },
    });

    doc.save(`TulsiMart_${reportType}_report.pdf`);
    showToast('PDF report downloaded!', 'success');
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#384959] dark:text-slate-100 tracking-tight font-heading">
            Reports & Business Statements
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-1">
            Generate compliant GST, Sales, Procurement, and P&L statements with 1-click Excel and PDF export.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" icon={FileSpreadsheet} onClick={handleExportExcel} className="flex-1 sm:flex-initial">
            Export Excel
          </Button>
          <Button variant="primary" size="sm" icon={Download} onClick={handleExportPDF} className="flex-1 sm:flex-initial">
            Download PDF
          </Button>
        </div>
      </div>

      {/* Report Types Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan bg-white dark:bg-slate-900 p-1.5 sm:p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs">
        {reportTypes.map((r) => {
          const Icon = r.icon;
          return (
            <button
              key={r.id}
              onClick={() => setReportType(r.id)}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl font-bold shrink-0 transition-all cursor-pointer ${
                reportType === r.id
                  ? 'bg-[#384959] dark:bg-[#88BDF2] text-white dark:text-[#384959] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {Object.entries(reportData.summary).map(([key, val], idx) => (
            <div key={idx} className="p-3.5 sm:p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate block">{key}</span>
              <p className="text-base sm:text-lg font-black text-[#384959] dark:text-slate-100 font-heading mt-0.5">{val}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter Row */}
      <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
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
              className="flex-1 sm:flex-initial px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100 font-medium"
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
              className="w-full sm:w-auto px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
              title="From"
            />
            <span className="text-slate-400 font-bold shrink-0">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full sm:w-auto px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[#384959] dark:text-slate-100"
              title="To"
            />
          </div>
        </div>
      </div>

      {/* Report Table Card */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-[#88BDF2] border-t-transparent animate-spin mx-auto mb-2" />
            <p className="text-xs font-bold">Compiling Financial Statement...</p>
          </div>
        ) : !reportData.data || reportData.data.length === 0 ? (
          <EmptyState
            icon={FileSpreadsheet}
            title="No Report Records Found"
            description="No transaction or sales entries match the selected report type and date range."
            variant="default"
          />
        ) : (

          <div className="overflow-x-auto max-h-[640px] overflow-y-auto custom-scrollbar touch-pan">
            <table className="w-full min-w-[700px] text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-50 dark:bg-slate-800 shadow-xs">
                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                  {Object.keys(reportData.data[0]).map((h, i) => (

                    <th key={i} className="py-3 px-4 capitalize">{h.replace(/_/g, ' ')}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {reportData.data.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/60 transition-colors">
                    {Object.values(row).map((val, cIdx) => (
                      <td key={cIdx} className="py-3 px-4 text-[#384959] dark:text-slate-200">
                        {typeof val === 'number' && val > 99 ? `₹${val.toLocaleString('en-IN')}` : String(val)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReportsPage;
