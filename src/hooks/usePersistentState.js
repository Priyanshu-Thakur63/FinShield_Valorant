import { useEffect, useState } from 'react';

export default function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      return storedValue === null ? initialValue : JSON.parse(storedValue);
    } catch (error) {
      console.error(`Unable to load saved workspace data for "${key}".`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Unable to save workspace data for "${key}".`, error);
    }
  }, [key, value]);

  return [value, setValue];
}
