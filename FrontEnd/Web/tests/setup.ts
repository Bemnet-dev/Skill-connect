import '@testing-library/jest-dom';
import '@testing-library/react';

// Polyfill Web API globals in JSDOM environment
/* eslint-disable @typescript-eslint/no-explicit-any */
const rootGlobal = Function('return this')();
if (typeof (global as any).Response === 'undefined' && rootGlobal.Response) {
  (global as any).Response = rootGlobal.Response;
  if (typeof window !== 'undefined') (window as any).Response = rootGlobal.Response;
}
if (typeof (global as any).Headers === 'undefined' && rootGlobal.Headers) {
  (global as any).Headers = rootGlobal.Headers;
  if (typeof window !== 'undefined') (window as any).Headers = rootGlobal.Headers;
}
if (typeof (global as any).Request === 'undefined' && rootGlobal.Request) {
  (global as any).Request = rootGlobal.Request;
  if (typeof window !== 'undefined') (window as any).Request = rootGlobal.Request;
}
if (typeof (global as any).fetch === 'undefined' && rootGlobal.fetch) {
  (global as any).fetch = rootGlobal.fetch;
  if (typeof window !== 'undefined') (window as any).fetch = rootGlobal.fetch;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

