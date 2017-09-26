import * as React from 'react';
import {shape, func, object} from 'prop-types';
import * as hoistNonReactStatic from 'hoist-non-react-statics';
import * as actions from './redux/dynamicStore/dynamicStoreActions';
import {getStateByName, Wrapper, IAction, IDynamicStoreItem, dynamicStoreName, NAME_SEPARATOR} from './index';
import {isWrapper, wrapperStructureToArray, forEachWrapper, NameOrGetter, WrappersStructureOrGetter} from './utils';

export interface ICreateDomainHostComponentParams<TProps> {
  wrappersOrGetter: any;
  ComponentToWrap: React.ComponentType<TProps>;
  subscribe?: (props: any) => Array<() => void>;
  nameOrGetter: NameOrGetter<TProps>;
}

export function createDomainHostComponent<TProps, TExtendedProps = {}>({
                                            wrappersOrGetter,
                                            ComponentToWrap,
                                            subscribe = () => [],
                                            nameOrGetter,
                                          }: ICreateDomainHostComponentParams<TProps>): React.ComponentType<TProps & TExtendedProps> {

  class DomainHostComponent extends React.PureComponent<TProps> {
    public static contextTypes = {
      store: shape({
        subscribe: func.isRequired,
        dispatch: func.isRequired,
        getState: func.isRequired,
      }),
      domains: object,
    };
    public static childContextTypes = {
      domains: object,
    };
    public static WrappedComponent = ComponentToWrap;
    public static displayName = `domainHost(${ComponentToWrap.displayName || ComponentToWrap.name})`;

    private dispatch: (action: IAction<any>, name?: string) => void;
    private getStoreState: () => any;
    private checkIfStoreExists: (name: string) => boolean;
    private storesToDelete: string[];
    private unsubscriptions: Array<() => void> = [];
    private prevState: any;
    private currentState: any;
    private domain: any;
    private name: string;
    private wrappers: Array<Wrapper<any, any>>;

    public constructor(props: any, context: any) {
      super(props, context);
      this.context = context;
      this.domain = wrappersOrGetter;
      if (typeof wrappersOrGetter === 'function') {
        this.domain = wrappersOrGetter(props);
      }

      if (typeof nameOrGetter === 'function') {
        this.name = nameOrGetter(props);
      } else {
        this.name = nameOrGetter;
      }
      this.wrappers = [];
      forEachWrapper(this.domain, (wrapper, context) => {
        this.wrappers.push(wrapper.withName(`${this.name}.${context.path}`.replace('.', NAME_SEPARATOR)));
      });
      const { store } = context;
      if (!store) {
        throw new Error('DomainHostComponent: Unable to find store instance in context!');
      }
      const { dispatch } = store;
      if (!dispatch) {
        throw new Error('DomainHostComponent: Unable to find dispatch func in context!');
      }

      this.dispatch = (action, name) => {
        const actionWrapper = name ? actions.sendActionToDynamicStore(name, action) : null;
        dispatch(actionWrapper || action);
      };

      this.getStoreState = () => store.getState()[dynamicStoreName];
      this.checkIfStoreExists = (name) =>
      name && Object.prototype.hasOwnProperty.call(store.getState()[dynamicStoreName], name);

      const storesToAdd: Array<IDynamicStoreItem<any>> = [];

      const moveStates = () => {
        this.prevState = this.currentState;
        this.currentState = this.getStoreState();
      };
      moveStates();
      let activeAction = 0;
      this.storesToDelete = [];
      this.wrappers.forEach((wrapper) => {
        const storeName = wrapper.name;
        if (this.checkIfStoreExists(storeName)) {
          return;
        }

        if (!storeName) {
          throw new Error('Unable to use wrapper without name!');
        }
        if (!wrapper.isPermanent) {
          this.storesToDelete.push(storeName);
        }
        const wrapperStore = wrapper.getStore({
          getProps: () => this.props,
        });
        const storeToAdd = {
          ...wrapperStore!,
          name: storeName,
        };
        storesToAdd.push(storeToAdd);
      });

      if (storesToAdd.length) {
        this.dispatch(actions.addStores(storesToAdd));
      }
      moveStates();
      this.wrappers.forEach((wrapperInfo) => {
        wrapperInfo.mount({
          getState: () => getStateByName(wrapperInfo.name, this.currentState),
          getPrevState: () => getStateByName(wrapperInfo.name, this.prevState),
          props: this.props,
          dispatch: (action) => {
            try {
              activeAction ++;
              this.dispatch(action, wrapperInfo.name);
            } finally {
              activeAction --;
            }
            if (activeAction === 0) {
              moveStates();
            }
            wrapperInfo.onChangeStore();
          }
        });
      });
      this.wrappers.forEach((wrapper) => wrapper.onChangeStore());
      moveStates();
      this.unsubscriptions = [...this.unsubscriptions, ...subscribe(this.props)];
    }

    public componentWillUnmount() {
      this.unsubscriptions.forEach((u) => u && u());
      this.wrappers.forEach((w) => w.unmount());
      if (this.storesToDelete.length) {
        this.dispatch(actions.deleteStores(this.storesToDelete));
      }
    }

    public render() {
      return <ComponentToWrap {...this.props} />;
    }
    private getChildContext() {
      const domains = this.context.domains || {};
      return { domains: { ...domains, [this.name]: this.domain}};
    }
  }

  return (hoistNonReactStatic as any)(DomainHostComponent, ComponentToWrap) as React.ComponentType<TProps & TExtendedProps>;
}
