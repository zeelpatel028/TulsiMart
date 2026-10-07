import React, { useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { 
  Calculator, 
  Wallet, 
  FileText, 
  Zap, 
  CheckCircle2, 
  IndianRupee, 
  Banknote, 
  Smartphone, 
  CreditCard, 
  Building2, 
  Minus, 
  Plus, 
  AlertCircle 
} from 'lucide-react';

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
  if (!isOpen || !payingSupplier) return null;

  // Filter pending POs for this supplier
  const supplierPendingPOs = purchaseOrders.filter(
    po => (po.supplier === payingSupplier?.id || po.supplier_name === payingSupplier?.name) &&
          (po.status !== 'CANCELLED') &&
          (parseFloat(po.total_amount || 0) > parseFloat(po.paid_amount || 0))
  );

  const gullaCashAvailable = gullaSummary?.cash_in_hand ?? gullaSummary?.net_cash_in_gulla ?? 0;
  const dueAmount = Number(payingSupplier?.pending_balance || 0);
  const targetAmount = parseFloat(paymentForm.amount || 0);
  const isOverpaying = targetAmount > dueAmount && dueAmount > 0;
  const isInvalidAmount = !targetAmount || targetAmount <= 0 || isOverpaying;
  const remainingBalance = Math.max(0, dueAmount - targetAmount);

  // Auto-fill greedy note calculation
  const handleAutoFillNotes = (amountToFill) => {
    let rem = Math.round(amountToFill);
    const newCounts = { 500: 0, 200: 0, 100: 0, 50: 0, 20: 0, 10: 0, 5: 0, coins: 0 };

    DENOMS.forEach(d => {
      if (rem >= d) {
        const cnt = Math.floor(rem / d);
        rem %= d;
        const key = d === 1 ? 'coins' : String(d);
        newCounts[key] = cnt;
      }
    });

    setDenominations(newCounts);
  };

  const updateDenomCount = (denom, delta) => {
    const key = denom === 1 ? 'coins' : String(denom);
    const currentCnt = parseInt(denominations[key] || 0, 10);
    const newCnt = Math.max(0, currentCnt + delta);
    const newCounts = { ...denominations, [key]: newCnt };
    setDenominations(newCounts);

    const newTot = DENOMS.reduce((sum, dom) => {
      const k = dom === 1 ? 'coins' : String(dom);
      return sum + ((newCounts[k] || 0) * dom);
    }, 0);
    if (newTot > 0) {
      setPaymentForm(prev => ({ ...prev, amount: newTot }));
    }
  };

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
      maxWidth="max-w-xl"
      title={
        <span className="flex items-center gap-3 text-left">
          <span className="w-10 h-10 rounded-2xl bg-[#00796b] text-white flex items-center justify-center font-bold text-lg shadow-md shadow-[#00796b]/20 shrink-0">
            <IndianRupee className="w-5 h-5" />
          </span>
          <span className="block min-w-0">
            <span className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight block">
              Record Vendor Payout
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block truncate">
              Supplier: <strong className="text-slate-800 dark:text-slate-100">{payingSupplier?.company_name || payingSupplier?.name}</strong>
            </span>
          </span>
        </span>
      }
      footer={
        <div className="w-full flex items-center justify-end gap-3">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            className="px-5 py-2.5 rounded-xl font-semibold border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-all text-sm cursor-pointer"
          >
            Cancel
          </Button>
          <Button 
            type="button"
            onClick={onSavePayment}
            disabled={isInvalidAmount}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              isInvalidAmount
                ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-[#00796b] hover:bg-[#004d40] text-white shadow-teal-600/20 active:scale-95 cursor-pointer'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Record Payment Receipt</span>
          </Button>
        </div>
      }
    >
      <form onSubmit={onSavePayment} className="space-y-5 font-sans text-slate-800 dark:text-slate-100 pb-1">
        
        {/* 1. Pending Balance Card */}
        <div className={`p-4 rounded-2xl border shadow-2xs flex items-center justify-between transition-all ${
          dueAmount > 0 
            ? 'bg-gradient-to-br from-amber-50/90 to-orange-50/40 dark:from-slate-800/90 dark:to-amber-950/30 border-amber-200/80 dark:border-amber-800/50' 
            : 'bg-gradient-to-br from-emerald-50/90 to-teal-50/40 dark:from-slate-800/90 dark:to-emerald-950/30 border-emerald-200/80 dark:border-emerald-800/50'
        }`}>
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
              <Wallet className="w-3.5 h-3.5 text-[#00796b] dark:text-teal-400" />
              <span>Total Outstanding Balance</span>
            </div>
            <div className="text-xs font-mono font-medium text-slate-400 dark:text-slate-500">
              Vendor ID: <span className="font-semibold text-slate-600 dark:text-slate-300">#SUP-{payingSupplier.id}</span>
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black font-mono tracking-tight shrink-0 ${
            dueAmount > 0 ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-400'
          }`}>
            ₹{dueAmount.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Order-Wise Selection */}
        {supplierPendingPOs.length > 0 && (
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#00796b]" /> Link Specific Purchase Order (Optional)
            </label>
            <select
              value={paymentForm.purchase_order || ''}
              onChange={(e) => {
                const poId = e.target.value;
                const selectedPO = supplierPendingPOs.find(p => p.id === Number(poId));
                const due = selectedPO ? (parseFloat(selectedPO.total_amount) - parseFloat(selectedPO.paid_amount || 0)) : (payingSupplier?.pending_balance || '');
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
              className="w-full px-3.5 py-2.5 text-xs font-bold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#00796b] outline-hidden text-slate-800 dark:text-slate-100"
            >
              <option value="">-- General Supplier Balance (Not linked to single PO) --</option>
              {supplierPendingPOs.map(po => {
                const due = (parseFloat(po.total_amount) - parseFloat(po.paid_amount || 0)).toFixed(2);
                return (
                  <option key={po.id} value={po.id}>
                    PO #{po.po_number} - Total ₹{po.total_amount} | Due ₹{due}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        {/* 2. Amount Paid Input */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Amount Paid (₹) <span className="text-rose-500">*</span>
            </label>
            {dueAmount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setPaymentForm({ ...paymentForm, amount: String(dueAmount) });
                  handleAutoFillNotes(dueAmount);
                }}
                className="text-[11px] font-semibold text-[#00796b] hover:text-[#004d40] dark:text-teal-400 hover:underline cursor-pointer"
              >
                Pay Full Dues (₹{dueAmount.toLocaleString('en-IN')})
              </button>
            )}
          </div>

          <div className="relative rounded-2xl shadow-2xs">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-lg font-mono">
              ₹
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              value={paymentForm.amount}
              onChange={(e) => {
                const val = e.target.value;
                setPaymentForm({ ...paymentForm, amount: val });
                if (parseFloat(val) > 0) {
                  handleAutoFillNotes(parseFloat(val));
                }
              }}
              placeholder="0.00"
              className={`w-full pl-9 pr-4 py-3 text-lg font-black bg-white dark:bg-slate-800 border rounded-2xl outline-hidden font-mono transition-all ${
                isOverpaying 
                  ? 'border-rose-400 focus:ring-2 focus:ring-rose-500 text-rose-700 dark:text-rose-300' 
                  : 'border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-[#00796b] text-slate-900 dark:text-white'
              }`}
            />
          </div>

          {/* Validation Feedback */}
          {isOverpaying ? (
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1 mt-1">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              Payout amount cannot exceed pending supplier balance (₹{dueAmount.toLocaleString('en-IN')}).
            </p>
          ) : null}
        </div>

        {/* 3. Payment Method Selector */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Payment Method
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'CASH', label: 'CASH (Gulla)', icon: Banknote },
              { id: 'BANK_TRANSFER', label: 'Bank Transfer', icon: Building2 },
              { id: 'UPI', label: 'UPI Payment', icon: Smartphone },
              { id: 'CHEQUE', label: 'Cheque', icon: CreditCard },
            ].map((method) => {
              const MethodIcon = method.icon;
              const isSelected = paymentForm.payment_method === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => {
                    setPaymentForm({ ...paymentForm, payment_method: method.id });
                    if (method.id === 'CASH' && targetAmount > 0) {
                      handleAutoFillNotes(targetAmount);
                    }
                  }}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-[#00796b] text-[#00796b] dark:text-teal-300 shadow-2xs ring-1 ring-[#00796b]' 
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                  }`}
                >
                  <MethodIcon className={`w-4 h-4 ${isSelected ? 'text-[#00796b] dark:text-teal-300' : 'text-slate-400'}`} />
                  <span className="text-center">{method.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Live Gulla Register & Rupee Note Calculator (Only for CASH mode) */}
        {paymentForm.payment_method === 'CASH' && (
          <div className="space-y-3 pt-1">
            <div className="p-3.5 bg-gradient-to-r from-[#004D40] via-[#00695C] to-[#004D40] text-white rounded-2xl shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center text-[#4DB6AC] font-black">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#E0F2F1]">
                    Gulla Register Cash Balance
                  </p>
                  <p className="text-lg font-black text-white font-mono mt-0.5">
                    ₹{Number(gullaCashAvailable).toLocaleString('en-IN')}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-white/10 border border-white/20 text-[#E0F2F1] text-[10px] font-extrabold rounded-full flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#4DB6AC] animate-pulse"></span> Gulla Active
              </span>
            </div>

            {/* Rupee Note Denomination Calculator */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-[#263238] dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Calculator className="w-4 h-4 text-[#00695C]" /> Quick Cash Counter
                </label>
                <button
                  type="button"
                  onClick={() => handleAutoFillNotes(targetAmount)}
                  className="text-[10px] font-bold text-[#00695C] dark:text-[#4DB6AC] hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Zap className="w-3.5 h-3.5 fill-[#00695C] text-[#00695C]" /> Auto-Fill Notes
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {DENOMS.map((d) => {
                  const key = d === 1 ? 'coins' : String(d);
                  const count = denominations[key] !== undefined ? denominations[key] : '';
                  return (
                    <div key={d} className="p-2 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-between gap-1">
                      <span className="text-xs font-black text-slate-700 dark:text-slate-200 font-mono w-10 shrink-0">
                        {d === 1 ? 'Coin' : `₹${d}`}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateDenomCount(d, -1)}
                          className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                          title="Decrease"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={count}
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
                          className="w-8 text-center py-0.5 text-xs font-mono font-bold bg-transparent outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={() => updateDenomCount(d, 1)}
                          className="w-5 h-5 rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-200 flex items-center justify-center text-xs font-bold cursor-pointer transition-colors"
                          title="Increase"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500">Calculated Cash Notes Total:</span>
                  <span className={`font-black text-sm font-mono ${diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-sky-600' : 'text-amber-600'}`}>
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
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Reference / UTR No.</label>
            <input
              type="text"
              value={paymentForm.reference_number}
              onChange={(e) => setPaymentForm({ ...paymentForm, reference_number: e.target.value })}
              placeholder="e.g. UTR-987123"
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-slate-100"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Payment Date</label>
            <input
              type="date"
              value={paymentForm.payment_date}
              onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
              className="w-full px-3.5 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-mono text-slate-800 dark:text-slate-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">Payment Notes</label>
          <input
            type="text"
            value={paymentForm.notes}
            onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
            placeholder="Partial payment against invoice #1024"
            className="w-full px-3.5 py-2.5 text-xs bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* 6. Live Payment Summary */}
        <div className="p-3.5 bg-slate-50/90 dark:bg-slate-800/40 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
            Payment Summary
          </span>
          <div className="space-y-1.5 font-medium pt-0.5">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
              <span>Total Outstanding Balance</span>
              <span className="font-mono font-bold">₹{dueAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between text-slate-900 dark:text-white font-bold">
              <span>Payout Amount</span>
              <span className="font-mono text-[#00796b] dark:text-teal-400">₹{targetAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex items-center justify-between pt-1.5 border-t border-slate-200/70 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100">
              <span>Remaining Vendor Balance</span>
              <span className={`font-mono text-sm ${remainingBalance > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                ₹{remainingBalance.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

      </form>
    </Modal>
  );
};

export default SupplierPaymentModal;
