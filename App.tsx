
import React, { useState, useEffect } from 'react';
import { ViewState, Report, ReportStatus, ReportPriority, Tenant, DefensePack } from './types';
import { ICONS } from './constants';
import SecurityAnimation from './components/SecurityAnimation';
import DefenseReport from './components/DefenseReport';
import { generateEmploymentRule, getLegalAdvice } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING');
  const [reports, setReports] = useState<Report[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [companyName, setCompanyName] = useState('아이언랩 테크');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedRule, setGeneratedRule] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [packProgress, setPackProgress] = useState(0);
  const [currentPack, setCurrentPack] = useState<DefensePack | null>(null);
  const [trackCode, setTrackCode] = useState('');

  // Mock Data Initialization (Aligned with v11 Backend)
  useEffect(() => {
    const mockEvents = [
      { id: 'ev-1', type: 'received', actorRole: 'user', data: { channel: 'anonymous_web' }, prevEventHash: null, eventHash: 'hmac-8822-001', createdAt: new Date(Date.now() - 86400000 * 3).toISOString() },
      { id: 'ev-2', type: 'investigation_started', actorRole: 'admin', data: { owner: '인사팀 이과장' }, prevEventHash: 'hmac-8822-001', eventHash: 'hmac-9933-002', createdAt: new Date(Date.now() - 86400000 * 2.5).toISOString() },
      { id: 'ev-3', type: 'protective_action', actorRole: 'admin', data: { action: '피해자 유급휴가 및 분리조치' }, prevEventHash: 'hmac-9933-002', eventHash: 'hmac-aabb-003', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() }
    ];

    setReports([{
      id: 'rep-8f2a-b7e1-92c4',
      tenantId: 't-1',
      publicCodeHash: 'sha256-hash-code',
      status: ReportStatus.INVESTIGATING,
      priority: ReportPriority.HIGH,
      subject: '팀장급 인사에 의한 지속적 가스라이팅 및 업무 배제',
      category: 'Power Abuse',
      content: '개발 1팀 최팀장이 아침마다 전체 회의에서 특정인을 지칭해 모욕을 주고, 모든 메일 수신인에서 제외하는 등 집단 따돌림을 주도하고 있습니다.',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      lastViewedAt: new Date().toISOString(),
      encryptionKeyId: 'v1',
      integrityOk: true,
      evidenceHeadHash: 'hmac-aabb-003',
      events: mockEvents as any
    }]);

    setTenants([
      { id: 't-1', name: '아이언랩 테크', partnerId: 'ptr-1', isPremium: true, tags: ['핵심고객', 'IT'], traffic: 'red', openCount: 3, urgentCount: 1, lastAt: new Date().toISOString(), slaPolicy: {} },
      { id: 't-2', name: '미래 로지스틱스', partnerId: 'ptr-1', isPremium: false, tags: ['물류'], traffic: 'green', openCount: 0, urgentCount: 0, lastAt: null, slaPolicy: {} },
      { id: 't-3', name: '에이치에스 시스템', partnerId: 'ptr-1', isPremium: true, tags: ['제조'], traffic: 'yellow', openCount: 8, urgentCount: 0, lastAt: new Date().toISOString(), slaPolicy: {} }
    ]);
  }, []);

  const handleAiAdvice = async (report: Report) => {
    setIsLoading(true);
    try {
      const advice = await getLegalAdvice(report.content);
      setAiAdvice(advice || '');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartPackGeneration = () => {
    setPackProgress(5);
    const interval = setInterval(() => {
      setPackProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          const newPack: DefensePack = {
            id: `pack-${Math.random().toString(36).substr(2, 9)}`,
            status: 'generated',
            reasonCode: 'audit_ready',
            verifyOk: true,
            signature: `sig_hmac_sha256_${Math.random().toString(16).substr(2, 48)}`,
            createdAt: new Date().toISOString(),
            storedHead: reports[0].evidenceHeadHash,
            computedHead: reports[0].evidenceHeadHash,
            eventsCount: reports[0].events.length
          };
          setCurrentPack(newPack);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const renderLanding = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-[0.03]">
        <ICONS.Shield className="w-[800px] h-[800px]" />
      </div>
      
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-[10px] font-black tracking-[0.2em] uppercase mb-12 border border-slate-700 shadow-2xl">
        <ICONS.Lock className="w-3 h-3 text-emerald-400" /> Secure Evidence Chaining v3.0
      </div>

      <h1 className="text-7xl md:text-9xl font-black text-slate-900 mb-8 tracking-tighter leading-tight">
        SafeReport<br/>
        <span className="text-blue-600 italic">Legal Shield</span>
      </h1>

      <p className="text-xl md:text-2xl text-slate-500 mb-16 max-w-3xl font-light leading-relaxed">
        사건 접수부터 법적 조치 이력까지,<br/>
        <span className="text-slate-900 font-bold underline decoration-blue-500 decoration-4 underline-offset-8">무결성이 증명된 Defense Pack</span>을 자동 생성합니다.
      </p>

      <div className="flex flex-wrap gap-6 justify-center scale-110">
        <button onClick={() => setView('ONBOARD')} className="bg-slate-900 text-white px-12 py-5 rounded-3xl font-black text-xl hover:bg-slate-800 transition shadow-2xl active:scale-95">
          관리자 온보딩
        </button>
        <button onClick={() => setView('REPORT_FORM')} className="bg-white text-slate-900 border-2 border-slate-900 px-12 py-5 rounded-3xl font-black text-xl hover:bg-slate-50 transition active:scale-95">
          익명 제보하기
        </button>
      </div>

      <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl text-left">
        <FeatureCard 
          icon={<ICONS.Lock className="text-blue-600" />}
          title="Evidence Chaining"
          desc="모든 기록은 HMAC SHA-256 체인으로 연결되어 사후 조작이 원천적으로 불가능합니다."
        />
        <FeatureCard 
          icon={<ICONS.FileText className="text-emerald-600" />}
          title="Defense Pack"
          desc="노동부 점검 및 법적 분쟁 시 즉각 제출 가능한 전문 증빙 리포트를 비동기로 자동 생성합니다."
        />
        <FeatureCard 
          icon={<ICONS.Activity className="text-amber-600" />}
          title="Partner Portal"
          desc="전담 노무법인이 실시간으로 리스크를 통합 관제하며 즉각적인 법률 자문을 수행합니다."
        />
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="max-w-7xl mx-auto py-16 px-6">
      <div className="flex justify-between items-end mb-12 pb-8 border-b-2 border-slate-100">
        <div>
          <h2 className="text-5xl font-black tracking-tighter text-slate-900">{companyName} <span className="text-slate-300 font-light ml-2">Admin</span></h2>
          <div className="flex items-center gap-3 text-slate-500 mt-4 font-bold">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
            System Integrity: 100% Verified
          </div>
        </div>
        <div className="flex gap-4">
           <button className="bg-red-50 text-red-600 px-8 py-4 rounded-2xl font-black text-sm border-2 border-red-100 hover:bg-red-100 transition flex items-center gap-3 shadow-xl shadow-red-50">
             <ICONS.AlertOctagon className="w-5 h-5" /> 노무사 긴급 자문
           </button>
           <button onClick={() => setView('HOOK_TOOL')} className="bg-white border-2 border-slate-200 px-8 py-4 rounded-2xl font-black text-sm text-slate-600 hover:border-slate-900 transition">
             취업규칙 업데이트
           </button>
        </div>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
          <h3 className="font-black text-xl text-slate-900 tracking-tight">최근 인입 사건</h3>
          <button onClick={() => setView('TRACK')} className="text-blue-600 text-xs font-black flex items-center gap-2 hover:underline">
            <ICONS.Search className="w-3 h-3" /> 사건 추적 시스템
          </button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-white border-b border-slate-100">
            <tr>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Integrity</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject / ID</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Logs</th>
              <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {reports.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="p-6">
                   <div className="flex items-center gap-2 text-emerald-600">
                     <ICONS.Shield className="w-4 h-4" />
                     <span className="text-[10px] font-black">HMAC OK</span>
                   </div>
                </td>
                <td className="p-6">
                  <p className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{r.subject}</p>
                  <p className="text-[10px] text-slate-400 mt-2 uppercase font-mono font-bold tracking-wider">{r.id.slice(0, 12)}... • {r.category}</p>
                </td>
                <td className="p-6">
                  <span className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-xl border ${
                    r.status === ReportStatus.RECEIVED ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    {r.status}
                  </span>
                </td>
                <td className="p-6 font-bold text-slate-500 text-sm">
                  {r.events.length} Evidence Nodes
                </td>
                <td className="p-6 text-right">
                  <button 
                    onClick={() => { setSelectedReport(r); setAiAdvice(null); setPackProgress(0); setCurrentPack(null); }}
                    className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-black shadow-xl hover:bg-blue-600 transition-all active:scale-95"
                  >
                    사건 관리
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-6xl rounded-[56px] shadow-[0_0_100px_rgba(0,0,0,0.5)] h-[94vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setSelectedReport(null)} className="absolute top-10 right-10 text-slate-400 hover:text-slate-900 transition p-3 bg-slate-100 rounded-full z-10 active:scale-90">✕</button>
            
            <div className="p-12 border-b-2 border-slate-50 flex items-center justify-between bg-slate-50/40">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-[10px] font-black px-3 py-1 bg-blue-600 text-white rounded-full uppercase tracking-widest">Admin Control</span>
                  <span className="text-[10px] font-black px-3 py-1 bg-emerald-500 text-white rounded-full uppercase tracking-widest">Integrity Enforced</span>
                </div>
                <h3 className="text-4xl font-black tracking-tighter text-slate-900">{selectedReport.subject}</h3>
              </div>
              <div className="flex gap-4 pr-16">
                 <TabButton active={!aiAdvice} onClick={() => setAiAdvice(null)} label="Timeline" />
                 <TabButton active={aiAdvice === 'STRATEGY'} onClick={() => { setAiAdvice('STRATEGY'); handleAiAdvice(selectedReport); }} label="AI Strategy" icon={<ICONS.Activity className="w-4 h-4" />} />
                 <TabButton active={aiAdvice === 'DEFENSE_PACK'} onClick={() => setAiAdvice('DEFENSE_PACK')} label="Defense Pack" icon={<ICONS.FileText className="w-4 h-4" />} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
              {!aiAdvice && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                  <div className="lg:col-span-2 space-y-12">
                    <section>
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                        <ICONS.Lock className="w-3 h-3" /> Encrypted Payload (Decrypted for Admin)
                      </h4>
                      <div className="p-10 bg-slate-900 text-slate-200 rounded-[40px] italic leading-loose shadow-inner relative overflow-hidden text-lg font-medium border-t-4 border-blue-500">
                        <div className="absolute top-4 right-8 text-[8px] font-mono text-slate-600 uppercase tracking-widest">AES-256-GCM Payload Access Logs Recorded</div>
                        "{selectedReport.content}"
                      </div>
                    </section>
                    <section>
                      <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8">Chain of Evidence (HMAC Timeline)</h4>
                      <div className="border-l-4 border-slate-100 ml-6 space-y-14">
                        {selectedReport.events.map((e, idx) => (
                          <div key={idx} className="relative pl-12 group">
                            <div className="absolute -left-[14px] top-1 w-6 h-6 rounded-full border-[6px] border-white shadow-lg bg-slate-900 transition-transform group-hover:scale-125"></div>
                            <div className="flex justify-between items-center mb-3">
                              <p className="font-black text-xl uppercase tracking-tighter text-slate-900">{e.type.replace(/_/g, ' ')}</p>
                              <span className="text-[11px] font-mono text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{new Date(e.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">{JSON.stringify(e.data)}</p>
                            <div className="mt-4 font-mono text-[9px] text-slate-300 bg-slate-50 px-2 py-1 rounded inline-block">
                               NODE_H: {e.eventHash}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                  <aside className="space-y-8">
                     <ComplianceBox 
                        items={[
                          { label: '통보 의무 준수', ok: true },
                          { label: '조사 개시 승인', ok: true },
                          { label: '피해자 분리 조치', ok: true },
                          { label: 'HMAC 무결성 체크', ok: true },
                          { label: '최종 징계 위원회', ok: false },
                        ]}
                     />
                     <div className="p-8 bg-slate-900 rounded-[40px] text-white">
                        <h5 className="font-black text-slate-500 text-xs mb-6 uppercase tracking-[0.2em]">Security Info</h5>
                        <div className="space-y-4 font-mono text-[10px] text-slate-400">
                          <p>KEY_ID: {selectedReport.encryptionKeyId}</p>
                          <p>HEAD_HASH: {selectedReport.evidenceHeadHash.slice(0, 24)}...</p>
                        </div>
                     </div>
                  </aside>
                </div>
              )}

              {aiAdvice === 'STRATEGY' && (
                <div className="bg-slate-50 p-14 rounded-[48px] border-2 border-slate-100 animate-in fade-in duration-500 prose max-w-none">
                  <div className="flex items-center gap-4 mb-12">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-100"><ICONS.Activity className="w-6 h-6" /></div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight m-0 uppercase">AI Legal Risk Assessment</h3>
                  </div>
                  <div className="whitespace-pre-wrap font-sans text-slate-800 leading-loose text-xl">
                    {isLoading ? (
                      <div className="flex flex-col gap-6 animate-pulse">
                        <div className="h-8 bg-slate-200 rounded-xl w-3/4"></div>
                        <div className="h-8 bg-slate-200 rounded-xl w-1/2"></div>
                        <div className="h-8 bg-slate-200 rounded-xl w-5/6"></div>
                      </div>
                    ) : (
                      <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm leading-relaxed">
                        {aiAdvice}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {aiAdvice === 'DEFENSE_PACK' && (
                <div className="animate-in fade-in zoom-in-95 duration-500 h-full">
                   {!currentPack ? (
                     <div className="py-32 text-center max-w-md mx-auto h-full flex flex-col justify-center">
                        <div className="mb-12 inline-block p-12 bg-slate-900 text-white rounded-[48px] animate-bounce shadow-2xl">
                          <ICONS.FileText className="w-14 h-14" />
                        </div>
                        <h4 className="text-3xl font-black mb-6 tracking-tighter text-slate-900 uppercase">Generating Defense Pack</h4>
                        <p className="text-slate-500 mb-12 leading-relaxed text-lg font-medium">사건 처리 타임라인의 모든 HMAC 노드를 스냅샷하고,<br/>디지털 서명을 포함한 PDF 패키지를 빌드하고 있습니다.</p>
                        <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden mb-12 border border-slate-200">
                          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${packProgress}%` }}></div>
                        </div>
                        {packProgress === 0 && (
                          <button onClick={handleStartPackGeneration} className="bg-slate-900 text-white px-16 py-6 rounded-[32px] font-black text-xl shadow-2xl hover:bg-slate-800 transition-all active:scale-95">
                             빌드 프로세스 시작
                          </button>
                        )}
                     </div>
                   ) : (
                     <DefenseReport 
                        report={selectedReport} 
                        companyName={companyName} 
                        pack={currentPack}
                      />
                   )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderPartner = () => (
    <div className="max-w-7xl mx-auto py-16 px-6">
      <div className="flex justify-between items-end mb-16">
        <div>
          <h2 className="text-6xl font-black tracking-tighter italic text-slate-900">Partner Portal</h2>
          <p className="text-slate-500 mt-4 font-bold text-xl uppercase tracking-widest opacity-60">Labor Attorney Integrated Dashboard</p>
        </div>
        <div className="bg-white border-4 border-slate-900 px-10 py-5 rounded-[32px] font-mono text-sm font-black shadow-2xl">
          INVITE CODE: <span className="text-blue-600 underline">SEJONG-2025</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {tenants.map(t => (
          <div key={t.id} className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-sm hover:shadow-3xl transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-48 h-48 -mr-24 -mt-24 rounded-full blur-[100px] opacity-25 ${
              t.traffic === 'red' ? 'bg-red-500' : t.traffic === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'
            }`}></div>
            
            <div className="flex justify-between items-start mb-12 relative">
              <div>
                <h3 className="text-3xl font-black group-hover:text-blue-600 transition-colors tracking-tighter">{t.name}</h3>
                <p className="text-[10px] text-slate-400 mt-3 uppercase font-mono font-black tracking-[0.2em]">TENANT_UID: {t.id.slice(0, 12)}</p>
              </div>
              <div className={`px-5 py-2 rounded-full text-[11px] font-black uppercase border-2 flex items-center gap-2 ${
                t.traffic === 'red' ? 'bg-red-50 text-red-600 border-red-100' : 
                t.traffic === 'yellow' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                'bg-emerald-50 text-emerald-600 border-emerald-100'
              }`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${t.traffic === 'red' ? 'bg-red-600' : t.traffic === 'yellow' ? 'bg-amber-600' : 'bg-emerald-600'}`}></span>
                {t.traffic} Risk Level
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8 mb-12">
               <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 shadow-inner">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Active Reports</p>
                 <p className="text-4xl font-black text-slate-900 tracking-tighter">{t.openCount}</p>
               </div>
               <div className="bg-slate-50 p-8 rounded-[32px] border border-slate-100 shadow-inner">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Urgent SLA</p>
                 <p className={`text-4xl font-black tracking-tighter ${t.urgentCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{t.urgentCount}</p>
               </div>
            </div>

            <div className="flex items-center justify-between pt-10 border-t border-slate-100">
              <div className="flex gap-3">
                 {t.tags.map(tag => <span key={tag} className="text-[10px] font-black text-slate-400 px-3 py-1 bg-slate-50 rounded-lg border border-slate-100 tracking-widest">#{tag}</span>)}
              </div>
              <button 
                onClick={() => { setCompanyName(t.name); setView('ADMIN'); }}
                className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-[11px] font-black hover:bg-blue-600 transition-all shadow-xl active:scale-95 uppercase tracking-widest"
              >
                Access Dashboard
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFE] selection:bg-blue-100 font-sans">
      <header className="sticky top-0 z-40 w-full glass-effect border-b border-slate-100 px-10 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div onClick={() => setView('LANDING')} className="flex items-center gap-4 cursor-pointer group">
            <div className="p-3 bg-slate-900 text-white rounded-[20px] group-hover:rotate-12 transition-transform shadow-xl shadow-slate-200"><ICONS.Shield className="w-6 h-6" /></div>
            <span className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">SafeReport</span>
          </div>
          <nav className="hidden md:flex gap-14">
            <NavButton active={view === 'HOOK_TOOL'} onClick={() => setView('HOOK_TOOL')} label="Legal Hook" />
            <NavButton active={view === 'ADMIN'} onClick={() => setView('ADMIN')} label="Admin" />
            <NavButton active={view === 'PARTNER'} onClick={() => setView('PARTNER')} label="Partner" />
            <NavButton active={view === 'TRACK'} onClick={() => setView('TRACK')} label="Tracking" />
          </nav>
          <div className="flex items-center gap-6">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:block">System v3.0.4 Premium</span>
             <button className="bg-slate-900 text-white px-10 py-3 rounded-2xl text-xs font-black shadow-2xl shadow-slate-300 hover:bg-blue-600 transition active:scale-95 uppercase tracking-widest">Sign In</button>
          </div>
        </div>
      </header>

      <main className="pb-40">
        {view === 'LANDING' && renderLanding()}
        {view === 'PARTNER' && renderPartner()}
        {view === 'ADMIN' && renderAdmin()}
        {view === 'HOOK_TOOL' && renderHookTool()}
        {view === 'REPORT_FORM' && renderReportForm()}
        {view === 'ONBOARD' && renderOnboard()}
        {view === 'TRACK' && renderTrack()}
      </main>

      <footer className="bg-white border-t border-slate-100 py-32 px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-24">
          <div className="max-w-md">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-slate-900 text-white rounded-[18px] shadow-xl"><ICONS.Shield className="w-6 h-6" /></div>
              <span className="font-black text-3xl tracking-tighter uppercase italic">SafeReport</span>
            </div>
            <p className="text-slate-400 text-lg leading-relaxed font-medium">The Official Legal Shield for Modern SMEs.<br/>전국 50개 노무법인이 보증하는 국내 유일의<br/>디지털 사건 처리 무결성 시스템.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-24 flex-1">
            <FooterLinkGroup title="Technology" links={['HMAC Chain', 'AES-256-GCM', 'Audit Logs', 'Zero-Trust Intake']} />
            <FooterLinkGroup title="Resources" links={['Legal Guide', 'API Specs', 'Warrant Canary', 'Ethics Policy']} />
            <FooterLinkGroup title="Enterprise" links={['About Iron Dome', 'Partner Program', 'White-labeling', 'Contact']} />
          </div>
        </div>
      </footer>
    </div>
  );

  function renderTrack() {
    return (
      <div className="max-w-2xl mx-auto py-32 px-6 text-center animate-in fade-in duration-500">
         <h2 className="text-5xl font-black tracking-tighter mb-6">사건 추적 시스템</h2>
         <p className="text-slate-500 mb-12 text-lg">제보 시 발급받은 <span className="font-bold text-slate-900">10자리 추적 코드</span>를 입력하세요.</p>
         <div className="bg-white p-12 rounded-[48px] border-2 border-slate-100 shadow-2xl">
            <div className="relative mb-8">
               <input 
                  type="text" 
                  maxLength={10}
                  value={trackCode}
                  onChange={(e) => setTrackCode(e.target.value.toUpperCase())}
                  placeholder="ABCDEF1234" 
                  className="w-full p-8 bg-slate-50 border-4 border-transparent focus:border-blue-500 focus:bg-white rounded-[32px] transition-all outline-none text-center font-mono text-4xl tracking-[0.4em] uppercase font-black" 
               />
            </div>
            <button className="w-full bg-slate-900 text-white py-8 rounded-[32px] font-black text-2xl hover:bg-blue-600 transition-all shadow-2xl active:scale-95 uppercase tracking-widest">
              실시간 상태 조회
            </button>
            <p className="mt-8 text-xs text-slate-400 font-medium">본 시스템은 영장 없는 데이터 요청에 응하지 않으며, 모든 조회 이력은 감사 로그로 남습니다.</p>
         </div>
      </div>
    );
  }

  function renderOnboard() {
    return (
      <div className="max-w-md mx-auto py-32 px-6 animate-in fade-in slide-in-from-bottom-10 duration-500">
         <div className="text-center mb-16">
           <h2 className="text-5xl font-black tracking-tighter mb-4 text-slate-900">Activate Shield</h2>
           <p className="text-slate-500 text-lg">노무법인에서 제공한 <span className="font-bold text-slate-900">초대 코드</span>를 입력하세요.</p>
         </div>
         <div className="bg-white p-12 rounded-[48px] border-2 border-slate-100 shadow-2xl space-y-10">
           <div className="space-y-3">
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Invite Code</label>
             <input type="text" placeholder="SEJONG-XXXX" className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-[24px] transition-all outline-none font-mono text-2xl tracking-widest uppercase font-black" />
           </div>
           <div className="space-y-3">
             <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
             <input type="text" onBlur={(e) => setCompanyName(e.target.value)} placeholder="예: (주) 아이언테크" className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-[24px] transition-all outline-none font-bold text-xl" />
           </div>
           <button onClick={() => setView('ADMIN')} className="w-full bg-slate-900 text-white py-8 rounded-[32px] font-black text-2xl hover:bg-slate-800 transition shadow-2xl active:scale-95 uppercase tracking-widest">
             기업 대시보드 생성
           </button>
         </div>
      </div>
    );
  }

  function renderReportForm() {
    return (
      <div className="max-w-3xl mx-auto py-24 px-6">
        <SecurityAnimation />
        <div className="mt-16 bg-white p-16 rounded-[64px] border border-slate-100 shadow-3xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500"></div>
           <h2 className="text-5xl font-black tracking-tighter mb-6 text-slate-900 italic">Anonymous Intake</h2>
           <p className="text-slate-500 text-xl mb-14 font-light leading-relaxed">귀하의 제보는 AES-256 암호화 후 HMAC 해시 체인으로 즉시 기록됩니다. 본 기록은 사후 조작이 불가능한 강력한 법적 증거가 됩니다.</p>
           
           <div className="space-y-12">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                <select className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-[24px] transition-all outline-none font-bold text-xl appearance-none shadow-sm cursor-pointer">
                  <option>Power Abuse (직장 내 괴롭힘)</option>
                  <option>Sexual Harassment (성희롱)</option>
                  <option>Verbal Abuse (폭언/폭행)</option>
                  <option>Retaliation (보복/불이익)</option>
                </select>
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                <input type="text" placeholder="사건의 요지를 짧게 입력하세요." className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-[24px] transition-all outline-none font-bold text-xl shadow-sm" />
              </div>
              <div className="space-y-4">
                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Evidence Narrative</label>
                <textarea placeholder="육하원칙에 따라 상세히 기술해주세요." className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-[24px] transition-all outline-none font-medium text-xl h-60 leading-relaxed shadow-sm resize-none"></textarea>
              </div>

              <div className="p-8 bg-emerald-50 rounded-[32px] border border-emerald-100 flex items-center gap-6">
                <div className="p-4 bg-white text-emerald-600 rounded-[22px] shadow-sm"><ICONS.Lock className="w-6 h-6" /></div>
                <div>
                  <p className="text-base font-black text-emerald-900 tracking-tight">Warrant Canary Active</p>
                  <p className="text-xs text-emerald-700 mt-2 opacity-80 font-medium leading-relaxed">SafeReport는 지난 24시간 동안 수사기관으로부터 어떠한 사용자 데이터 요청도 수신하지 않았음을 선언합니다.</p>
                </div>
              </div>

              <button 
                className="w-full bg-slate-900 text-white py-8 rounded-[32px] font-black text-2xl hover:bg-blue-600 transition shadow-2xl active:scale-95 uppercase tracking-widest"
                onClick={() => { alert('제보가 암호화되어 안전하게 전송되었습니다. 추적 코드를 잘 보관하세요.'); setView('LANDING'); }}
              >
                Shield On & Submit
              </button>
           </div>
        </div>
      </div>
    );
  }

  function renderHookTool() {
    return (
      <div className="max-w-4xl mx-auto py-24 px-6 animate-in fade-in duration-500">
         <div className="text-center mb-20">
           <h2 className="text-6xl font-black tracking-tighter mb-6 text-slate-900 italic underline decoration-blue-500 decoration-8 underline-offset-12">Legal Hook Tool</h2>
           <p className="text-slate-500 text-2xl font-light">AI가 생성하는 최신 판례 기반 직장 내 괴롭힘 방지 조항</p>
         </div>
         <div className="bg-white p-16 rounded-[64px] border-2 border-slate-100 shadow-2xl mb-16">
            <div className="flex flex-col md:flex-row gap-8 items-end">
               <div className="flex-1 space-y-4">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                  <input 
                    type="text" 
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="예: 주식회사 아이언랩" 
                    className="w-full p-6 bg-slate-50 border-4 border-transparent focus:border-blue-500 focus:bg-white rounded-[24px] transition-all outline-none font-bold text-2xl shadow-sm" 
                  />
               </div>
               <button 
                onClick={async () => {
                  setIsLoading(true);
                  const rule = await generateEmploymentRule(companyName);
                  setGeneratedRule(rule || '');
                  setIsLoading(false);
                }}
                disabled={isLoading || !companyName}
                className="bg-blue-600 text-white px-16 py-6 rounded-[24px] font-black text-xl shadow-2xl shadow-blue-100 hover:bg-blue-700 transition disabled:opacity-50 active:scale-95 uppercase tracking-widest"
               >
                 {isLoading ? 'Processing...' : 'AI 조항 생성'}
               </button>
            </div>
         </div>
         {generatedRule && (
            <div className="bg-slate-900 text-slate-300 p-16 rounded-[64px] shadow-[0_50px_100px_rgba(0,0,0,0.4)] prose prose-invert max-w-none animate-in slide-in-from-bottom-10 duration-700">
              <div className="flex justify-between items-center mb-12 border-b border-slate-800 pb-8">
                <h3 className="text-white font-black text-3xl m-0 tracking-tight uppercase tracking-widest">Legal Clause Generated</h3>
                <button className="text-emerald-400 font-bold text-xs uppercase border-2 border-emerald-400/30 px-5 py-2 rounded-xl hover:bg-emerald-400/10 transition tracking-widest">Copy Markdown</button>
              </div>
              <div className="whitespace-pre-wrap leading-loose text-xl font-sans text-slate-300">
                {generatedRule}
              </div>
              <div className="mt-20 pt-12 border-t border-slate-800 text-center">
                 <p className="text-white font-bold text-2xl mb-10">본 조항을 기업 취업규칙에 즉시 적용하시겠습니까?</p>
                 <button onClick={() => setView('ONBOARD')} className="bg-emerald-500 text-slate-900 px-16 py-6 rounded-[32px] font-black text-2xl hover:bg-emerald-400 transition-all active:scale-95 shadow-2xl shadow-emerald-900/40 uppercase tracking-widest">SafeReport 도입 문의 (Free)</button>
              </div>
            </div>
         )}
      </div>
    );
  }
};

// UI Helper Components
const NavButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button onClick={onClick} className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:tracking-[0.4em] ${active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-900'}`}>{label}</button>
);

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-10 bg-white rounded-[48px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-2xl font-black mb-4 tracking-tight uppercase">{title}</h3>
    <p className="text-slate-500 leading-relaxed font-medium">{desc}</p>
  </div>
);

const TabButton = ({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon?: React.ReactNode }) => (
  <button 
    onClick={onClick}
    className={`px-8 py-4 rounded-[22px] text-sm font-black transition-all flex items-center gap-3 ${active ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'bg-white border-2 border-slate-100 text-slate-400 hover:bg-slate-50'}`}
  >
    {icon} {label}
  </button>
);

const ComplianceBox = ({ items }: { items: Array<{ label: string, ok: boolean }> }) => (
  <div className="p-10 bg-blue-50 rounded-[40px] border border-blue-100 shadow-sm">
    <h5 className="font-black text-blue-900 text-xs mb-8 uppercase tracking-[0.2em] flex items-center gap-2">
      <ICONS.Shield className="w-3 h-3" /> Compliance Check
    </h5>
    <ul className="space-y-6">
      {items.map((item, idx) => (
        <li key={idx} className={`flex items-center justify-between text-sm font-bold ${item.ok ? 'text-blue-800' : 'text-blue-300'}`}>
          <span>{item.label}</span>
          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${item.ok ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-300'}`}>
            {item.ok ? '✓' : '□'}
          </div>
        </li>
      ))}
    </ul>
  </div>
);

const FooterLinkGroup = ({ title, links }: { title: string, links: string[] }) => (
  <div className="space-y-8">
    <h4 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.3em]">{title}</h4>
    <ul className="space-y-5 text-base font-bold text-slate-400">
      {links.map((link) => <li key={link} className="hover:text-blue-600 cursor-pointer transition-colors transition-all hover:pl-2">{link}</li>)}
    </ul>
  </div>
);

export default App;
