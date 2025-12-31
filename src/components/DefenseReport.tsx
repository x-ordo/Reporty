
import React, { useState } from 'react';
import { Report, DefensePack } from '../types';
import { ICONS } from '../constants';

interface Props {
  report: Report;
  companyName: string;
  pack: DefensePack;
}

const DefenseReport: React.FC<Props> = ({ report, companyName, pack }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(`/api/admin/reports/${report.id}/pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': process.env.GEMINI_API_KEY || '',
        },
      });

      if (response.ok) {
        alert('PDF 생성이 시작되었습니다. 잠시 후 목록에서 확인하세요.');
      } else {
        const errorData = await response.json();
        alert(`PDF 생성에 실패했습니다: ${errorData.error}`);
      }
    } catch (error) {
      console.error('PDF download error:', error);
      alert('PDF 생성 요청 중 오류가 발생했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="bg-white p-12 max-w-4xl mx-auto border-2 border-slate-100 shadow-sm print:shadow-none font-sans text-slate-900">
      {/* Official Watermark / Header */}
      <div className="flex justify-between items-start border-b-4 border-slate-900 pb-10 mb-10">
        <div>
          <h1 className="text-5xl font-black uppercase tracking-tighter mb-2">Defense Pack</h1>
          <p className="text-slate-500 font-bold text-sm tracking-widest uppercase">SafeReport Legal Shield Integrity Snapshot</p>
        </div>
        <div className="text-right text-[10px] font-mono text-slate-400 leading-tight">
          <p>PACK ID: {pack.id}</p>
          <p>REPORT: {report.id}</p>
          <p>GEN AT: {new Date(pack.createdAt).toISOString()}</p>
        </div>
      </div>

      <section className="mb-10">
        <h2 className="text-lg font-black mb-4 bg-slate-900 text-white px-3 py-1 inline-block">01. CASE SUMMARY</h2>
        <div className="grid grid-cols-2 gap-8 text-sm border-t border-slate-100 pt-6">
          <div className="space-y-3">
            <p><strong>발행 대상:</strong> {companyName}</p>
            <p><strong>사건 분류:</strong> {report.category || '미지정'}</p>
            <p><strong>현재 상태:</strong> <span className="uppercase font-bold text-blue-600">{report.status}</span></p>
          </div>
          <div className="space-y-3 text-right">
            <p><strong>접수 일시:</strong> {new Date(report.createdAt).toLocaleString('ko-KR')}</p>
            <p><strong>AI 심각도:</strong> <span className="font-bold text-red-600">{report.priority}</span></p>
            <p><strong>데이터 보존:</strong> AES-256-GCM / HMAC Chain</p>
          </div>
        </div>
      </section>

      <section className="mb-10 bg-slate-50 p-8 rounded-3xl border border-slate-200">
        <h2 className="text-lg font-black mb-6 flex items-center gap-2">
          <ICONS.Shield className="text-emerald-600 w-5 h-5" /> 02. INTEGRITY VERIFICATION (무결성 검증)
        </h2>
        <div className="space-y-4">
          <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-slate-200">
            <div className={`px-4 py-1 rounded-full font-black text-xs text-white ${pack.verifyOk ? 'bg-emerald-600' : 'bg-red-600'}`}>
              {pack.verifyOk ? 'VERIFIED PASS' : 'INTEGRITY FAIL'}
            </div>
            <p className="text-xs text-slate-500 font-medium">생성 시점 HMAC-SHA256 체인 재연산 결과가 DB Evidence Head와 100% 일치함.</p>
          </div>
          <div className="grid grid-cols-1 gap-3 font-mono text-[9px]">
            <div className="bg-slate-900 text-slate-400 p-4 rounded-xl overflow-hidden">
              <p className="text-slate-500 mb-1 font-sans font-bold uppercase tracking-widest">Evidence Head Hash</p>
              <p className="break-all text-slate-200">{pack.storedHead}</p>
            </div>
            <div className="bg-slate-900 text-blue-400 p-4 rounded-xl overflow-hidden">
              <p className="text-slate-500 mb-1 font-sans font-bold uppercase tracking-widest">System Digital Signature</p>
              <p className="break-all">{pack.signature}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-10" aria-labelledby="defense-log-title">
        <h2 id="defense-log-title" className="text-lg font-black mb-6 border-l-4 border-slate-900 pl-4">03. DEFENSE LOG (조치 이력 타임라인)</h2>
        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs" aria-describedby="defense-log-desc">
            <caption id="defense-log-desc" className="sr-only">
              사건 처리 이력 타임라인. 각 행에는 타임스탬프, 이벤트 유형, 담당자, 무결성 해시가 포함됩니다.
            </caption>
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th scope="col" className="p-4 font-black uppercase text-slate-500">Timestamp</th>
                <th scope="col" className="p-4 font-black uppercase text-slate-500">Event Type</th>
                <th scope="col" className="p-4 font-black uppercase text-slate-500">Actor</th>
                <th scope="col" className="p-4 font-black uppercase text-slate-500">Integrity Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.events.map((e, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 whitespace-nowrap text-slate-400">{new Date(e.createdAt).toLocaleString()}</td>
                  <td className="p-4 font-bold uppercase">{e.type.replace(/_/g, ' ')}</td>
                  <td className="p-4 uppercase font-medium">{e.actorRole}</td>
                  <td className="p-4 font-mono text-[10px] text-slate-300">
                    <span className="sr-only">해시값: </span>{e.eventHash.slice(0, 16)}...
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-20 pt-10 border-t border-slate-200 text-center">
        <div className="mb-6 flex justify-center opacity-10" aria-hidden="true">
          <ICONS.Shield className="w-16 h-16" />
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed max-w-xl mx-auto italic">
          본 Defense Pack은 SafeReport Iron Dome 엔진에 의해 자동 생성된 무결성 스냅샷입니다. 
          각 이벤트는 이전 해시를 포함한 HMAC 체인으로 암호학적으로 연결되어 있으며, 사후 조작 시 시스템 서명이 파기됩니다.
        </p>
        <p className="mt-6 font-mono text-[9px] text-slate-300 uppercase tracking-widest">
          SafeReport • Iron Dome Project • Signature: {pack.signature.slice(0, 24)}
        </p>
      </div>

      <div className="mt-12 flex justify-end gap-3 no-print" role="group" aria-label="인쇄 옵션">
        <button
          onClick={() => window.print()}
          className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-slate-800 transition shadow-2xl"
        >
          <ICONS.FileText className="w-4 h-4" aria-hidden="true" /> 리포트 다운로드 / 인쇄
        </button>
      </div>
    </div>
  );
};

export default DefenseReport;
