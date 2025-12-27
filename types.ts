
export enum ReportStatus {
  RECEIVED = 'received',
  INVESTIGATING = 'investigating',
  IN_PROGRESS = 'in_progress',
  CLOSED = 'closed'
}

export enum ReportPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface TimelineEvent {
  id: string;
  type: string;
  actorRole: 'user' | 'admin' | 'partner' | 'system';
  data: Record<string, any>;
  dataFull?: Record<string, any>; // 복호화된 데이터 (어드민 전용)
  prevEventHash: string | null;
  eventHash: string;
  createdAt: string;
}

export interface Report {
  id: string;
  tenantId: string;
  publicCodeHash: string;
  status: ReportStatus;
  priority: ReportPriority;
  subject: string | null;
  category: string | null;
  content: string; // 복호화된 본문
  createdAt: string;
  lastViewedAt: string | null;
  encryptionKeyId: string;
  events: TimelineEvent[];
  evidenceHeadHash: string;
  integrityOk: boolean;
}

export interface DefensePack {
  id: string;
  status: 'queued' | 'generated' | 'failed';
  reasonCode: string;
  verifyOk: boolean;
  signature: string;
  pdfPath?: string;
  createdAt: string;
  generatedAt?: string;
  storedHead: string;
  computedHead: string;
  eventsCount: number;
}

export interface Tenant {
  id: string;
  name: string;
  partnerId: string | null;
  isPremium: boolean;
  tags: string[];
  traffic: 'green' | 'yellow' | 'red';
  openCount: number;
  urgentCount: number;
  lastAt: string | null;
  slaPolicy: {
    receivedHours?: number;
    openDays?: number;
    strictHints?: string[];
  };
}

export type ViewState = 'LANDING' | 'ONBOARD' | 'HOOK_TOOL' | 'REPORT_FORM' | 'ADMIN' | 'PARTNER' | 'TRACK';
