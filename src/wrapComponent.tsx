import * as React from 'react';
import * as hoistNonReactStatic from 'hoist-non-react-statics';
import * as trigger from './trigger';
import {or, and, WrapChainMapper, ChangePropsHandler} from './index';

export interface IWrapComponentParams<TProps> {
  ComponentToWrap: React.ComponentType<TProps>;
  mappers: Array<WrapChainMapper<any, any, any>>;
  extenders: Array<(c: React.ComponentType) => React.ComponentType>;
  internalPropsNames: string[];
  changePropsCallback: ChangePropsHandler<any>;
}

export interface IWrappedComponentState {
  coin: boolean;
}

const isClassComponent = (component: any) => !!component.prototype.isReactComponent;

const getDifferentTypesOfValueError = (key: string, displayName: string) => `Different types of props by key '${key}' specified in .withProps for component '${displayName}'.
        Please check your wrap chain for component ${displayName} and make sure that all props with key '${key}' have only functions or only non-function values.
        `;

export function wrapComponent<TProps extends {[pn: string]: any }, TWrappedComponentProps>({
                                ComponentToWrap,
                                mappers,
                                extenders,
                                internalPropsNames = [],
                                changePropsCallback = () => {},
                              }: IWrapComponentParams<TWrappedComponentProps>): React.ComponentType<TProps> {
  class WrappedComponent extends React.PureComponent<TProps, IWrappedComponentState> {
    public static WrappedComponent = ComponentToWrap;
    public static displayName = `wrappedComponent(${ComponentToWrap.displayName || ComponentToWrap.name})`;
    private unsubscriptions: Array<() => void> = [];
    private updatesCount = 0;
    private updating = false;
    private internalProps: any;
    private functionsStore: Array<{[key: string]: (...params: any[]) => any}> = [];

    constructor(props: TProps, context: any) {
      super(props, context);
      this.state = { coin: true };
    }

    public componentWillMount() {
      changePropsCallback(this.props, {}, true);
      mappers.forEach(this.subscribeToWrappers);
    }

    public componentWillReceiveProps(nextProps: TProps) {
      changePropsCallback(nextProps, this.props, false);
    }

    public componentWillUnmount() {
      this.unsubscriptions.forEach((u) => u());
    }

    public render() {
      const cleanProps: any = {};
      for (const key in this.props) {
        if (!internalPropsNames.includes(key)) {
          cleanProps[key] = this.props[key];
        }
      }
      const unitedProps = { ...cleanProps, ...this.internalProps } as TWrappedComponentProps;
      return (
        <ComponentToWrap {...unitedProps as any} />
      );
    }

    private update = () => {
      if (this.updating || this.updatesCount === 0) {
        return;
      }
      this.updating = true;
      this.updatesCount = 0;
      this.setState({ coin: !this.state.coin }, () => {
        this.updating = false;
        this.update();
      });
    }

    private subscribeToWrappers = (mapper: WrapChainMapper<any, any, any>, index: number) => {
      try {
        trigger.start();
        this.calculateInternalProps(mapper, index);
        const wrappers = trigger.getTriggered();
        wrappers.forEach((wrapper) => {
          const unsubscription = wrapper.subscribe(() => {
            this.calculateInternalProps(mapper, index);
            this.updatesCount ++;
            this.update();
          });
          this.unsubscriptions.push(unsubscription);
        });
      } finally {
        trigger.stop();
      }
    }

    private calculateInternalProps = (mapper: WrapChainMapper<any, any, any>, index: number) => {
      const context = {
        getProps: () => this.props,
        or,
        and,
      };
      const newProps = mapper(context, this.internalProps || {});

      this.internalProps = { ...this.internalProps};
      Object.keys(newProps).forEach((key) => {
        let val = newProps[key];
        if (typeof val === 'function' && !isClassComponent(val)) {
          this.functionsStore[index] = this.functionsStore[index] || {};
          this.functionsStore[index][key] = val;
          if (!this.internalProps[key]) {
            val = (...params: any[]) => this.triggerAllFunctionsByKey(key, ...params);
          } else {
            if (typeof this.internalProps[key] !== 'function') {
              throw new Error(getDifferentTypesOfValueError(key, WrappedComponent.displayName));
            }
            val = this.internalProps[key];
          }
        } else if (typeof this.internalProps[key] === 'function' && !isClassComponent(this.internalProps[key])) {
            throw new Error(getDifferentTypesOfValueError(key, WrappedComponent.displayName));
        }
        this.internalProps[key] = val;
      });
    }

    private triggerAllFunctionsByKey = (key: string, ...params: any[]) => {
      let lastNotUndefinedResult;
      let countOfNotUndefinedResults = 0;
      this.functionsStore.forEach((funcs) => {
        if (funcs && funcs[key]) {
          const r = funcs[key](...params);
          if (r !== undefined) {
            countOfNotUndefinedResults ++;
            lastNotUndefinedResult = r;
          }
        }
      });
      if (countOfNotUndefinedResults > 1) {
        throw new Error(`You specified two or more functions with the same key ${key} in several .withProps for the same component and several functions returned value.
         In order to fix this error please make sure that all function with the same key return undefined, or you have only one function which return value.
        `);
      }
      return lastNotUndefinedResult;
    }
  }

  const resultComponent =  (hoistNonReactStatic as any)(WrappedComponent, ComponentToWrap);
  return extenders.reduce((result, extender) => extender(result), resultComponent as React.ComponentType<any>);
}
