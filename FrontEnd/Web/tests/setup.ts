import '@testing-library/jest-dom';
import '@testing-library/react';

// Polyfill Web API globals in JSDOM environment
/* eslint-disable @typescript-eslint/no-explicit-any */
const rootGlobal = Function('return this')();

if (typeof (global as any).Request === 'undefined') {
  class MockRequest {
    public credentials = 'include';
  }
  const Req = rootGlobal.Request || MockRequest;
  (global as any).Request = Req;
  if (typeof window !== 'undefined') (window as any).Request = Req;
}

if (typeof (global as any).Response === 'undefined') {
  class MockResponse {
    public ok = true;
    public status = 200;
  }
  const Res = rootGlobal.Response || MockResponse;
  (global as any).Response = Res;
  if (typeof window !== 'undefined') (window as any).Response = Res;
}

if (typeof (global as any).Headers === 'undefined') {
  class MockHeaders {
    private map = new Map<string, string>();
    get(name: string) {
      return this.map.get(name.toLowerCase()) || null;
    }
    set(name: string, val: string) {
      this.map.set(name.toLowerCase(), val);
    }
    has(name: string) {
      return this.map.has(name.toLowerCase());
    }
  }
  const Hdr = rootGlobal.Headers || MockHeaders;
  (global as any).Headers = Hdr;
  if (typeof window !== 'undefined') (window as any).Headers = Hdr;
}

if (typeof (global as any).fetch === 'undefined') {
  const defaultFetch = rootGlobal.fetch || (() => Promise.resolve(new (global as any).Response()));
  (global as any).fetch = defaultFetch;
  if (typeof window !== 'undefined') (window as any).fetch = defaultFetch;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// Global mock for next/navigation in test environment
jest.mock('next/navigation', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockRefresh = jest.fn();
  const mockBack = jest.fn();
  const mockForward = jest.fn();
  const mockPrefetch = jest.fn();

  return {
    useRouter: () => ({
      push: mockPush,
      replace: mockReplace,
      refresh: mockRefresh,
      back: mockBack,
      forward: mockForward,
      prefetch: mockPrefetch,
    }),
    usePathname: () => '/dashboard',
    useSearchParams: () => new URLSearchParams(),
    useParams: () => ({}),
    redirect: jest.fn(),
    notFound: jest.fn(),
  };
});
