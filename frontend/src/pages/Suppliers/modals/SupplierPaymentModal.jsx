import React, { useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Calculator, Wallet, FileText, Zap, CheckCircle2 } from 'lucide-react';

const DENOMS = [500, 200, 100, 50, 20, 10, 5, 1];

export const SupplierPaymentModal = ({
  isOpen,
  onClose,
  payingSupplier,
  paymentForm,
  setPaymentForm,
  purchaseOrders = [],
  gullaSummary,
  denominations,
  setDenominations,
  onSavePayment
}) => {
  if (!isOpen) return null;

  // Filter pending POs for this supplier
  const supplierPendingPOs = purchaseOrders.filter(
    po => (po.supplier === payingSupplier?.id || po.supplier_name === payingSupplier?.name) &&
          (po.status !== 'CANCELLED') &&
          (parseFloat(po.total_amount || 0) > parseFloat(po.paid_amount || 0))
  );

  const gullaCashAvailable = gullaSummary?.cash_in_hand ?? gullaSummary?.net_cash_in_gulla ?? 0;
  const targetAmount = parseFloat(paymentForm.amount || 0);

  // Auto-fill greedy note calculation (અંદાજિત નોટો)
  const handleAutoFillNotes = (amountToFill) => {
    let rem = Math.round(amountToFill);
    const newCounts = { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, coins: 0 };
    const denomValues = [500, 200, 100, 50, 20, 10, 5, 1];

    denomValues.forEach(d => {
      if (rem >= d) {
        const cnt = Math.floor(rem / d);
        rem %= d;
        const key = d === 1 ? 'coins' : String(d);
        newCounts[key] = cnt;
      }
    });

    setDenominations(newCounts);
  };

  // Auto calculate notes whenever modal opens or amount changes
  useEffect(() => {
    if (isOpen && targetAmount > 0) {
      handleAutoFillNotes(targetAmount);
    }
  }, [isOpen, paymentForm.amount]);

  // Calculate note total
  const noteTotal = DENOMS.reduce((sum, d) => {
    const key = d === 1 ? 'coins' : String(d);
    const count = parseInt(denominations[key] || 0, 10);
    return sum + (count * d);
  }, 0);

  const diff = noteTotal - targetAmount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Record Vendor Payout: ${payingSupplier?.company_name || payingSupplier?.name}`}
      subtitle={`Total Outstanding Balance: ₹${Number(payingSupplier?.pending_balance || 0).toLocaleString('en-IN')}`}
      maxWidth="max-w-xl"
      footer={
        <div className="flex items-center justify-between w-full font-sans">
          <div className="text-xs">
            <span className="text-slate-500 font-semibold">Net Payout Amount: </span>
            <span className="font-extrabold text-[#384959] dark:text-[#88BDF2] text-sm">
              ₹{Number(paymentForm.amount || 0).toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={onSavePayment}>
              Record Payment Receipt
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={onSavePayment} className="space-y-4 text-xs font-sans">
        {/* Order-Wise Selection */}
        <div>
          <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-sky-600" /> Order-Wise Specific PO Payment (Optional)
          </label>
          <select
            value={paymentForm.purchase_order || ''}
            onChange={(e) => {
              const poId = e.target.value;
              const selectedPO = supplierPendingPOs.find(p => p.id === Number(poId));
              const due = selectedPO ? (parseFloat(selectedPO.total_amount) - parseFloat(selectedPO.paid_amount)) : (payingSupplier?.pending_balance || '');
              setPaymentForm({
                ...paymentForm,
                purchase_order: poId,
                amount: due,
                notes: selectedPO ? `Order-wise payment for PO #${selectedPO.po_number}` : paymentForm.notes
              });
              if (due > 0) {
                handleAutoFillNotes(due);
              }
            }}
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
          >
            <option value="">-- General Supplier Balance (Not linked to single PO) --</option>
            {supplierPendingPOs.map(po => {
              const due = (parseFloat(po.total_amount) - parseFloat(po.paid_amount)).toFixed(2);
              return (
                <option key={po.id} value={po.id}>
                  PO #{po.po_number} - Total ₹{po.total_amount} | Due ₹{due}
                </option>
              );
            })}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">Amount Paid (₹) *</label>
            <input
              type="number"
              required
              step="0.01"
              value={paymentForm.amount}
              onChange={(e) => {
                const val = e.target.value;
                setPaymentForm({ ...paymentForm, amount: val });
                if (val > 0) {
                  handleAutoFillNotes(parseFloat(val));
                }
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold text-[#384959] dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">Payment Method</label>
            <select
              value={paymentForm.payment_method}
              onChange={(e) => {
                const mode = e.target.value;
                setPaymentForm({ ...paymentForm, payment_method: mode });
                if (mode === 'CASH' && targetAmount > 0) {
                  handleAutoFillNotes(targetAmount);
                }
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
            >
              <option value="CASH">💵 Cash (Gulla Register Outflow)</option>
              <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
              <option value="UPI">UPI Payment</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>
        </div>

        {/* Live Gulla Register Status Card & Rupee Note Calculator (Only for CASH mode) */}
        {paymentForm.payment_method === 'CASH' && (
          <div className="space-y-3 pt-1">
            <div className="p-3.5 bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white rounded-2xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-black">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    Gulla Register Cash (ગલ્લો બેલેન્સ)
                  </p>
                  <p className="text-lg font-black text-white font-mono mt-0.5">
                    ₹{Number(gullaCashAvailable).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-extrabold rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Gulla Active
              </span>
            </div>

            {/* Rupee Note Denomination Calculator */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-bold text-[#384959] dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-emerald-600" /> Rupee Note Calculator (નોટ ગણતરી)
                </label>
                <button
                  type="button"
                  onClick={() => handleAutoFillNotes(targetAmount)}
                  className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" /> Auto-Fill Notes (અંદાજિત નોટો)
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                {DENOMS.map((d) => {
                  const key = d === 1 ? 'coins' : String(d);
                  const countVal = denominations[key] !== undefined ? denominations[key] : '';
                  return (
                    <div key={d} className="text-center">
                      <span className="block text-[9px] font-extrabold text-slate-500 mb-0.5">
                        {d === 1 ? 'Coin' : `₹${d}`}
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={countVal}
                        onChange={(e) => {
                          const cnt = parseInt(e.target.value || 0, 10);
                          const newCounts = { ...denominations, [key]: cnt };
                          setDenominations(newCounts);
                          const newTot = DENOMS.reduce((sum, dom) => {
                            const k = dom === 1 ? 'coins' : String(dom);
                            return sum + ((newCounts[k] || 0) * dom);
                          }, 0);
                          if (newTot > 0) {
                            setPaymentForm(prev => ({ ...prev, amount: newTot }));
                          }
                        }}
                        placeholder="0"
                        className="w-full px-1.5 py-1 text-center font-black text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[#384959] dark:text-slate-100"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500">Calculated Cash Notes Total:</span>
                  <span className={`font-black text-sm ${diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-sky-600' : 'text-amber-600'}`}>
                    ₹{noteTotal.toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  {diff === 0 && (
                    <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Exact Match
                    </span>
                  )}
                  {diff > 0 && (
                    <span className="text-[10px] font-extrabold text-sky-600 bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded-md">
                      🔵 Change Return: ₹{diff.toLocaleString('en-IN')}
                    </span>
                  )}
                  {diff < 0 && (
                    <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                      🟠 Short: ₹{Math.abs(diff).toLocaleString('en-IN')}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">Reference / UTR No.</label>
            <input
              type="text"
              value={paymentForm.reference_number}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
              placeholder="e.g. UTR-987123"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">Payment Date</label>
            <input
              type="date"
              value={paymentForm.payment_date}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">Payment Notes</label>
          <input
            type="text"
            value={paymentForm.notes}
            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            placeholder="Partial payment against invoice #1024"
            className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
          />
        </div>
      </form>
    </Modal>
  );
};

export default SupplierPaymentModal;
