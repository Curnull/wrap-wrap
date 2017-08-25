import { listReducer, IListReducerState, listInitialState, setItems, addItem, deleteItem  } from '../redux/index';
import { createWrapper, Wrapper } from './index';

export function list<T>(items?: T[]) {
  return createWrapper()
    .withStore(() => ({
      reducer: listReducer,
      initialState: items ? { items } : listInitialState,
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

      const isSelected = (item: T) => getState().items.indexOf(item) !== -1;

      const toggleItem = (item: T) => (isSelected(item) ? remove(item) : add(item));

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
        isSelected,
        toggleItem,
        setProp,
        setItem,
      };
  });
}
