import React, { useState, useEffect } from 'react';
import { Calendar, Activity, TrendingDown } from 'lucide-react';

const InsightsHeatmap = () => {
  const [heatmapData, setHeatmapData] = useState([]);
  
  useEffect(() => {
    // Generate/Load data from localStorage
    const loadData = () => {
      const stored = localStorage.getItem('neuroalert_history');
      let parsed = stored ? JSON.parse(stored) : {};
      
      // Transform into an array of 7 days, each with 24 hours
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        
        const hours = Array(24).fill(0);
        
        if (parsed[dayStr]) {
          Object.keys(parsed[dayStr]).forEach(hourStr => {
            const h = parseInt(hourStr);
            if (h >= 0 && h < 24) {
              hours[h] = parsed[dayStr][hourStr];
            }
          });
        }
        
        last7Days.push({
          date: d.toLocaleDateString('en-US', { weekday: 'short' }),
          hours: hours
        });
      }
      setHeatmapData(last7Days);
    };
    
    loadData();
    const interval = setInterval(loadData, 60000); // refresh every minute
    return () => clearInterval(interval);
  }, []);

  const getColor = (score) => {
    if (score === 0) return 'rgba(30, 41, 59, 0.5)'; // No data (slate-800)
    if (score < 30) return '#10b981'; // Green (Optimal)
    if (score < 60) return '#eab308'; // Yellow (Moderate)
    return '#ef4444'; // Red (Critical)
  };

  return (
    <div className="glass-panel p-5 mt-4">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={18} className="text-blue-400" />
        <h3 className="text-white font-bold tracking-wider">FATIGUE HEATMAP (7 DAYS)</h3>
      </div>
      
      <div className="flex">
        {/* Y-axis labels (Days) */}
        <div className="flex flex-col justify-around pr-2 text-[10px] text-slate-400 font-mono h-32">
          {heatmapData.map((d, i) => <span key={i}>{d.date}</span>)}
        </div>
        
        {/* Heatmap Grid */}
        <div className="flex-1 flex flex-col justify-between h-32">
          {heatmapData.map((day, i) => (
            <div key={i} className="flex flex-1 items-center gap-[2px]">
              {day.hours.map((score, h) => (
                <div 
                  key={h} 
                  className="flex-1 h-[10px] rounded-[1px] cursor-help transition-all hover:scale-150"
                  style={{ background: getColor(score) }}
                  title={`${day.date} ${h}:00 - Avg CLI: ${score > 0 ? Math.round(score) : 'No Data'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      
      {/* X-axis labels (Hours) */}
      <div className="flex justify-between pl-8 mt-1 text-[10px] text-slate-500 font-mono">
        <span>12am</span>
        <span>6am</span>
        <span>12pm</span>
        <span>6pm</span>
        <span>11pm</span>
      </div>

      <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-slate-400">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-[#10b981]" /> Optimal</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-[#eab308]" /> Moderate</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-sm bg-[#ef4444]" /> Critical</div>
      </div>
      
      <div className="mt-4 p-3 bg-slate-800/50 rounded-lg border border-slate-700/50 flex gap-3">
        <TrendingDown className="text-blue-400 flex-shrink-0" size={20} />
        <p className="text-xs text-slate-300">
          <strong>AI Insight:</strong> Track your natural circadian rhythm. Avoid scheduling heavy deep work during red blocks to maximize productivity and reduce burnout.
        </p>
      </div>
    </div>
  );
};

export default InsightsHeatmap;
