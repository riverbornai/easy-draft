import { useState, useEffect } from 'react';
import axios from 'axios';
import { Trophy, BarChart3, ListOrdered } from 'lucide-react';

function MiniBar({ score, model }) {
  const color = model === 'gpt4o' ? 'bg-[#D4F53C]' : 'bg-[#0D2B22]';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#E8EDE6] rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-1000`} style={{ width: `${(score / 10) * 100}%` }} />
      </div>
      <span className="text-[10px] font-black text-[#0D2B22] w-6 text-right">{score?.toFixed(1)}</span>
    </div>
  );
}

export default function Eval() {
  const [leaderboard, setLeaderboard] = useState(null);

  useEffect(() => {
    axios.get('/api/eval/leaderboard').then(r => setLeaderboard(r.data)).catch(() => { });
  }, []);

  const runs = leaderboard?.runs ?? [];
  const winner = leaderboard?.overallWinner;

  return (
    <div className="p-4 sm:p-6 max-w-[70rem] mx-auto fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-black text-[#0D2B22] flex items-center gap-3 tracking-tight">
          <BarChart3 size={28} className="text-[#0D2B22]" />
          Intelligence Analysis
        </h1>
        <p className="text-xs text-[#1A4435] font-black uppercase tracking-[0.2em] mt-2">Historical Performance Benchmarks</p>
      </div>

      {winner && (
        <div className="mb-8 flex flex-col sm:flex-row items-center text-center sm:text-left gap-4 sm:gap-6 px-6 sm:px-8 py-6 rounded-[2rem] bg-white border border-[#E8EDE6] shadow-2xl shadow-[#0D2B22]/5 fade-in relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#F2FFEE] rounded-full -mr-24 -mt-24 opacity-40 group-hover:scale-110 transition-transform duration-1000" />
          <div className="p-5 rounded-2xl bg-[#0D2B22] text-[#D4F53C] shadow-lg z-10 flex-shrink-0">
            <Trophy size={32} />
          </div>
          <div className="z-10 flex flex-col items-center sm:items-start">
            <p className="text-2xl font-black text-[#0D2B22] tracking-tighter">
              {winner === 'gpt4o' ? 'GPT-4o leads the Studio' : 'Claude leads the Studio'}
            </p>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3 mt-4">
              <span className="text-[10px] text-[#0D2B22] font-black uppercase tracking-[0.2em] bg-[#D4F53C] px-4 py-2 rounded-xl border border-[#D4F53C]">
                {leaderboard?.gpt4oWins} Victories
              </span>
              <span className="text-[10px] text-[#D4F53C] font-black uppercase tracking-[0.2em] bg-[#0D2B22] px-4 py-2 rounded-xl border border-[#0D2B22]">
                {leaderboard?.claudeWins} Victories
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bar chart */}
      <div className="bg-white border border-[#E8EDE6] rounded-[1.5rem] p-4 sm:p-6 mb-6 shadow-sm relative overflow-hidden group">
        <h3 className="text-[11px] font-black text-[#1A4435] uppercase tracking-[0.2em] mb-8">Performance Trajectory</h3>
        <div className="flex items-end gap-6 h-56 overflow-x-auto pb-6 custom-scrollbar">
          {runs.slice(0, 12).reverse().map((run, i) => (
            <div key={`${run.id}-${i}`} className="flex flex-col items-center gap-3 flex-shrink-0 min-w-[80px] group/bar">
            <div className="flex items-end gap-2 h-40">
                <div className="flex flex-col justify-end group/gpt">
                  <span className="text-[9px] font-black text-[#1A4435] text-center mb-1 opacity-0 group-hover/bar:opacity-100 transition-opacity">{run.gpt4oScore?.toFixed(1)}</span>
                  <div className="w-7 bg-[#D4F53C] rounded-t-xl transition-all group-hover/bar:brightness-110 shadow-[0_0_15px_rgba(212,245,60,0.2)]" style={{ height: `${((run.gpt4oScore ?? 0) / 10) * 140}px` }} />
                </div>
                <div className="flex flex-col justify-end group/claude">
                  <span className="text-[9px] font-black text-[#0D2B22] text-center mb-1 opacity-0 group-hover/bar:opacity-100 transition-opacity">{run.claudeScore?.toFixed(1)}</span>
                  <div className="w-7 bg-[#0D2B22] rounded-t-xl transition-all group-hover/bar:brightness-125 shadow-[0_0_15px_rgba(13,43,34,0.1)]" style={{ height: `${((run.claudeScore ?? 0) / 10) * 140}px` }} />
                </div>
              </div>
              <span className="text-[9px] font-black text-[#1A4435]/40 uppercase tracking-widest">Run {runs.length - (runs.slice(0, 12).length - 1 - i)}</span>
            </div>
          ))}
          {runs.length === 0 && <div className="flex-1 flex items-center justify-center text-[#1A4435]/30 text-sm font-black uppercase tracking-widest py-20">No evaluation data available</div>}
        </div>
        <div className="flex gap-8 mt-6 pt-6 border-t border-[#E8EDE6]">
          <span className="flex items-center gap-3 text-[10px] font-black text-[#1A4435] uppercase tracking-[0.2em]">
            <span className="w-4 h-4 bg-[#D4F53C] rounded-lg shadow-md border border-[#D4F53C]/20" />GPT-4o
          </span>
          <span className="flex items-center gap-3 text-[10px] font-black text-[#1A4435] uppercase tracking-[0.2em]">
            <span className="w-4 h-4 bg-[#0D2B22] rounded-lg shadow-md" />Claude
          </span>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="bg-white border border-[#E8EDE6] rounded-[1.5rem] overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-[#E8EDE6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F2FFEE]/30">
          <h3 className="text-[12px] font-black text-[#0D2B22] uppercase tracking-[0.2em] flex items-center gap-3 justify-center sm:justify-start">
            <ListOrdered size={16} />
            Intelligence Leaderboard
          </h3>
          <span className="text-[10px] font-black text-[#1A4435] uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-[#E8EDE6] shadow-sm self-center sm:self-auto">
            {runs.length} Sessions
          </span>
        </div>
        {/* Mobile card list (visible on mobile, hidden on desktop) */}
        <div className="block md:hidden divide-y divide-[#E8EDE6]/50 bg-white">
          {runs.length === 0 ? (
            <div className="text-center py-20 text-[#1A4435]/40 text-xs font-black uppercase tracking-[0.2em]">No session data available</div>
          ) : (
            runs.map((run, i) => (
              <div key={`${run.id}-${i}`} className="p-5 flex flex-col gap-4 hover:bg-[#F2FFEE]/10 transition-all duration-300">
                <div className="flex justify-between items-center">
                  <span className="text-[#1A4435]/30 text-[10px] font-black">#{runs.length - i}</span>
                  <span className="text-[10px] font-black bg-white text-[#1A4435] px-3 py-1.5 rounded-xl uppercase tracking-wider border border-[#E8EDE6] shadow-sm">
                    {run.channel}
                  </span>
                </div>
                <div>
                  <h4 className="text-[#0D2B22] text-[13px] font-black leading-snug">
                    {run.topic}
                  </h4>
                </div>
                <div className="flex items-center justify-between gap-4 pt-1">
                  <span className="text-[10px] font-black text-[#1A4435] uppercase tracking-[0.15em]">Winner</span>
                  {run.winner ? (
                    <span className={`text-[10px] font-black px-4 py-2 rounded-xl border uppercase tracking-widest transition-all ${
                      run.winner === 'gpt4o'
                        ? 'bg-[#1A4435] text-[#D4F53C] border-[#1A4435] shadow-lg shadow-[#1A4435]/10'
                        : 'bg-[#0D2B22] text-[#D4F53C] border-[#0D2B22] shadow-lg shadow-[#0D2B22]/10'
                    }`}>
                      {run.winner === 'gpt4o' ? 'GPT-4o' : 'Claude'}
                    </span>
                  ) : (
                    <span className="text-[#E8EDE6] text-xs">—</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#E8EDE6]/40">
                  <div>
                    <span className="text-[9px] font-black text-[#1A4435]/50 uppercase tracking-[0.15em] block mb-1">GPT-4o</span>
                    <MiniBar score={run.gpt4oScore} model="gpt4o" />
                  </div>
                  <div>
                    <span className="text-[9px] font-black text-[#1A4435]/50 uppercase tracking-[0.15em] block mb-1">Claude</span>
                    <MiniBar score={run.claudeScore} model="claude" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop table (hidden on mobile, visible on desktop) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#E8EDE6]/20 border-b border-[#E8EDE6]">
                {['#', 'Session Topic', 'Platform', 'Winner', 'GPT-4o', 'Claude'].map(h => (
                  <th key={h} className="text-left px-6 py-4 text-[10px] font-black text-[#1A4435] uppercase tracking-[0.2em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8EDE6]/50">
              {runs.length === 0
                ? <tr><td colSpan={6} className="text-center py-20 text-[#1A4435]/40 text-xs font-black uppercase tracking-[0.2em]">No session data available</td></tr>
                : runs.map((run, i) => (
                  <tr key={`${run.id}-${i}`} className="hover:bg-[#F2FFEE]/20 transition-all duration-300 group">
                    <td className="px-6 py-4 text-[#1A4435]/30 text-[10px] font-black">{runs.length - i}</td>
                    <td className="px-6 py-4">
                      <p className="text-[#0D2B22] text-[13px] font-black truncate max-w-[280px] group-hover:translate-x-1 transition-transform">
                        {run.topic}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-[10px] font-black bg-white text-[#1A4435] px-3 py-1.5 rounded-xl uppercase tracking-wider border border-[#E8EDE6] shadow-sm">
                        {run.channel}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {run.winner
                        ? <span className={`text-[10px] font-black px-4 py-2 rounded-xl border uppercase tracking-widest transition-all ${run.winner === 'gpt4o'
                          ? 'bg-[#1A4435] text-[#D4F53C] border-[#1A4435] shadow-lg shadow-[#1A4435]/10'
                          : 'bg-[#0D2B22] text-[#D4F53C] border-[#0D2B22] shadow-lg shadow-[#0D2B22]/10'
                          }`}>
                          {run.winner === 'gpt4o' ? 'GPT-4o' : 'Claude'}
                        </span>
                        : <span className="text-[#E8EDE6] text-xs">—</span>}
                    </td>
                    <td className="px-6 py-4 w-28 sm:w-48"><MiniBar score={run.gpt4oScore} model="gpt4o" /></td>
                    <td className="px-6 py-4 w-28 sm:w-48"><MiniBar score={run.claudeScore} model="claude" /></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
