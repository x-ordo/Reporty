import React, { useState, useEffect } from 'react';
import { TimelineEvent } from '../types';
import { ICONS } from '../constants';

interface Props {
  events: TimelineEvent[];
  headHash: string;
  onVerificationComplete?: (isValid: boolean) => void;
}

interface NodeVerification {
  nodeId: string;
  isVerified: boolean;
  isVerifying: boolean;
}

const EvidenceChain: React.FC<Props> = ({ events, headHash, onVerificationComplete }) => {
  const [verifications, setVerifications] = useState<NodeVerification[]>([]);
  const [chainValid, setChainValid] = useState<boolean | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [expandedNode, setExpandedNode] = useState<string | null>(null);
  const [animatedNodes, setAnimatedNodes] = useState<Set<string>>(new Set());

  // Animate nodes on mount
  useEffect(() => {
    events.forEach((event, idx) => {
      setTimeout(() => {
        setAnimatedNodes(prev => new Set([...prev, event.id]));
      }, idx * 150);
    });
  }, [events]);

  // Verify chain integrity
  const verifyChain = async () => {
    setIsVerifying(true);
    setVerifications([]);

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      setVerifications(prev => [...prev, { nodeId: event.id, isVerified: false, isVerifying: true }]);

      // Simulate verification delay for visual effect
      await new Promise(resolve => setTimeout(resolve, 300));

      // Check if prevEventHash matches the previous event's hash
      const isValid = i === 0
        ? event.prevEventHash === null
        : event.prevEventHash === events[i - 1].eventHash;

      setVerifications(prev =>
        prev.map(v => v.nodeId === event.id ? { ...v, isVerified: isValid, isVerifying: false } : v)
      );

      if (!isValid) {
        setChainValid(false);
        setIsVerifying(false);
        onVerificationComplete?.(false);
        return;
      }
    }

    // Check if head hash matches last event
    const lastEvent = events[events.length - 1];
    const headValid = lastEvent?.eventHash === headHash;

    setChainValid(headValid);
    setIsVerifying(false);
    onVerificationComplete?.(headValid);
  };

  const getVerificationStatus = (eventId: string) => {
    return verifications.find(v => v.nodeId === eventId);
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'received': return <ICONS.FileText className="w-4 h-4" />;
      case 'investigation_started': return <ICONS.Activity className="w-4 h-4" />;
      case 'protective_action': return <ICONS.Shield className="w-4 h-4" />;
      case 'resolution': return <ICONS.CheckCircle className="w-4 h-4" />;
      default: return <ICONS.Clock className="w-4 h-4" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'received': return 'bg-blue-500';
      case 'investigation_started': return 'bg-amber-500';
      case 'protective_action': return 'bg-emerald-500';
      case 'resolution': return 'bg-purple-500';
      default: return 'bg-slate-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Chain Status Header */}
      <div className="flex items-center justify-between bg-slate-900 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${
            chainValid === null ? 'bg-slate-500' :
            chainValid ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-pulse'
          }`} />
          <span className="text-white font-bold text-sm uppercase tracking-wider">
            {chainValid === null ? 'Chain Integrity: Pending' :
             chainValid ? 'Chain Integrity: Verified' : 'Chain Integrity: BROKEN'}
          </span>
        </div>
        <button
          onClick={verifyChain}
          disabled={isVerifying}
          className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isVerifying ? (
            <>
              <ICONS.Activity className="w-3 h-3 animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <ICONS.Shield className="w-3 h-3" />
              Verify Chain
            </>
          )}
        </button>
      </div>

      {/* Evidence Head Hash */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl p-4 border border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <ICONS.Lock className="w-4 h-4 text-emerald-400" />
          <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Evidence Head Hash</span>
        </div>
        <code className="text-slate-300 text-sm font-mono break-all">{headHash}</code>
      </div>

      {/* Timeline */}
      <div className="relative">
        {events.map((event, idx) => {
          const verification = getVerificationStatus(event.id);
          const isAnimated = animatedNodes.has(event.id);
          const isExpanded = expandedNode === event.id;
          const isLast = idx === events.length - 1;

          return (
            <div
              key={event.id}
              className={`relative transition-all duration-500 ${
                isAnimated ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'
              }`}
            >
              {/* Connection Line */}
              {!isLast && (
                <div className="absolute left-6 top-14 w-0.5 h-full bg-gradient-to-b from-slate-300 to-slate-200 z-0">
                  {/* Hash Link Arrow */}
                  <div className="absolute -left-[7px] top-1/2 transform -translate-y-1/2">
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 rounded-full bg-slate-200 flex items-center justify-center">
                        <ICONS.ChevronRight className="w-2 h-2 text-slate-500" />
                      </div>
                      <span className="text-[8px] font-mono text-slate-400 bg-white px-1 rounded">
                        PREV_H
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Event Node */}
              <div
                className={`relative z-10 mb-8 pl-16 cursor-pointer group`}
                onClick={() => setExpandedNode(isExpanded ? null : event.id)}
              >
                {/* Node Circle */}
                <div className={`absolute left-3 top-2 w-7 h-7 rounded-full ${getEventColor(event.type)}
                  flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110
                  ${verification?.isVerifying ? 'animate-pulse' : ''}
                  ${verification?.isVerified === false ? 'ring-4 ring-red-300' : ''}
                  ${verification?.isVerified === true ? 'ring-4 ring-emerald-300' : ''}`}
                >
                  {verification?.isVerifying ? (
                    <ICONS.Activity className="w-3 h-3 animate-spin" />
                  ) : verification?.isVerified === true ? (
                    <ICONS.CheckCircle className="w-3 h-3" />
                  ) : verification?.isVerified === false ? (
                    <ICONS.AlertOctagon className="w-3 h-3" />
                  ) : (
                    getEventIcon(event.type)
                  )}
                </div>

                {/* Event Card */}
                <div className={`bg-white rounded-2xl border-2 transition-all duration-300
                  ${isExpanded ? 'border-blue-300 shadow-lg' : 'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'}`}
                >
                  <div className="p-5">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white ${getEventColor(event.type)}`}>
                          {event.type.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          by {event.actorRole}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(event.createdAt).toLocaleString('ko-KR')}
                      </span>
                    </div>

                    {/* Data */}
                    <p className="text-slate-600 text-sm mb-4">
                      {Object.entries(event.data).map(([key, value]) => (
                        <span key={key} className="mr-3">
                          <span className="text-slate-400">{key}:</span> {String(value)}
                        </span>
                      ))}
                    </p>

                    {/* Hash Info (Collapsed) */}
                    <div className="flex items-center gap-4 text-[9px] font-mono">
                      <div className="flex items-center gap-1 text-slate-400 bg-slate-50 px-2 py-1 rounded">
                        <span className="text-slate-500">H:</span>
                        <span className="text-slate-600">{event.eventHash}</span>
                      </div>
                      {event.prevEventHash && (
                        <div className="flex items-center gap-1 text-slate-300 bg-slate-50 px-2 py-1 rounded">
                          <span className="text-slate-400">←</span>
                          <span>{event.prevEventHash}</span>
                        </div>
                      )}
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-slate-400 font-bold uppercase tracking-wider mb-1">Event ID</p>
                            <code className="text-slate-600 font-mono">{event.id}</code>
                          </div>
                          <div>
                            <p className="text-slate-400 font-bold uppercase tracking-wider mb-1">Actor Role</p>
                            <code className="text-slate-600 font-mono">{event.actorRole}</code>
                          </div>
                          <div className="col-span-2">
                            <p className="text-slate-400 font-bold uppercase tracking-wider mb-1">Current Hash</p>
                            <code className="text-emerald-600 font-mono text-[10px] break-all bg-emerald-50 p-2 rounded block">
                              {event.eventHash}
                            </code>
                          </div>
                          <div className="col-span-2">
                            <p className="text-slate-400 font-bold uppercase tracking-wider mb-1">Previous Hash</p>
                            <code className={`font-mono text-[10px] break-all p-2 rounded block ${
                              event.prevEventHash ? 'text-blue-600 bg-blue-50' : 'text-slate-400 bg-slate-50'
                            }`}>
                              {event.prevEventHash || 'NULL (Genesis Block)'}
                            </code>
                          </div>
                          <div className="col-span-2">
                            <p className="text-slate-400 font-bold uppercase tracking-wider mb-1">Raw Data</p>
                            <pre className="text-slate-600 font-mono text-[10px] bg-slate-50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(event.data, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Chain End Marker */}
        <div className="relative z-10 pl-16">
          <div className="absolute left-3 top-0 w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center text-white shadow-lg">
            <ICONS.Lock className="w-3 h-3" />
          </div>
          <div className="bg-slate-900 rounded-2xl p-4 text-white">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-emerald-400 text-xs font-bold uppercase tracking-widest">Chain Head</span>
              {chainValid === true && (
                <span className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-full">
                  VERIFIED
                </span>
              )}
            </div>
            <code className="text-slate-400 text-[10px] font-mono">{headHash}</code>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-[10px] text-slate-400 pt-4 border-t border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span>Received</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span>Investigation</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span>Action</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span>Resolution</span>
        </div>
      </div>
    </div>
  );
};

export default EvidenceChain;
