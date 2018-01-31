import { Wrapper } from '../Wrapper';
import {object} from './object';

export interface IListState<T> {
  items: T[];
}
export interface IListWrapperMethods<T> {
  set: (items: T[]) => void;
  setItem: (index: number, item: T) => void;
  add: (items: T[] | T) => void;
  remove: (items: T[] | T) => void;
  includes: (item: T) => boolean;
  toggleItem: (item: T) => void;
  setProp: <K extends keyof T>(index: number, field: K, value: T[K]) => void;
}

export type ListWrapper<T> = Wrapper<IListState<T>, IListWrapperMethods<T>>;

export function list<T>(items: T[] = []): ListWrapper<T> {
  const t = object({items});
  return object({items})
    .withMethods(({ getState }, {merge}) => {
      const set = (items: T[]) => merge({items});

      const setItem = (index: number, item: T) => {
        const newItems = [...getState().items];
        newItems[index] = item;
        set(newItems);
      };

      const add = (item: T | T[]) => {
        if (Array.isArray(item)) {
          set([...getState().items, ...item]);
        } else {
          set([...getState().items, item]);
        }
      };

      const remove = (item: T | T[]) => {
        let nextItems;
        if (Array.isArray(item)) {
          nextItems = getState().items.filter((i: T) => !~item.indexOf(i));
        } else {
          nextItems = getState().items.filter((i: T) => i !== item);
        }
        set(nextItems);
      };

      const includes = (item: T) => getState().items.indexOf(item) !== -1;

      const toggleItem = (item: T) => (includes(item) ? remove(item) : add(item));

      const setProp = <K extends keyof T>(index: number, field: K, value: T[K]) => {
        const item = getState().items[index];
        const newItem = {
            ...item as any,
          [field as string]: value,
        };
        const items = [ ...getState().items];
        items[index] = newItem;
        set(items);
      };

      return {
        set,
        add,
        remove,
        includes,
        toggleItem,
        setProp,
        setItem,
      };
  });
}
