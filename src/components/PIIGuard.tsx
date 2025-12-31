import React, { useState, useEffect, useCallback } from 'react';
import { ICONS } from '../constants';
import { quickPIICheck, deepPIIAnalysis, PIIDetection, PIIAnalysisResult } from '../services/piiService';

interface Props {
  text: string;
  onMaskedTextChange?: (maskedText: string) => void;
  showDeepAnalysis?: boolean;
  className?: string;
}

const PIIGuard: React.FC<Props> = ({
  text,
  onMaskedTextChange,
  showDeepAnalysis = false,
  className = '',
}) => {
  const [quickDetections, setQuickDetections] = useState<PIIDetection[]>([]);
  const [deepResult, setDeepResult] = useState<PIIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // Quick check on every text change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      const detections = quickPIICheck(text);
      setQuickDetections(detections);
    }, 300);
    return () => clearTimeout(timer);
  }, [text]);

  // Deep analysis on demand
  const runDeepAnalysis = useCallback(async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    try {
      const result = await deepPIIAnalysis(text);
      setDeepResult(result);
      if (onMaskedTextChange && result.maskedText !== text) {
        onMaskedTextChange(result.maskedText);
      }
    } catch (error) {
      console.error('Deep analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [text, onMaskedTextChange]);

  const getTypeLabel = (type: PIIDetection['type']) => {
    const labels: Record<PIIDetection['type'], string> = {
      name: '이름',
      phone: '전화번호',
      email: '이메일',
      rrn: '주민번호',
      address: '주소',
      account: '계좌번호',
      other: '기타',
    };
    return labels[type];
  };

  const getSeverityColor = (severity: PIIDetection['severity']) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'medium':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low':
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  const getRiskBadge = (level: PIIAnalysisResult['riskLevel']) => {
    switch (level) {
      case 'danger':
        return (
          <span className="px-2 py-1 bg-red-600 text-white text-xs font-bold rounded-full animate-pulse">
            위험
          </span>
        );
      case 'caution':
        return (
          <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded-full">
            주의
          </span>
        );
      case 'safe':
        return (
          <span className="px-2 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full">
            안전
          </span>
        );
    }
  };

  const detections = deepResult?.detections || quickDetections;
  const hasIssues = detections.length > 0;

  if (!text.trim()) return null;

  return (
    <div className={`${className}`}>
      {/* Quick Alert Bar */}
      {hasIssues && (
        <div
          className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
            detections.some(d => d.severity === 'high')
              ? 'bg-red-50 border-red-200'
              : 'bg-amber-50 border-amber-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                detections.some(d => d.severity === 'high') ? 'bg-red-500' : 'bg-amber-500'
              }`}
            >
              <ICONS.Eye className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-800">
                개인정보 {detections.length}건 탐지됨
              </p>
              <p className="text-xs text-slate-500">
                {detections
                  .slice(0, 3)
                  .map(d => getTypeLabel(d.type))
                  .join(', ')}
                {detections.length > 3 && ` 외 ${detections.length - 3}건`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {deepResult && getRiskBadge(deepResult.riskLevel)}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-2 hover:bg-white/50 rounded-lg transition"
            >
              <ICONS.ChevronRight
                className={`w-4 h-4 text-slate-500 transition-transform ${
                  showDetails ? 'rotate-90' : ''
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* No Issues */}
      {!hasIssues && text.length > 20 && (
        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border-2 border-emerald-200">
          <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
            <ICONS.Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm text-emerald-800">개인정보 미탐지</p>
            <p className="text-xs text-emerald-600">자동 검사 통과</p>
          </div>
        </div>
      )}

      {/* Details Panel */}
      {showDetails && hasIssues && (
        <div className="mt-3 p-4 bg-white rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-sm text-slate-700">탐지된 개인정보</h4>
            {showDeepAnalysis && (
              <button
                onClick={runDeepAnalysis}
                disabled={isAnalyzing}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <ICONS.Activity className="w-3 h-3 animate-spin" />
                    AI 분석 중...
                  </>
                ) : (
                  <>
                    <ICONS.Search className="w-3 h-3" />
                    AI 정밀 분석
                  </>
                )}
              </button>
            )}
          </div>

          <div className="space-y-2">
            {detections.map((detection, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between p-3 rounded-lg border ${getSeverityColor(
                  detection.severity
                )}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase">{getTypeLabel(detection.type)}</span>
                  <code className="text-xs bg-white/50 px-2 py-0.5 rounded font-mono">
                    {detection.text.length > 20
                      ? detection.text.slice(0, 20) + '...'
                      : detection.text}
                  </code>
                </div>
                <span className="text-xs opacity-70">{detection.suggestion}</span>
              </div>
            ))}
          </div>

          {deepResult && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-2">마스킹된 텍스트 미리보기:</p>
              <div className="p-3 bg-slate-50 rounded-lg text-sm text-slate-700 max-h-32 overflow-y-auto">
                {deepResult.maskedText}
              </div>
              <button
                onClick={() => onMaskedTextChange?.(deepResult.maskedText)}
                className="mt-3 w-full py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition"
              >
                마스킹된 텍스트로 대체
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PIIGuard;
