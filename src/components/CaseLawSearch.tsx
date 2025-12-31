import React, { useState, useEffect } from 'react';
import { ICONS } from '../constants';
import { CaseLaw, getCategoryLabel, getCaseLawStats } from '../data/caseLaw';
import {
  searchSimilarCases,
  quickKeywordSearch,
  extractKeywords,
  initializeCaseLawEmbeddings,
  SimilarCase,
} from '../services/vectorService';

interface Props {
  reportContent?: string;
  reportCategory?: string;
  onCaseSelect?: (caseLaw: CaseLaw) => void;
}

const CaseLawSearch: React.FC<Props> = ({
  reportContent,
  reportCategory,
  onCaseSelect,
}) => {
  const [isInitializing, setIsInitializing] = useState(false);
  const [initProgress, setInitProgress] = useState({ current: 0, total: 0 });
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SimilarCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<CaseLaw | null>(null);
  const [searchMode, setSearchMode] = useState<'auto' | 'manual'>('auto');
  const [manualQuery, setManualQuery] = useState('');
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([]);

  // Initialize embeddings on mount
  useEffect(() => {
    const init = async () => {
      setIsInitializing(true);
      try {
        await initializeCaseLawEmbeddings((current, total) => {
          setInitProgress({ current, total });
        });
      } catch (e) {
        console.error('Failed to initialize embeddings:', e);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, []);

  // Auto-search when report content changes
  useEffect(() => {
    if (reportContent && searchMode === 'auto' && !isInitializing) {
      handleAutoSearch();
    }
  }, [reportContent, searchMode, isInitializing]);

  const handleAutoSearch = async () => {
    if (!reportContent) return;

    setIsSearching(true);
    try {
      // Extract keywords for display
      const keywords = extractKeywords(reportContent);
      setExtractedKeywords(keywords);

      // AI-powered semantic search
      const results = await searchSimilarCases(reportContent, 5, 0.25);
      setSearchResults(results);
    } catch (e) {
      console.error('Search failed:', e);
      // Fallback to keyword search
      const keywords = extractKeywords(reportContent);
      const fallbackResults = quickKeywordSearch(keywords, 5);
      setSearchResults(fallbackResults.map(c => ({ caseLaw: c, similarity: 0 })));
    } finally {
      setIsSearching(false);
    }
  };

  const handleManualSearch = async () => {
    if (!manualQuery.trim()) return;

    setIsSearching(true);
    try {
      const results = await searchSimilarCases(manualQuery, 5, 0.2);
      setSearchResults(results);
    } catch (e) {
      console.error('Manual search failed:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleCaseClick = (caseLaw: CaseLaw) => {
    setSelectedCase(selectedCase?.id === caseLaw.id ? null : caseLaw);
    onCaseSelect?.(caseLaw);
  };

  const getVerdictBadge = (verdict: CaseLaw['verdict']) => {
    switch (verdict) {
      case 'plaintiff':
        return (
          <span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">
            원고 승
          </span>
        );
      case 'defendant':
        return (
          <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-full">
            원고 패
          </span>
        );
      case 'partial':
        return (
          <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">
            일부 승
          </span>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const stats = getCaseLawStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
            <ICONS.Search className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-black text-lg text-slate-900">유사 판례 검색</h3>
            <p className="text-xs text-slate-500">AI 벡터 임베딩 기반 시맨틱 검색</p>
          </div>
        </div>

        {/* Search Mode Toggle */}
        <div className="flex bg-slate-100 rounded-lg p-1">
          <button
            onClick={() => setSearchMode('auto')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
              searchMode === 'auto' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            자동 검색
          </button>
          <button
            onClick={() => setSearchMode('manual')}
            className={`px-3 py-1.5 text-xs font-bold rounded-md transition ${
              searchMode === 'manual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
            }`}
          >
            수동 검색
          </button>
        </div>
      </div>

      {/* Initialization Progress */}
      {isInitializing && (
        <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-3">
            <ICONS.Activity className="w-5 h-5 text-blue-600 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">
                판례 벡터 DB 초기화 중...
              </p>
              <div className="mt-2 h-2 bg-blue-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${initProgress.total > 0 ? (initProgress.current / initProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-xs text-blue-600">
                {initProgress.current} / {initProgress.total} 판례 처리 완료
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Manual Search Input */}
      {searchMode === 'manual' && !isInitializing && (
        <div className="flex gap-3">
          <input
            type="text"
            value={manualQuery}
            onChange={e => setManualQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleManualSearch()}
            placeholder="검색어를 입력하세요 (예: 팀장 괴롭힘, 성희롱, 폭언)"
            className="flex-1 px-4 py-3 bg-slate-50 rounded-xl border-2 border-transparent focus:border-indigo-500 focus:bg-white outline-none transition"
          />
          <button
            onClick={handleManualSearch}
            disabled={isSearching || !manualQuery.trim()}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {isSearching ? (
              <ICONS.Activity className="w-4 h-4 animate-spin" />
            ) : (
              <ICONS.Search className="w-4 h-4" />
            )}
            검색
          </button>
        </div>
      )}

      {/* Extracted Keywords */}
      {searchMode === 'auto' && extractedKeywords.length > 0 && (
        <div className="p-4 bg-slate-50 rounded-xl">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            추출된 키워드
          </p>
          <div className="flex flex-wrap gap-2">
            {extractedKeywords.map((keyword, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-white text-slate-600 text-xs font-medium rounded-lg border border-slate-200"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Category Stats */}
      {reportCategory && (
        <div className="grid grid-cols-3 gap-4">
          {stats
            .filter(s => s.category === reportCategory)
            .map(stat => (
              <React.Fragment key={stat.category}>
                <div className="p-4 bg-slate-50 rounded-xl text-center">
                  <p className="text-2xl font-black text-slate-900">{stat.count}</p>
                  <p className="text-xs text-slate-500">관련 판례</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl text-center">
                  <p className="text-2xl font-black text-emerald-600">{stat.plaintiffWinRate}%</p>
                  <p className="text-xs text-slate-500">원고 승소율</p>
                </div>
                <div className="p-4 bg-blue-50 rounded-xl text-center">
                  <p className="text-lg font-black text-blue-600">
                    {formatCurrency(stat.avgDamages)}
                  </p>
                  <p className="text-xs text-slate-500">평균 인용액</p>
                </div>
              </React.Fragment>
            ))}
        </div>
      )}

      {/* Search Results */}
      {isSearching && (
        <div className="flex items-center justify-center py-8">
          <ICONS.Activity className="w-8 h-8 text-indigo-500 animate-spin" />
        </div>
      )}

      {!isSearching && searchResults.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-bold text-slate-700">
            {searchResults.length}건의 유사 판례 발견
          </p>

          {searchResults.map(({ caseLaw, similarity }) => (
            <div
              key={caseLaw.id}
              className={`bg-white rounded-2xl border-2 transition-all cursor-pointer ${
                selectedCase?.id === caseLaw.id
                  ? 'border-indigo-300 shadow-lg'
                  : 'border-slate-100 hover:border-slate-200 hover:shadow-md'
              }`}
              onClick={() => handleCaseClick(caseLaw)}
            >
              {/* Case Header */}
              <div className="p-4 border-b border-slate-100">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded">
                        {getCategoryLabel(caseLaw.category)}
                      </span>
                      {getVerdictBadge(caseLaw.verdict)}
                      {similarity > 0 && (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-[10px] font-bold rounded">
                          {Math.round(similarity * 100)}% 유사
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900">{caseLaw.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">
                      {caseLaw.court} | {caseLaw.caseNumber} | {caseLaw.date}
                    </p>
                  </div>
                  {caseLaw.damages && caseLaw.damages > 0 && (
                    <div className="text-right">
                      <p className="text-lg font-black text-emerald-600">
                        {formatCurrency(caseLaw.damages)}
                      </p>
                      <p className="text-[10px] text-slate-400">인용액</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Case Summary (Expanded) */}
              {selectedCase?.id === caseLaw.id && (
                <div className="p-4 animate-in fade-in slide-in-from-top-2">
                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                    {caseLaw.summary}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {caseLaw.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-lg"
                      >
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isSearching && !isInitializing && searchResults.length === 0 && reportContent && (
        <div className="text-center py-8 text-slate-400">
          <ICONS.Search className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">유사한 판례를 찾지 못했습니다.</p>
          <p className="text-sm mt-1">다른 키워드로 검색해보세요.</p>
        </div>
      )}

      {/* No Report Content */}
      {!reportContent && searchMode === 'auto' && !isInitializing && (
        <div className="text-center py-8 text-slate-400">
          <ICONS.FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">사건 내용을 기반으로 유사 판례를 검색합니다.</p>
          <p className="text-sm mt-1">사건을 선택하면 자동으로 검색됩니다.</p>
        </div>
      )}
    </div>
  );
};

export default CaseLawSearch;
