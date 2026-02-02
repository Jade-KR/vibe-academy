import { describe, it, expect, vi, beforeEach } from "vitest";
import { createMockFormDataRequest } from "../../helpers/api";

// ---- Mocks ----

const mockGetUser = vi.fn();
const mockSupabaseClient = {
  auth: { getUser: mockGetUser },
};

const mockUploadAvatar = vi
  .fn()
  .mockResolvedValue("https://storage.example.com/avatars/supabase-user-123/avatar.png");
const mockDeleteAvatar = vi.fn().mockResolvedValue(undefined);

vi.mock("@/shared/api/supabase", () => ({
  createServerClient: vi.fn().mockImplementation(async () => mockSupabaseClient),
  createAdminClient: vi.fn(),
  uploadAvatar: (...args: unknown[]) => mockUploadAvatar(...args),
  deleteAvatar: (...args: unknown[]) => mockDeleteAvatar(...args),
}));

// Drizzle mock chain
const mockUpdateReturning = vi.fn().mockResolvedValue([]);
const mockUpdateWhere = vi.fn().mockImplementation(() => ({
  returning: mockUpdateReturning,
}));
const mockSet = vi.fn().mockImplementation(() => ({
  where: mockUpdateWhere,
}));

vi.mock("@/db/client", () => ({
  db: {
    update: vi.fn().mockImplementation(() => ({
      set: mockSet,
    })),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn().mockImplementation((col, val) => ({ col, val })),
}));

// Mock sharp for image resizing
vi.mock("sharp", () => ({
  default: vi.fn().mockImplementation(() => ({
    resize: vi.fn().mockReturnThis(),
    toBuffer: vi.fn().mockResolvedValue(Buffer.from("resized-image")),
  })),
}));

// ---- Test data ----

const TEST_SUPABASE_USER = {
  id: "supabase-user-123",
  email: "test@example.com",
};

function createMockFile(name: string, type: string, sizeBytes: number): File {
  const buffer = new ArrayBuffer(sizeBytes);
  return new File([buffer], name, { type });
}

// ---- Tests ----

describe("POST /api/user/avatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const formData = new FormData();
    formData.append("file", createMockFile("avatar.png", "image/png", 1024));

    const { POST } = await import("@/app/api/user/avatar/route");
    const request = createMockFormDataRequest("POST", formData);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 400 when no file in FormData", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    const formData = new FormData();

    const { POST } = await import("@/app/api/user/avatar/route");
    const request = createMockFormDataRequest("POST", formData);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toContain("No file");
  });

  it("returns 400 when file MIME type is not JPG/PNG/WebP", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    const formData = new FormData();
    formData.append("file", createMockFile("avatar.gif", "image/gif", 1024));

    const { POST } = await import("@/app/api/user/avatar/route");
    const request = createMockFormDataRequest("POST", formData);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toContain("JPG, PNG, or WebP");
  });

  it("returns 400 when file exceeds 5MB", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    const formData = new FormData();
    formData.append("file", createMockFile("avatar.png", "image/png", 6 * 1024 * 1024));

    const { POST } = await import("@/app/api/user/avatar/route");
    const request = createMockFormDataRequest("POST", formData);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("VALIDATION_ERROR");
    expect(body.error.message).toContain("5MB");
  });

  it("returns 200 and uploads to Supabase Storage", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    const formData = new FormData();
    formData.append("file", createMockFile("avatar.png", "image/png", 1024));

    const { POST } = await import("@/app/api/user/avatar/route");
    const request = createMockFormDataRequest("POST", formData);
    const response = await POST(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.avatarUrl).toBeDefined();
    expect(body.message).toContain("Avatar uploaded");
  });

  it("calls uploadAvatar with correct params", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    const formData = new FormData();
    formData.append("file", createMockFile("avatar.png", "image/png", 1024));

    const { POST } = await import("@/app/api/user/avatar/route");
    const request = createMockFormDataRequest("POST", formData);
    await POST(request);

    expect(mockUploadAvatar).toHaveBeenCalledWith(
      expect.any(Buffer),
      TEST_SUPABASE_USER.id,
      expect.objectContaining({ contentType: "image/png", ext: "png", server: true }),
    );
  });

  it("updates users.avatarUrl in DB", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    const formData = new FormData();
    formData.append("file", createMockFile("avatar.png", "image/png", 1024));

    const { POST } = await import("@/app/api/user/avatar/route");
    const request = createMockFormDataRequest("POST", formData);
    await POST(request);

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        avatarUrl: expect.any(String),
        updatedAt: expect.any(Date),
      }),
    );
  });
});

describe("DELETE /api/user/avatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: "Not authenticated" },
    });

    const { DELETE } = await import("@/app/api/user/avatar/route");
    const request = createMockFormDataRequest("DELETE", new FormData());
    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 200 and removes avatar files from storage", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    const { DELETE } = await import("@/app/api/user/avatar/route");
    const request = createMockFormDataRequest("DELETE", new FormData());
    const response = await DELETE(request);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.message).toContain("Avatar deleted");
    expect(mockDeleteAvatar).toHaveBeenCalledWith(TEST_SUPABASE_USER.id, { server: true });
  });

  it("sets users.avatarUrl to null in DB", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    const { DELETE } = await import("@/app/api/user/avatar/route");
    const request = createMockFormDataRequest("DELETE", new FormData());
    await DELETE(request);

    expect(mockSet).toHaveBeenCalledWith(
      expect.objectContaining({
        avatarUrl: null,
        updatedAt: expect.any(Date),
      }),
    );
  });

  it("returns 200 even if user has no avatar (idempotent)", async () => {
    mockGetUser.mockResolvedValue({
      data: { user: TEST_SUPABASE_USER },
      error: null,
    });

    const { DELETE } = await import("@/app/api/user/avatar/route");
    const request = createMockFormDataRequest("DELETE", new FormData());
    const response = await DELETE(request);

    expect(response.status).toBe(200);
  });
});
