/**
 * Thin API boundary: returns mock/local behavior today; swap for fetch() when a backend exists.
 */
export type ApiMode = 'mock';

export interface PractikalApi {
  mode: ApiMode;
  /** Placeholder for future authenticated requests */
  baseUrl: string | null;
}

let singleton: PractikalApi = {
  mode: 'mock',
  baseUrl: null,
};

export function getApi(): PractikalApi {
  return singleton;
}

export function configureApi(next: Partial<PractikalApi>) {
  singleton = { ...singleton, ...next };
}
