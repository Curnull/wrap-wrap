import * as React from 'react';
import {shape, func} from 'prop-types';
import hoistStatic from 'hoist-non-react-statics';
import * as actions from './redux/dynamicStore/dynamicStoreActions';
import {getStateByName, Wrapper, IAction, IDynamicStoreItem} from './index';

export interface ICreateDomainHostComponentParams {
  wrappers: Array<Wrapper<any, any, any>>;
  ComponentToWrap: React.ComponentClass<any>;
  subscribe: (props: any) => Array<() => void>;
}

export function createDomainHostComponent({
                                            wrappers,
                                            ComponentToWrap,
                                            subscribe = () => [],
                                          }: ICreateDomainHostComponentParams) {
  class DomainHostComponent extends React.PureComponent<any> {
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
    private unsubscriptions: Array<() => void>;

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

      this.getStoreState = () => store.getState().dynamic;
      this.checkIfStoreExists = (name) =>
      name && Object.prototype.hasOwnProperty.call(store.getState().dynamic, name);

      const storesToAdd: Array<IDynamicStoreItem<any>> = [];
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
      wrappers.forEach((wrapperInfo) => {
        wrapperInfo.mount({
          getState: () => getStateByName(wrapperInfo.name, this.getStoreState()),
          props: this.props,
          dispatch: (action) => {
            this.dispatch(action, wrapperInfo.name);
            wrapperInfo.onChangeStore();
          }
        });
      });
      wrappers.forEach((wrapper) => wrapper.onChangeStore());
      this.unsubscriptions = subscribe(this.props);
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

  return hoistStatic(DomainHostComponent, ComponentToWrap);
}
