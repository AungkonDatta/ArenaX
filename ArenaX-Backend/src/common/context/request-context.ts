import { AsyncLocalStorage } from 'async_hooks';

export interface RequestStore {
  userId?: number;
  ip?: string;
}

export class RequestContext {
  private static readonly storage = new AsyncLocalStorage<RequestStore>();

  static run(store: RequestStore, callback: () => void) {
    this.storage.run(store, callback);
  }

  static get(): RequestStore | undefined {
    return this.storage.getStore();
  }

  static setUserId(userId: number) {
    const store = this.storage.getStore();
    if (store) {
      store.userId = userId;
    }
  }
}
