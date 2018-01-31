import {NAME_SEPARATOR} from './index';
import {Wrapper} from './Wrapper';
import {isWrapper, wrapperStructureToArray, forEachWrapper, NameOrGetter, WrappersStructureOrGetter, replaceAll} from './utils';
import {getStorage, IStoreInfo} from './storage';

export interface IDomainHost<TDomain>{
    domain: TDomain;
    name: string;
    mount: () => TDomain;
    unmount: () => void;
    getIsMounted: () => boolean;
}

export type OnMountCallback<TDomain> = (domain: TDomain) => (Array<() => void> | void);

export function domainHost<TDomain>(name: string, domain: TDomain, onMount: OnMountCallback<TDomain> = () => {}): IDomainHost<TDomain> {
    let isMounted = false;
    let unsubscriptions: Array<() => void> = [];
    let storesToDelete: string[] = [];
    let wrappers: Array<Wrapper<any, any, any>>;
    return {
        domain,
        name,
        mount: () => {
            if (isMounted) {
                throw new Error(`Enable to mount ${name} domain, it's already mounted!`);
            }
            wrappers = [];
            const storage = getStorage();
            forEachWrapper(domain as any, (wrapper, context) => {
                if (wrapper.isMounted) {
                    return;
                }
                const wrapperName = replaceAll(`${name}.${context.path}`, '.', NAME_SEPARATOR);
                wrappers.push(wrapper.withName(wrapperName));
            });

            const storesToAdd: IStoreInfo[] = [];

            let prevState: object;
            let currentState: object;
            const moveStates = () => {
                prevState = currentState;
                currentState = storage.getState();
            };
            moveStates();
            let activeUpdate = 0;
            storesToDelete = [];
            wrappers.forEach((wrapper) => {
                const storeName = wrapper.name;
                if (!storeName) {
                    throw new Error('Unable to use wrapper without name!');
                }
                if (storage.isStoreExists(storeName)) {
                    return;
                }
                if (!wrapper.isPermanent) {
                    storesToDelete.push(storeName);
                }
                const initialState = wrapper.getInitialState();
                const storeToAdd: IStoreInfo = {
                    initialState,
                    name: storeName,
                };
                storesToAdd.push(storeToAdd);
            });

            if (storesToAdd.length) {
                storage.addStores(storesToAdd);
            }
            moveStates();
            wrappers.forEach((wrapper) => {
                wrapper.mount({
                    getState: () => storage.getStateByName(wrapper.name),
                    getPrevState: () => storage.getStateByName(wrapper.name, prevState),
                    setState: (state) => {
                        try {
                            activeUpdate ++;
                            storage.setStateByName(wrapper.name, state);
                        } finally {
                            activeUpdate --;
                        }
                        if (activeUpdate === 0) {
                            moveStates();
                        }
                        wrapper.onChangeStore();
                    }
                });
            });
            wrappers.forEach((wrapper) => wrapper.onChangeStore());
            moveStates();
            unsubscriptions = [...(onMount(domain) || [])];
            isMounted = true;
            return domain;
        },
        unmount: () => {
            if (!isMounted) {
                throw new Error(`Enable to unmount ${name} domain, it's already unmounted!`);
            }
            unsubscriptions.forEach((u) => u && u());
            wrappers.forEach((w) => w.unmount());
            if (storesToDelete.length) {
                getStorage().removeStores(storesToDelete);
            }
        },
        getIsMounted: () => isMounted
    };
}
