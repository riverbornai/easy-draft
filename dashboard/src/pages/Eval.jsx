import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy } from 'lucide-react';

function MiniBar({ score, color }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${(score / 10) * 100}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-6 text-right">{score?.toFixed(1)}</span>
    </div>
  );
}

export default function Eval() {
  const [leaderboard, setLeaderboard] = useState(null);

  useEffect(() => {
    axios.get('/api/eval/leaderboard').then(r => setLeaderboard(r.data)).catch(() => {});
  }, []);

  const runs   = leaderboard?.runs ?? [];
  const winner = leaderboard?.overallWinner;

  return (
    <div className="p-8 max-w-5xl mx-auto fade-in">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Eval</h1>
        <p className="text-sm text-gray-400 mt-1">Score comparison — GPT-4o vs Claude</p>
      </div>

      {winner && (
        <div className={`mb-6 flex items-center gap-3 px-5 py-4 rounded-xl border fade-in ${winner === 'gpt4o' ? 'bg-teal-50 border-teal-200' : 'bg-violet-50 border-violet-200'}`}>
          <Trophy size={20} className={winner === 'gpt4o' ? 'text-teal-500' : 'text-violet-500'} />
          <div>
            <p className={`text-sm font-bold ${winner === 'gpt4o' ? 'text-teal-800' : 'text-violet-800'}`}>
              {winner === 'gpt4o' ? 'GPT-4o leads overall' : 'Claude leads overall'}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {leaderboard?.gpt4oWins} GPT-4o wins · {leaderboard?.claudeWins} Claude wins
            </p>
          </div>
        </div>
      )}

      {/* Bar chart */}
      <div className="bg-white border border-gray-100 rounded-xl p-6 mb-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-5">Score Comparison</h3>
        <div className="flex items-end gap-3 h-40 overflow-x-auto pb-2">
          {runs.slice(0,10).reverse().map((run, i) => (
            <div key={`${run.id}-${i}`} className="flex flex-col items-center gap-1 flex-shrink-0 min-w-[60px]">
              <div className="flex items-end gap-1 h-32">
                <div className="flex flex-col justify-end">
                  <span className="text-[9px] text-teal-600 text-center mb-0.5">{run.gpt4oScore?.toFixed(1)}</span>
                  <div className="w-5 bg-teal-400 rounded-t" style={{ height: `${((run.gpt4oScore ?? 0)/10)*112}px` }} />
                </div>
                <div className="flex flex-col justify-end">
                  <span className="text-[9px] text-violet-600 text-center mb-0.5">{run.claudeScore?.toFixed(1)}</span>
                  <div className="w-5 bg-violet-400 rounded-t" style={{ height: `${((run.claudeScore ?? 0)/10)*112}px` }} />
                </div>
              </div>
              <span className="text-[9px] text-gray-400">#{i+1}</span>
            </div>
          ))}
          {runs.length === 0 && <div className="flex-1 flex items-center justify-center text-gray-300 text-sm">No data</div>}
        </div>
        <div className="flex gap-4 mt-3 pt-3 border-t border-gray-50">
          <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 bg-teal-400 rounded-sm inline-block"/>GPT-4o</span>
          <span className="flex items-center gap-1.5 text-xs text-gray-500"><span className="w-3 h-3 bg-violet-400 rounded-sm inline-block"/>Claude</span>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Leaderboard</h3>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['#','Topic','Channel','Winner','GPT-4o','Claude'].map(h => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {runs.length === 0
              ? <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">No completed runs</td></tr>
              : runs.map((run, i) => (
                <tr key={`${run.id}-${i}`} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 text-gray-400 text-xs font-mono">{i+1}</td>
                  <td className="px-3 py-3"><p className="text-gray-800 text-xs font-medium truncate max-w-[180px]">{run.topic}</p></td>
                  <td className="px-3 py-3"><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">{run.channel}</span></td>
                  <td className="px-3 py-3">
                    {run.winner
                      ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${run.winner==='gpt4o'?'bg-teal-50 text-teal-600':'bg-violet-50 text-violet-600'}`}>{run.winner==='gpt4o'?'GPT-4o':'Claude'}</span>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-3 py-3 w-32"><MiniBar score={run.gpt4oScore} color="bg-teal-400"/></td>
                  <td className="px-3 py-3 w-32"><MiniBar score={run.claudeScore} color="bg-violet-400"/></td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
