import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { Report } from '../types';
import {
  createAnchor,
  getAnchors,
  confirmAnchor,
  getAnchorForReport,
  verifyReportInAnchor,
  generateVerificationCertificate,
  AnchorRecord,
} from '../services/anchorService';

interface Props {
  reports: Report[];
  onAnchorComplete?: (anchor: AnchorRecord) => void;
}

const MerkleAnchor: React.FC<Props> = ({ reports, onAnchorComplete }) => {
  const [anchors, setAnchors] = useState<AnchorRecord[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedAnchor, setSelectedAnchor] = useState<AnchorRecord | null>(null);
  const [tweetIdInput, setTweetIdInput] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    reportId: string;
    verified: boolean;
  } | null>(null);
  const [showCertificate, setShowCertificate] = useState<string | null>(null);

  useEffect(() => {
    setAnchors(getAnchors());
  }, []);

  const pendingReports = reports.filter(
    r => !anchors.some(a => a.reportIds.includes(r.id))
  );

  const handleCreateAnchor = async () => {
    if (pendingReports.length === 0) return;

    setIsCreating(true);
    try {
      const reportHashes = pendingReports.map(r => ({
        id: r.id,
        hash: r.evidenceHeadHash || r.id,
      }));

      const result = await createAnchor(reportHashes);

      // Open Twitter intent
      window.open(result.tweetIntentUrl, '_blank', 'width=600,height=400');

      setAnchors(prev => [...prev, result.anchor]);
      setSelectedAnchor(result.anchor);
      onAnchorComplete?.(result.anchor);
    } catch (error) {
      console.error('Anchor creation failed:', error);
      alert('앵커 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmTweet = () => {
    if (!selectedAnchor || !tweetIdInput.trim()) return;

    const tweetUrl = `https://twitter.com/i/status/${tweetIdInput}`;
    confirmAnchor(selectedAnchor.id, tweetIdInput, tweetUrl);

    setAnchors(prev =>
      prev.map(a =>
        a.id === selectedAnchor.id
          ? { ...a, tweetId: tweetIdInput, tweetUrl, status: 'anchored' as const }
          : a
      )
    );
    setSelectedAnchor(null);
    setTweetIdInput('');
  };

  const handleVerify = async (reportId: string, anchorId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const result = await verifyReportInAnchor(
      report.evidenceHeadHash || report.id,
      anchorId
    );

    setVerificationResult({ reportId, verified: result.verified });
    setTimeout(() => setVerificationResult(null), 3000);
  };

  const handleShowCertificate = (anchor: AnchorRecord, reportId: string) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    const cert = generateVerificationCertificate(
      anchor,
      reportId,
      report.evidenceHeadHash || report.id
    );
    setShowCertificate(cert);
  };

  const getStatusBadge = (status: AnchorRecord['status']) => {
    switch (status) {
      case 'pending':
        return (
          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
            대기중
          </span>
        );
      case 'anchored':
        return (
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full flex items-center gap-1">
            <ICONS.CheckCircle className="w-3 h-3" /> 앵커됨
          </span>
        );
      case 'verified':
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
            검증됨
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
            <ICONS.Lock className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-900">Merkle Anchor</h3>
            <p className="text-xs text-slate-500">Twitter/X 타임스탬프 증명</p>
          </div>
        </div>

        {pendingReports.length > 0 && (
          <button
            onClick={handleCreateAnchor}
            disabled={isCreating}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isCreating ? (
              <>
                <ICONS.Activity className="w-4 h-4 animate-spin" />
                생성 중...
              </>
            ) : (
              <>
                <ICONS.Shield className="w-4 h-4" />
                {pendingReports.length}건 앵커링
              </>
            )}
          </button>
        )}
      </div>

      {/* Pending Reports Info */}
      {pendingReports.length > 0 && (
        <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
          <div className="flex items-center gap-2 text-amber-800">
            <ICONS.Clock className="w-4 h-4" />
            <span className="text-sm font-medium">
              {pendingReports.length}개 리포트가 앵커링 대기 중입니다.
            </span>
          </div>
        </div>
      )}

      {/* Tweet ID Input Modal */}
      {selectedAnchor && (
        <div className="p-6 bg-slate-900 rounded-2xl text-white">
          <h4 className="font-bold mb-4 flex items-center gap-2">
            <ICONS.CheckCircle className="w-5 h-5 text-emerald-400" />
            트윗 ID 입력
          </h4>
          <p className="text-sm text-slate-400 mb-4">
            트윗 게시 후, 트윗 URL에서 ID를 복사하여 입력하세요.
            <br />
            예: twitter.com/user/status/<strong>1234567890</strong>
          </p>
          <div className="flex gap-3">
            <input
              type="text"
              value={tweetIdInput}
              onChange={e => setTweetIdInput(e.target.value)}
              placeholder="트윗 ID 입력"
              className="flex-1 px-4 py-2 bg-slate-800 rounded-lg text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleConfirmTweet}
              disabled={!tweetIdInput.trim()}
              className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
            >
              확인
            </button>
            <button
              onClick={() => setSelectedAnchor(null)}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Anchor List */}
      <div className="space-y-4">
        {anchors.map(anchor => (
          <div
            key={anchor.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            {/* Anchor Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <ICONS.Lock className="w-4 h-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-900">
                      {anchor.id.slice(0, 20)}...
                    </span>
                    {getStatusBadge(anchor.status)}
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(anchor.createdAt).toLocaleString('ko-KR')}
                  </span>
                </div>
              </div>

              {anchor.tweetUrl && (
                <a
                  href={anchor.tweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg hover:bg-slate-200 transition flex items-center gap-1"
                >
                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                  트윗 보기
                </a>
              )}
            </div>

            {/* Merkle Root */}
            <div className="px-4 py-3 bg-slate-50">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Merkle Root
              </p>
              <code className="text-xs font-mono text-slate-600 break-all">
                {anchor.merkleRoot}
              </code>
            </div>

            {/* Anchored Reports */}
            <div className="p-4">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
                포함된 리포트 ({anchor.reportIds.length})
              </p>
              <div className="space-y-2">
                {anchor.reportIds.map(reportId => {
                  const report = reports.find(r => r.id === reportId);
                  const isVerified = verificationResult?.reportId === reportId;

                  return (
                    <div
                      key={reportId}
                      className={`flex items-center justify-between p-3 rounded-xl transition ${
                        isVerified
                          ? verificationResult.verified
                            ? 'bg-emerald-50 border border-emerald-200'
                            : 'bg-red-50 border border-red-200'
                          : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {isVerified && (
                          verificationResult.verified ? (
                            <ICONS.CheckCircle className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <ICONS.AlertOctagon className="w-4 h-4 text-red-600" />
                          )
                        )}
                        <span className="text-sm font-medium text-slate-700">
                          {report?.subject || reportId.slice(0, 16) + '...'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVerify(reportId, anchor.id)}
                          className="px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition"
                        >
                          검증
                        </button>
                        <button
                          onClick={() => handleShowCertificate(anchor, reportId)}
                          className="px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 rounded transition"
                        >
                          인증서
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}

        {anchors.length === 0 && pendingReports.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <ICONS.Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">앵커된 리포트가 없습니다.</p>
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h4 className="font-bold text-lg">검증 인증서</h4>
              <button
                onClick={() => setShowCertificate(null)}
                className="p-2 hover:bg-slate-100 rounded-lg transition"
              >
                <ICONS.X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[60vh]">
              <pre className="text-xs font-mono bg-slate-900 text-emerald-400 p-4 rounded-xl overflow-x-auto whitespace-pre">
                {showCertificate}
              </pre>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(showCertificate);
                  alert('인증서가 클립보드에 복사되었습니다.');
                }}
                className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition"
              >
                복사
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerkleAnchor;
