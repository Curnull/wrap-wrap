import { trigger } from './trigger';

export type WrapperSubscription<T> = (state: T) => void;
export interface IMethodsGetterContext<TStorageState> {
  getState: () => TStorageState;
  setState: (state: any) => void;
}
export type MethodsGetter<TPrev, TNext, TStorageState> = (context: IMethodsGetterContext<TStorageState>, prev: TPrev) => TNext;
export type StateMapper<TPrev, TNext> = (nextState: TPrev) => TNext;
export type InitialStateGetter<TCurState, TAddon> = (initialState: TCurState) => TAddon;

export interface IWrapperParams<TState, TMethods, TStorageState> {
  name: string;
  methodsGetter?: (context: IMethodsGetterContext<TStorageState>) => TMethods;
  initialStateGetter?: InitialStateGetter<any, TStorageState>;
  isPermanent: boolean;
  stateMapper?: StateMapper<any, TState>;
}

export interface IMountWrapperParams<TState> {
  getState: () => TState;
  getPrevState: () => TState;
  setState: (state: any) => void;
}

const fakeSubsctiption = () => {};
export class Wrapper<TState, TMethods, TStorageState = TState> {

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
  private triggeringSubs = false;
  private myMethods?: TMethods;
  private getState?: () => TStorageState;
  private getPrevState?: () => TStorageState;
  private methodsGetter: (context: IMethodsGetterContext<TStorageState>) => TMethods;
  private initialStateGetter?: InitialStateGetter<any, TStorageState>;
  private setState?: (state: any) => void;

  public constructor({
                name,
                methodsGetter = () => ({} as TMethods),
                initialStateGetter = (initialState) => initialState,
                isPermanent,
                stateMapper = (s) => s,
  }: IWrapperParams<TState, TMethods, TStorageState>) {
    this.isPermanent = isPermanent;
    this.name = name;
    this.methodsGetter = methodsGetter;
    this.initialStateGetter = initialStateGetter;
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
  public withMethods = <TNextMethods>(methodsGetter: MethodsGetter<TMethods, TNextMethods, TStorageState>) => {
    this.shouldBeUnmounted();
    const nextMethodsGetter = (context: IMethodsGetterContext<TStorageState>) => methodsGetter(context, this.methodsGetter(context));
    return this.next<TState, TNextMethods, TStorageState>({ methodsGetter: nextMethodsGetter });
  }
  public withState = <TNextState>(stateMapper: StateMapper<TState, TNextState>) => {
    this.shouldBeUnmounted();
    let prevResult: TNextState | undefined;
    const nextStateMapper = (nextState: TState) =>
      prevResult = stateMapper(this.stateMapper(nextState));
    return this.next<TNextState, TMethods, TStorageState>({ stateMapper: nextStateMapper});
  }
  public withInitialState = <TAddon>(initialStateGetter: InitialStateGetter<TStorageState, TAddon>) => {
    this.shouldBeUnmounted();
    const nextInitialStateGetter = (initialState: TStorageState) => ({ ...initialStateGetter(this.initialStateGetter!(initialState)) as any, ...initialState as any});
    return this.next<TStorageState & TAddon, TMethods, TStorageState & TAddon>({ initialStateGetter: nextInitialStateGetter});
  }
  public getInitialState = () => {
    return this.initialStateGetter!({});
  }
  public onChangeStore = () => {
    this.shouldBeMounted();
    this.recalculateState(this.getState!());
    if (this.isChanged()) {
      this.triggeringSubs = true;
      try{
        this.subscriptions.forEach((s) => s(this.mappedState));
      }
      finally {
        this.triggeringSubs = false;
        this.subscriptions = this.subscriptions.filter((s) => s !== fakeSubsctiption);
      }
    }
  }

  public isChanged = (selector?: (s: TState) => any) => {
    trigger(this);
    const changed = this.getState!() !== this.getPrevState!();
    if (!changed || !selector) {
      return changed;
    }
    const prevState = this.getPrevState!();
    return selector(this.mappedState) !== selector(prevState ? this.stateMapper(prevState) : {} as TState);
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

  public mount({ getState, setState, getPrevState }: IMountWrapperParams<TStorageState>) {
    this.getState = getState;
    this.getPrevState = getPrevState;
    this.setState = setState;
    this.myMethods = this.methodsGetter({
      getState: () => {
        trigger(this);
        return this.getState!();
      }, setState
    });
    this.initState();
  }

  public unmount() {
    this.getState = undefined;
    this.getPrevState = undefined;
    this.setState = undefined;
    this.myMethods = undefined;
  }

  private initState = () => {
    this.shouldBeMounted();
    this.recalculateState({ ...this.getState!() as any});
  }

  private recalculateState = (nextState: TStorageState) => {
    if (this.isChanged()) {
      this.mappedState = this.stateMapper(nextState);
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

  private next<TNextState, TNextMethods, TNexTStorageState>({
                name = this.name,
                methodsGetter = this.methodsGetter,
                initialStateGetter = this.initialStateGetter,
                isPermanent = this.isPermanent,
                stateMapper = this.stateMapper,
  }: Partial<IWrapperParams<TNextState, TNextMethods, TStorageState>>): Wrapper<TNextState, TNextMethods, TNexTStorageState> {
    return new Wrapper<TNextState, TNextMethods, TNexTStorageState>({ name, methodsGetter, initialStateGetter, isPermanent, stateMapper } as any);
  }
}
