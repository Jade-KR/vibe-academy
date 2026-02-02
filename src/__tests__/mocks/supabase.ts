import { vi } from "vitest";

/**
 * Creates a mock Supabase client with auth and storage methods.
 */
export function createMockSupabaseClient() {
  const storageUpload = vi.fn().mockResolvedValue({ error: null });
  const storageRemove = vi.fn().mockResolvedValue({ error: null });
  const storageGetPublicUrl = vi.fn().mockReturnValue({
    data: { publicUrl: "https://storage.example.com/avatars/test/avatar.png" },
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: "Not authenticated" },
      }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signInWithOtp: vi.fn().mockResolvedValue({
        data: {},
        error: null,
      }),
      verifyOtp: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
      updateUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: null,
      }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: storageUpload,
        remove: storageRemove,
        getPublicUrl: storageGetPublicUrl,
      }),
    },
    _mocks: {
      storageUpload,
      storageRemove,
      storageGetPublicUrl,
    },
  };
}

/**
 * Creates a mock admin Supabase client for storage operations.
 */
export function createMockAdminClient() {
  const storageUpload = vi.fn().mockResolvedValue({ error: null });
  const storageRemove = vi.fn().mockResolvedValue({ error: null });
  const storageGetPublicUrl = vi.fn().mockReturnValue({
    data: { publicUrl: "https://storage.example.com/avatars/test/avatar.png" },
  });

  return {
    storage: {
      from: vi.fn().mockReturnValue({
        upload: storageUpload,
        remove: storageRemove,
        getPublicUrl: storageGetPublicUrl,
      }),
    },
    _mocks: {
      storageUpload,
      storageRemove,
      storageGetPublicUrl,
    },
  };
}

/**
 * Helper to set up mock for authenticated user.
 */
export function mockAuthenticatedUser(
  mockClient: ReturnType<typeof createMockSupabaseClient>,
  user: { id: string; email: string },
) {
  mockClient.auth.getUser.mockResolvedValue({
    data: { user },
    error: null,
  });
}

/**
 * Helper to set up mock for unauthenticated request.
 */
export function mockUnauthenticated(mockClient: ReturnType<typeof createMockSupabaseClient>) {
  mockClient.auth.getUser.mockResolvedValue({
    data: { user: null },
    error: { message: "Not authenticated" },
  });
}
