const STEPS = [
  { label: 'Intake',    key: 'intake'    },
  { label: 'Research',  key: 'research'  },
  { label: 'Writer',    key: 'writing'   },
  { label: 'Review',    key: 'review'    },
  { label: 'Eval',      key: 'eval'      },
  { label: 'Publisher', key: 'done'      },
];

const STATUS_TO_STEP = {
  created: -1, intake: 0, 'intake-complete': 0, 'research-ready': 0,
  research: 1, 'research-complete': 1,
  'writing-ready': 2, writing: 2,
  'review-ready': 3, review: 3,
  'eval-ready': 4, eval: 4, 'publish-ready': 5, done: 5,
};

export default function PipelineBar({ pipelineStatus = 'idle', currentStep = -1, reviewStatus = null }) {
  const activeIdx = currentStep >= 0 ? currentStep : (STATUS_TO_STEP[pipelineStatus] ?? -1);
  const isDone    = pipelineStatus === 'done';

  return (
    <div className="bg-[#F2FFEE]/30 border border-[#E8EDE6] rounded-2xl p-6">
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-[10px] font-black text-[#1A4435] uppercase tracking-[0.2em]">Workflow Progress</h3>
        <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-3 py-1 rounded-md border shadow-sm transition-all duration-500 ${
          isDone                     ? 'bg-[#0D2B22] border-[#0D2B22] text-[#D4F53C]'  :
          pipelineStatus === 'idle'  ? 'bg-white border-[#E8EDE6] text-[#1A4435]'  :
          pipelineStatus === 'error' ? 'bg-red-50 border-red-100 text-red-600'    :
                                       'bg-[#0D2B22] border-[#0D2B22] text-[#D4F53C]'
        }`}>
          {pipelineStatus === 'idle' ? 'Idle' : pipelineStatus.replace(/-/g, ' ')}
        </span>
      </div>

      <div className="flex items-start gap-0 pb-8">
        {STEPS.map((step, i) => {
          const isReviewPending = step.key === 'review' && reviewStatus === 'pending';
          const done   = isDone || i < activeIdx || isReviewPending;
          const active = !isDone && i === activeIdx && !isReviewPending;

          return (
            <div key={step.key} className="flex items-start flex-1 min-w-0 last:flex-none">
              {/* Node */}
              <div className="flex flex-col items-center flex-shrink-0 relative z-10 w-9">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center border-2 shadow-sm transition-all duration-700 cubic-bezier(0.16, 1, 0.3, 1) ${
                  done    ? 'bg-[#0D2B22] border-[#0D2B22] scale-110 shadow-lg' :
                  active  ? 'bg-[#0D2B22] border-[#0D2B22] scale-110 shadow-lg' :
                            'bg-white border-[#E8EDE6]'
                }`}>
                  {done ? (
                    <svg className="w-4 h-4 text-[#D4F53C]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : active ? (
                    <span className="w-2 h-2 rounded-full bg-[#D4F53C] animate-pulse shadow-[0_0_8px_rgba(212,245,60,0.8)]" />
                  ) : (
                    <span className="text-[10px] font-black text-[#1A4435]/30">{i + 1}</span>
                  )}
                </div>
                <span className={`text-[9px] absolute top-12 left-1/2 -translate-x-1/2 font-black uppercase tracking-widest whitespace-nowrap transition-colors duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${
                  done || active ? 'text-[#0D2B22]' : 'text-[#1A4435]/40'
                }`}>
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div className={`h-[2px] flex-1 mx-[-2px] mt-[17px] transition-all duration-700 relative overflow-hidden ${
                  done ? 'bg-[#0D2B22]' : 'bg-[#E8EDE6]'
                }`}>
                  {active && (
                    <div className="absolute inset-0 bg-gradient-to-r from-[#D4F53C] to-transparent animate-shimmer" />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
