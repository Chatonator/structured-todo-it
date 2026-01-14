import { useState, useCallback, useMemo } from 'react';
import { ViewState } from '@/components/layout/view';

export interface UseViewStateOptions<T> {
  initialData?: T;
  initialState?: ViewState;
}

export interface UseViewStateReturn<T> {
  data: T | undefined;
  state: ViewState;
  error: Error | null;
  
  // State setters
  setData: (data: T) => void;
  setLoading: () => void;
  setSuccess: (data?: T) => void;
  setError: (error: Error) => void;
  setEmpty: () => void;
  reset: () => void;
  
  // Computed booleans
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  isSuccess: boolean;
}

export function useViewState<T = any>(
  options: UseViewStateOptions<T> = {}
): UseViewStateReturn<T> {
  const { initialData, initialState = 'idle' } = options;
  
  const [data, setDataInternal] = useState<T | undefined>(initialData);
  const [state, setState] = useState<ViewState>(initialState);
  const [error, setErrorInternal] = useState<Error | null>(null);

  const setData = useCallback((newData: T) => {
    setDataInternal(newData);
    setState('success');
    setErrorInternal(null);
  }, []);

  const setLoading = useCallback(() => {
    setState('loading');
    setErrorInternal(null);
  }, []);

  const setSuccess = useCallback((newData?: T) => {
    if (newData !== undefined) {
      setDataInternal(newData);
    }
    setState('success');
    setErrorInternal(null);
  }, []);

  const setError = useCallback((err: Error) => {
    setState('error');
    setErrorInternal(err);
  }, []);

  const setEmpty = useCallback(() => {
    setState('empty');
    setErrorInternal(null);
  }, []);

  const reset = useCallback(() => {
    setDataInternal(initialData);
    setState(initialState);
    setErrorInternal(null);
  }, [initialData, initialState]);

  // Computed booleans
  const computed = useMemo(() => ({
    isLoading: state === 'loading',
    isError: state === 'error',
    isEmpty: state === 'empty',
    isSuccess: state === 'success',
  }), [state]);

  return {
    data,
    state,
    error,
    setData,
    setLoading,
    setSuccess,
    setError,
    setEmpty,
    reset,
    ...computed,
  };
}

export default useViewState;
