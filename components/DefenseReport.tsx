
import React from 'react';
import { Report, ReportPriority } from '../types';
import { ICONS } from '../constants';

interface Props {
  report: Report;
  companyName: string;
  packId: string;
  signature: string;
}

const DefenseReport: React.FC<Props> = ({ report, companyName, packId, signature }) => {
  return (
    <div className="bg-white p-10 max-w-4xl mx-auto border shadow-sm print:shadow-none font-sans text-slate-900 leading-relaxed">
      {/* Header Section */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter">Defense Pack</h1>
          <p className="text-slate-500 font-bold text-sm mt-1">법적 의무 준수 및 조치 이력 증빙서</p>
        </div>
        <div className="text-right text-xs font-mono space-y-1">
          <p><b>Pack ID:</b> {packId}</p>
          <p><b>Report ID:</b> {report.id}</p>
          <p><b>Tenant:</b> {companyName}</p>
          <p><b>Generated:</b> {new Date().toISOString()}</p>
        </div>
      </div>

      {/* Meta Grid */}
      <div className="grid grid-cols-2 gap-8 mb-10 text-sm">
        <div className="space-y-2">
          <p><b>상태:</b> <span className="uppercase font-bold">{report.status}</span></p>
          <p><b>분류:</b> {report.category || '미지정'}</p>
          <p><b>제목:</b> {report.subject || '제목 없음'}</p>
        </div>
        <div className="space-y-2">
          <p><b>접수 일시:</b> {new Date(report.createdAt).toLocaleString('ko-KR')}</p>
          <p><b>심각도(AI):</b> <span className="font-bold text-red-600">{report.priority}</span></p>
          <p><b>보안:</b> AES-256-GCM / HMAC Chain</p>
        </div>
      </div>

      {/* Integrity Snapshot */}
      <section className="mb-12 bg-slate-50 p-6 rounded-2xl border border-slate-200">
        <h2 className="text-lg font-black mb-4 flex items-center gap-2">
          <ICONS.Shield /> Integrity Verification (무결성 검증)
        </h2>
        <div className="grid grid-cols-1 gap-4 text-xs font-mono">
          <div className="flex items-center gap-4">
            <span className={`px-4 py-1 rounded-full font-bold text-white ${report.integrityOk ? 'bg-emerald-600' : 'bg-red-600'}`}>
              {report.integrityOk ? 'PASS' : 'FAIL'}
            </span>
            <span className="text-slate-500">생성 시점 HMAC 체인 재연산 결과 DB 헤드와 일치함</span>
          </div>
          <div className="bg-white p-3 rounded border overflow-x-auto">
            <p className="text-slate-400 mb-1 font-sans font-bold uppercase tracking-widest text-[10px]">Evidence Head Hash</p>
            <p className="break-all text-slate-800">{report.evidenceHeadHash}</p>
          </div>
          <div className="bg-white p-3 rounded border overflow-x-auto">
            <p className="text-slate-400 mb-1 font-sans font-bold uppercase tracking-widest text-[10px]">System Signature (Digital Seal)</p>
            <p className="break-all text-blue-700">{signature}</p>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="mb-12">
        <h2 className="text-lg font-black mb-6 border-l-4 border-slate-900 pl-3">Defense Log (사건 처리 타임라인)</h2>
        <div className="overflow-hidden border rounded-xl">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-3 font-bold">시간</th>
                <th className="p-3 font-bold">이벤트</th>
                <th className="p-3 font-bold">주체</th>
                <th className="p-3 font-bold">상세 데이터 (Metadata)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {report.events.map((e, idx) => (
                <tr key={idx}>
                  <td className="p-3 whitespace-nowrap text-slate-500">{new Date(e.createdAt).toLocaleString()}</td>
                  <td className="p-3 font-bold uppercase">{e.type}</td>
                  <td className="p-3 uppercase">{e.actorRole}</td>
                  <td className="p-3">
                    <pre className="font-mono text-[10px] bg-slate-50 p-2 rounded max-w-xs overflow-hidden">
                      {JSON.stringify(e.data, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Footer Statement */}
      <div className="mt-20 pt-10 border-t border-slate-200 text-[11px] text-slate-400 text-center leading-relaxed">
        <p className="mb-2 font-bold">Legal Disclaimer</p>
        <p>본 증빙서는 SafeReport 시스템에 의해 자동 생성된 무결성 스냅샷입니다.</p>
        <p>각 이벤트는 이전 해시(prev_hash)를 포함한 HMAC-SHA256 체인으로 암호학적으로 연결되어 있으며, 수정 시 서명이 파기됩니다.</p>
        <p className="mt-4 font-mono">SafeReport • Iron Dome Project • {signature.slice(0, 16)}</p>
      </div>

      <div className="mt-12 flex justify-end gap-3 no-print">
        <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-800 shadow-lg">
          <ICONS.FileText /> PDF로 저장 / 인쇄
        </button>
      </div>
    </div>
  );
};

export default DefenseReport;
