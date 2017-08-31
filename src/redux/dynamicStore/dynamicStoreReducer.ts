import * as types from './dynamicStoreConstants';
import {createReducer} from '../createReducer';
import {Reducer, IAction} from '../interfaces';
import {ISendActionToDynamicStoreActionPayload, IDeleteStoreActionPayload, IAddStoreActionPayload} from './dynamicStoreActions';

export interface IDynamicState {
  [storeName: string]: any;
}

interface IReducersStore {
  [reducerName: string]: Reducer<any, any>;
}

declare var process: {
  env: {
    NODE_ENV: string
  }
};

let __DEV__ = false;
try {
  __DEV__ = process.env.NODE_ENV !== 'production';
} catch (e) {}

const reducers: IReducersStore = {};
export const NAME_SEPARATOR = '/';
export function getStateByName(name: string, state: IDynamicState): any {
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

function putByName(value: any, name: string, state: IDynamicState) {
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

function deleteByName(name: string, state: IDynamicState) {
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
        }, {} as IDynamicState);
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
  }, {} as IDynamicState);
}

export let dynamicStoreName = 'dynamic';
export const dynamicStoreInitialState: IDynamicState = {};
export const getDynamicStoreReducer = (storeName = 'dynamic') => {
    dynamicStoreName = storeName;
    return createReducer(dynamicStoreInitialState, {
      [types.SEND_ACTION_TO_DYNAMIC_STORE]: (state: IDynamicState, action: IAction<ISendActionToDynamicStoreActionPayload>) => {
        const name = action.payload.name;
        const subAction = action.payload.action;
        if (reducers[name]) {
          const reducer = reducers[name];
          const curState = getStateByName(name, state);
          const nextState = reducer(curState, subAction);
          const newState = {
            ...state,
          };
          putByName(nextState, name, newState);
          return newState;
        }
        return state;
      },
      [types.ADD_STORES]: (state: IDynamicState, action: IAction<IAddStoreActionPayload>) => {
        const newState = { ...state };

        action.payload.stores.forEach((store) => {
          if (!reducers[store.name]) {
            reducers[store.name] = store.reducer;
            const reducedState = store.reducer(store.initialState, { type: '', payload: undefined });
            putByName(reducedState, store.name, newState);
          }
        });
        return newState;
      },
      [types.DELETE_STORES]: (state: IDynamicState, action: IAction<IDeleteStoreActionPayload>) => {
        let newState = {...state};
        action.payload.names.forEach((name) => {
          delete reducers[name];
          newState = deleteByName(name, newState);
        });
        return newState;
      },
    }
  );
};
