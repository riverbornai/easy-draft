const STEPS = [
  { label: 'Intake',    key: 'intake'    },
  { label: 'Research',  key: 'research'  },
  { label: 'Writer',    key: 'writing'   },
  { label: 'Review',    key: 'review'    },
  { label: 'Publisher', key: 'publish'   },
  { label: 'Eval',      key: 'done'      },
];

const STATUS_TO_STEP = {
  created: -1, intake: 0, 'intake-complete': 0, 'research-ready': 0,
  research: 1, 'research-complete': 1,
  'writing-ready': 2, writing: 2,
  review: 3,
  publish: 4, 'eval-ready': 5, done: 5,
};

export default function PipelineBar({ pipelineStatus = 'idle', currentStep = -1 }) {
  const activeIdx = currentStep >= 0 ? currentStep : (STATUS_TO_STEP[pipelineStatus] ?? -1);
  const isDone    = pipelineStatus === 'done';

  return (
    <div className="bg-white border border-gray-100 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Pipeline</h3>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
          isDone                     ? 'bg-teal-50 text-teal-600'  :
          pipelineStatus === 'idle'  ? 'bg-gray-50 text-gray-400'  :
          pipelineStatus === 'error' ? 'bg-red-50 text-red-600'    :
                                       'bg-violet-50 text-violet-600'
        }`}>
          {pipelineStatus === 'idle' ? 'Idle' : pipelineStatus.replace(/-/g, ' ')}
        </span>
      </div>

      <div className="flex items-center gap-0">
        {STEPS.map((step, i) => {
          const done   = isDone || i < activeIdx;
          const active = !isDone && i === activeIdx;
          const pending = !done && !active;

          return (
            <div key={step.key} className="flex items-center flex-1 min-w-0">
              {/* Node */}
              <div className="flex flex-col items-center flex-shrink-0">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  done    ? 'bg-teal-500 border-teal-500'    :
                  active  ? 'bg-violet-500 border-violet-500' :
                            'bg-white border-gray-200'
                }`}>
                  {done ? (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : active ? (
                    <span className="w-2 h-2 rounded-full bg-white pulse-dot" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-gray-300" />
                  )}
                </div>
                <span className={`text-[10px] mt-1.5 font-medium whitespace-nowrap ${
                  done ? 'text-teal-600' : active ? 'text-violet-600' : 'text-gray-400'
                }`}>
                  {step.label}
                </span>
              </div>

              {/* Connector */}
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 mx-1 transition-all duration-500 ${
                  done ? 'bg-teal-400' : 'bg-gray-200'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
