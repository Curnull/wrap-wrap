import {IStorage, IStoreInfo, getStateByName} from '../storage';
import {addStores, deleteStores, setDynamicStoreState} from './dynamicStoreActions';

export class ReduxStorage implements IStorage {
    public constructor(getState: () => object, dispatch: (action: any) => void) {
        this.getState = getState;
        this.dispatch = dispatch;
    }

    public getStateByName = (name: string, storage = this.getState()) => getStateByName(name, storage);
    public addStores = (storesInfo: IStoreInfo[]) => this.dispatch(addStores(storesInfo));
    public removeStores = (names: string[]) => this.dispatch(deleteStores(names));
    public setStateByName = (name: string, state: object) =>  this.dispatch(setDynamicStoreState(name, state));
    public isStoreExists = (name: string) => this.getStateByName(name) !== undefined;
    public getState: () => object = () => { throw new Error('getState is not defined!'); };

    private dispatch: (action: any) => void = () => { throw new Error('dispatch is not defined!'); };
}
