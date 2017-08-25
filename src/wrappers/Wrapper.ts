import trigger from '../trigger';
import {IDynamicStoreItem, IAction} from '../index';

export type WrapperSubscription<T> = (state: T) => void;
export interface IMethodsGetterContext<TReduxState> {
  getState: () => TReduxState;
  dispatch: (action: IAction<any>) => void;
}
export type MethodsGetter<TPrev, TNext, TReduxState> = (context: IMethodsGetterContext<TReduxState>, prev?: TPrev) => TNext;
export type StateMapper<TPrev, TNext> = (nextUnmappedState: TPrev, prevUnmappedState: TPrev | undefined , prevState: TNext | undefined ) => TNext;
export type StoreGetter<T> = () => Pick<IDynamicStoreItem<T>, 'reducer' | 'initialState'>;

export interface IWrapperParams<TState, TMethods, TReduxState> {
  name: string;
  methodsGetter: MethodsGetter<any, TMethods, TReduxState>;
  storeGetter?: StoreGetter<any>;
  isPermanent: boolean;
  stateMapper: StateMapper<any, TState>;
}

export interface IMountWrapperParams {
  getState: () => any;
  dispatch: (action: IAction<any>) => any;
  props: any;
}

const fakeSubsctiption = () => {};
export class Wrapper<TState, TMethods, TReduxState> {

  public name: string;
  public get state(): TState {
    this.shouldBeMounted();
    trigger(this);
    return this.mappedState;
  }
  public get methods(): TMethods {
    this.shouldBeMounted();
    return this.myMethods!;
  }
  public get isMounted() {
    return !!this.getState;
  }

  public isPermanent = false;

  private subscriptions: Array<WrapperSubscription<TState>> = [];
  private stateMapper: StateMapper<any, TState>;
  private mappedState: TState;
  private unmappedState: any;
  private prevUnmappedState: any;
  private prevMappedState: TState;
  private triggeringSubs = false;
  private myMethods?: TMethods;
  private getState?: () => TReduxState;
  private methodsGetter: MethodsGetter<any, TMethods, TReduxState>;
  private storeGetter?: StoreGetter<any>;
  private dispatch?: (action: IAction<any>) => void;

  public constructor({
                name,
                methodsGetter,
                storeGetter,
                isPermanent,
                stateMapper = (s) => s,
  }: IWrapperParams<TState, TMethods, TReduxState>) {
    this.isPermanent = isPermanent;
    this.name = name;
    this.methodsGetter = methodsGetter;
    this.storeGetter = storeGetter;
    this.stateMapper = stateMapper;
  }

  public asPermanent = () => {
    this.shouldBeUnmounted();
    return this.next({ isPermanent: true });
  }
  public asNotPermanent = () => {
    this.shouldBeUnmounted();
    return this.next({ isPermanent: false });
  }
  public withName = (name: string) => {
    this.shouldBeUnmounted();
    this.name = name;
    return this;
  }
  public withMethods = <TNextMethods>(methodsGetter: MethodsGetter<TMethods, TNextMethods, TReduxState>) => {
    this.shouldBeUnmounted();
    const nextMethodsGetter: MethodsGetter<TMethods, TNextMethods, TReduxState> = (context) =>
      methodsGetter(context, this.methodsGetter(context));
    return this.next<TState, TNextMethods, TReduxState>({ methodsGetter: nextMethodsGetter });
  }
  public withState = <TNextState>(stateMapper: StateMapper<TState, TNextState>) => {
    this.shouldBeUnmounted();
    let prevMappedState: TNextState | undefined;
    const nextStateMapper = (state: TState) =>
      prevMappedState = stateMapper(this.stateMapper(state, this.prevUnmappedState, this.mappedState), this.mappedState, prevMappedState);
    return this.next<TNextState, TMethods, TReduxState>({ stateMapper: nextStateMapper});
  }
  public withStore = <TReduxState>(storeGetter: StoreGetter<TReduxState>) => {
    this.shouldBeUnmounted();
    return this.next<TReduxState, TMethods, TReduxState>({ storeGetter });
  }
  public getStore = (context: { getProps: () => any }) => {
    return this.storeGetter ? this.storeGetter() : undefined;
  }
  public onChangeStore = () => {
    this.shouldBeMounted();
    this.recalculateState(this.getState!());
    if (this.isChanged()) {
      this.triggeringSubs = true;
      try{
        this.subscriptions.forEach((s) => s(this.mappedState));
      }
      catch (e) {
        console.error(`Error while triggering subscriptions in ${this.name}: ${e}`);
      }
      finally {
        this.triggeringSubs = false;
        this.subscriptions = this.subscriptions.filter((s) => s !== fakeSubsctiption);
      }
    }
  }

  public isChanged = (selector?: (s: TState) => boolean) => {
    trigger(this);
    const changed = this.unmappedState !== this.prevUnmappedState;
    if (!changed || !selector) {
      return changed;
    }
    return selector(this.mappedState) !== selector(this.prevMappedState || {});
  }

  public subscribe = (subscription: WrapperSubscription<TState>) => {
    this.subscriptions.push(subscription);
    return () => {
      const index = this.subscriptions.indexOf(subscription);
      if (this.triggeringSubs) {
        this.subscriptions[index] = fakeSubsctiption;
      } else {
        if (index > -1) {
          this.subscriptions.splice(index, 1);
        }
      }
    };
  }

  public mount({ getState, dispatch, props }: IMountWrapperParams) {
    this.getState = getState;
    this.dispatch = dispatch;
    this.myMethods = this.methodsGetter({
      getState: () => {
        trigger(this);
        return this.unmappedState;
      }, dispatch
    });
    this.initState();
  }

  public unmount() {
    this.getState = undefined;
    this.dispatch = undefined;
    this.myMethods = undefined;
  }

  private initState = () => {
    this.shouldBeMounted();
    this.recalculateState({ ...this.getState!() as any});
  }

  private recalculateState = (nextState: TReduxState) => {
    this.prevUnmappedState = this.unmappedState;
    this.unmappedState = nextState;
    this.prevMappedState = this.mappedState;
    if (this.isChanged()) {
      this.mappedState = this.stateMapper(nextState, this.prevUnmappedState, this.mappedState);
    }
  }

  private shouldBeMounted = () => {
    if (!this.isMounted) {
      throw new Error('Wrapper should be mounted!');
    }
  }

  private shouldBeUnmounted = () => {
    if (this.isMounted) {
      throw new Error('Wrapper should be unmounted!');
    }
  }

  private next<TNextState, TNextMethods, TNextReduxState>({
                name = this.name,
                methodsGetter = this.methodsGetter,
                storeGetter = this.storeGetter,
                isPermanent = this.isPermanent,
                stateMapper = this.stateMapper,
  }: Partial<IWrapperParams<TNextState, TNextMethods, TReduxState>>): Wrapper<TNextState, TNextMethods, TNextReduxState> {
    return new Wrapper<TNextState, TNextMethods, TNextReduxState>({ name, methodsGetter, storeGetter, isPermanent, stateMapper } as any);
  }
}
