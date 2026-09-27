import * as React from "react";
import { describe, it, expect, beforeEach } from "@jest/globals";
import { render, screen, fireEvent, act } from "@testing-library/react";

// ─── Module Mocks ─────────────────────────────────────────────────────────────
// Use global `jest.mock` (not from @jest/globals import) so SWC hoists properly.
const mockPush = jest.fn();
const mockRefresh = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn(), refresh: mockRefresh }),
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

const mockGetSession = jest.fn();
jest.mock("@/lib/auth-server", () => ({
  __esModule: true,
  auth: {
    api: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
    },
  },
}));

jest.mock("next/headers", () => ({
  headers: jest.fn().mockResolvedValue(new Headers()),
}));

// ─── Imports (resolved AFTER jest.mock hoisting) ──────────────────────────────
import { authClient } from "@/lib/auth-client";
import {
  Header,
  AccountMenu,
  MobileNav,
  SidebarToggle,
  AppShellFeedback,
  Footer,
  RoleSidebar,
  AppShell,
  getUserInitials,
  getDashboardLink,
} from "@/components/layout";
import { useUiStore, toast } from "@/state/store/uiStore";
import { ROUTES } from "@/lib/constants";

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
    mockGetSession.mockResolvedValue(null);
  });

  describe("Helper Functions", () => {
    it("generates initials correctly from single, multi-word names, and email fallback", () => {
      expect(getUserInitials("Abebe Kebede")).toBe("AK");
      expect(getUserInitials("Dawit")).toBe("DA");
      expect(getUserInitials(undefined, "solomon@example.com")).toBe("SO");
      expect(getUserInitials()).toBe("U");
    });

    it("resolves dashboard links according to role", () => {
      expect(getDashboardLink("worker")).toBe(ROUTES.WORKER.DASHBOARD);
      expect(getDashboardLink("admin")).toBe(ROUTES.ADMIN.VERIFICATION_QUEUE);
      expect(getDashboardLink("customer")).toBe(ROUTES.CUSTOMER.BOOKINGS);
      expect(getDashboardLink(undefined)).toBe(ROUTES.CUSTOMER.BOOKINGS);
    });
  });

  describe("Header Component (Server Component SC-FE-003 §8.1)", () => {
    it("fetches session on server and renders AccountMenu client island when authenticated", async () => {
      mockGetSession.mockResolvedValueOnce({
        user: {
          id: "u-server-123",
          name: "Dawit Server",
          email: "dawit@example.com",
          role: "worker",
        },
        session: { id: "sess-abc" },
      });

      const headerJsx = await Header({ showSearch: true });
      render(headerJsx);

      expect(mockGetSession).toHaveBeenCalledTimes(1);
      expect(screen.getByText("Dawit Server")).toBeInTheDocument();
      expect(screen.getByText("DS")).toBeInTheDocument();
      expect(screen.getByText("worker")).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: /^log in$/i })).not.toBeInTheDocument();
    });

    it("renders unauthenticated CTAs when server session is null", async () => {
      mockGetSession.mockResolvedValueOnce(null);

      const headerJsx = await Header({});
      render(headerJsx);

      expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /post a job/i })).toBeInTheDocument();
      expect(screen.queryByLabelText(/user profile menu/i)).not.toBeInTheDocument();
    });

    it("catches getSession server errors gracefully and renders unauthenticated fallback", async () => {
      mockGetSession.mockRejectedValueOnce(new Error("Connection reset"));

      const headerJsx = await Header({});
      render(headerJsx);

      expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();
    });
  });

  describe("AccountMenu Component (Client Island)", () => {
    it("renders authenticated user name, initials, and role badge when user prop is passed", () => {
      render(
        <AccountMenu
          user={{
            id: "u-123",
            name: "Dawit Worku",
            email: "dawit@example.com",
            role: "worker",
            createdAt: new Date(),
            updatedAt: new Date(),
            emailVerified: true,
          }}
        />
      );

      expect(screen.getByText("Dawit Worku")).toBeInTheDocument();
      expect(screen.getByText("DW")).toBeInTheDocument(); // Initials
      expect(screen.getByText("worker")).toBeInTheDocument(); // Role badge
    });

    it("renders loading skeletons when client session is pending without server user prop", () => {
      mockUseSession.mockReturnValue({
        data: null,
        isPending: true,
      });

      const { container } = render(<AccountMenu />);
      expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
    });

    it("returns null when unauthenticated in client fallback mode", () => {
      mockUseSession.mockReturnValue({
        data: null,
        isPending: false,
      });

      const { container } = render(<AccountMenu />);
      expect(container.firstChild).toBeNull();
    });

    it("opens profile dropdown menu on click, handles Escape key, and handles logout", async () => {
      mockSignOut.mockResolvedValue(undefined);

      render(
        <AccountMenu
          user={{
            id: "cust-1",
            name: "Sara Customer",
            email: "sara@example.com",
            role: "customer",
            createdAt: new Date(),
            updatedAt: new Date(),
            emailVerified: true,
          }}
        />
      );

      const userMenuTrigger = screen.getByLabelText(/user profile menu/i);
      fireEvent.click(userMenuTrigger);

      // Name appears in both trigger and dropdown summary
      expect(screen.getAllByText("Sara Customer").length).toBeGreaterThanOrEqual(2);
      expect(screen.getByText("sara@example.com")).toBeInTheDocument();
      expect(screen.getByText("Dashboard")).toBeInTheDocument();

      // Test Escape key closes dropdown
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByText("Profile & Settings")).not.toBeInTheDocument();

      // Re-open menu to test logout
      fireEvent.click(userMenuTrigger);
      expect(screen.getByText("Profile & Settings")).toBeInTheDocument();

      const logoutBtn = screen.getByRole("menuitem", { name: /log out/i });
      await act(async () => {
        fireEvent.click(logoutBtn);
      });

      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/");
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  describe("MobileNav Component (Client Island)", () => {
    it("toggles mobile menu on mobile button click and closes on Escape", () => {
      render(<MobileNav />);

      const mobileToggle = screen.getByLabelText(/toggle navigation menu/i);
      expect(mobileToggle).toBeInTheDocument();

      // Open mobile menu
      fireEvent.click(mobileToggle);
      expect(screen.getByText("Find Workers")).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /log in/i })).toBeInTheDocument();

      // Close via Escape key
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByText("Find Workers")).not.toBeInTheDocument();
    });

    it("renders authenticated links and handles logout in mobile menu", async () => {
      render(
        <MobileNav
          user={{
            id: "u-m-1",
            name: "Mobile Worker",
            email: "mw@example.com",
            role: "worker",
            createdAt: new Date(),
            updatedAt: new Date(),
            emailVerified: true,
          }}
        />
      );

      const mobileToggle = screen.getByLabelText(/toggle navigation menu/i);
      fireEvent.click(mobileToggle);

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("My Bookings")).toBeInTheDocument();

      const logoutBtn = screen.getByRole("button", { name: /log out/i });
      await act(async () => {
        fireEvent.click(logoutBtn);
      });

      expect(mockSignOut).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/");
      expect(mockRefresh).toHaveBeenCalledTimes(1);
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

  describe("SidebarToggle Component (Client Island SC-FE-003 §7.2)", () => {
    it("renders mobile toggle button and opens slide-out drawer on click", () => {
      render(<SidebarToggle role="worker" />);

      const toggleBtn = screen.getByLabelText(/open sidebar navigation/i);
      expect(toggleBtn).toBeInTheDocument();

      // Open drawer
      fireEvent.click(toggleBtn);
      expect(screen.getByText("Portal Menu")).toBeInTheDocument();
      expect(screen.getByText("Dashboard")).toBeInTheDocument();

      // Close drawer on Escape
      fireEvent.keyDown(document, { key: "Escape" });
      expect(screen.queryByText("Portal Menu")).not.toBeInTheDocument();
    });

    it("closes drawer when close button is clicked", () => {
      render(<SidebarToggle role="customer" />);

      const toggleBtn = screen.getByLabelText(/open sidebar navigation/i);
      fireEvent.click(toggleBtn);
      expect(screen.getByText("Portal Menu")).toBeInTheDocument();

      const closeBtn = screen.getByLabelText(/close sidebar drawer/i);
      fireEvent.click(closeBtn);
      expect(screen.queryByText("Portal Menu")).not.toBeInTheDocument();
    });
  });

  describe("AppShellFeedback Component (Client Island)", () => {
    it("renders active announcement banner and clears it on dismiss", () => {
      useUiStore.setState({
        activeBanner: {
          id: "banner-1",
          type: "warning",
          message: "System scheduled maintenance tonight",
          dismissible: true,
        },
      });

      render(<AppShellFeedback />);
      expect(screen.getByText("System scheduled maintenance tonight")).toBeInTheDocument();

      const dismissBtn = screen.getByLabelText(/dismiss banner/i);
      fireEvent.click(dismissBtn);

      expect(useUiStore.getState().activeBanner).toBeNull();
    });

    it("renders fullscreen loading overlay when isGlobalLoading is true", () => {
      useUiStore.setState({ isGlobalLoading: true });

      render(<AppShellFeedback />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();
    });
  });

  describe("AppShell Component (Server Component SC-FE-003 §7.2)", () => {
    it("renders main content, custom header slot, and Footer", () => {
      render(
        <AppShell header={<header role="banner">App Header Slot</header>}>
          <div data-testid="page-content">Page Body Content</div>
        </AppShell>
      );

      expect(screen.getByTestId("page-content")).toBeInTheDocument();
      expect(screen.getByRole("banner")).toBeInTheDocument();
      expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    });

    it("renders desktop RoleSidebar and mobile SidebarToggle when showSidebar is true", () => {
      render(
        <AppShell showSidebar sidebarRole="worker" header={<header role="banner">Header</header>}>
          <div>Worker Page</div>
        </AppShell>
      );

      expect(screen.getByText("Job Requests")).toBeInTheDocument();
      expect(screen.getByLabelText(/open sidebar navigation/i)).toBeInTheDocument();
    });

    it("renders interactive toast notifications via AppShellFeedback", () => {
      render(
        <AppShell header={<header role="banner">Header</header>}>
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
