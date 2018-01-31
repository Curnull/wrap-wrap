import {ReduxStorage} from './ReduxStorage';
import {setStorage} from '../storage';

export function useReduxAsStorage({getState, dispatch}: any, name = 'dynamic') {
    if (!getState || !dispatch) {
        throw new Error('Store have to have getState and dispatch fields!');
    }
    const reduxStorage = new ReduxStorage(() => getState()[name], dispatch);
    setStorage(reduxStorage);
}

export * from './dynamicStoreActions';
export * from './dynamicStoreConstants';
export * from './dynamicStoreReducer';
