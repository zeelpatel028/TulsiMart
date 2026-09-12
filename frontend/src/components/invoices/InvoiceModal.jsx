import React, { useRef } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Printer, Download, CheckCircle, Store, Phone, Mail, MapPin, QrCode } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const InvoiceModal = ({ isOpen, onClose, order, store }) => {
  const invoiceRef = useRef(null);

  if (!order) return null;

  const defaultStore = {
    name: 'Tulsi Mart',
    tagline: 'Fresh Groceries & Supermarket',
    phone: '+91 98765 43210',
    email: 'contact@tulsimart.com',
    address: 'Shop No. 12-14, Heritage Plaza, MG Road, Mumbai, MH - 400001',
    gstin: '27AABCT8899F1Z4',
    logo_url: '/logo.png',
    footer_terms: 'Thank you for shopping at Tulsi Mart! 100% Quality Guarantee. Exchanges valid within 24 hours with original invoice.',
    ...store
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(0, 105, 92); // #00695C Deep Teal
    doc.text('TULSI MART', 14, 20);
    
    doc.setFontSize(9);
    doc.setTextColor(0, 150, 136); // #009688 Teal
    doc.text(defaultStore.tagline, 14, 25);
    doc.text(defaultStore.address, 14, 30);
    doc.text(`GSTIN: ${defaultStore.gstin} | Phone: ${defaultStore.phone}`, 14, 35);
    
    // Line
    doc.setDrawColor(178, 223, 219); // #B2DFDB
    doc.line(14, 38, 196, 38);
    
    // Invoice Meta
    doc.setFontSize(11);
    doc.setTextColor(0, 105, 92);
    doc.text(`INVOICE: ${order.invoice_number || order.order_number}`, 14, 46);
    doc.setFontSize(9);
    doc.setTextColor(96, 125, 139);
    doc.text(`Date: ${new Date(order.created_at).toLocaleDateString('en-IN')}`, 14, 52);
    doc.text(`Payment: ${order.payment_method} (${order.payment_status})`, 14, 57);
    
    doc.text(`Customer: ${order.customer_name}`, 120, 46);
    doc.text(`Phone: ${order.customer_phone || 'Walk-in Customer'}`, 120, 52);
    doc.text(`Status: ${order.status}`, 120, 57);

    // Items Table
    const tableData = (order.items || []).map((item, index) => [
      index + 1,
      item.product_name,
      item.sku || '-',
      item.quantity,
      `Rs. ${Number(item.unit_price).toFixed(2)}`,
      `${item.gst_percent}%`,
      `Rs. ${Number(item.subtotal).toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['#', 'Item Description', 'SKU', 'Qty', 'Rate', 'GST', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [0, 105, 92], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
    });

    const finalY = doc.lastAutoTable.finalY + 10;
    doc.text(`Subtotal: Rs. ${Number(order.subtotal).toFixed(2)}`, 140, finalY);
    doc.text(`GST Tax: Rs. ${Number(order.tax_amount).toFixed(2)}`, 140, finalY + 6);
    doc.text(`Discount: -Rs. ${Number(order.discount_amount).toFixed(2)}`, 140, finalY + 12);
    doc.text(`Delivery: Rs. ${Number(order.delivery_charge).toFixed(2)}`, 140, finalY + 18);
    
    let currentY = finalY + 26;
    doc.setFontSize(12);
    doc.setTextColor(0, 105, 92);
    doc.text(`Grand Total: Rs. ${Number(order.total_amount).toFixed(2)}`, 140, currentY);

    if (order.payment_method === 'CASH' && order.cash_tendered && Number(order.cash_tendered) > 0) {
      const formatPdfNotes = (notes) => {
        if (!notes || typeof notes !== 'object') return '';
        return Object.entries(notes)
          .filter(([_, count]) => Number(count) > 0)
          .sort((a, b) => Number(b[0]) - Number(a[0]))
          .map(([denom, count]) => `${count}xRs.${denom}`)
          .join(' + ');
      };

      const tNotesStr = formatPdfNotes(order.tendered_notes);
      const cNotesStr = formatPdfNotes(order.change_notes);

      currentY += 6;
      doc.setFontSize(9);
      doc.setTextColor(0, 150, 136);
      doc.text(`Cash Tendered: Rs. ${Number(order.cash_tendered).toFixed(2)}${tNotesStr ? ` (${tNotesStr})` : ''}`, 140, currentY);
      currentY += 5;
      doc.setTextColor(251, 192, 45);
      doc.text(`Change Returned: Rs. ${Number(order.change_returned || 0).toFixed(2)}${cNotesStr ? ` (${cNotesStr})` : ''}`, 140, currentY);
    }

    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(defaultStore.footer_terms, 14, currentY + 14);

    doc.save(`Invoice_${order.order_number}.pdf`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tax Invoice - ${order.order_number}`}
      subtitle="Original Customer Billing Copy"
      maxWidth="max-w-3xl"
      footer={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between w-full gap-2.5 no-print">
          <span className="text-[11px] sm:text-xs text-[#607D8B] font-medium text-center sm:text-left">
            Generated via Tulsi Mart POS
          </span>
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" icon={Printer} onClick={handlePrint} className="flex-1 sm:flex-initial">
              Print Receipt
            </Button>
            <Button variant="primary" size="sm" icon={Download} onClick={handleDownloadPDF} className="flex-1 sm:flex-initial">
              Download PDF
            </Button>
          </div>
        </div>
      }
    >
      <div ref={invoiceRef} className="bg-white p-4 sm:p-8 rounded-2xl border border-[#B2DFDB] text-[#263238] invoice-printable">
        {/* Top Header with TM Logo */}
        <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6 pb-4 sm:pb-6 border-b border-[#B2DFDB]/60">
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-[#E0F2F1] p-2 flex items-center justify-center border border-[#B2DFDB] shrink-0">
              <img src="/logo.png" alt="Tulsi Mart" className="w-full h-full object-contain" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-[#00695C] tracking-tight font-heading">
                {defaultStore.name}
              </h2>
              <p className="text-xs text-[#009688] font-semibold">{defaultStore.tagline}</p>
              <p className="text-[11px] text-[#607D8B] mt-0.5 max-w-sm">{defaultStore.address}</p>
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-[#607D8B] mt-1">
                <span><strong>Phone:</strong> {defaultStore.phone}</span>
                <span><strong>GSTIN:</strong> {defaultStore.gstin}</span>
              </div>
            </div>
          </div>

          <div className="text-left sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-[#B2DFDB]/40">
            <span className="inline-block bg-[#00695C] text-white text-[10px] sm:text-xs font-extrabold px-2.5 py-1 rounded-md uppercase tracking-wider">
              TAX INVOICE
            </span>
            <p className="text-xs sm:text-sm font-extrabold text-[#00695C] mt-1.5 font-mono">
              {order.invoice_number || order.order_number}
            </p>
            <p className="text-[11px] sm:text-xs text-[#607D8B] mt-0.5">
              Date: {new Date(order.created_at).toLocaleString('en-IN')}
            </p>
            <div className="mt-1.5">
              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold ${
                order.payment_status === 'PAID' ? 'bg-[#E0F2F1] text-[#00695C]' : 'bg-[#FFF8E1] text-[#263238]'
              }`}>
                ● {order.payment_status} via {order.payment_method}
              </span>
            </div>
          </div>
        </div>

        {/* Customer & Bill Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 py-4 sm:py-6 border-b border-[#B2DFDB]/60 text-xs">
          <div>
            <p className="text-[10px] sm:text-[11px] font-bold text-[#607D8B] uppercase tracking-wider mb-1 font-heading">Billed To:</p>
            <p className="text-sm font-bold text-[#263238] font-heading">{order.customer_name || 'Counter Customer'}</p>
            {order.customer_phone && <p className="text-[#607D8B] mt-0.5">Phone: {order.customer_phone}</p>}
            {order.customer_address && <p className="text-[#607D8B] mt-0.5">{order.customer_address}</p>}
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] sm:text-[11px] font-bold text-[#607D8B] uppercase tracking-wider mb-1 font-heading">Order Details:</p>
            <p className="text-[#607D8B]">Order ID: <strong className="font-mono text-[#00695C]">{order.order_number}</strong></p>
            <p className="text-[#607D8B]">Order Status: <strong className="text-[#009688]">{order.status}</strong></p>
            {order.coupon_applied && <p className="text-[#607D8B]">Coupon: <strong className="text-[#4DB6AC]">{order.coupon_applied}</strong></p>}
          </div>
        </div>

        {/* Items Table */}
        <div className="py-4 sm:py-6 overflow-x-auto touch-pan">
          <table className="w-full min-w-[480px] text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-[#00695C] text-[#00695C] font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 px-2">#</th>
                <th className="py-2.5 px-2">Item Description</th>
                <th className="py-2.5 px-2 text-center">Qty</th>
                <th className="py-2.5 px-2 text-right">Price</th>
                <th className="py-2.5 px-2 text-center">GST</th>
                <th className="py-2.5 px-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E0F2F1]">
              {(order.items || []).map((item, idx) => (
                <tr key={idx} className="hover:bg-[#F0FAF9]/60">
                  <td className="py-3 px-2 text-[#607D8B] font-mono">{idx + 1}</td>
                  <td className="py-3 px-2">
                    <p className="font-bold text-[#263238] font-heading">{item.product_name}</p>
                    {item.sku && <span className="text-[10px] text-[#607D8B] font-mono">SKU: {item.sku}</span>}
                  </td>
                  <td className="py-3 px-2 text-center font-bold">{item.quantity}</td>
                  <td className="py-3 px-2 text-right font-medium">₹{Number(item.unit_price).toFixed(2)}</td>
                  <td className="py-3 px-2 text-center text-[#607D8B]">{item.gst_percent}%</td>
                  <td className="py-3 px-2 text-right font-extrabold text-[#00695C]">₹{Number(item.subtotal).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary & QR Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t-2 border-[#B2DFDB]">
          <div className="flex items-center gap-4 bg-[#F0FAF9] p-4 rounded-xl border border-[#B2DFDB]">
            <div className="w-16 h-16 bg-white p-2 rounded-lg border border-[#B2DFDB] flex items-center justify-center shrink-0">
              <QrCode className="w-12 h-12 text-[#00695C]" />
            </div>
            <div className="text-[11px] text-[#607D8B]">
              <p className="font-bold text-[#00695C] font-heading">Instant UPI Pay / Verify</p>
              <p className="mt-0.5">Scan to pay via GPay, PhonePe, Paytm or view invoice online.</p>
            </div>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-[#607D8B]">
              <span>Subtotal:</span>
              <span className="font-semibold">₹{Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[#607D8B]">
              <span>GST / Tax Total:</span>
              <span className="font-semibold">₹{Number(order.tax_amount).toFixed(2)}</span>
            </div>
            {Number(order.discount_amount) > 0 && (
              <div className="flex justify-between text-[#00695C] font-medium">
                <span>Discount:</span>
                <span>-₹{Number(order.discount_amount).toFixed(2)}</span>
              </div>
            )}
            {Number(order.delivery_charge) > 0 && (
              <div className="flex justify-between text-[#607D8B]">
                <span>Delivery Charge:</span>
                <span className="font-semibold">₹{Number(order.delivery_charge).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-[#00695C] pt-2 border-t border-[#B2DFDB]">
              <span>Grand Total:</span>
              <span className="text-[#00695C] font-heading">₹{Number(order.total_amount).toFixed(2)}</span>
            </div>

            {/* Cash Tendered & Change Return Breakdown */}
            {order.payment_method === 'CASH' && order.cash_tendered && Number(order.cash_tendered) > 0 && (
              <div className="pt-2 mt-2 border-t border-dashed border-[#B2DFDB] space-y-1 bg-[#E0F2F1]/60 p-2.5 rounded-xl">
                <div className="flex justify-between items-center text-[#00695C] font-bold">
                  <span>Cash Tendered:</span>
                  <div className="text-right">
                    <span>₹{Number(order.cash_tendered).toFixed(2)}</span>
                    {order.tendered_notes && typeof order.tendered_notes === 'object' && Object.values(order.tendered_notes).some(v => v > 0) && (
                      <span className="text-[10px] text-[#009688] block font-mono font-medium">
                        ({Object.entries(order.tendered_notes).filter(([_, c]) => c > 0).sort((a, b) => Number(b[0]) - Number(a[0])).map(([d, c]) => `${c}×₹${d}`).join(' + ')})
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center text-[#263238] font-bold">
                  <span>Change Returned:</span>
                  <div className="text-right">
                    <span>₹{Number(order.change_returned || 0).toFixed(2)}</span>
                    {order.change_notes && typeof order.change_notes === 'object' && Object.values(order.change_notes).some(v => v > 0) && (
                      <span className="text-[10px] text-[#607D8B] block font-mono font-medium">
                        ({Object.entries(order.change_notes).filter(([_, c]) => c > 0).sort((a, b) => Number(b[0]) - Number(a[0])).map(([d, c]) => `${c}×₹${d}`).join(' + ')})
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 pt-4 border-t border-[#B2DFDB]/60 text-center text-[10px] text-[#607D8B]">
          <p>{defaultStore.footer_terms}</p>
          <p className="mt-1">Computer generated invoice. No signature required. Powered by Tulsi Mart.</p>
        </div>
      </div>
    </Modal>
  );
};

export default InvoiceModal;
