import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SWRConfig } from "swr";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en",
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ children, ...props }: any) => <a {...props}>{children}</a>,
}));
vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

function renderWithSWR(ui: React.ReactElement) {
  return render(
    <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{ui}</SWRConfig>,
  );
}

function createFile(name: string, size: number, type: string): File {
  const content = new Uint8Array(size);
  return new File([content], name, { type });
}

describe("AvatarUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    global.fetch = vi.fn();
    // Mock URL.createObjectURL
    global.URL.createObjectURL = vi.fn(() => "blob:mock-preview-url");
    global.URL.revokeObjectURL = vi.fn();
  });

  it("renders current avatar image when avatarUrl exists", async () => {
    const { AvatarUpload } = await import("@/features/settings");
    renderWithSWR(<AvatarUpload avatarUrl="https://example.com/avatar.jpg" name="Test User" />);

    const img = screen.getByRole("img");
    expect(img).toHaveAttribute("src", "https://example.com/avatar.jpg");
  });

  it("renders fallback initials when no avatar", async () => {
    const { AvatarUpload } = await import("@/features/settings");
    renderWithSWR(<AvatarUpload avatarUrl={null} name="Test User" />);

    expect(screen.getByText("TU")).toBeInTheDocument();
  });

  it("renders upload and remove buttons", async () => {
    const { AvatarUpload } = await import("@/features/settings");
    renderWithSWR(<AvatarUpload avatarUrl="https://example.com/avatar.jpg" name="Test User" />);

    expect(screen.getByRole("button", { name: "upload" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "remove" })).toBeInTheDocument();
  });

  it("validates file type (rejects non-image)", async () => {
    const { toast } = await import("sonner");
    const { AvatarUpload } = await import("@/features/settings");
    renderWithSWR(<AvatarUpload avatarUrl={null} name="Test User" />);

    const file = createFile("doc.pdf", 1024, "application/pdf");
    const input = screen.getByTestId("avatar-file-input");
    // Use fireEvent to bypass the accept attribute filter in userEvent.upload
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("invalidType");
    });
  });

  it("validates file size (rejects > 5MB)", async () => {
    const { toast } = await import("sonner");
    const { AvatarUpload } = await import("@/features/settings");
    renderWithSWR(<AvatarUpload avatarUrl={null} name="Test User" />);

    const file = createFile("huge.jpg", 6 * 1024 * 1024, "image/jpeg");
    const input = screen.getByTestId("avatar-file-input");
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("tooLarge");
    });
  });

  it("calls upload API with FormData on valid file select", async () => {
    const { toast } = await import("sonner");
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { avatarUrl: "https://example.com/new-avatar.jpg" },
      }),
    });

    const { AvatarUpload } = await import("@/features/settings");
    renderWithSWR(<AvatarUpload avatarUrl={null} name="Test User" />);

    const file = createFile("avatar.jpg", 1024, "image/jpeg");
    const input = screen.getByTestId("avatar-file-input");
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/avatar",
        expect.objectContaining({
          method: "POST",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("success");
    });
  });

  it("calls delete API on remove click", async () => {
    const { toast } = await import("sonner");
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: null }),
    });

    const user = userEvent.setup();
    const { AvatarUpload } = await import("@/features/settings");
    renderWithSWR(<AvatarUpload avatarUrl="https://example.com/avatar.jpg" name="Test User" />);

    await user.click(screen.getByRole("button", { name: "remove" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/avatar",
        expect.objectContaining({
          method: "DELETE",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("removed");
    });
  });

  it("disables buttons while uploading", async () => {
    // Make upload hang
    (global.fetch as ReturnType<typeof vi.fn>).mockReturnValue(new Promise(() => {}));

    const { AvatarUpload } = await import("@/features/settings");
    renderWithSWR(<AvatarUpload avatarUrl="https://example.com/avatar.jpg" name="Test User" />);

    const file = createFile("avatar.jpg", 1024, "image/jpeg");
    const input = screen.getByTestId("avatar-file-input");
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "upload" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "remove" })).toBeDisabled();
    });
  });

  it("handles drag-and-drop file input", async () => {
    const { toast } = await import("sonner");
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: { avatarUrl: "https://example.com/new-avatar.jpg" },
      }),
    });

    const { AvatarUpload } = await import("@/features/settings");
    renderWithSWR(<AvatarUpload avatarUrl={null} name="Test User" />);

    const dropZone = screen.getByTestId("avatar-drop-zone");
    const file = createFile("avatar.png", 1024, "image/png");

    fireEvent.dragOver(dropZone);
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/avatar",
        expect.objectContaining({
          method: "POST",
        }),
      );
      expect(toast.success).toHaveBeenCalledWith("success");
    });
  });
});
