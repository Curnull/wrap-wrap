import * as React from 'react';
import * as hoistNonReactStatic from 'hoist-non-react-statics';
import * as trigger from './trigger';
import {or, and, WrapChainMapper, ChangePropsHandler} from './index';

export interface IWrapComponentParams<TProps> {
  ComponentToWrap: React.ComponentClass<TProps>;
  mappers: Array<WrapChainMapper<any, any, any>>;
  extenders: Array<(c: React.ComponentClass) => React.ComponentClass>;
  internalPropsNames: string[];
  changePropsCallback: ChangePropsHandler<any>;
}

export interface IWrappedComponentState {
  coin: boolean;
}

export function wrapComponent<TProps extends {[pn: string]: any }, TWrappedComponentProps>({
                                ComponentToWrap,
                                mappers,
                                extenders,
                                internalPropsNames = [],
                                changePropsCallback = () => {},
                              }: IWrapComponentParams<TWrappedComponentProps>): React.ComponentClass<TProps> {
  class WrappedComponent extends React.PureComponent<TProps, IWrappedComponentState> {
    public static WrappedComponent = ComponentToWrap;
    public static displayName = `wrappedComponent(${ComponentToWrap.displayName || ComponentToWrap.name})`;
    private unsubscriptions: Array<() => void> = [];
    private updatesCount = 0;
    private updating = false;
    private internalProps: any;

    constructor(props: TProps, context: any) {
      super(props, context);
      this.state = { coin: true };
    }

    public componentWillMount() {
      mappers.forEach(this.subscribeToWrappers);
      changePropsCallback(this.props, {}, true);
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

    private subscribeToWrappers = (mapper: WrapChainMapper<any, any, any>) => {
      try {
        trigger.start();
        this.calculateInternalProps(mapper);
        const wrappers = trigger.getTriggered();
        wrappers.forEach((wrapper) => {
          const unsubscription = wrapper.subscribe(() => {
            this.calculateInternalProps(mapper);
            this.updatesCount ++;
            this.update();
          });
          this.unsubscriptions.push(unsubscription);
        });
      } catch (e) {
        trigger.stop();
        throw e;
      }
      trigger.stop();
    }

    private calculateInternalProps = (mapper: WrapChainMapper<any, any, any>) => {
      const context = {
        getProps: () => this.props,
        or,
        and,
      };
      this.internalProps = { ...this.internalProps, ...mapper(context, this.internalProps || {}) };
    }
  }
  const resultComponent =  (hoistNonReactStatic as any)(WrappedComponent, ComponentToWrap);
  return extenders.reduce((result, extender) => extender(result), resultComponent as React.ComponentClass<any>);
}
