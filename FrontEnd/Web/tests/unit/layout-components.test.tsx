import * as React from "react";
import { describe, it, expect, beforeEach } from "@jest/globals";
import { render, screen, fireEvent, act } from "@testing-library/react";

// ─── Module Mocks ─────────────────────────────────────────────────────────────
// Use global `jest.mock` (not from @jest/globals import) so SWC hoists properly.
// The `jest` object from @jest/globals is NOT recognized by the SWC hoisting
// transform, causing mock factories to never execute.

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), refresh: jest.fn() }),
  usePathname: () => "/bookings",
}));

jest.mock("@/lib/api-client", () => ({
  __esModule: true,
  clearAuthTokens: jest.fn(),
}));

jest.mock("@/lib/auth-client", () => {
  const useSessionMock = jest.fn().mockReturnValue({ data: null, isPending: false });
  const signOutMock = jest.fn().mockResolvedValue(undefined);
  const clientObj = {
    useSession: useSessionMock,
    signOut: signOutMock,
  };
  return {
    __esModule: true,
    authClient: clientObj,
    useSession: useSessionMock,
    getSession: jest.fn(),
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: signOutMock,
    default: clientObj,
  };
});

// ─── Imports (resolved AFTER jest.mock hoisting) ──────────────────────────────
import { authClient } from "@/lib/auth-client";
import { Header, Footer, RoleSidebar, AppShell } from "@/components/layout";
import { useUiStore, toast } from "@/state/store/uiStore";

// Retrieve typed mock references from the mocked module
const mockUseSession = authClient.useSession as jest.Mock;
const mockSignOut = authClient.signOut as jest.Mock;

// ─── Tests ────────────────────────────────────────────────────────────────────
describe("Layout Chrome Components (src/components/layout/*)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useUiStore.getState().resetUi();
    // Re-set defaults after clearAllMocks wipes implementations
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    });
    mockSignOut.mockResolvedValue(undefined);
  });

  describe("Header Component", () => {
    it("renders unauthenticated state with 'Log In' button when session is null", () => {
      mockUseSession.mockReturnValue({
        data: null,
        isPending: false,
      });

      render(<Header />);

      expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /post a job/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/user profile menu/i)).not.toBeInTheDocument();
    });

    it("renders loading skeletons when session is pending", () => {
      mockUseSession.mockReturnValue({
        data: null,
        isPending: true,
      });

      const { container } = render(<Header />);
      expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    });

    it("renders authenticated user name, initials, and role badge", () => {
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: "u-123",
            name: "Dawit Worku",
            email: "dawit@example.com",
            role: "worker",
          },
        },
        isPending: false,
      });

      render(<Header />);

      expect(screen.getByText("Dawit Worku")).toBeInTheDocument();
      expect(screen.getByText("DW")).toBeInTheDocument(); // Initials
      expect(screen.getByText("worker")).toBeInTheDocument(); // Role badge
      expect(screen.queryByRole("link", { name: /^log in$/i })).not.toBeInTheDocument();
    });

    it("opens profile dropdown menu on click and handles logout", async () => {
      mockSignOut.mockResolvedValue(undefined);
      mockUseSession.mockReturnValue({
        data: {
          user: {
            id: "cust-1",
            name: "Sara Customer",
            email: "sara@example.com",
            role: "customer",
          },
        },
        isPending: false,
      });

      render(<Header />);

      const userMenuTrigger = screen.getByLabelText(/user profile menu/i);
      fireEvent.click(userMenuTrigger);

      // Name appears in both the trigger and the dropdown summary
      expect(screen.getAllByText("Sara Customer").length).toBeGreaterThanOrEqual(2);
      // Email only appears in the dropdown
      expect(screen.getByText("sara@example.com")).toBeInTheDocument();
      expect(screen.getByText("Dashboard")).toBeInTheDocument();

      const logoutBtn = screen.getByRole("menuitem", { name: /log out/i });
      await act(async () => {
        fireEvent.click(logoutBtn);
      });

      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/");
    });
  });

  describe("Footer Component", () => {
    it("renders quick links, contact info, and copyright", () => {
      render(<Footer />);

      expect(screen.getByText("MyJob")).toBeInTheDocument();
      expect(screen.getByText("Quick Link")).toBeInTheDocument();
      expect(screen.getByText("Candidate")).toBeInTheDocument();
      expect(screen.getByText("Employers")).toBeInTheDocument();
      expect(screen.getByText("Support")).toBeInTheDocument();
    });
  });

  describe("RoleSidebar Component", () => {
    it("renders customer navigation items for customer role", () => {
      render(<RoleSidebar role="customer" />);

      expect(screen.getByText("Find Workers")).toBeInTheDocument();
      expect(screen.getByText("My Bookings")).toBeInTheDocument();
      expect(screen.getByText("Messages")).toBeInTheDocument();
    });

    it("renders worker navigation items for worker role", () => {
      render(<RoleSidebar role="worker" />);

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Job Requests")).toBeInTheDocument();
      expect(screen.getByText("Earnings")).toBeInTheDocument();
    });

    it("renders admin navigation items for admin role", () => {
      render(<RoleSidebar role="admin" />);

      expect(screen.getByText("Overview")).toBeInTheDocument();
      expect(screen.getByText("Verification Queue")).toBeInTheDocument();
      expect(screen.getByText("Disputes")).toBeInTheDocument();
    });

    it("renders collapse toggle and handles collapse state", () => {
      const handleToggle = jest.fn();
      render(
        <RoleSidebar role="customer" collapsed={true} onToggleCollapse={handleToggle} />
      );

      const expandBtn = screen.getByLabelText(/expand sidebar/i);
      expect(expandBtn).toBeInTheDocument();
      fireEvent.click(expandBtn);
      expect(handleToggle).toHaveBeenCalledTimes(1);
    });
  });

  describe("AppShell Component", () => {
    it("renders main content, Header, and Footer", () => {
      render(
        <AppShell>
          <div data-testid="page-content">Page Body Content</div>
        </AppShell>
      );

      expect(screen.getByTestId("page-content")).toBeInTheDocument();
      expect(screen.getByRole("banner")).toBeInTheDocument(); // Header
      expect(screen.getByRole("contentinfo")).toBeInTheDocument(); // Footer
    });

    it("renders RoleSidebar when showSidebar is true", () => {
      render(
        <AppShell showSidebar sidebarRole="worker">
          <div>Worker Page</div>
        </AppShell>
      );

      expect(screen.getByText("Job Requests")).toBeInTheDocument();
    });

    it("renders interactive toast notifications from uiStore", () => {
      render(
        <AppShell>
          <div>Main View</div>
        </AppShell>
      );

      act(() => {
        toast.success("Profile saved successfully!", { title: "Updated" });
      });

      expect(screen.getByText("Updated")).toBeInTheDocument();
      expect(screen.getByText("Profile saved successfully!")).toBeInTheDocument();

      const dismissBtn = screen.getByLabelText(/dismiss notification/i);
      fireEvent.click(dismissBtn);

      expect(screen.queryByText("Profile saved successfully!")).not.toBeInTheDocument();
    });
  });
});
