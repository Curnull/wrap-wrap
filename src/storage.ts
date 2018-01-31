export interface IStoreInfo {
    initialState: any;
    name: string;
}

export interface IStorage {
    getStateByName: (name: string, storage?: object) => any;
    addStores: (storesInfo: IStoreInfo[]) => void;
    removeStores: (names: string[]) => void;
    setStateByName: (name: string, state: object) => void;
    isStoreExists: (name: string) => boolean;
    getState: () => object;
}

declare var process: {
    env: {
      NODE_ENV: string
    }
  };

declare var window: {
  wrapWrapStorage: IStorage;
};

let __DEV__ = false;
try {
__DEV__ = process.env.NODE_ENV !== 'production';
} catch (e) {}

export const NAME_SEPARATOR = '/';
export function getStateByName(name: string, state: any): any {
  if (!state) {
    return undefined;
  }
  if (!__DEV__) {
    return state[name];
  }
  const index = name.indexOf(NAME_SEPARATOR);
  if (index > -1) {
    const curName = name.substr(0, index);
    return getStateByName(name.substr(index + 1, name.length - index), state[curName]);
  }
  return state[name];
}

export function putByName(value: any, name: string, state: any): void {
  if (!__DEV__) {
    state[name] = value;
    return;
  }
  const index = name.indexOf(NAME_SEPARATOR);
  if (index > -1) {
    const curName = name.substr(0, index);
    state[curName] = {...state[curName]};
    putByName(value, name.substr(index + 1, name.length - index), state[curName]);
    return;
  }
  state[name] = value;
}

export function deleteByName(name: string, state: any): object {
  if (__DEV__) {
    const index = name.indexOf(NAME_SEPARATOR);
    if (index > -1) {
      const curName = name.substr(0, index);
      state[curName] = deleteByName(name.substr(index + 1, name.length - index), state[curName]);
      if (!Object.keys(state[curName]).length) {
        return Object.keys(state).reduce((result, key) => {
          if (key !== curName) {
            result[key] = state[key];
          }
          return result;
        }, {} as any);
      } else {
        return state;
      }
    }
  }
  return Object.keys(state).reduce((result, key) => {
    if (key !== name) {
      result[key] = state[key];
    }
    return result;
  }, {} as any);
}

class Storage implements IStorage {
    private storage = {};

    public getStateByName = (name: string, storage = this.storage) => getStateByName(name, storage);
    public addStores = (storesInfo: IStoreInfo[]) => {
        this.storage = { ...this.storage };
        storesInfo.map((info) => {
            putByName(info.initialState, info.name, this.storage);
        });
    }
    public removeStores = (names: string[]) => {
        names.forEach((name) => {
            this.storage = deleteByName(name, this.storage);
        });
    }

    public setStateByName = (name: string, state: object) => {
        this.storage = { ...this.storage };
        putByName(state, name, this.storage);
    }

    public isStoreExists = (name: string) => this.getStateByName(name) !== undefined;
    public getState = () => this.storage;
}

let storage: IStorage;
let storageUsed = false;

export function getStorage(): IStorage {
    storageUsed = true;
    return storage;
}

export function setStorage(nextStorage: IStorage) {
    if (storageUsed) {
        throw new Error(`Enable to set storage, current storage already used somethere.`);
    }
    window.wrapWrapStorage = nextStorage;
    storage = nextStorage;
}

setStorage(new Storage());
