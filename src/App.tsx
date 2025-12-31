
import React, { useState, useEffect, useCallback } from 'react';
import { ViewState, Report, ReportStatus, ReportPriority, Tenant, DefensePack } from './types';
import { ICONS } from './constants';
import SecurityAnimation from './components/SecurityAnimation';
import DefenseReport from './components/DefenseReport';
import { generateEmploymentRule, getLegalAdvice } from './services/geminiService';
import { useFocusTrap } from './hooks/useFocusTrap';

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

  const closeModal = useCallback(() => {
    setSelectedReport(null);
    setAiAdvice(null);
    setPackProgress(0);
    setCurrentPack(null);
  }, []);

  const modalRef = useFocusTrap<HTMLDivElement>({
    isOpen: !!selectedReport,
    onClose: closeModal,
  });

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
    <article className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4 relative overflow-hidden" aria-labelledby="landing-title">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -z-10 opacity-[0.03]" aria-hidden="true">
        <ICONS.Shield className="w-[800px] h-[800px]" />
      </div>

      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 text-white text-[10px] font-black tracking-[0.2em] uppercase mb-12 border border-slate-700 shadow-2xl">
        <ICONS.Lock className="w-3 h-3 text-emerald-400" aria-hidden="true" /> Secure Evidence Chaining v3.0
      </div>

      <h1 id="landing-title" className="text-7xl md:text-9xl font-black text-slate-900 mb-8 tracking-tighter leading-tight">
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

      <section className="mt-32 max-w-6xl text-left" aria-labelledby="features-title">
        <h2 id="features-title" className="sr-only">주요 기능</h2>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-10 list-none p-0 m-0" role="list">
          <li>
            <FeatureCard
              icon={<ICONS.Lock className="text-blue-600" aria-hidden="true" />}
              title="Evidence Chaining"
              desc="모든 기록은 HMAC SHA-256 체인으로 연결되어 사후 조작이 원천적으로 불가능합니다."
            />
          </li>
          <li>
            <FeatureCard
              icon={<ICONS.FileText className="text-emerald-600" aria-hidden="true" />}
              title="Defense Pack"
              desc="노동부 점검 및 법적 분쟁 시 즉각 제출 가능한 전문 증빙 리포트를 비동기로 자동 생성합니다."
            />
          </li>
          <li>
            <FeatureCard
              icon={<ICONS.Activity className="text-amber-600" aria-hidden="true" />}
              title="Partner Portal"
              desc="전담 노무법인이 실시간으로 리스크를 통합 관제하며 즉각적인 법률 자문을 수행합니다."
            />
          </li>
        </ul>
      </section>
    </article>
  );

  const renderAdmin = () => (
    <section className="max-w-7xl mx-auto py-16 px-6" aria-labelledby="admin-title">
      <div className="flex justify-between items-end mb-12 pb-8 border-b-2 border-slate-100">
        <div>
          <h1 id="admin-title" className="text-5xl font-black tracking-tighter text-slate-900">{companyName} <span className="text-slate-300 font-light ml-2">Admin</span></h1>
          <div className="flex items-center gap-3 text-slate-500 mt-4 font-bold" role="status" aria-live="polite">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true"></span>
            <span className="sr-only">시스템 상태:</span> System Integrity: 100% Verified
          </div>
        </div>
        <nav className="flex gap-4" aria-label="관리자 작업">
           <button className="bg-red-50 text-red-600 px-8 py-4 rounded-2xl font-black text-sm border-2 border-red-100 hover:bg-red-100 transition flex items-center gap-3 shadow-xl shadow-red-50">
             <ICONS.AlertOctagon className="w-5 h-5" aria-hidden="true" /> 노무사 긴급 자문
           </button>
           <button onClick={() => setView('HOOK_TOOL')} className="bg-white border-2 border-slate-200 px-8 py-4 rounded-2xl font-black text-sm text-slate-600 hover:border-slate-900 transition">
             취업규칙 업데이트
           </button>
        </nav>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-2xl overflow-hidden">
        <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
          <h2 className="font-black text-xl text-slate-900 tracking-tight">최근 인입 사건</h2>
          <button onClick={() => setView('TRACK')} className="text-blue-600 text-xs font-black flex items-center gap-2 hover:underline">
            <ICONS.Search className="w-3 h-3" aria-hidden="true" /> 사건 추적 시스템
          </button>
        </div>
        <table className="w-full text-left" aria-describedby="reports-caption">
          <caption id="reports-caption" className="sr-only">
            최근 접수된 사건 목록. 총 {reports.length}건의 사건이 있습니다.
          </caption>
          <thead className="bg-white border-b border-slate-100">
            <tr>
              <th scope="col" className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Integrity</th>
              <th scope="col" className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Subject / ID</th>
              <th scope="col" className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
              <th scope="col" className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Logs</th>
              <th scope="col" className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {reports.map(r => (
              <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                <td className="p-6">
                   <div className="flex items-center gap-2 text-emerald-600" role="status" aria-label={`무결성 상태: ${r.integrityOk ? '검증됨' : '오류'}`}>
                     <ICONS.Shield className="w-4 h-4" aria-hidden="true" />
                     <span className="text-[10px] font-black">HMAC OK</span>
                   </div>
                </td>
                <td className="p-6">
                  <p className="font-black text-slate-900 text-lg group-hover:text-blue-600 transition-colors">{r.subject}</p>
                  <p className="text-[10px] text-slate-400 mt-2 uppercase font-mono font-bold tracking-wider">
                    <span className="sr-only">ID: </span>{r.id.slice(0, 12)}...
                    <span className="sr-only">, 분류: </span> • {r.category}
                  </p>
                </td>
                <td className="p-6">
                  <span className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-xl border ${
                    r.status === ReportStatus.RECEIVED ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-blue-50 text-blue-700 border-blue-100'
                  }`}>
                    <span className="sr-only">상태: </span>{r.status}
                  </span>
                </td>
                <td className="p-6 font-bold text-slate-500 text-sm">
                  <span className="sr-only">증거 노드: </span>{r.events.length} Evidence Nodes
                </td>
                <td className="p-6 text-right">
                  <button
                    onClick={() => { setSelectedReport(r); setAiAdvice(null); setPackProgress(0); setCurrentPack(null); }}
                    className="bg-slate-900 text-white px-6 py-2 rounded-xl text-xs font-black shadow-xl hover:bg-blue-600 transition-all active:scale-95"
                    aria-label={`${r.subject} 사건 관리 열기`}
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
        <div
          className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-50 flex items-center justify-center p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div
            ref={modalRef}
            className="bg-white w-full max-w-6xl rounded-[56px] shadow-[0_0_100px_rgba(0,0,0,0.5)] h-[94vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-300"
            tabIndex={-1}
          >
            <button
              onClick={closeModal}
              aria-label="모달 닫기"
              className="absolute top-10 right-10 text-slate-400 hover:text-slate-900 transition p-3 bg-slate-100 rounded-full z-10 active:scale-90"
            >
              <span aria-hidden="true">✕</span>
            </button>

            <div className="p-12 border-b-2 border-slate-50 flex items-center justify-between bg-slate-50/40">
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-[10px] font-black px-3 py-1 bg-blue-600 text-white rounded-full uppercase tracking-widest">Admin Control</span>
                  <span className="text-[10px] font-black px-3 py-1 bg-emerald-500 text-white rounded-full uppercase tracking-widest">Integrity Enforced</span>
                </div>
                <h2 id="modal-title" className="text-4xl font-black tracking-tighter text-slate-900">{selectedReport.subject}</h2>
              </div>
              <div role="tablist" aria-label="사건 상세 탭" className="flex gap-4 pr-16">
                 <TabButton id="tab-timeline" ariaControls="panel-timeline" active={!aiAdvice} onClick={() => setAiAdvice(null)} label="Timeline" />
                 <TabButton id="tab-strategy" ariaControls="panel-strategy" active={aiAdvice === 'STRATEGY'} onClick={() => { setAiAdvice('STRATEGY'); handleAiAdvice(selectedReport); }} label="AI Strategy" icon={<ICONS.Activity className="w-4 h-4" />} />
                 <TabButton id="tab-defense" ariaControls="panel-defense" active={aiAdvice === 'DEFENSE_PACK'} onClick={() => setAiAdvice('DEFENSE_PACK')} label="Defense Pack" icon={<ICONS.FileText className="w-4 h-4" />} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
              {!aiAdvice && (
                <div id="panel-timeline" role="tabpanel" aria-labelledby="tab-timeline" tabIndex={0} className="grid grid-cols-1 lg:grid-cols-3 gap-16">
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
                <div id="panel-strategy" role="tabpanel" aria-labelledby="tab-strategy" tabIndex={0} className="bg-slate-50 p-14 rounded-[48px] border-2 border-slate-100 animate-in fade-in duration-500 prose max-w-none">
                  <div className="flex items-center gap-4 mb-12">
                    <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-blue-100"><ICONS.Activity className="w-6 h-6" /></div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tight m-0 uppercase">AI Legal Risk Assessment</h3>
                  </div>
                  <div className="whitespace-pre-wrap font-sans text-slate-800 leading-loose text-xl" aria-busy={isLoading}>
                    {isLoading ? (
                      <div role="status" aria-live="polite" className="flex flex-col gap-6 animate-pulse">
                        <span className="sr-only">AI 분석 중입니다. 잠시만 기다려 주세요.</span>
                        <div className="h-8 bg-slate-200 rounded-xl w-3/4" aria-hidden="true"></div>
                        <div className="h-8 bg-slate-200 rounded-xl w-1/2" aria-hidden="true"></div>
                        <div className="h-8 bg-slate-200 rounded-xl w-5/6" aria-hidden="true"></div>
                      </div>
                    ) : (
                      <div role="status" aria-live="polite" className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm leading-relaxed">
                        {aiAdvice}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {aiAdvice === 'DEFENSE_PACK' && (
                <div id="panel-defense" role="tabpanel" aria-labelledby="tab-defense" tabIndex={0} className="animate-in fade-in zoom-in-95 duration-500 h-full">
                   {!currentPack ? (
                     <div className="py-32 text-center max-w-md mx-auto h-full flex flex-col justify-center">
                        <div className="mb-12 inline-block p-12 bg-slate-900 text-white rounded-[48px] animate-bounce shadow-2xl" aria-hidden="true">
                          <ICONS.FileText className="w-14 h-14" />
                        </div>
                        <h4 id="pack-progress-label" className="text-3xl font-black mb-6 tracking-tighter text-slate-900 uppercase">Generating Defense Pack</h4>
                        <p className="text-slate-500 mb-12 leading-relaxed text-lg font-medium">사건 처리 타임라인의 모든 HMAC 노드를 스냅샷하고,<br/>디지털 서명을 포함한 PDF 패키지를 빌드하고 있습니다.</p>
                        <div
                          role="progressbar"
                          aria-valuenow={packProgress}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-labelledby="pack-progress-label"
                          className="h-4 w-full bg-slate-100 rounded-full overflow-hidden mb-12 border border-slate-200"
                        >
                          <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: `${packProgress}%` }}></div>
                        </div>
                        <div role="status" aria-live="polite" className="sr-only">
                          {packProgress > 0 && packProgress < 100 && `Defense Pack 생성 중: ${packProgress}% 완료`}
                          {packProgress === 100 && 'Defense Pack 생성이 완료되었습니다.'}
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
    </section>
  );

  const renderPartner = () => (
    <section className="max-w-7xl mx-auto py-16 px-6" aria-labelledby="partner-title">
      <div className="flex justify-between items-end mb-16">
        <div>
          <h1 id="partner-title" className="text-6xl font-black tracking-tighter italic text-slate-900">Partner Portal</h1>
          <p className="text-slate-500 mt-4 font-bold text-xl uppercase tracking-widest opacity-60">Labor Attorney Integrated Dashboard</p>
        </div>
        <div className="bg-white border-4 border-slate-900 px-10 py-5 rounded-[32px] font-mono text-sm font-black shadow-2xl">
          INVITE CODE: <span className="text-blue-600 underline">SEJONG-2025</span>
        </div>
      </div>

      <ul className="grid grid-cols-1 md:grid-cols-3 gap-12 list-none p-0 m-0" role="list" aria-label="관리 테넌트 목록">
        {tenants.map(t => (
          <li key={t.id}>
            <article className="bg-white p-12 rounded-[56px] border border-slate-100 shadow-sm hover:shadow-3xl transition-all group relative overflow-hidden" aria-labelledby={`tenant-${t.id}`}>
              <div className={`absolute top-0 right-0 w-48 h-48 -mr-24 -mt-24 rounded-full blur-[100px] opacity-25 ${
                t.traffic === 'red' ? 'bg-red-500' : t.traffic === 'yellow' ? 'bg-amber-500' : 'bg-emerald-500'
              }`} aria-hidden="true"></div>

              <div className="flex justify-between items-start mb-12 relative">
                <div>
                  <h2 id={`tenant-${t.id}`} className="text-3xl font-black group-hover:text-blue-600 transition-colors tracking-tighter">{t.name}</h2>
                <p className="text-[10px] text-slate-400 mt-3 uppercase font-mono font-black tracking-[0.2em]">TENANT_UID: {t.id.slice(0, 12)}</p>
              </div>
              <div className={`px-5 py-2 rounded-full text-[11px] font-black uppercase border-2 flex items-center gap-2 ${
                t.traffic === 'red' ? 'bg-red-50 text-red-600 border-red-100' :
                t.traffic === 'yellow' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                'bg-emerald-50 text-emerald-600 border-emerald-100'
              }`}>
                <span className={`w-2 h-2 rounded-full animate-pulse ${t.traffic === 'red' ? 'bg-red-600' : t.traffic === 'yellow' ? 'bg-amber-600' : 'bg-emerald-600'}`} aria-hidden="true"></span>
                <span className="sr-only">위험 수준:</span> {t.traffic} Risk Level
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
                  aria-label={`${t.name} 대시보드 접근`}
                >
                  Access Dashboard
                </button>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );

  return (
    <div className="min-h-screen bg-[#FBFBFE] selection:bg-blue-100 font-sans">
      {/* Skip Link for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:bg-slate-900 focus:text-white focus:px-6 focus:py-3 focus:rounded-xl focus:font-bold focus:shadow-2xl"
        onClick={(e) => {
          e.preventDefault();
          const main = document.getElementById('main-content');
          if (main) {
            main.focus();
            main.scrollIntoView({ behavior: 'smooth' });
          }
        }}
      >
        본문 바로가기
      </a>

      <header role="banner" className="sticky top-0 z-40 w-full glass-effect border-b border-slate-100 px-10 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setView('LANDING')}
            className="flex items-center gap-4 cursor-pointer group bg-transparent border-none p-0"
            aria-label="SafeReport 홈으로 이동"
          >
            <div className="p-3 bg-slate-900 text-white rounded-[20px] group-hover:rotate-12 transition-transform shadow-xl shadow-slate-200">
              <ICONS.Shield className="w-6 h-6" aria-hidden="true" />
            </div>
            <span className="text-3xl font-black tracking-tighter text-slate-900 uppercase italic">SafeReport</span>
          </button>
          <nav role="navigation" aria-label="주 메뉴" className="hidden md:flex gap-14">
            <NavButton active={view === 'HOOK_TOOL'} onClick={() => setView('HOOK_TOOL')} label="Legal Hook" />
            <NavButton active={view === 'ADMIN'} onClick={() => setView('ADMIN')} label="Admin" />
            <NavButton active={view === 'PARTNER'} onClick={() => setView('PARTNER')} label="Partner" />
            <NavButton active={view === 'TRACK'} onClick={() => setView('TRACK')} label="Tracking" />
          </nav>
          <div className="flex items-center gap-6">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden lg:block" aria-hidden="true">System v3.0.4 Premium</span>
             <button className="bg-slate-900 text-white px-10 py-3 rounded-2xl text-xs font-black shadow-2xl shadow-slate-300 hover:bg-blue-600 transition active:scale-95 uppercase tracking-widest">Sign In</button>
          </div>
        </div>
      </header>

      <main id="main-content" role="main" tabIndex={-1} className="pb-40 outline-none">
        {view === 'LANDING' && renderLanding()}
        {view === 'PARTNER' && renderPartner()}
        {view === 'ADMIN' && renderAdmin()}
        {view === 'HOOK_TOOL' && renderHookTool()}
        {view === 'REPORT_FORM' && renderReportForm()}
        {view === 'ONBOARD' && renderOnboard()}
        {view === 'TRACK' && renderTrack()}
      </main>

      <footer role="contentinfo" className="bg-white border-t border-slate-100 py-32 px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-24">
          <div className="max-w-md">
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-slate-900 text-white rounded-[18px] shadow-xl"><ICONS.Shield className="w-6 h-6" aria-hidden="true" /></div>
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
      <section className="max-w-2xl mx-auto py-32 px-6 text-center animate-in fade-in duration-500" aria-labelledby="track-title">
         <h1 id="track-title" className="text-5xl font-black tracking-tighter mb-6">사건 추적 시스템</h1>
         <p id="track-desc" className="text-slate-500 mb-12 text-lg">제보 시 발급받은 <span className="font-bold text-slate-900">10자리 추적 코드</span>를 입력하세요.</p>
         <form className="bg-white p-12 rounded-[48px] border-2 border-slate-100 shadow-2xl" aria-describedby="track-desc" onSubmit={(e) => e.preventDefault()}>
            <div className="relative mb-8">
               <label htmlFor="track-code" className="sr-only">추적 코드</label>
               <input
                  id="track-code"
                  type="text"
                  maxLength={10}
                  value={trackCode}
                  onChange={(e) => setTrackCode(e.target.value.toUpperCase())}
                  placeholder="ABCDEF1234"
                  autoComplete="one-time-code"
                  pattern="[A-Z0-9]{10}"
                  aria-describedby="track-format"
                  className="w-full p-8 bg-slate-50 border-4 border-transparent focus:border-blue-500 focus:bg-white rounded-[32px] transition-all outline-none text-center font-mono text-4xl tracking-[0.4em] uppercase font-black"
               />
               <p id="track-format" className="sr-only">10자리 영문 대문자와 숫자 조합</p>
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white py-8 rounded-[32px] font-black text-2xl hover:bg-blue-600 transition-all shadow-2xl active:scale-95 uppercase tracking-widest">
              실시간 상태 조회
            </button>
            <p className="mt-8 text-xs text-slate-400 font-medium">본 시스템은 영장 없는 데이터 요청에 응하지 않으며, 모든 조회 이력은 감사 로그로 남습니다.</p>
         </form>
      </section>
    );
  }

  function renderOnboard() {
    return (
      <section className="max-w-md mx-auto py-32 px-6 animate-in fade-in slide-in-from-bottom-10 duration-500" aria-labelledby="onboard-title">
         <div className="text-center mb-16">
           <h1 id="onboard-title" className="text-5xl font-black tracking-tighter mb-4 text-slate-900">Activate Shield</h1>
           <p id="onboard-desc" className="text-slate-500 text-lg">노무법인에서 제공한 <span className="font-bold text-slate-900">초대 코드</span>를 입력하세요.</p>
         </div>
         <form className="bg-white p-12 rounded-[48px] border-2 border-slate-100 shadow-2xl space-y-10" aria-describedby="onboard-desc" onSubmit={(e) => { e.preventDefault(); setView('ADMIN'); }}>
           <div className="space-y-3">
             <label htmlFor="invite-code" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
               Invite Code <span className="text-red-500" aria-hidden="true">*</span>
               <span className="sr-only">(필수)</span>
             </label>
             <input
               id="invite-code"
               type="text"
               placeholder="SEJONG-XXXX"
               autoComplete="one-time-code"
               aria-required="true"
               className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-[24px] transition-all outline-none font-mono text-2xl tracking-widest uppercase font-black"
             />
           </div>
           <div className="space-y-3">
             <label htmlFor="company-name" className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
               Company Name <span className="text-red-500" aria-hidden="true">*</span>
               <span className="sr-only">(필수)</span>
             </label>
             <input
               id="company-name"
               type="text"
               onBlur={(e) => setCompanyName(e.target.value)}
               placeholder="예: (주) 아이언테크"
               autoComplete="organization"
               aria-required="true"
               className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-[24px] transition-all outline-none font-bold text-xl"
             />
           </div>
           <button type="submit" className="w-full bg-slate-900 text-white py-8 rounded-[32px] font-black text-2xl hover:bg-slate-800 transition shadow-2xl active:scale-95 uppercase tracking-widest">
             기업 대시보드 생성
           </button>
         </form>
      </section>
    );
  }

  function renderReportForm() {
    return (
      <section className="max-w-3xl mx-auto py-24 px-6" aria-labelledby="report-form-title">
        <SecurityAnimation />
        <form className="mt-16 bg-white p-16 rounded-[64px] border border-slate-100 shadow-3xl relative overflow-hidden" onSubmit={(e) => { e.preventDefault(); alert('제보가 암호화되어 안전하게 전송되었습니다. 추적 코드를 잘 보관하세요.'); setView('LANDING'); }}>
           <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500" aria-hidden="true"></div>
           <h1 id="report-form-title" className="text-5xl font-black tracking-tighter mb-6 text-slate-900 italic">Anonymous Intake</h1>
           <p id="report-form-desc" className="text-slate-500 text-xl mb-14 font-light leading-relaxed">귀하의 제보는 AES-256 암호화 후 HMAC 해시 체인으로 즉시 기록됩니다. 본 기록은 사후 조작이 불가능한 강력한 법적 증거가 됩니다.</p>

           <p className="text-slate-500 text-sm mb-8"><span className="text-red-500">*</span> 표시는 필수 항목입니다.</p>

           <fieldset className="space-y-12 border-none p-0 m-0">
              <legend className="sr-only">제보 정보</legend>

              <div className="space-y-4">
                <label htmlFor="intake-category" className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Category <span className="text-red-500" aria-hidden="true">*</span>
                  <span className="sr-only">(필수)</span>
                </label>
                <select
                  id="intake-category"
                  aria-required="true"
                  className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-[24px] transition-all outline-none font-bold text-xl appearance-none shadow-sm cursor-pointer"
                >
                  <option value="power_abuse">Power Abuse (직장 내 괴롭힘)</option>
                  <option value="sexual_harassment">Sexual Harassment (성희롱)</option>
                  <option value="verbal_abuse">Verbal Abuse (폭언/폭행)</option>
                  <option value="retaliation">Retaliation (보복/불이익)</option>
                </select>
              </div>
              <div className="space-y-4">
                <label htmlFor="intake-subject" className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Subject <span className="text-red-500" aria-hidden="true">*</span>
                  <span className="sr-only">(필수)</span>
                </label>
                <input
                  id="intake-subject"
                  type="text"
                  placeholder="사건의 요지를 짧게 입력하세요."
                  autoComplete="off"
                  aria-required="true"
                  className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-[24px] transition-all outline-none font-bold text-xl shadow-sm"
                />
              </div>
              <div className="space-y-4">
                <label htmlFor="intake-narrative" className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                  Evidence Narrative <span className="text-red-500" aria-hidden="true">*</span>
                  <span className="sr-only">(필수)</span>
                </label>
                <textarea
                  id="intake-narrative"
                  placeholder="육하원칙에 따라 상세히 기술해주세요."
                  autoComplete="off"
                  aria-required="true"
                  aria-describedby="narrative-hint"
                  className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-[24px] transition-all outline-none font-medium text-xl h-60 leading-relaxed shadow-sm resize-none"
                ></textarea>
                <p id="narrative-hint" className="text-xs text-slate-400 ml-1">육하원칙(누가, 언제, 어디서, 무엇을, 어떻게, 왜)에 따라 상세히 기술해주세요.</p>
              </div>

              <aside className="p-8 bg-emerald-50 rounded-[32px] border border-emerald-100 flex items-center gap-6" aria-label="보안 알림">
                <div className="p-4 bg-white text-emerald-600 rounded-[22px] shadow-sm"><ICONS.Lock className="w-6 h-6" aria-hidden="true" /></div>
                <div>
                  <p className="text-base font-black text-emerald-900 tracking-tight">Warrant Canary Active</p>
                  <p className="text-xs text-emerald-700 mt-2 opacity-80 font-medium leading-relaxed">SafeReport는 지난 24시간 동안 수사기관으로부터 어떠한 사용자 데이터 요청도 수신하지 않았음을 선언합니다.</p>
                </div>
              </aside>

              <button
                type="submit"
                className="w-full bg-slate-900 text-white py-8 rounded-[32px] font-black text-2xl hover:bg-blue-600 transition shadow-2xl active:scale-95 uppercase tracking-widest"
              >
                Shield On & Submit
              </button>
           </fieldset>
        </form>
      </section>
    );
  }

  function renderHookTool() {
    return (
      <section className="max-w-4xl mx-auto py-24 px-6 animate-in fade-in duration-500" aria-labelledby="hook-tool-title">
         <div className="text-center mb-20">
           <h1 id="hook-tool-title" className="text-6xl font-black tracking-tighter mb-6 text-slate-900 italic underline decoration-blue-500 decoration-8 underline-offset-12">Legal Hook Tool</h1>
           <p className="text-slate-500 text-2xl font-light">AI가 생성하는 최신 판례 기반 직장 내 괴롭힘 방지 조항</p>
         </div>
         <form className="bg-white p-16 rounded-[64px] border-2 border-slate-100 shadow-2xl mb-16" onSubmit={async (e) => { e.preventDefault(); setIsLoading(true); const rule = await generateEmploymentRule(companyName); setGeneratedRule(rule || ''); setIsLoading(false); }}>
            <div className="flex flex-col md:flex-row gap-8 items-end">
               <div className="flex-1 space-y-4">
                  <label htmlFor="hook-company-name" className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Company Name <span className="text-red-500" aria-hidden="true">*</span>
                    <span className="sr-only">(필수)</span>
                  </label>
                  <input
                    id="hook-company-name"
                    type="text"
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="예: 주식회사 아이언랩"
                    autoComplete="organization"
                    aria-required="true"
                    className="w-full p-6 bg-slate-50 border-4 border-transparent focus:border-blue-500 focus:bg-white rounded-[24px] transition-all outline-none font-bold text-2xl shadow-sm"
                  />
               </div>
               <button
                type="submit"
                disabled={isLoading || !companyName}
                aria-busy={isLoading}
                className="bg-blue-600 text-white px-16 py-6 rounded-[24px] font-black text-xl shadow-2xl shadow-blue-100 hover:bg-blue-700 transition disabled:opacity-50 active:scale-95 uppercase tracking-widest"
               >
                 {isLoading ? 'Processing...' : 'AI 조항 생성'}
               </button>
            </div>
         </form>
         <div role="status" aria-live="polite" className="sr-only">
           {isLoading && 'AI 조항을 생성하고 있습니다. 잠시만 기다려 주세요.'}
           {generatedRule && !isLoading && 'AI 조항 생성이 완료되었습니다.'}
         </div>
         {generatedRule && (
            <article className="bg-slate-900 text-slate-300 p-16 rounded-[64px] shadow-[0_50px_100px_rgba(0,0,0,0.4)] prose prose-invert max-w-none animate-in slide-in-from-bottom-10 duration-700" aria-labelledby="generated-clause-title">
              <div className="flex justify-between items-center mb-12 border-b border-slate-800 pb-8">
                <h2 id="generated-clause-title" className="text-white font-black text-3xl m-0 tracking-tight uppercase tracking-widest">Legal Clause Generated</h2>
                <button type="button" className="text-emerald-400 font-bold text-xs uppercase border-2 border-emerald-400/30 px-5 py-2 rounded-xl hover:bg-emerald-400/10 transition tracking-widest">Copy Markdown</button>
              </div>
              <div className="whitespace-pre-wrap leading-loose text-xl font-sans text-slate-300" role="region" aria-label="생성된 조항 내용">
                {generatedRule}
              </div>
              <div className="mt-20 pt-12 border-t border-slate-800 text-center">
                 <p className="text-white font-bold text-2xl mb-10">본 조항을 기업 취업규칙에 즉시 적용하시겠습니까?</p>
                 <button type="button" onClick={() => setView('ONBOARD')} className="bg-emerald-500 text-slate-900 px-16 py-6 rounded-[32px] font-black text-2xl hover:bg-emerald-400 transition-all active:scale-95 shadow-2xl shadow-emerald-900/40 uppercase tracking-widest">SafeReport 도입 문의 (Free)</button>
              </div>
            </article>
         )}
      </section>
    );
  }
};

// UI Helper Components
const NavButton = ({ label, active, onClick }: { label: string, active: boolean, onClick: () => void }) => (
  <button
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`text-[10px] font-black uppercase tracking-[0.3em] transition-all hover:tracking-[0.4em] ${active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-900'}`}
  >
    {label}
  </button>
);

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
  <div className="p-10 bg-white rounded-[48px] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="text-2xl font-black mb-4 tracking-tight uppercase">{title}</h3>
    <p className="text-slate-500 leading-relaxed font-medium">{desc}</p>
  </div>
);

const TabButton = ({
  id,
  active,
  onClick,
  label,
  icon,
  ariaControls,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
  ariaControls: string;
}) => (
  <button
    id={id}
    role="tab"
    aria-selected={active}
    aria-controls={ariaControls}
    tabIndex={active ? 0 : -1}
    onClick={onClick}
    className={`px-8 py-4 rounded-[22px] text-sm font-black transition-all flex items-center gap-3 ${active ? 'bg-slate-900 text-white shadow-2xl scale-105' : 'bg-white border-2 border-slate-100 text-slate-400 hover:bg-slate-50'}`}
  >
    {icon && <span aria-hidden="true">{icon}</span>} {label}
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
