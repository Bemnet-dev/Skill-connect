import { describe, it, expect } from '@jest/globals';
import {
  ROUTES,
  getWorkerProfileRoute,
  getBookingDetailRoute,
  getChatThreadRoute,
  getJobDetailRoute,
  API_TIMEOUTS,
  API_RETRY,
  PAGINATION,
  VALIDATION,
  DATE_FORMAT,
  FILE_UPLOAD,
  SIGNALR,
  STORAGE_KEYS,
} from '@/lib/constants';

describe('Route Constants', () => {
  describe('ROUTES object', () => {
    it('should have correct auth routes', () => {
      expect(ROUTES.AUTH.LOGIN).toBe('/login');
      expect(ROUTES.AUTH.VERIFY_OTP).toBe('/verify-otp');
    });

    it('should have correct customer routes', () => {
      expect(ROUTES.CUSTOMER.SEARCH).toBe('/search');
      expect(ROUTES.CUSTOMER.BOOKINGS).toBe('/bookings');
      expect(ROUTES.CUSTOMER.WORKERS).toBe('/workers');
      expect(ROUTES.CUSTOMER.CHAT).toBe('/chat');
    });

    it('should have correct worker routes', () => {
      expect(ROUTES.WORKER.DASHBOARD).toBe('/dashboard');
      expect(ROUTES.WORKER.JOBS).toBe('/jobs');
      expect(ROUTES.WORKER.EARNINGS).toBe('/earnings');
    });

    it('should have correct admin routes', () => {
      expect(ROUTES.ADMIN.VERIFICATION_QUEUE).toBe('/verification-queue');
      expect(ROUTES.ADMIN.DISPUTES).toBe('/disputes');
    });

    it('should have home route', () => {
      expect(ROUTES.HOME).toBe('/');
    });
  });

  describe('Dynamic route helpers', () => {
    it('getWorkerProfileRoute should generate correct path', () => {
      expect(getWorkerProfileRoute('worker123')).toBe('/workers/worker123');
      expect(getWorkerProfileRoute('abc-def-456')).toBe('/workers/abc-def-456');
    });

    it('getBookingDetailRoute should generate correct path', () => {
      expect(getBookingDetailRoute('booking456')).toBe('/bookings/booking456');
      expect(getBookingDetailRoute('xyz-789')).toBe('/bookings/xyz-789');
    });

    it('getChatThreadRoute should generate correct path', () => {
      expect(getChatThreadRoute('thread789')).toBe('/chat/thread789');
      expect(getChatThreadRoute('conv-abc-123')).toBe('/chat/conv-abc-123');
    });

    it('getJobDetailRoute should generate correct path', () => {
      expect(getJobDetailRoute('job321')).toBe('/jobs/job321');
      expect(getJobDetailRoute('job-def-789')).toBe('/jobs/job-def-789');
    });
  });

  describe('Type safety', () => {
    it('should be readonly (as const)', () => {
      // TypeScript will catch any attempts to modify these at compile time
      // This test just verifies the structure exists
      expect(ROUTES).toBeDefined();
      expect(typeof ROUTES.AUTH).toBe('object');
      expect(typeof ROUTES.CUSTOMER).toBe('object');
      expect(typeof ROUTES.WORKER).toBe('object');
      expect(typeof ROUTES.ADMIN).toBe('object');
    });
  });
});

describe('API Configuration Constants', () => {
  describe('API_TIMEOUTS', () => {
    it('should have correct timeout values', () => {
      expect(API_TIMEOUTS.DEFAULT).toBe(30000);
      expect(API_TIMEOUTS.UPLOAD).toBe(120000);
      expect(API_TIMEOUTS.DOWNLOAD).toBe(60000);
    });
  });

  describe('API_RETRY', () => {
    it('should have correct retry configuration', () => {
      expect(API_RETRY.MAX_ATTEMPTS).toBe(3);
      expect(API_RETRY.BACKOFF_MS).toBe(1000);
    });
  });

  describe('PAGINATION', () => {
    it('should have correct default page size', () => {
      expect(PAGINATION.DEFAULT_PAGE_SIZE).toBe(20);
    });

    it('should have correct max page size', () => {
      expect(PAGINATION.MAX_PAGE_SIZE).toBe(100);
    });

    it('should have correct min page size', () => {
      expect(PAGINATION.MIN_PAGE_SIZE).toBe(10);
    });

    it('should have correct default page number', () => {
      expect(PAGINATION.DEFAULT_PAGE).toBe(1);
    });

    it('should have min less than default less than max', () => {
      expect(PAGINATION.MIN_PAGE_SIZE).toBeLessThan(PAGINATION.DEFAULT_PAGE_SIZE);
      expect(PAGINATION.DEFAULT_PAGE_SIZE).toBeLessThan(PAGINATION.MAX_PAGE_SIZE);
    });
  });
});

describe('Validation Constants', () => {
  describe('PASSWORD', () => {
    it('should have correct min length', () => {
      expect(VALIDATION.PASSWORD.MIN_LENGTH).toBe(8);
    });

    it('should have correct max length', () => {
      expect(VALIDATION.PASSWORD.MAX_LENGTH).toBe(128);
    });

    it('should have min less than max', () => {
      expect(VALIDATION.PASSWORD.MIN_LENGTH).toBeLessThan(VALIDATION.PASSWORD.MAX_LENGTH);
    });
  });

  describe('USERNAME', () => {
    it('should have correct min length', () => {
      expect(VALIDATION.USERNAME.MIN_LENGTH).toBe(3);
    });

    it('should have correct max length', () => {
      expect(VALIDATION.USERNAME.MAX_LENGTH).toBe(30);
    });

    it('should have min less than max', () => {
      expect(VALIDATION.USERNAME.MIN_LENGTH).toBeLessThan(VALIDATION.USERNAME.MAX_LENGTH);
    });
  });

  describe('BIO_MAX_LENGTH', () => {
    it('should have correct max length', () => {
      expect(VALIDATION.BIO_MAX_LENGTH).toBe(500);
    });
  });

  describe('MESSAGE_MAX_LENGTH', () => {
    it('should have correct max length', () => {
      expect(VALIDATION.MESSAGE_MAX_LENGTH).toBe(2000);
    });
  });

  describe('PHONE_REGEX', () => {
    it('should be defined as a RegExp', () => {
      expect(VALIDATION.PHONE_REGEX).toBeInstanceOf(RegExp);
    });

    it('should match valid E.164 phone numbers', () => {
      const validNumbers = [
        '+1234567890',
        '+447911123456',
        '+12025551234',
        '+861234567890',
        '+33123456789',
      ];

      validNumbers.forEach((number) => {
        expect(VALIDATION.PHONE_REGEX.test(number)).toBe(true);
      });
    });

    it('should reject invalid phone numbers', () => {
      const invalidNumbers = [
        '1234567890',           // Missing +
        '+0234567890',          // Starts with 0
        '+1',                   // Too short
        '+12345678901234567',   // Too long (>15 digits)
        '+ 1234567890',         // Space after +
        '+12 345 678',          // Spaces in number
        'abc',                  // Not a number
        '',                     // Empty string
        '+',                    // Just plus sign
      ];

      invalidNumbers.forEach((number) => {
        expect(VALIDATION.PHONE_REGEX.test(number)).toBe(false);
      });
    });
  });
});
describe('Date Format Constants', () => {
  describe('DATE_FORMAT', () => {
    it('should have correct display format', () => {
      expect(DATE_FORMAT.DISPLAY).toBe('MMM dd, yyyy');
    });

    it('should have correct display with time format', () => {
      expect(DATE_FORMAT.DISPLAY_WITH_TIME).toBe('MMM dd, yyyy HH:mm');
    });

    it('should have correct ISO date format', () => {
      expect(DATE_FORMAT.ISO).toBe('yyyy-MM-dd');
    });

    it('should have correct ISO datetime format', () => {
      expect(DATE_FORMAT.ISO_WITH_TIME).toBe("yyyy-MM-dd'T'HH:mm:ss");
    });

    it('should have correct time only format', () => {
      expect(DATE_FORMAT.TIME_ONLY).toBe('HH:mm');
    });

    it('should have correct file name format', () => {
      expect(DATE_FORMAT.FILE_NAME).toBe('yyyy-MM-dd');
    });

    it('should have correct file name with time format', () => {
      expect(DATE_FORMAT.FILE_NAME_WITH_TIME).toBe('yyyy-MM-dd_HHmmss');
    });

    it('should be defined as an object', () => {
      expect(typeof DATE_FORMAT).toBe('object');
      expect(DATE_FORMAT).toBeDefined();
    });
  });
});

describe('File Upload Constants', () => {
  describe('FILE_UPLOAD', () => {
    it('should have correct max size in MB', () => {
      expect(FILE_UPLOAD.MAX_SIZE_MB).toBe(5);
    });

    it('should have correct max size in bytes', () => {
      expect(FILE_UPLOAD.MAX_SIZE_BYTES).toBe(5 * 1024 * 1024);
    });

    it('should have max size bytes match max size MB', () => {
      expect(FILE_UPLOAD.MAX_SIZE_BYTES).toBe(FILE_UPLOAD.MAX_SIZE_MB * 1024 * 1024);
    });

    it('should have allowed image types array', () => {
      expect(Array.isArray(FILE_UPLOAD.ALLOWED_IMAGE_TYPES)).toBe(true);
      expect(FILE_UPLOAD.ALLOWED_IMAGE_TYPES).toContain('image/jpeg');
      expect(FILE_UPLOAD.ALLOWED_IMAGE_TYPES).toContain('image/png');
      expect(FILE_UPLOAD.ALLOWED_IMAGE_TYPES).toContain('image/webp');
    });

    it('should have allowed document types array', () => {
      expect(Array.isArray(FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES)).toBe(true);
      expect(FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES).toContain('application/pdf');
      expect(FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES).toContain('image/jpeg');
      expect(FILE_UPLOAD.ALLOWED_DOCUMENT_TYPES).toContain('image/png');
    });

    it('should have error messages object', () => {
      expect(typeof FILE_UPLOAD.ERROR_MESSAGES).toBe('object');
      expect(FILE_UPLOAD.ERROR_MESSAGES.SIZE_EXCEEDED).toBeDefined();
      expect(FILE_UPLOAD.ERROR_MESSAGES.INVALID_TYPE).toBeDefined();
    });

    it('should have descriptive error messages', () => {
      expect(FILE_UPLOAD.ERROR_MESSAGES.SIZE_EXCEEDED).toContain('5MB');
      expect(FILE_UPLOAD.ERROR_MESSAGES.INVALID_TYPE).toContain('file type');
    });
  });
});

describe('SignalR Configuration Constants', () => {
  describe('SIGNALR', () => {
    it('should have correct reconnect delay', () => {
      expect(SIGNALR.RECONNECT_DELAY_MS).toBe(5000);
    });

    it('should have correct max reconnect attempts', () => {
      expect(SIGNALR.MAX_RECONNECT_ATTEMPTS).toBe(5);
    });

    it('should have correct timeout', () => {
      expect(SIGNALR.TIMEOUT_MS).toBe(30000);
    });

    it('should have correct keep-alive interval', () => {
      expect(SIGNALR.KEEP_ALIVE_INTERVAL_MS).toBe(15000);
    });

    it('should have keep-alive interval less than timeout', () => {
      expect(SIGNALR.KEEP_ALIVE_INTERVAL_MS).toBeLessThan(SIGNALR.TIMEOUT_MS);
    });

    it('should have positive reconnect attempts', () => {
      expect(SIGNALR.MAX_RECONNECT_ATTEMPTS).toBeGreaterThan(0);
    });

    it('should have positive delay values', () => {
      expect(SIGNALR.RECONNECT_DELAY_MS).toBeGreaterThan(0);
      expect(SIGNALR.TIMEOUT_MS).toBeGreaterThan(0);
      expect(SIGNALR.KEEP_ALIVE_INTERVAL_MS).toBeGreaterThan(0);
    });
  });
});

describe('Storage Keys Constants', () => {
  describe('STORAGE_KEYS', () => {
    it('should have auth token key', () => {
      expect(STORAGE_KEYS.AUTH_TOKEN).toBe('skilld_auth_token');
    });

    it('should have user preferences key', () => {
      expect(STORAGE_KEYS.USER_PREFERENCES).toBe('skilld_user_prefs');
    });

    it('should have last search key', () => {
      expect(STORAGE_KEYS.LAST_SEARCH).toBe('skilld_last_search');
    });

    it('should have onboarding completed key', () => {
      expect(STORAGE_KEYS.ONBOARDING_COMPLETED).toBe('skilld_onboarding_completed');
    });

    it('should have draft messages key', () => {
      expect(STORAGE_KEYS.DRAFT_MESSAGES).toBe('skilld_draft_messages');
    });

    it('should all have skilld prefix', () => {
      Object.values(STORAGE_KEYS).forEach((key) => {
        expect(key).toMatch(/^skilld_/);
      });
    });

    it('should have unique keys', () => {
      const keys = Object.values(STORAGE_KEYS);
      const uniqueKeys = new Set(keys);
      expect(keys.length).toBe(uniqueKeys.size);
    });
  });
});
