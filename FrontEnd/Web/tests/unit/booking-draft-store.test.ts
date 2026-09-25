/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  useBookingDraftStore,
  getBookingDraft,
  getCurrentWizardStep,
  isDraftComplete,
  INITIAL_BOOKING_DRAFT,
} from "@/state/store/bookingDraftStore";

describe("bookingDraftStore (SessionStorage Persisted Booking Wizard Draft)", () => {
  beforeEach(() => {
    useBookingDraftStore.getState().resetDraft();
  });

  it("initializes at Step 1 with empty draft", () => {
    expect(getCurrentWizardStep()).toBe(1);
    expect(getBookingDraft()).toEqual(INITIAL_BOOKING_DRAFT);
    expect(isDraftComplete()).toBe(false);
  });

  describe("Step 1: Worker & Category Selection", () => {
    it("fails validation if worker is not selected", () => {
      expect(useBookingDraftStore.getState().isStepValid(1)).toBe(false);
      expect(useBookingDraftStore.getState().canProceed()).toBe(false);
    });

    it("succeeds validation and updates cost after setting worker", () => {
      useBookingDraftStore.getState().setWorker({
        id: "worker-99",
        name: "Dawit Plumber",
        category: "plumbing",
        hourlyRate: 50,
      });

      const draft = getBookingDraft();
      expect(draft.workerId).toBe("worker-99");
      expect(draft.workerName).toBe("Dawit Plumber");
      expect(draft.hourlyRate).toBe(50);
      expect(draft.estimatedCost).toBe(50); // 1 hour * 50
      expect(useBookingDraftStore.getState().isStepValid(1)).toBe(true);
      expect(useBookingDraftStore.getState().canProceed()).toBe(true);
    });
  });

  describe("Step Navigation & Progression", () => {
    it("does not advance to next step if current step is invalid", () => {
      expect(getCurrentWizardStep()).toBe(1);
      useBookingDraftStore.getState().nextStep();
      expect(getCurrentWizardStep()).toBe(1);
    });

    it("advances to next step and records completed step when valid", () => {
      useBookingDraftStore.getState().setWorker({
        id: "w-1",
        name: "Abebe Electrician",
        category: "electrical",
      });

      useBookingDraftStore.getState().nextStep();
      expect(getCurrentWizardStep()).toBe(2);
      expect(useBookingDraftStore.getState().completedSteps).toContain(1);
    });

    it("allows stepping back via prevStep and clamping to 1", () => {
      useBookingDraftStore.getState().setWorker({ id: "w-1", name: "Abebe" });
      useBookingDraftStore.getState().nextStep();
      expect(getCurrentWizardStep()).toBe(2);

      useBookingDraftStore.getState().prevStep();
      expect(getCurrentWizardStep()).toBe(1);

      useBookingDraftStore.getState().prevStep();
      expect(getCurrentWizardStep()).toBe(1);
    });
  });

  describe("Step 2: Schedule & Time Slot", () => {
    beforeEach(() => {
      useBookingDraftStore.getState().setStep(2);
    });

    it("validates scheduledDate and timeSlot", () => {
      expect(useBookingDraftStore.getState().isStepValid(2)).toBe(false);

      useBookingDraftStore.getState().setSchedule({
        scheduledDate: "2026-10-01",
        timeSlot: "10:00 - 12:00",
        isEmergency: false,
      });

      const draft = getBookingDraft();
      expect(draft.scheduledDate).toBe("2026-10-01");
      expect(draft.timeSlot).toBe("10:00 - 12:00");
      expect(useBookingDraftStore.getState().isStepValid(2)).toBe(true);
    });
  });

  describe("Step 3: Location & Contact", () => {
    beforeEach(() => {
      useBookingDraftStore.getState().setStep(3);
    });

    it("requires address and contact phone", () => {
      expect(useBookingDraftStore.getState().isStepValid(3)).toBe(false);

      useBookingDraftStore.getState().setLocation({
        address: "Bole Medhanialem, House 45",
        city: "Addis Ababa",
        contactPhone: "+251911223344",
        coordinates: { latitude: 9.0, longitude: 38.7 },
      });

      const draft = getBookingDraft();
      expect(draft.address).toBe("Bole Medhanialem, House 45");
      expect(draft.contactPhone).toBe("+251911223344");
      expect(draft.coordinates).toEqual({ latitude: 9.0, longitude: 38.7 });
      expect(useBookingDraftStore.getState().isStepValid(3)).toBe(true);
    });
  });

  describe("Step 4: Job Description & Attachments", () => {
    beforeEach(() => {
      useBookingDraftStore.getState().setStep(4);
    });

    it("requires minimum 10 characters description", () => {
      useBookingDraftStore.getState().setJobDetails({
        title: "Leaking Pipe",
        description: "Short",
      });
      expect(useBookingDraftStore.getState().isStepValid(4)).toBe(false);

      useBookingDraftStore.getState().setJobDetails({
        description: "Kitchen sink pipe is leaking heavily under the counter.",
      });
      expect(useBookingDraftStore.getState().isStepValid(4)).toBe(true);
    });

    it("supports adding and removing photo attachments", () => {
      useBookingDraftStore.getState().addAttachment({
        id: "att-1",
        name: "leak.jpg",
        url: "https://example.com/leak.jpg",
      });

      let draft = getBookingDraft();
      expect(draft.attachments).toHaveLength(1);
      expect(draft.attachments[0].id).toBe("att-1");

      useBookingDraftStore.getState().removeAttachment("att-1");
      draft = getBookingDraft();
      expect(draft.attachments).toHaveLength(0);
    });
  });

  describe("Step 5 & Overall Draft Completion", () => {
    it("reports draft complete when all 4 preliminary steps are fulfilled", () => {
      expect(isDraftComplete()).toBe(false);

      // Fulfill step 1
      useBookingDraftStore.getState().setWorker({ id: "w-1", name: "Worker 1" });
      // Fulfill step 2
      useBookingDraftStore.getState().setSchedule({
        scheduledDate: "2026-10-01",
        timeSlot: "09:00",
      });
      // Fulfill step 3
      useBookingDraftStore.getState().setLocation({
        address: "Main St",
        contactPhone: "+15551234567",
      });
      // Fulfill step 4
      useBookingDraftStore.getState().setJobDetails({
        description: "Need full bathroom pipe replacement done properly.",
      });

      expect(isDraftComplete()).toBe(true);
      expect(useBookingDraftStore.getState().isStepValid(5)).toBe(true);
    });

    it("resets all wizard state and draft data on resetDraft", () => {
      useBookingDraftStore.getState().setWorker({ id: "w-1", name: "Worker 1" });
      useBookingDraftStore.getState().setStep(3);

      useBookingDraftStore.getState().resetDraft();
      expect(getCurrentWizardStep()).toBe(1);
      expect(getBookingDraft().workerId).toBe("");
    });
  });
});
