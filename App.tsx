
import React, { useState, useEffect } from 'react';
import { ViewState, Report, ReportStatus, ReportPriority, Tenant, DefensePack } from './types';
import { ICONS } from './constants';
import SecurityAnimation from './components/SecurityAnimation';
import DefenseReport from './components/DefenseReport';
import { generateEmploymentRule, getLegalAdvice, triageReport } from './services/geminiService';

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('LANDING');
  const [reports, setReports] = useState<Report[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [companyName, setCompanyName] = useState('아이언랩 테크');
  const [isLoading, setIsLoading] = useState(false);
  const [generatedRule, setGeneratedRule] = useState('');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [packs, setPacks] = useState<DefensePack[]>([]);
  const [packProgress, setPackProgress] = useState(0);

  // Mock 데이터 초기화 (v11 스키마 기준)
  useEffect(() => {
    const mockReportId = 'rep-8f2a-b7e1';
    const mockEvents = [
      {
        id: 'ev-1', type: 'received', actorRole: 'user', 
        data: { channel: 'public', location: '서울 본사' }, 
        prevEventHash: null, eventHash: 'hmac-8822...001', 
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
      },
      {
        id: 'ev-2', type: 'investigation_started', actorRole: 'admin', 
        data: { owner: '인사팀 김철수', notes: '조사위원회 구성 완료' }, 
        prevEventHash: 'hmac-8822...001', eventHash: 'hmac-9933...002', 
        createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString()
      }
    ];

    setReports([{
      id: mockReportId,
      tenantId: 't-1',
      publicCodeHash: 'sha256-hash-code',
      status: ReportStatus.INVESTIGATING,
      priority: ReportPriority.HIGH,
      subject: '지속적인 업무 배제 및 따돌림 제보',
      category: 'Power Abuse',
      content: '부서장님이 특정 팀원을 점심시간에 의도적으로 배제하고 업무 메일을 공유하지 않는 상황이 3개월째 지속되고 있습니다.',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      lastViewedAt: new Date().toISOString(),
      encryptionKeyId: 'v1',
      events: mockEvents as any,
      evidenceHeadHash: 'hmac-9933...002',
      integrityOk: true
    }]);

    setTenants([
      { id: 't-1', name: '아이언랩 테크', partnerId: 'ptr-1', isPremium: true, tags: ['vip', 'high-risk'], traffic: 'red', openCount: 3, urgentCount: 1, lastAt: new Date().toISOString(), slaPolicy: {} },
      { id: 't-2', name: '미래 로지스', partnerId: 'ptr-1', isPremium: false, tags: ['new'], traffic: 'green', openCount: 0, urgentCount: 0, lastAt: null, slaPolicy: {} },
      { id: 't-3', name: '에이치에스 시스템', partnerId: 'ptr-1', isPremium: true, tags: ['union'], traffic: 'yellow', openCount: 12, urgentCount: 0, lastAt: new Date().toISOString(), slaPolicy: {} }
    ]);
  }, []);

  const handleHookGenerate = async (name: string) => {
    setIsLoading(true);
    const rule = await generateEmploymentRule(name);
    setGeneratedRule(rule || '');
    setIsLoading(false);
  };

  const handleAiAdvice = async (report: Report) => {
    setIsLoading(true);
    const advice = await getLegalAdvice(report.content);
    setAiAdvice(advice || '');
    setIsLoading(false);
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
            reasonCode: 'audit_request',
            verifyOk: true,
            signature: `sig_hmac_sha256_${Math.random().toString(16).substr(2, 32)}`,
            createdAt: new Date().toISOString()
          };
          setPacks([newPack, ...packs]);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const renderLanding = () => (
    <div className="flex flex-col items-center justify-center min-h-[85vh] text-center px-4 relative overflow-hidden">
      {/* Background Decorative Shield */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-5">
        <svg width="600" height="600" viewBox="0 0 24 24" fill="currentColor"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      </div>

      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-900 text-white text-[10px] font-black tracking-widest uppercase mb-10 border border-slate-700">
        <ICONS.Lock /> Zero-Knowledge Legal Shield v2.0
      </div>
      
      <h1 className="text-6xl md:text-8xl font-black text-slate-900 mb-8 tracking-tighter leading-none">
        SafeReport<br/>
        <span className="text-blue-600 italic">The Legal Shield</span>
      </h1>
      
      <p className="text-xl md:text-2xl text-slate-500 mb-12 max-w-3xl font-light leading-relaxed">
        단순 신고함이 아닌 <span className="text-slate-900 font-bold underline decoration-blue-500">방어 중심의 리스크 관리 OS.</span><br/>
        노무법인과 연동된 사건 처리 타임라인 및 무결성 증빙 자동화 시스템.
      </p>

      <div className="flex flex-wrap gap-4 justify-center scale-110">
        <button onClick={() => setView('ONBOARD')} className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-800 transition shadow-2xl shadow-slate-300">
          관리자 온보딩
        </button>
        <button onClick={() => setView('REPORT_FORM')} className="bg-white text-slate-900 border-2 border-slate-900 px-10 py-5 rounded-2xl font-black text-lg hover:bg-slate-50 transition">
          익명 제보하기
        </button>
      </div>

      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl text-left">
        <FeatureCard 
          icon={<ICONS.Lock className="text-blue-600" />} 
          title="Evidence Chaining" 
          desc="모든 관리 활동은 HMAC SHA-256 체인으로 연결되어 사후 조작이 원천적으로 불가능합니다." 
        />
        <FeatureCard 
          icon={<ICONS.FileText className="text-emerald-600" />} 
          title="Defense Pack" 
          desc="노동부 점검 시 원클릭으로 제출 가능한 법적 조치 이력 보고서를 자동 생성합니다." 
        />
        <FeatureCard 
          icon={<ICONS.Shield className="text-amber-600" />} 
          title="Partner Network" 
          desc="전담 노무법인이 실시간 관제하며 리스크 발생 시 즉각적인 자문을 제공합니다." 
        />
      </div>
    </div>
  );

  const renderOnboard = () => (
    <div className="max-w-md mx-auto py-24 px-4">
      <div className="text-center mb-12">
        <h2 className="text-4xl font-black tracking-tighter mb-4 text-slate-900">Company Onboarding</h2>
        <p className="text-slate-500">노무법인으로부터 받은 <span className="font-bold">초대 코드</span>를 입력하여<br/>기업 전용 방패를 활성화하세요.</p>
      </div>
      <div className="bg-white p-10 rounded-[32px] border border-slate-100 shadow-2xl space-y-8">
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Invite Code</label>
          <input 
            type="text" 
            placeholder="IRON-XXXX" 
            className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition outline-none font-mono text-xl tracking-widest"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Company Name</label>
          <input 
            type="text" 
            placeholder="예: (주) 아이언테크" 
            className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition outline-none font-bold text-xl"
            onBlur={(e) => setCompanyName(e.target.value)}
          />
        </div>
        <button 
          onClick={() => setView('ADMIN')}
          className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-xl hover:bg-slate-800 transition shadow-xl"
        >
          Activate Shield
        </button>
      </div>
    </div>
  );

  const renderAdmin = () => (
    <div className="max-w-7xl mx-auto py-12 px-6">
      <div className="flex justify-between items-end mb-10 pb-6 border-b">
        <div>
          <h2 className="text-4xl font-black tracking-tighter text-slate-900">{companyName}</h2>
          <p className="text-slate-500 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Admin Dashboard • Iron Dome Active
          </p>
        </div>
        <div className="flex gap-4">
           <button className="bg-red-50 text-red-600 px-6 py-3 rounded-2xl font-black text-sm border border-red-200 hover:bg-red-100 transition flex items-center gap-2">
             <ICONS.AlertOctagon /> 노무사 긴급 자문
           </button>
           <button onClick={() => setView('HOOK_TOOL')} className="bg-white border px-6 py-3 rounded-2xl font-black text-sm text-slate-600">
             취업규칙 업데이트
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <StatCard title="Total Reports" value={reports.length} color="text-slate-900" />
        <StatCard title="Active Risk" value={reports.filter(r => r.status !== ReportStatus.CLOSED).length} color="text-amber-600" />
        <StatCard title="Defense Index" value="98%" color="text-blue-600" />
        <StatCard title="Integrity" value="100%" color="text-emerald-600" suffix="HMAC OK" />
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
          <h3 className="font-black text-slate-900">최근 사건 로그</h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Auto-Synced</span>
        </div>
        <table className="w-full text-left">
          <thead className="bg-white border-b">
            <tr>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Integrity</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timeline</th>
              <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {reports.map(r => (
              <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-5">
                   <div className="flex items-center gap-1.5 text-emerald-600">
                     <ICONS.Shield />
                     <span className="text-[10px] font-black">OK</span>
                   </div>
                </td>
                <td className="p-5">
                  <p className="font-bold text-slate-900">{r.subject}</p>
                  <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono">{r.id.slice(0, 8)} • {r.category}</p>
                </td>
                <td className="p-5">
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 text-[10px] font-black uppercase rounded-lg border border-amber-100">
                    {r.status}
                  </span>
                </td>
                <td className="p-5">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-slate-500">
                    <ICONS.Activity /> {r.events.length} Events
                  </div>
                </td>
                <td className="p-5">
                  <button 
                    onClick={() => { setSelectedReport(r); setAiAdvice(null); setPackProgress(0); }}
                    className="text-blue-600 text-xs font-black hover:underline"
                  >
                    사건 관리하기
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Case Management Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-6xl rounded-[40px] shadow-2xl h-[90vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setSelectedReport(null)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition p-2 bg-slate-100 rounded-full">✕</button>
            
            {/* Modal Header */}
            <div className="p-10 border-b flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-[10px] font-black px-2 py-1 bg-blue-50 text-blue-600 rounded uppercase">Case Detail</span>
                  <span className="text-[10px] font-black px-2 py-1 bg-emerald-50 text-emerald-600 rounded uppercase">Decrypted (v1)</span>
                </div>
                <h3 className="text-3xl font-black tracking-tighter text-slate-900">{selectedReport.subject}</h3>
              </div>
              <div className="flex gap-3 pr-12">
                 <TabButton active={!aiAdvice} onClick={() => setAiAdvice(null)} label="Timeline" />
                 <TabButton active={aiAdvice === 'STRATEGY'} onClick={() => handleAiAdvice(selectedReport).then(() => setAiAdvice('STRATEGY'))} label="AI Legal Strategy" icon={<ICONS.Activity />} />
                 <TabButton active={aiAdvice === 'DEFENSE_PACK'} onClick={() => setAiAdvice('DEFENSE_PACK')} label="Defense Pack" icon={<ICONS.FileText />} />
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-10">
              {!aiAdvice && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                  <div className="lg:col-span-2 space-y-10">
                    <section>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Original Evidence Body</h4>
                      <div className="p-8 bg-slate-900 text-slate-300 rounded-[32px] italic leading-loose shadow-inner relative overflow-hidden">
                        <div className="absolute top-4 right-6 text-[8px] font-mono text-slate-500 uppercase">Decrypted AES-256-GCM Payload</div>
                        "{selectedReport.content}"
                      </div>
                    </section>
                    <section>
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Defense Log (HMAC Chain)</h4>
                      <div className="border-l-2 border-slate-100 ml-4 space-y-10">
                        {selectedReport.events.map((e, idx) => (
                          <div key={idx} className="relative pl-10 group">
                            <div className="absolute -left-[11px] top-1 w-5 h-5 rounded-full border-4 border-white shadow-sm bg-slate-900 transition-transform group-hover:scale-125"></div>
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-black text-sm uppercase tracking-tighter text-slate-900">{e.type.replace('_', ' ')}</p>
                              <span className="text-[10px] font-mono text-slate-400">{new Date(e.createdAt).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-500 text-sm">{JSON.stringify(e.data)}</p>
                            <p className="text-[8px] font-mono text-slate-300 mt-2">HASH: {e.eventHash.slice(0, 16)}...</p>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>
                  <aside className="space-y-8">
                     <div className="p-8 bg-blue-50 rounded-[32px] border border-blue-100">
                       <h5 className="font-black text-blue-900 text-xs mb-4 uppercase tracking-widest">Case Compliance</h5>
                       <ul className="space-y-4 text-sm text-blue-800 font-medium">
                         <li className="flex items-center gap-2">✓ 통보 의무 준수</li>
                         <li className="flex items-center gap-2">✓ 분리 조치 여부 확인</li>
                         <li className="flex items-center gap-2">✓ 무결성 검증 통과</li>
                       </ul>
                     </div>
                  </aside>
                </div>
              )}

              {aiAdvice === 'STRATEGY' && (
                <div className="bg-slate-50 p-10 rounded-[32px] border border-slate-200 animate-in fade-in duration-500 prose max-w-none">
                  <div className="whitespace-pre-wrap font-sans text-slate-800 leading-relaxed text-lg">
                    {aiAdvice === 'STRATEGY' && !isLoading ? aiAdvice : 'AI 노무사가 사건 데이터를 분석 중입니다...'}
                  </div>
                </div>
              )}

              {aiAdvice === 'DEFENSE_PACK' && (
                <div>
                   {packProgress < 100 ? (
                     <div className="py-24 text-center max-w-md mx-auto">
                        <div className="mb-10 inline-block p-6 bg-slate-900 text-white rounded-full animate-bounce">
                          <ICONS.FileText />
                        </div>
                        <h4 className="text-2xl font-black mb-4 tracking-tighter">Defense Pack 생성 중</h4>
                        <p className="text-slate-500 mb-8 leading-relaxed">사건 처리 타임라인의 HMAC 체인을 스냅샷하고,<br/>무결성 서명을 포함한 PDF 패키지를 빌드하고 있습니다.</p>
                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-10">
                          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${packProgress}%` }}></div>
                        </div>
                        {packProgress === 0 && (
                          <button onClick={handleStartPackGeneration} className="bg-slate-900 text-white px-10 py-4 rounded-2xl font-black shadow-xl">
                             생성 시작
                          </button>
                        )}
                     </div>
                   ) : (
                     <DefenseReport 
                        report={selectedReport} 
                        companyName={companyName} 
                        packId={packs[0]?.id || 'PACK-TEMP'} 
                        signature={packs[0]?.signature || 'SIG-TEMP'}
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
    <div className="max-w-7xl mx-auto py-12 px-6">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-5xl font-black tracking-tighter italic">Partner Portal</h2>
          <p className="text-slate-500 mt-2 font-medium">세종 노무법인 박대표 노무사 통합 대시보드</p>
        </div>
        <div className="bg-white border-2 border-slate-900 px-6 py-3 rounded-2xl font-mono text-sm font-black">
          INVITE CODE: SEJONG-2025
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
        {tenants.map(t => (
          <div key={t.id} className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            {/* Traffic Light Background Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full blur-3xl opacity-20 ${t.traffic === 'red' ? 'bg-red-500' : t.traffic === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'}`}></div>
            
            <div className="flex justify-between items-start mb-8 relative">
              <div>
                <h3 className="text-2xl font-black group-hover:text-blue-600 transition-colors">{t.name}</h3>
                <p className="text-[10px] text-slate-400 mt-1 uppercase font-mono tracking-widest">{t.id.slice(0, 8)}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${t.traffic === 'red' ? 'bg-red-50 text-red-600 border-red-100' : t.traffic === 'yellow' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                {t.traffic} Risk
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="bg-slate-50 p-4 rounded-2xl">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Open Reports</p>
                 <p className="text-2xl font-black">{t.openCount}</p>
               </div>
               <div className="bg-slate-50 p-4 rounded-2xl">
                 <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Urgent SLA</p>
                 <p className={`text-2xl font-black ${t.urgentCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{t.urgentCount}</p>
               </div>
            </div>

            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
              <div className="flex gap-2">
                 {t.tags.map(tag => <span key={tag} className="text-[10px] font-bold text-slate-400">#{tag}</span>)}
              </div>
              <button 
                onClick={() => { setCompanyName(t.name); setView('ADMIN'); }}
                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-blue-600 transition"
              >
                고객사 대시보드 진입
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFE] selection:bg-blue-100">
      <header className="sticky top-0 z-40 w-full glass-effect border-b border-slate-100 px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div onClick={() => setView('LANDING')} className="flex items-center gap-3 cursor-pointer group">
            <div className="p-2 bg-slate-900 text-white rounded-xl group-hover:rotate-12 transition-transform shadow-lg"><ICONS.Shield /></div>
            <span className="text-2xl font-black tracking-tighter text-slate-900">SafeReport</span>
          </div>
          <nav className="hidden md:flex gap-10">
            <NavButton label="Hook Tool" active={view === 'HOOK_TOOL'} onClick={() => setView('HOOK_TOOL')} />
            <NavButton label="Admin" active={view === 'ADMIN'} onClick={() => setView('ADMIN')} />
            <NavButton label="Partner" active={view === 'PARTNER'} onClick={() => setView('PARTNER')} />
          </nav>
          <button className="bg-slate-900 text-white px-6 py-2.5 rounded-xl text-xs font-black shadow-xl shadow-slate-200 hover:bg-slate-800 transition">SIGN IN</button>
        </div>
      </header>

      <main className="pb-32">
        {view === 'LANDING' && renderLanding()}
        {view === 'ONBOARD' && renderOnboard()}
        {view === 'ADMIN' && renderAdmin()}
        {view === 'PARTNER' && renderPartner()}
        {view === 'REPORT_FORM' && (
          <div className="max-w-3xl mx-auto py-24 px-6 animate-in fade-in duration-500">
            <SecurityAnimation />
            <div className="mt-16 bg-white p-12 rounded-[48px] border border-slate-100 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500"></div>
               <h2 className="text-4xl font-black tracking-tighter mb-4 text-slate-900">익명 제보 신청서</h2>
               <p className="text-slate-500 text-lg mb-12 font-light leading-relaxed">귀하의 제보는 AES-256 암호화 후 HMAC 해시 체인으로 기록되어 사후 조작이 불가능한 강력한 증거가 됩니다.</p>
               
               <div className="space-y-10">
                  <InputWrapper label="Category">
                    <select className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition outline-none font-bold text-lg appearance-none">
                      <option>Power Abuse (직장 내 괴롭힘)</option>
                      <option>Sexual Harassment (성희롱)</option>
                      <option>Verbal Abuse (폭언/폭행)</option>
                      <option>Retaliation (보복/불이익)</option>
                    </select>
                  </InputWrapper>
                  <InputWrapper label="Subject">
                    <input type="text" placeholder="사건의 핵심 요지를 입력하세요." className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition outline-none font-bold text-lg" />
                  </InputWrapper>
                  <InputWrapper label="Evidence Description">
                    <textarea placeholder="육하원칙에 따라 상세히 기술해주세요. 타임스탬프 기록을 위해 발생 시점을 명시하시면 좋습니다." className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition outline-none font-medium text-lg h-48 leading-relaxed"></textarea>
                  </InputWrapper>

                  <div className="p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-5">
                    <div className="p-3 bg-white text-emerald-600 rounded-2xl shadow-sm"><ICONS.Lock /></div>
                    <div>
                      <p className="text-sm font-black text-emerald-900 tracking-tight">Warrant Canary Protected</p>
                      <p className="text-xs text-emerald-700 mt-1 opacity-80">지난 24시간 동안 어떠한 공공기관의 데이터 요청도 수신되지 않았습니다.</p>
                    </div>
                  </div>

                  <button 
                    className="w-full bg-slate-900 text-white py-6 rounded-2xl font-black text-2xl hover:bg-blue-600 transition shadow-2xl shadow-blue-100"
                    onClick={() => { alert('제보가 암호화 전송되었습니다. 추적 코드가 발급됩니다.'); setView('LANDING'); }}
                  >
                    Shield On & Submit
                  </button>
               </div>
            </div>
          </div>
        )}
        {view === 'HOOK_TOOL' && (
          <div className="max-w-4xl mx-auto py-24 px-6 animate-in fade-in duration-500">
             <div className="text-center mb-16">
               <h2 className="text-5xl font-black tracking-tighter mb-4">Legal Hook Tool</h2>
               <p className="text-slate-500 text-xl font-light">가입 없이 즉시 생성하는 AI 취업규칙 괴롭힘 방지 조항</p>
             </div>
             <div className="bg-white p-12 rounded-[48px] border border-slate-100 shadow-2xl mb-12">
                <div className="flex flex-col md:flex-row gap-6 items-end">
                   <div className="flex-1 space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                      <input 
                        type="text" 
                        onBlur={(e) => setCompanyName(e.target.value)}
                        placeholder="예: 주식회사 아이언랩" 
                        className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition outline-none font-bold text-xl" 
                      />
                   </div>
                   <button 
                    onClick={() => handleHookGenerate(companyName)}
                    className="bg-blue-600 text-white px-12 py-5 rounded-2xl font-black text-lg shadow-xl shadow-blue-200 hover:bg-blue-700 transition"
                   >
                     AI 조항 생성
                   </button>
                </div>
             </div>
             {generatedRule && (
                <div className="bg-slate-900 text-slate-300 p-12 rounded-[48px] shadow-2xl prose prose-invert max-w-none">
                  <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
                    <h3 className="text-white font-black text-2xl m-0 tracking-tight">Generated Prevention Clause</h3>
                    <button className="text-emerald-400 font-bold text-xs uppercase border border-emerald-400/30 px-3 py-1 rounded-lg">Copy Markdown</button>
                  </div>
                  <div className="whitespace-pre-wrap leading-relaxed text-lg font-sans">
                    {generatedRule}
                  </div>
                  <div className="mt-16 pt-10 border-t border-slate-800 text-center">
                     <p className="text-white font-bold mb-6">이 조항을 회사에 자동 적용하고 싶으신가요?</p>
                     <button onClick={() => setView('ONBOARD')} className="bg-emerald-500 text-slate-900 px-10 py-4 rounded-2xl font-black text-lg">SafeReport 도입 (무료)</button>
                  </div>
                </div>
             )}
          </div>
        )}
      </main>

      <footer className="bg-white border-t py-24 px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="max-w-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-slate-900 text-white rounded-lg"><ICONS.Shield /></div>
              <span className="font-black text-2xl tracking-tighter">SafeReport</span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed font-medium">The Legal Shield for Modern SMEs.<br/>전국 50개 노무법인이 보증하는<br/>디지털 사건 처리 무결성 시스템.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-16">
            <FooterLinkGroup title="Product" links={['Security', 'Integrity', 'Pricing', 'API']} />
            <FooterLinkGroup title="Legal" links={['Privacy', 'Warrant Canary', 'Ethics']} />
            <FooterLinkGroup title="Company" links={['About', 'Contact', 'Partner App']} />
          </div>
        </div>
      </footer>
    </div>
  );
};

// UI Helper Components
const NavButton = ({ label, active, onClick }: any) => (
  <button onClick={onClick} className={`text-xs font-black uppercase tracking-widest transition-colors ${active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-900'}`}>{label}</button>
);

const FeatureCard = ({ icon, title, desc }: any) => (
  <div className="p-8 bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-lg transition-all">
    <div className="mb-6">{icon}</div>
    <h3 className="text-xl font-black mb-3 tracking-tight">{title}</h3>
    <p className="text-slate-500 text-sm leading-relaxed font-medium">{desc}</p>
  </div>
);

const StatCard = ({ title, value, color, suffix }: any) => (
  <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
    <div className="flex items-baseline gap-2">
      <span className={`text-4xl font-black ${color}`}>{value}</span>
      {suffix && <span className="text-[10px] font-bold text-emerald-500 uppercase">{suffix}</span>}
    </div>
  </div>
);

const TabButton = ({ active, onClick, label, icon }: any) => (
  <button 
    onClick={onClick}
    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 ${active ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
  >
    {icon} {label}
  </button>
);

const InputWrapper = ({ label, children }: any) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{label}</label>
    {children}
  </div>
);

const FooterLinkGroup = ({ title, links }: any) => (
  <div className="space-y-6">
    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest">{title}</h4>
    <ul className="space-y-4">
      {links.map((link: any) => <li key={link} className="text-sm font-bold text-slate-400 hover:text-blue-600 cursor-pointer transition-colors">{link}</li>)}
    </ul>
  </div>
);

export default App;
