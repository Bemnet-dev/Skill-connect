import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { WorkerCategory } from "@/lib/constants";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Booking Draft Store Domain Models & Types
 * ─────────────────────────────────────────────────────────────────────────────
 * Manages the multi-step customer booking wizard draft state, persisted across
 * page refreshes and route changes in sessionStorage.
 */

export interface BookingAttachment {
  id: string;
  name: string;
  url: string;
  sizeBytes?: number;
  type?: string;
}

export type JobUrgency = "standard" | "high" | "urgent";

export interface BookingDraft {
  /** Target worker identification */
  workerId: string;
  workerName: string;
  workerAvatarUrl?: string;
  category: WorkerCategory | string;
  hourlyRate?: number;
  serviceTier?: "standard" | "premium" | "emergency";

  /** Schedule & appointment slot */
  scheduledDate: string | null; // ISO Date string 'YYYY-MM-DD'
  timeSlot: string | null; // e.g. '09:00 - 11:00' or '14:00'
  isEmergency: boolean;

  /** Service location and onsite access */
  address: string;
  city: string;
  postalCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  contactPhone: string;
  accessInstructions?: string; // Gate code, apartment number, parking

  /** Job description and media attachments */
  title: string;
  description: string;
  urgency: JobUrgency;
  attachments: BookingAttachment[];

  /** Pricing, estimation, and final review */
  estimatedHours: number;
  estimatedCost: number;
  notesForWorker?: string;
}

export interface BookingDraftState {
  /** Current step in the booking wizard (1-indexed, 1 through 5) */
  step: number;
  /** List of completed step numbers */
  completedSteps: number[];
  /** Draft data accumulated across wizard steps */
  draft: BookingDraft;
  /** Hydration status from sessionStorage */
  hasHydrated: boolean;
}

export interface BookingDraftActions {
  /** Navigate directly to a specific wizard step */
  setStep: (step: number) => void;
  /** Advance to next step (if within bounds 1-5) */
  nextStep: () => void;
  /** Retreat to previous step (if within bounds 1-5) */
  prevStep: () => void;

  /** Update draft attributes partially */
  updateDraft: (partial: Partial<BookingDraft>) => void;

  /** Step 1: Worker & Category selection */
  setWorker: (worker: {
    id: string;
    name: string;
    avatarUrl?: string;
    category?: WorkerCategory | string;
    hourlyRate?: number;
    serviceTier?: "standard" | "premium" | "emergency";
  }) => void;

  /** Step 2: Schedule selection */
  setSchedule: (schedule: {
    scheduledDate: string;
    timeSlot: string;
    isEmergency?: boolean;
  }) => void;

  /** Step 3: Location and contact details */
  setLocation: (location: {
    address: string;
    city?: string;
    postalCode?: string;
    coordinates?: { latitude: number; longitude: number };
    contactPhone?: string;
    accessInstructions?: string;
  }) => void;

  /** Step 4: Job scope and description */
  setJobDetails: (details: {
    title?: string;
    description?: string;
    urgency?: JobUrgency;
  }) => void;

  /** Attachment upload / removal */
  addAttachment: (attachment: Omit<BookingAttachment, "id"> & { id?: string }) => void;
  removeAttachment: (attachmentId: string) => void;

  /** Step 5: Pricing estimate */
  setPricing: (pricing: {
    estimatedHours?: number;
    estimatedCost?: number;
    notesForWorker?: string;
  }) => void;

  /** Mark a step completed */
  markStepCompleted: (step: number) => void;

  /** Check if a given step is valid to proceed */
  isStepValid: (stepNumber?: number) => boolean;

  /** Whether the current active step can proceed */
  canProceed: () => boolean;

  /** Clear draft and reset wizard back to Step 1 */
  resetDraft: () => void;

  /** Set hydration status */
  setHasHydrated: (hasHydrated: boolean) => void;
}

export type BookingDraftStore = BookingDraftState & BookingDraftActions;

export const INITIAL_BOOKING_DRAFT: BookingDraft = {
  workerId: "",
  workerName: "",
  workerAvatarUrl: undefined,
  category: "",
  hourlyRate: undefined,
  serviceTier: "standard",

  scheduledDate: null,
  timeSlot: null,
  isEmergency: false,

  address: "",
  city: "",
  postalCode: "",
  coordinates: undefined,
  contactPhone: "",
  accessInstructions: "",

  title: "",
  description: "",
  urgency: "standard",
  attachments: [],

  estimatedHours: 1,
  estimatedCost: 0,
  notesForWorker: "",
};

export const INITIAL_BOOKING_WIZARD_STATE: BookingDraftState = {
  step: 1,
  completedSteps: [],
  draft: INITIAL_BOOKING_DRAFT,
  hasHydrated: false,
};

export const TOTAL_WIZARD_STEPS = 5;
export const BOOKING_DRAFT_STORAGE_KEY = "skilld_booking_wizard_draft";

/**
 * Fallback storage when sessionStorage is unavailable (SSR, Node, Jest).
 */
const sessionMemoryStorage: Record<string, string> = {};

const fallbackSessionStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        return window.sessionStorage.getItem(name);
      } catch {
        return sessionMemoryStorage[name] ?? null;
      }
    }
    return sessionMemoryStorage[name] ?? null;
  },
  setItem: (name: string, value: string): void => {
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(name, value);
        return;
      } catch {
        sessionMemoryStorage[name] = value;
        return;
      }
    }
    sessionMemoryStorage[name] = value;
  },
  removeItem: (name: string): void => {
    if (typeof window !== "undefined" && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem(name);
        return;
      } catch {
        delete sessionMemoryStorage[name];
        return;
      }
    }
    delete sessionMemoryStorage[name];
  },
};

function generateAttachmentId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `att_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Validates requirements for each wizard step
 */
function validateStepRequirements(step: number, draft: BookingDraft): boolean {
  switch (step) {
    case 1:
      // Worker must be selected
      return Boolean(draft.workerId.trim() && draft.workerName.trim());
    case 2:
      // Scheduled date and time slot must be selected
      return Boolean(draft.scheduledDate && draft.timeSlot);
    case 3:
      // Address and contact phone must be filled
      return Boolean(draft.address.trim() && draft.contactPhone.trim());
    case 4:
      // Description of the job is required
      return Boolean(draft.description.trim().length >= 10);
    case 5:
      // All previous steps must be valid
      return (
        validateStepRequirements(1, draft) &&
        validateStepRequirements(2, draft) &&
        validateStepRequirements(3, draft) &&
        validateStepRequirements(4, draft)
      );
    default:
      return true;
  }
}

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Zustand bookingDraftStore Instance
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const useBookingDraftStore = create<BookingDraftStore>()(
  persist(
    (set, get) => ({
      ...INITIAL_BOOKING_WIZARD_STATE,

      setStep: (step) => {
        const clampedStep = Math.max(1, Math.min(TOTAL_WIZARD_STEPS, step));
        set({ step: clampedStep });
      },

      nextStep: () => {
        const { step, completedSteps, isStepValid } = get();
        if (isStepValid(step)) {
          const next = Math.min(TOTAL_WIZARD_STEPS, step + 1);
          const nextCompleted = Array.from(new Set([...completedSteps, step]));
          set({ step: next, completedSteps: nextCompleted });
        }
      },

      prevStep: () => {
        const { step } = get();
        set({ step: Math.max(1, step - 1) });
      },

      updateDraft: (partial) => {
        set((state) => ({
          draft: { ...state.draft, ...partial },
        }));
      },

      setWorker: (worker) => {
        set((state) => {
          const rate = worker.hourlyRate ?? state.draft.hourlyRate ?? 0;
          const hours = state.draft.estimatedHours || 1;
          const cost = rate * hours;

          return {
            draft: {
              ...state.draft,
              workerId: worker.id,
              workerName: worker.name,
              workerAvatarUrl: worker.avatarUrl ?? state.draft.workerAvatarUrl,
              category: worker.category ?? state.draft.category,
              hourlyRate: rate,
              serviceTier: worker.serviceTier ?? state.draft.serviceTier,
              estimatedCost: cost,
            },
          };
        });
      },

      setSchedule: ({ scheduledDate, timeSlot, isEmergency = false }) => {
        set((state) => ({
          draft: {
            ...state.draft,
            scheduledDate,
            timeSlot,
            isEmergency,
          },
        }));
      },

      setLocation: ({
        address,
        city = "",
        postalCode = "",
        coordinates,
        contactPhone,
        accessInstructions,
      }) => {
        set((state) => ({
          draft: {
            ...state.draft,
            address,
            city: city || state.draft.city,
            postalCode: postalCode || state.draft.postalCode,
            coordinates: coordinates ?? state.draft.coordinates,
            contactPhone: contactPhone ?? state.draft.contactPhone,
            accessInstructions: accessInstructions ?? state.draft.accessInstructions,
          },
        }));
      },

      setJobDetails: ({ title, description, urgency }) => {
        set((state) => ({
          draft: {
            ...state.draft,
            title: title ?? state.draft.title,
            description: description ?? state.draft.description,
            urgency: urgency ?? state.draft.urgency,
          },
        }));
      },

      addAttachment: (attachment) => {
        const newAttachment: BookingAttachment = {
          id: attachment.id ?? generateAttachmentId(),
          name: attachment.name,
          url: attachment.url,
          sizeBytes: attachment.sizeBytes,
          type: attachment.type,
        };

        set((state) => ({
          draft: {
            ...state.draft,
            attachments: [...state.draft.attachments, newAttachment],
          },
        }));
      },

      removeAttachment: (attachmentId) => {
        set((state) => ({
          draft: {
            ...state.draft,
            attachments: state.draft.attachments.filter((att) => att.id !== attachmentId),
          },
        }));
      },

      setPricing: ({ estimatedHours, estimatedCost, notesForWorker }) => {
        set((state) => {
          const hours = estimatedHours ?? state.draft.estimatedHours;
          const rate = state.draft.hourlyRate ?? 0;
          const cost = estimatedCost ?? hours * rate;

          return {
            draft: {
              ...state.draft,
              estimatedHours: hours,
              estimatedCost: cost,
              notesForWorker: notesForWorker ?? state.draft.notesForWorker,
            },
          };
        });
      },

      markStepCompleted: (stepNumber) => {
        set((state) => ({
          completedSteps: Array.from(new Set([...state.completedSteps, stepNumber])),
        }));
      },

      isStepValid: (stepNumber) => {
        const { step, draft } = get();
        const targetStep = stepNumber ?? step;
        return validateStepRequirements(targetStep, draft);
      },

      canProceed: () => {
        const { step, isStepValid } = get();
        return isStepValid(step);
      },

      resetDraft: () => {
        set({
          ...INITIAL_BOOKING_WIZARD_STATE,
          hasHydrated: get().hasHydrated,
        });
      },

      setHasHydrated: (hasHydrated) => {
        set({ hasHydrated });
      },
    }),
    {
      name: BOOKING_DRAFT_STORAGE_KEY,
      storage: createJSONStorage(() => fallbackSessionStorage),
      partialize: (state) => ({
        step: state.step,
        completedSteps: state.completedSteps,
        draft: state.draft,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Non-Hook Direct Selectors & Helpers
 * ─────────────────────────────────────────────────────────────────────────────
 */
export const getBookingDraft = (): BookingDraft => useBookingDraftStore.getState().draft;

export const getCurrentWizardStep = (): number => useBookingDraftStore.getState().step;

export const isDraftComplete = (): boolean =>
  useBookingDraftStore.getState().isStepValid(5);

export default useBookingDraftStore;
