import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { AlertTriangle, PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const GullaAlertModal = ({
  isOpen,
  onClose,
  title = "⚠️ Gulla Drawer Cash Alert",
  message,
  denom,
  gullaDrawerNotes = {},
  onAddCashIn
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="max-w-md"
      footer={
        <div className="flex items-center justify-between w-full gap-2 font-sans">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-[#607D8B] dark:text-slate-300 border-[#B2DFDB] dark:border-slate-700"
          >
            Close
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              onClose();
              if (onAddCashIn) {
                onAddCashIn();
              } else {
                navigate('/gulla');
              }
            }}
            className="bg-[#E53935] hover:bg-[#c62828] text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-sm border-none"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Cash In</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4 font-sans py-1">
        {/* Warning Banner */}
        <div className="p-4 bg-[#FFEBEE] dark:bg-rose-950/60 rounded-2xl border-2 border-[#EF9A9A] dark:border-rose-800/80 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-rose-900/80 text-[#E53935] dark:text-rose-300 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0">
            <h4 className="text-xs font-black text-[#E53935] dark:text-rose-200 uppercase tracking-wider font-heading">
              Insufficient Notes in Gulla!
            </h4>
            <p className="text-xs text-[#263238] dark:text-rose-300 font-bold leading-relaxed">
              {message || `You do not have enough notes in Gulla drawer. Please add notes via Opening Float or Cash In.`}
            </p>
          </div>
        </div>

        {/* Live Drawer Breakdown Snapshot */}
        <div className="bg-[#F0FAF9] dark:bg-slate-800/60 p-3 rounded-2xl border border-[#B2DFDB] dark:border-slate-700 space-y-2">
          <span className="text-[10px] font-extrabold text-[#607D8B] uppercase tracking-wider block">
            Live Drawer Breakdown:
          </span>

          <div className="grid grid-cols-4 gap-1.5 text-xs font-bold">
            {[500, 200, 100, 50, 20, 10, 5, 1].map((d) => {
              const count = gullaDrawerNotes[d] !== undefined ? gullaDrawerNotes[d] : (gullaDrawerNotes[String(d)] || 0);
              const isTargetDenom = Number(denom) === d;
              const isZero = count <= 0;

              return (
                <div
                  key={d}
                  className={`p-2 rounded-xl border text-center font-mono transition-all ${
                    isTargetDenom
                      ? 'bg-[#FFEBEE] dark:bg-rose-900/80 border-[#EF9A9A] text-[#E53935] dark:text-rose-100 font-black ring-2 ring-[#E53935]/30'
                      : isZero
                      ? 'bg-slate-100/90 dark:bg-slate-800/90 border-[#B2DFDB]/50 dark:border-slate-700 text-[#607D8B] opacity-60'
                      : 'bg-white dark:bg-slate-800 border-[#B2DFDB] dark:border-slate-700 text-[#263238] dark:text-slate-200'
                  }`}
                >
                  <div className="text-[10px] font-black">{d === 1 ? 'Coins' : `₹${d}`}</div>
                  <div className={`text-[11px] font-black mt-0.5 ${isZero ? 'text-[#E53935]' : 'text-[#009688]'}`}>
                    {count} {d === 1 ? '₹' : 'N'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
};
