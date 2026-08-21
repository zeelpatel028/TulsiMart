import React from 'react';
import { Modal } from '../../../components/common/Modal';
import { Button } from '../../../components/common/Button';
import { Plus, Trash2 } from 'lucide-react';

export const PurchaseOrderModal = ({
  isOpen,
  onClose,
  poForm,
  setPoForm,
  suppliers,
  products,
  calculatePOTotals,
  onSavePO
}) => {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Generate Purchase Order (PO)"
      subtitle="Select registered supplier & multiple product items with GST & discount calculation"
      maxWidth="max-w-3xl"
      footer={
        <div className="flex items-center justify-between w-full font-sans">
          <div className="text-xs text-left">
            <span className="text-slate-500 font-semibold">Grand Total PO Value: </span>
            <span className="font-extrabold text-[#384959] dark:text-[#88BDF2] text-sm">
              ₹{calculatePOTotals(poForm.items, poForm.gst_mode, poForm.tax_type).grandTotal.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="md" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="primary" size="md" onClick={onSavePO}>
              Issue PO Voucher
            </Button>
          </div>
        </div>
      }
    >
      <form onSubmit={onSavePO} className="space-y-4 text-xs font-sans">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">PO Number *</label>
            <input
              type="text"
              required
              value={poForm.po_number}
              onChange={(e) => setPoForm({ ...poForm, po_number: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono font-bold"
            />
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">Select Supplier *</label>
            <select
              required
              value={poForm.supplier}
              onChange={(e) => setPoForm({ ...poForm, supplier: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold"
            >
              <option value="">-- Choose Vendor --</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.company_name || s.name} ({s.city})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider mb-1">Expected Delivery</label>
            <input
              type="date"
              value={poForm.expected_delivery}
              onChange={(e) => setPoForm({ ...poForm, expected_delivery: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono"
            />
          </div>
        </div>

        {/* Line items builder */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="font-bold text-[#384959] dark:text-slate-300 uppercase tracking-wider">Purchase Items List</label>
            <Button
              variant="outline"
              size="xs"
              icon={Plus}
              onClick={() => setPoForm(prev => ({
                ...prev,
                items: [...prev.items, { product: '', product_name: '', quantity: 10, unit_cost: 0, discount_rate: 0, tax_rate: 0 }]
              }))}
            >
              Add Item
            </Button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {poForm.items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
                <select
                  value={item.product}
                  onChange={(e) => {
                    const selectedProd = products.find(p => p.id === Number(e.target.value));
                    const updatedItems = [...poForm.items];
                    updatedItems[idx] = {
                      ...updatedItems[idx],
                      product: e.target.value,
                      product_name: selectedProd ? selectedProd.name : '',
                      unit_cost: selectedProd ? selectedProd.cost_price : 0
                    };
                    setPoForm({ ...poForm, items: updatedItems });
                  }}
                  className="flex-1 px-2 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-bold"
                >
                  <option value="">-- Choose Stock Product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock_quantity})</option>
                  ))}
                </select>

                <input
                  type="number"
                  min="1"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={(e) => {
                    const updatedItems = [...poForm.items];
                    updatedItems[idx].quantity = e.target.value;
                    setPoForm({ ...poForm, items: updatedItems });
                  }}
                  className="w-16 px-2 py-1.5 text-xs font-bold text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg"
                />

                <input
                  type="number"
                  min="0"
                  placeholder="Cost ₹"
                  value={item.unit_cost}
                  onChange={(e) => {
                    const updatedItems = [...poForm.items];
                    updatedItems[idx].unit_cost = e.target.value;
                    setPoForm({ ...poForm, items: updatedItems });
                  }}
                  className="w-20 px-2 py-1.5 text-xs font-bold text-right bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg font-mono"
                />

                {poForm.items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setPoForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== idx) }))}
                    className="p-1 text-rose-500 hover:bg-rose-50 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default PurchaseOrderModal;
