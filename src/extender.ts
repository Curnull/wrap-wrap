import * as React from 'react';

export interface IExtender<T, TProps, TCleanedProps extends keyof T = keyof T, TExternal = {}> {
    extender: (component: React.ComponentClass<TProps>) => React.ComponentClass<TProps & TExternal>;
    cleanedProps: TCleanedProps[];
}

export function extender<TExtender, TCleanedProps extends keyof TExtender = keyof TExtender, TProps = any, TExternalProps = {}>(
    extender: (c: React.ComponentClass<TProps>) => React.ComponentClass<TProps & TExternalProps>,
    ...cleanedProps: TCleanedProps[],
): IExtender<TExtender, TProps, TCleanedProps, TExternalProps> {
    return { extender, cleanedProps };
}
