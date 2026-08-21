import React from 'react';
import { Card } from '../../../components/common/Card';
import { Button } from '../../../components/common/Button';
import { Download, FileSpreadsheet, FileCode } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

export const ProcurementAnalyticsTab = ({ suppliers, onShowToast }) => {
  const handleExportReport = (format) => {
    const exportData = suppliers.map(s => ({
      'Supplier ID': `SUP-${s.id}`,
      'Company Name': s.company_name || s.name,
      'Contact Person': s.name,
      'Phone': s.phone,
      'GSTIN': s.gstin || 'N/A',
      'Category': s.category || 'Grocery',
      'Payment Terms': s.payment_terms || 'Net 15',
      'Total Purchased (₹)': s.total_purchases || 0,
      'Total Paid (₹)': s.total_paid || 0,
      'Pending Balance (₹)': s.pending_balance || 0,
      'Status': s.is_active !== false ? 'Active' : 'Inactive'
    }));

    if (format === 'csv') {
      const headers = Object.keys(exportData[0] || {}).join(',');
      const rows = exportData.map(row => Object.values(row).map(val => `"${val}"`).join(',')).join('\n');
      const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Tulsi_Mart_Supplier_Report_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      if (onShowToast) onShowToast('CSV Supplier Report exported!');
    } else if (format === 'excel') {
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Suppliers Ledger');
      XLSX.writeFile(wb, `Tulsi_Mart_Procurement_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      if (onShowToast) onShowToast('Excel Procurement Ledger exported!');
    } else if (format === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text('Tulsi Mart - Wholesale Supplier Ledger Report', 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 14, 22);

      const tableColumn = ["Company Name", "Contact", "Phone", "GSTIN", "Pending Balance (₹)"];
      const tableRows = suppliers.map(s => [
        s.company_name || s.name,
        s.name,
        s.phone,
        s.gstin || 'N/A',
        `Rs. ${Number(s.pending_balance || 0).toLocaleString('en-IN')}`
      ]);

      doc.autoTable({
        head: [tableColumn],
        body: tableRows,
        startY: 28,
        theme: 'grid'
      });

      doc.save(`Tulsi_Mart_Supplier_Report_${new Date().toISOString().split('T')[0]}.pdf`);
      if (onShowToast) onShowToast('PDF Supplier Report exported!');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-base font-extrabold text-[#384959] dark:text-slate-100">
            Procurement Cost Analysis & Export
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Export comprehensive vendor purchase reports in PDF, Excel, or CSV formats.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={Download} onClick={() => handleExportReport('pdf')}>
            Export PDF
          </Button>
          <Button variant="outline" size="sm" icon={FileSpreadsheet} onClick={() => handleExportReport('excel')}>
            Export Excel
          </Button>
          <Button variant="outline" size="sm" icon={FileCode} onClick={() => handleExportReport('csv')}>
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <Card title="Supplier Procurement Share" subtitle="Total purchase volume by vendor">
            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={suppliers.slice(0, 6)} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="company_name" tick={{ fontSize: 10 }} interval={0} angle={-10} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip formatter={(val) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Total Purchased']} />
                  <Bar dataKey="total_purchases" name="Purchases (₹)" fill="#384959" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        <div className="lg:col-span-4">
          <Card title="Top Suppliers Leaderboard" subtitle="Most active wholesale partners">
            <div className="space-y-3 pt-2">
              {suppliers.slice(0, 5).map((s, idx) => (
                <div key={s.id} className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#384959]/10 text-[#384959] dark:text-[#88BDF2] font-bold flex items-center justify-center text-[10px]">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="font-bold text-[#384959] dark:text-slate-100">{s.company_name || s.name}</p>
                      <p className="text-[10px] text-slate-400">{s.category || 'Grocery'}</p>
                    </div>
                  </div>
                  <span className="font-extrabold text-[#384959] dark:text-[#88BDF2]">
                    ₹{Number(s.total_purchases || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProcurementAnalyticsTab;
