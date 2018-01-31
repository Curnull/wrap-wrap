import * as React from 'react';
import {IExtender} from './extender';
import {Wrapper} from '../Wrapper';
import {wrapComponent} from './wrapComponent';
import {IDomainHost} from '../domainHost';

export type Diff<T extends string, U extends string> = ({ [P in T]: P } & { [P in U]: never } & { [x: string]: never })[T];
export type Omit<T, K extends keyof T> = Pick<T, Diff<keyof T, K>>;

const defaultCallback = () => {
};

const uniq = (arrArg: any[]) => {
  return arrArg.filter((elem, pos, arr) => {
    return arr.indexOf(elem) === pos;
  });
};

export type ChangePropsHandler<T> = (next: T, prev: T, isInit: boolean) => void;
export type WrapChainMapper<T, TProps, TInternalProps> = (
  context: IPropsGetterContext<TProps>,
  prev: TInternalProps) => T;

export interface IPropsGetterContext<TProps> {
  getProps: () => TProps;
  or: (...args: any[]) => boolean;
  and: (...args: any[]) => boolean;
}

export interface IWrapChainParams<TProps> {
  mappers?: Array<WrapChainMapper<any, any, any>>;
  changePropsCallback?: ChangePropsHandler<TProps>;
  extenders?: Array<(c: React.ComponentType<any>) => React.ComponentType<any>>;
  preExtenders?: Array<(c: React.ComponentType<any>) => React.ComponentType<any>>;
  internalPropsNames?: string[];
  domainHostGetter?: (props: any) => IDomainHost<any> | undefined;
}

export class WrapChain<TInternalProps, TExtendedProps, TExternalProps> {
  private mappers: Array<WrapChainMapper<any, any, any>>;
  private changePropsCallback: ChangePropsHandler<TExternalProps & TExtendedProps>;
  private extenders: Array<(c: React.ComponentType<any>) => React.ComponentType<any>>;
  private preExtenders: Array<(c: React.ComponentType<any>) => React.ComponentType<any>>;
  private internalPropsNames: string[];
  private domainHostGetter: (props: TExternalProps & TExtendedProps) => IDomainHost<any> | undefined;

  constructor({
                mappers = [],
                changePropsCallback = defaultCallback,
                extenders = [],
                preExtenders = [],
                internalPropsNames = [],
                domainHostGetter = () => undefined
              }: IWrapChainParams<TExternalProps & TExtendedProps>) {
    this.mappers = mappers;
    this.changePropsCallback = changePropsCallback;
    this.extenders = extenders;
    this.preExtenders = preExtenders;
    this.internalPropsNames = internalPropsNames;
    this.domainHostGetter = domainHostGetter;
  }

  public withProps = <T>(
      mapper: WrapChainMapper<T, TExternalProps & TInternalProps & TExtendedProps, TInternalProps>,
  ): WrapChain<TInternalProps & T, TExtendedProps, TExternalProps> => {
    return this.next({ mappers: [ ...this.mappers, mapper] });
  }

  public join = <TJoinedInternalProps, TJoinedExtendedProps, TJoinedExternalProps>(chain: WrapChain<TJoinedInternalProps, TJoinedExtendedProps, TJoinedExternalProps>):
  WrapChain<
  TJoinedInternalProps & TInternalProps,
  TJoinedExtendedProps & TExtendedProps,
  TJoinedExternalProps & TExternalProps> => {
    return this.onChangeProps(chain.onChangeProps as any).next({
      extenders: uniq([...this.extenders, ...chain.extenders]),
      mappers: [...this.mappers, ...chain.mappers],
      internalPropsNames: [...this.internalPropsNames, ...chain.internalPropsNames],
      preExtenders: [...this.preExtenders, ...chain.preExtenders],
    });
  }

  public withExternalProps = <T, TCleanedProps extends keyof T = keyof T>(...internalPropsNames: TCleanedProps[]) => {
    return this.next<TInternalProps, TExtendedProps, TExternalProps & T>({
      internalPropsNames: [...this.internalPropsNames, ...internalPropsNames],
    });
  }

  public onChangeProps = (nextOnChangeProps: ChangePropsHandler<TExternalProps & TExtendedProps>) => {
    const changePropsCallback = (next: TExternalProps & TExtendedProps, prev: TExternalProps & TExtendedProps, isInit: boolean) => {
      this.changePropsCallback(next, prev, isInit);
      nextOnChangeProps(next, prev, isInit);
    };
    return this.next({ changePropsCallback });
  }

  public extend<TExtenderProps, TProps, TExtenderExternalProps, TCleanedProps extends keyof TExtenderProps>(
    extender: IExtender<TExtenderProps, TProps, TCleanedProps, TExtenderExternalProps>,
  ) {
    if (typeof extender !== 'object' || !extender.extender) {
      throw new Error('WrapChain.extend: Extender should be an object with "extender" field!');
    }
    return this.next<TInternalProps & Omit<TExtenderProps, TCleanedProps>, TExtendedProps & TExtenderProps, TExternalProps & TExtenderExternalProps>({
      extenders: [...this.extenders, extender.extender],
      internalPropsNames: [...this.internalPropsNames, ...extender.cleanedProps as string[]],
    });
  }

  public extendBeforeWrap = (extender: (c: React.ComponentType<any>) => React.ComponentType<any>) => {
    return this.next({ preExtenders: [...this.preExtenders, extender] });
  }

  public withDomainHost = (domainHost: IDomainHost<any> | (() => IDomainHost<any>)) => {
    return this.next({ domainHostGetter: typeof domainHost === 'function' ? domainHost : () => domainHost });
  }

  public component = <TProps extends Partial<TInternalProps>>(component: React.ComponentType<TProps>) => {
    if (!component) {
      throw new Error('component mast be defiend! Check you wrap chains!')
    }
    const preWrapperComponent = this.preExtenders.reduce((result, extender) => extender(result), component);
    return wrapComponent<Omit<TProps, keyof TInternalProps> & TExternalProps, TProps>(
      {
        ComponentToWrap: preWrapperComponent,
        mappers: this.mappers,
        extenders: this.extenders,
        internalPropsNames: this.internalPropsNames,
        changePropsCallback: this.changePropsCallback,
        domainHostGetter: this.domainHostGetter
      });
  }

  private next<TNextInternalProps = TInternalProps, TNextExtendedProps = TExtendedProps, TNextExternalProps = TExternalProps>({
              mappers = this.mappers,
              changePropsCallback = this.changePropsCallback,
              extenders = this.extenders,
              preExtenders = this.preExtenders,
              internalPropsNames = this.internalPropsNames,
              domainHostGetter = this.domainHostGetter
            }): WrapChain<TNextInternalProps, TNextExtendedProps, TNextExternalProps> {
    return new WrapChain({ mappers, changePropsCallback, extenders, preExtenders, internalPropsNames, domainHostGetter }) as any;
  }
}

export const wrap = new WrapChain({});
