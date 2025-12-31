import { z } from 'zod';

export const REPORT_CATEGORIES = [
  'power_abuse',
  'sexual_harassment',
  'verbal_abuse',
  'retaliation',
] as const;

export type ReportCategory = typeof REPORT_CATEGORIES[number];

export const intakeFormSchema = z.object({
  category: z.enum(REPORT_CATEGORIES, {
    message: '유효하지 않은 사건 유형입니다.',
  }),
  subject: z
    .string()
    .min(5, { message: '제목은 최소 5자 이상이어야 합니다.' })
    .max(200, { message: '제목은 200자를 초과할 수 없습니다.' }),
  message: z
    .string()
    .min(10, { message: '내용은 최소 10자 이상이어야 합니다.' })
    .max(4000, { message: '내용은 4000자를 초과할 수 없습니다.' }),
  occurredAt: z.string().optional(),
  location: z
    .string()
    .max(200, { message: '장소는 200자를 초과할 수 없습니다.' })
    .optional(),
});

export type IntakeFormData = z.infer<typeof intakeFormSchema>;

export const onboardFormSchema = z.object({
  inviteCode: z
    .string()
    .min(4, { message: '초대 코드는 최소 4자 이상이어야 합니다.' })
    .max(30, { message: '초대 코드는 30자를 초과할 수 없습니다.' }),
  tenantName: z
    .string()
    .min(2, { message: '회사명은 최소 2자 이상이어야 합니다.' })
    .max(120, { message: '회사명은 120자를 초과할 수 없습니다.' }),
});

export type OnboardFormData = z.infer<typeof onboardFormSchema>;

export const trackingFormSchema = z.object({
  code: z
    .string()
    .length(10, { message: '추적 코드는 10자리여야 합니다.' })
    .regex(/^[A-Z0-9]+$/, { message: '추적 코드는 영문 대문자와 숫자만 포함해야 합니다.' }),
});

export type TrackingFormData = z.infer<typeof trackingFormSchema>;

export const hookToolFormSchema = z.object({
  companyName: z
    .string()
    .min(2, { message: '회사명은 최소 2자 이상이어야 합니다.' })
    .max(100, { message: '회사명은 100자를 초과할 수 없습니다.' }),
});

export type HookToolFormData = z.infer<typeof hookToolFormSchema>;

export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }

  return { success: false, errors };
}
