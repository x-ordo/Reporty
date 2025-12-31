/**
 * 직장 내 괴롭힘 관련 판례 데이터
 *
 * 실제 서비스에서는 DB에서 로드하지만,
 * MVP 데모용으로 하드코딩된 샘플 판례 사용
 */

export interface CaseLaw {
  id: string;
  caseNumber: string;        // 사건번호 (예: 2023나12345)
  court: string;             // 법원
  date: string;              // 선고일
  category: string;          // 분류
  title: string;             // 사건명
  summary: string;           // 판결 요지
  keywords: string[];        // 키워드
  verdict: 'plaintiff' | 'defendant' | 'partial';  // 승소 측
  damages?: number;          // 인정된 손해배상액
  embedding?: number[];      // 벡터 임베딩
}

export const SAMPLE_CASE_LAWS: CaseLaw[] = [
  {
    id: 'case_001',
    caseNumber: '2023나2045123',
    court: '서울고등법원',
    date: '2023-11-15',
    category: 'power_abuse',
    title: '직장 내 괴롭힘 손해배상 청구',
    summary: `팀장이 특정 직원에게 반복적으로 업무에서 배제하고, 회의에서 의도적으로 무시하며,
    다른 직원들 앞에서 모욕적 발언을 한 사안. 법원은 이러한 행위가 근로기준법상 직장 내 괴롭힘에
    해당한다고 판단하고, 사용자의 보호의무 위반을 인정하여 위자료 3,000만원을 인용함.
    특히 피해자가 정신과 치료를 받은 점, 회사가 신고 후에도 적절한 조치를 취하지 않은 점을
    가중 사유로 고려함.`,
    keywords: ['업무배제', '무시', '모욕', '정신적피해', '사용자책임'],
    verdict: 'plaintiff',
    damages: 30000000,
  },
  {
    id: 'case_002',
    caseNumber: '2022가단567890',
    court: '서울중앙지방법원',
    date: '2023-03-22',
    category: 'verbal_abuse',
    title: '폭언에 의한 인격권 침해',
    summary: `상급자가 업무상 실수를 이유로 공개적인 장소에서 "무능하다", "회사 나가라" 등의
    폭언을 반복한 사안. 법원은 업무상 필요한 지적의 범위를 넘어선 인격 모독에 해당한다고 보고,
    위자료 1,500만원을 인용함. 다만 원고의 업무상 과실도 일부 인정되어 청구액의 50%만 인용됨.`,
    keywords: ['폭언', '인격권', '공개적모욕', '업무상과실'],
    verdict: 'partial',
    damages: 15000000,
  },
  {
    id: 'case_003',
    caseNumber: '2023나3078901',
    court: '부산고등법원',
    date: '2023-09-08',
    category: 'sexual_harassment',
    title: '직장 내 성희롱 및 2차 피해',
    summary: `부서장이 회식 자리에서 신체 접촉 및 성적 발언을 하고, 피해자가 신고한 후
    인사상 불이익을 준 사안. 법원은 성희롱 행위 자체와 신고에 대한 보복성 인사조치 모두
    위법하다고 판단. 가해자 개인과 회사에 연대하여 위자료 5,000만원,
    부당전보로 인한 임금 차액 배상을 명함.`,
    keywords: ['성희롱', '신체접촉', '2차피해', '보복인사', '연대책임'],
    verdict: 'plaintiff',
    damages: 50000000,
  },
  {
    id: 'case_004',
    caseNumber: '2022가합234567',
    court: '대전지방법원',
    date: '2022-12-14',
    category: 'retaliation',
    title: '내부고발자 보복성 해고',
    summary: `회사의 회계부정을 내부 감사팀에 신고한 직원이 징계해고된 사안.
    법원은 해고 사유로 제시된 근무태만이 실질적 근거가 없고, 신고 직후 해고가 이루어진 점 등을
    고려하여 보복성 해고로 판단. 해고무효 확인 및 미지급 임금, 위자료 2,000만원을 인용함.`,
    keywords: ['내부고발', '보복해고', '해고무효', '공익신고'],
    verdict: 'plaintiff',
    damages: 20000000,
  },
  {
    id: 'case_005',
    caseNumber: '2023가단890123',
    court: '인천지방법원',
    date: '2023-07-19',
    category: 'power_abuse',
    title: '가스라이팅형 괴롭힘',
    summary: `팀장이 특정 직원의 업무 성과를 지속적으로 폄하하고, 다른 팀원들에게 해당 직원과
    대화하지 말라고 지시하며, 업무 관련 정보를 의도적으로 공유하지 않은 사안.
    법원은 이러한 행위가 피해자의 자존감과 업무 능력에 대한 신뢰를 훼손하는
    가스라이팅에 해당한다고 보고, 위자료 2,500만원을 인용함.`,
    keywords: ['가스라이팅', '고립', '정보차단', '심리적학대'],
    verdict: 'plaintiff',
    damages: 25000000,
  },
  {
    id: 'case_006',
    caseNumber: '2021나4056789',
    court: '서울고등법원',
    date: '2022-05-11',
    category: 'power_abuse',
    title: '과도한 업무 지시에 의한 괴롭힘 부정',
    summary: `원고는 상급자가 과도한 업무량을 지시하여 괴롭힘을 당했다고 주장했으나,
    법원은 해당 업무 지시가 회사의 정당한 인사권 행사 범위 내에 있고,
    다른 직원들과 비교하여 현저히 과중하지 않았다고 판단.
    단순한 업무 스트레스만으로는 괴롭힘을 인정하기 어렵다고 보아 청구 기각.`,
    keywords: ['업무과중', '인사권', '괴롭힘부정', '업무스트레스'],
    verdict: 'defendant',
    damages: 0,
  },
  {
    id: 'case_007',
    caseNumber: '2023가합678901',
    court: '수원지방법원',
    date: '2023-10-25',
    category: 'verbal_abuse',
    title: '메신저를 통한 언어폭력',
    summary: `상급자가 업무용 메신저로 심야/주말에 지속적으로 연락하며 욕설 및
    인격 모독적 메시지를 보낸 사안. 법원은 디지털 수단을 통한 괴롭힘도
    직장 내 괴롭힘에 해당한다고 판단. 특히 메시지 기록이 명확한 증거로 인정되어
    위자료 2,000만원 전액 인용.`,
    keywords: ['메신저폭언', '디지털괴롭힘', '심야연락', '증거'],
    verdict: 'plaintiff',
    damages: 20000000,
  },
  {
    id: 'case_008',
    caseNumber: '2022나1234567',
    court: '광주고등법원',
    date: '2023-01-18',
    category: 'sexual_harassment',
    title: '외모 비하 발언의 성희롱 인정',
    summary: `남성 상급자가 여성 직원의 외모, 복장에 대해 반복적으로 언급하고
    "여자가 그러면 시집 못 간다" 등의 발언을 한 사안. 법원은 직접적 성적 언동이 아니더라도
    성별에 기반한 반복적 비하 발언은 성희롱에 해당한다고 판단.
    위자료 1,000만원 인용.`,
    keywords: ['외모비하', '성별차별', '성희롱', '반복적발언'],
    verdict: 'plaintiff',
    damages: 10000000,
  },
];

/**
 * 카테고리별 판례 통계
 */
export function getCaseLawStats(): {
  category: string;
  count: number;
  avgDamages: number;
  plaintiffWinRate: number;
} [] {
  const categories = ['power_abuse', 'verbal_abuse', 'sexual_harassment', 'retaliation'];

  return categories.map(cat => {
    const cases = SAMPLE_CASE_LAWS.filter(c => c.category === cat);
    const plaintiffWins = cases.filter(c => c.verdict === 'plaintiff' || c.verdict === 'partial');
    const totalDamages = cases.reduce((sum, c) => sum + (c.damages || 0), 0);

    return {
      category: cat,
      count: cases.length,
      avgDamages: cases.length > 0 ? Math.round(totalDamages / cases.length) : 0,
      plaintiffWinRate: cases.length > 0 ? Math.round((plaintiffWins.length / cases.length) * 100) : 0,
    };
  });
}

/**
 * 카테고리 한글 라벨
 */
export function getCategoryLabel(category: string): string {
  const labels: Record<string, string> = {
    power_abuse: '직장 내 괴롭힘',
    verbal_abuse: '폭언/모욕',
    sexual_harassment: '성희롱',
    retaliation: '보복/불이익',
  };
  return labels[category] || category;
}
