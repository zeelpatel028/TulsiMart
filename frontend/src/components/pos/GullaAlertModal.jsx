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
            className="text-slate-600 dark:text-slate-300 border-slate-300 dark:border-slate-700"
          >
            હું સમજ્યો (Close)
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
            className="bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>ગલ્લામાં કેશ એડ કરો (Add Cash In)</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4 font-sans py-1">
        {/* Warning Banner */}
        <div className="p-4 bg-rose-50 dark:bg-rose-950/60 rounded-2xl border-2 border-rose-200 dark:border-rose-800/80 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/80 text-rose-600 dark:text-rose-300 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0">
            <h4 className="text-xs font-black text-rose-800 dark:text-rose-200 uppercase tracking-wider">
              નોટ ગલ્લા (Gulla) માં પ્રાપ્ય નથી!
            </h4>
            <p className="text-xs text-rose-700 dark:text-rose-300 font-bold leading-relaxed">
              {message || `તમારી પાસે ગલ્લામાં આપવા માટે પૂરતી નોટો નથી. કૃપા કરીને ઓપનિંગ ફ્લોટ અથવા Cash In વડે નોટો એડ કરો.`}
            </p>
          </div>
        </div>

        {/* Live Drawer Breakdown Snapshot */}
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
          <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
            ગલ્લામાં વર્તમાન નોટોની સ્થિતિ (Live Drawer Breakdown):
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
                      ? 'bg-rose-100 dark:bg-rose-900/80 border-rose-400 text-rose-900 dark:text-rose-100 font-black ring-2 ring-rose-400'
                      : isZero
                      ? 'bg-slate-100/90 dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 text-slate-400 opacity-60'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-[#384959] dark:text-slate-200'
                  }`}
                >
                  <div className="text-[10px] font-black">{d === 1 ? 'Coins' : `₹${d}`}</div>
                  <div className={`text-[11px] font-black mt-0.5 ${isZero ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
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
