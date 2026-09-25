/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import {
  useUiStore,
  toast,
  getToasts,
  getActiveModal,
  isModalOpen,
  isSidebarOpen,
  isGlobalLoading,
} from "@/state/store/uiStore";

describe("uiStore (Pure Global UI State & Toasts)", () => {
  beforeEach(() => {
    useUiStore.getState().resetUi();
  });

  describe("Toast Notifications", () => {
    it("initializes with empty toasts", () => {
      expect(getToasts()).toEqual([]);
    });

    it("adds toast via string message and auto-generates ID and defaults", () => {
      const id = toast.add("Simple notification");
      expect(id).toBeDefined();

      const toasts = getToasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe("Simple notification");
      expect(toasts[0].type).toBe("default");
      expect(toasts[0].duration).toBe(5000);
      expect(toasts[0].dismissible).toBe(true);
    });

    it("adds typed toasts with helper methods", () => {
      const sId = toast.success("Success message", { title: "Success" });
      const eId = toast.error("Error message", { title: "Error" });
      const wId = toast.warning("Warning message");
      const iId = toast.info("Info message");

      const toasts = getToasts();
      expect(toasts).toHaveLength(4);

      expect(toasts.find((t) => t.id === sId)?.type).toBe("success");
      expect(toasts.find((t) => t.id === sId)?.title).toBe("Success");

      expect(toasts.find((t) => t.id === eId)?.type).toBe("error");
      expect(toasts.find((t) => t.id === wId)?.type).toBe("warning");
      expect(toasts.find((t) => t.id === iId)?.type).toBe("info");
    });

    it("supports interactive toast actions", () => {
      const onAction = jest.fn();
      toast.add({
        message: "File uploaded",
        action: { label: "Undo", onClick: onAction },
      });

      const [item] = getToasts();
      expect(item.action?.label).toBe("Undo");
      item.action?.onClick();
      expect(onAction).toHaveBeenCalledTimes(1);
    });

    it("removes toast by ID via dismiss", () => {
      const id1 = toast.info("Toast 1");
      const id2 = toast.info("Toast 2");

      expect(getToasts()).toHaveLength(2);
      toast.dismiss(id1);

      const toasts = getToasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].id).toBe(id2);
    });

    it("clears all toasts", () => {
      toast.success("T1");
      toast.error("T2");
      toast.warning("T3");

      expect(getToasts()).toHaveLength(3);
      toast.clear();
      expect(getToasts()).toEqual([]);
    });
  });

  describe("Modal Management", () => {
    it("opens and closes modals with payload", () => {
      expect(getActiveModal()).toBeNull();
      expect(isModalOpen("worker-booking-modal")).toBe(false);

      useUiStore.getState().openModal("worker-booking-modal", { workerId: "w-1" });
      expect(getActiveModal()).toBe("worker-booking-modal");
      expect(isModalOpen("worker-booking-modal")).toBe(true);
      expect(useUiStore.getState().modalData).toEqual({ workerId: "w-1" });

      useUiStore.getState().closeModal();
      expect(getActiveModal()).toBeNull();
      expect(isModalOpen("worker-booking-modal")).toBe(false);
      expect(useUiStore.getState().modalData).toBeNull();
    });
  });

  describe("Sidebar & Layout", () => {
    it("toggles sidebar open and close state", () => {
      expect(isSidebarOpen()).toBe(false);

      useUiStore.getState().toggleSidebar();
      expect(isSidebarOpen()).toBe(true);

      useUiStore.getState().toggleSidebar();
      expect(isSidebarOpen()).toBe(false);

      useUiStore.getState().setSidebarOpen(true);
      expect(isSidebarOpen()).toBe(true);
    });
  });

  describe("Global Loading & Banner", () => {
    it("manages global loading state", () => {
      expect(isGlobalLoading()).toBe(false);

      useUiStore.getState().setGlobalLoading(true);
      expect(isGlobalLoading()).toBe(true);

      useUiStore.getState().setGlobalLoading(false);
      expect(isGlobalLoading()).toBe(false);
    });

    it("manages banner announcement state", () => {
      expect(useUiStore.getState().activeBanner).toBeNull();

      useUiStore.getState().setBanner({
        id: "b-1",
        message: "System maintenance tonight",
        type: "warning",
      });

      expect(useUiStore.getState().activeBanner?.message).toBe("System maintenance tonight");

      useUiStore.getState().clearBanner();
      expect(useUiStore.getState().activeBanner).toBeNull();
    });
  });
});
