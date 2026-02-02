import { NextRequest } from "next/server";

/**
 * Create a mock NextRequest for testing API routes.
 */
export function createMockRequest(
  method: string,
  body?: unknown,
  headers?: Record<string, string>,
): NextRequest {
  const url = "http://localhost:3000/api/test";
  const init = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  };

  return new NextRequest(url, init);
}

/**
 * Create a mock NextRequest with FormData for file upload testing.
 */
export function createMockFormDataRequest(method: string, formData: FormData): NextRequest {
  const url = "http://localhost:3000/api/test";
  return new NextRequest(url, {
    method,
    body: formData,
  });
}
