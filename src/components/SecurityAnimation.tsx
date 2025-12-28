
import React, { useEffect, useState } from 'react';
import { ICONS } from '../constants';

const SecurityAnimation: React.FC = () => {
  const [steps, setSteps] = useState<string[]>([]);
  const allSteps = [
    "Establishing Zero-Knowledge Connection...",
    "Masking Source IP Address...",
    "Initializing End-to-End Encryption...",
    "Clearing Local Session Logs...",
    "Anonymous Tunnel Established."
  ];

  useEffect(() => {
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < allSteps.length) {
        setSteps(prev => [...prev, allSteps[currentStep]]);
        currentStep++;
      } else {
        clearInterval(interval);
      }
    }, 600);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-900 text-emerald-400 p-6 rounded-lg font-mono text-sm shadow-2xl border border-slate-700">
      <div className="flex items-center gap-2 mb-4 border-b border-slate-700 pb-2">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
        <span className="text-slate-400 ml-2">Secure Gateway v2.0</span>
      </div>
      <div className="space-y-2">
        {steps.map((step, idx) => (
          <div key={idx} className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
            <span className="text-emerald-600">[{idx === steps.length - 1 ? '●' : '✓'}]</span>
            <span>{step}</span>
          </div>
        ))}
      </div>
      {steps.length === allSteps.length && (
        <div className="mt-4 flex items-center gap-2 text-emerald-300 animate-pulse">
          <ICONS.Shield />
          <span className="font-bold">YOUR IDENTITY IS NOW PROTECTED</span>
        </div>
      )}
    </div>
  );
};

export default SecurityAnimation;
