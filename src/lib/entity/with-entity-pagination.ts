import { computed, Signal } from '@angular/core';
import {
  EmptyFeatureResult,
  patchState,
  SignalStoreFeature,
  signalStoreFeature,
  withComputed,
  withMethods,
  withState
} from '@ngrx/signals';

export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
}

interface PaginationComputedProps {
  hasNext: boolean;
  hasPrevious: boolean;
  totalPages: number;
}

const initialPaginationState: PaginationState = {
  page: 1,
  pageSize: 10,
  totalCount: 0
};

/**
 * Resetea el estado de paginación al estado inicial.
 * @returns {PaginationState} - El estado inicial de paginación.
 */
export function resetPaginationState(): PaginationState {
  return initialPaginationState;
}

/**
 * Agrega funcionalidades de paginación a un Store.
 * @param {[number]} initialPageSize - Tamaño inicial de página (opcional).
 * @returns {SignalStoreFeature} - Características de la tienda con estado, computados y métodos de paginación.
 */
export function withPagination(initialPageSize?: number): SignalStoreFeature<
  EmptyFeatureResult,
  {
    methods: {
      nextPage: () => void;
      previousPage: () => void;
      setPage: (page: number) => void;
      setPageSize: (pageSize: number) => void;
      setTotalCount: (totalCount: number) => void;
    };
    props: Record<'paginationComputed', Signal<PaginationComputedProps>>;
    state: Record<'pagination', PaginationState>;
  }
> {
  return signalStoreFeature(
    withState({
      pagination: initialPageSize ? { ...initialPaginationState, pageSize: initialPageSize } : initialPaginationState
    }),

    withComputed(({ pagination: { page, pageSize, totalCount } }) => ({
      paginationComputed: computed(() => ({
        hasNext: page() < Math.ceil(totalCount() / pageSize()),
        hasPrevious: page() > 1,
        totalPages: Math.ceil(totalCount() / pageSize())
      }))
    })),
    withMethods((store) => ({
      nextPage: () => {
        if (store.pagination.page() < Math.ceil(store.pagination.totalCount() / store.pagination.pageSize())) {
          patchState(store, (state) => ({ pagination: { ...state.pagination, page: store.pagination.page() + 1 } }));
        }
      },
      previousPage: () => {
        if (store.pagination.page() > 1) {
          patchState(store, (state) => ({ pagination: { ...state.pagination, page: store.pagination.page() - 1 } }));
        }
      },
      setPage: (page: number) => {
        patchState(store, (state) => ({ pagination: { ...state.pagination, page } }));
      },
      setPageSize: (pageSize: number) =>
        patchState(store, (state) => ({ pagination: { ...state.pagination, page: 1, pageSize } })), // Reset a pág 1 si cambia el tamaño
      setTotalCount: (totalCount: number) =>
        patchState(store, (state) => ({ pagination: { ...state.pagination, totalCount } }))
    }))
  );
}
