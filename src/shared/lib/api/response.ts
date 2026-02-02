import { NextResponse } from "next/server";
import type { ApiSuccessResponse, ApiErrorResponse } from "@/shared/types";
import type { ZodError } from "zod";

export function successResponse<T>(data: T, message?: string, status = 200) {
  const body: ApiSuccessResponse<T> = { success: true, data };
  if (message) body.message = message;
  return NextResponse.json(body, { status });
}

export function errorResponse(
  code: string,
  message: string,
  status: number,
  details?: Record<string, string[]>,
) {
  const body: ApiErrorResponse = {
    success: false,
    error: { code, message, ...(details && { details }) },
  };
  return NextResponse.json(body, { status });
}

export function zodErrorResponse(error: ZodError) {
  const details: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (!details[key]) details[key] = [];
    details[key].push(issue.message);
  }
  return errorResponse("VALIDATION_ERROR", "Invalid input", 400, details);
}
