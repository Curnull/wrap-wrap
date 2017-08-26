import { getListReducer, IListState, getListInitialState, setItems, addItem, deleteItem  } from '../redux/index';
import { createWrapper, Wrapper } from './index';

export interface IListWrapperMethods<T> {
  set: (items: T[]) => void;
  setItem: (index: number, item: T) => void;
  add: (items: T[] | T) => void;
  remove: (items: T[] | T) => void;
  includes: (item: T) => void;
  toggleItem: (item: T) => void;
  setProp: (index: number, field: string, value: any) => void;
}

export type ListWrapper<T> = Wrapper<IListState<T>, IListWrapperMethods<T>>;

export function list<T>(items?: T[]): ListWrapper<T> {
  return createWrapper()
    .withStore(() => ({
      initialState: items ? { items } : getListInitialState<T>(),
      reducer: getListReducer<T>(),
    }))
    .withMethods(({ dispatch, getState }) => {
      const set = (items: T[]) => dispatch(setItems(items));

      const setItem = (index: number, item: T) => {
        const newItems = [...getState().items];
        newItems[index] = item;
        set(newItems);
      };

      const add = (item: T | T[]) => {
        if (Array.isArray(item)) {
          set([...getState().items, ...item]);
        } else {
          dispatch(addItem(item));
        }
      };

      const remove = (item: T | T[]) => {
        if (Array.isArray(item)) {
          const items = getState().items.filter((i: T) => !~item.indexOf(i));
          set(items);
        } else {
          dispatch(deleteItem(item));
        }
      };

      const includes = (item: T) => getState().items.indexOf(item) !== -1;

      const toggleItem = (item: T) => (includes(item) ? remove(item) : add(item));

      const setProp = <K extends keyof T>(index: number, field: K, value: T[K]) => {
        const item = getState().items[index];
        const newItem = {
            ...item,
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
