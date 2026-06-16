import { z } from "zod";

export const STUDENT_ID_REGEX = /^\d{12}$/;

export const studentIdentitySchema = z.object({
  studentName: z
    .string()
    .trim()
    .min(2, "姓名至少 2 个字符")
    .max(32, "姓名过长"),
  studentId: z
    .string()
    .trim()
    .regex(STUDENT_ID_REGEX, "学号须为 12 位数字"),
});

export const submitExamSchema = studentIdentitySchema.extend({
  examSlug: z.string().min(1),
  answers: z.record(z.string(), z.union([z.string(), z.array(z.string())])),
});

export type StudentIdentity = z.infer<typeof studentIdentitySchema>;
export type SubmitExamInput = z.infer<typeof submitExamSchema>;

export function formatStudentId(value: string) {
  return value.replace(/\D/g, "").slice(0, 12);
}
