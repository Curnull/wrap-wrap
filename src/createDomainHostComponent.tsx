import * as React from 'react';
import {shape, func} from 'prop-types';
import * as hoistNonReactStatic from 'hoist-non-react-statics';
import * as actions from './redux/dynamicStore/dynamicStoreActions';
import {getStateByName, Wrapper, IAction, IDynamicStoreItem, dynamicStoreName} from './index';

export interface ICreateDomainHostComponentParams<TProps> {
  wrappers: Array<Wrapper<any, any, any>>;
  ComponentToWrap: React.ComponentClass<TProps>;
  subscribe?: (props: any) => Array<() => void>;
}

export function createDomainHostComponent<TProps, TExtendedProps = {}>({
                                            wrappers,
                                            ComponentToWrap,
                                            subscribe = () => [],
                                          }: ICreateDomainHostComponentParams<TProps>): React.ComponentClass<TProps & TExtendedProps> {
  class DomainHostComponent extends React.PureComponent<TProps> {
    public static contextTypes = {
      store: shape({
        subscribe: func.isRequired,
        dispatch: func.isRequired,
        getState: func.isRequired,
      })
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

    public constructor(props: any, context: any) {
      super(props, context);
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
      wrappers.forEach((wrapper) => {
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
      wrappers.forEach((wrapperInfo) => {
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
      wrappers.forEach((wrapper) => wrapper.onChangeStore());
      moveStates();
      this.unsubscriptions = [...this.unsubscriptions, ...subscribe(this.props)];
    }

    public componentWillUnmount() {
      this.unsubscriptions.forEach((u) => u && u());
      wrappers.forEach((w) => w.unmount());
      if (this.storesToDelete.length) {
        this.dispatch(actions.deleteStores(this.storesToDelete));
      }
    }

    public render() {
      return <ComponentToWrap {...this.props} />;
    }
  }

  return (hoistNonReactStatic as any)(DomainHostComponent, ComponentToWrap) as React.ComponentClass<TProps & TExtendedProps>;
}
