import { containsArray } from 'src/helpers/containsArray';
import { formatDate } from 'src/helpers/formatDate';
import { DateType, FilterType, SingleValueFilterType } from 'src/helpers/types';
import { StoreSlice } from 'src/store';

import {
  createdToDateNow,
  getOnlyValues,
  getOptions,
} from 'src/components/Journal/helpers/filterHelpers';
import { allValueFilter } from 'src/components/Journal/reducer';
import { DateUnionType } from 'src/components/Journal/types';
import { OperatorFiltersQuery } from 'src/components/Statistic/DepartmentsTable/graphql/DepartmentsTable.generated';
import {
  getOperatorOptions,
  initialCurrentStartDate,
} from 'src/components/Statistic/helpers/filterHelpers';
import { OptionUnionType } from 'src/components/Statistic/types/types';

export type OperatorsFilterType = FilterType & { allOptions: OptionUnionType };
export interface DepartmentsTableFilters {
  departmentsFilters: {
    site: Omit<SingleValueFilterType<number>, 'options'>;
    units: FilterType;
    operators: OperatorsFilterType;
    date: DateType;
    isFiltersExist: boolean;
    isNeedDateReset: boolean;
    minDate: DateUnionType;
    setFilters: (
      units: OperatorFiltersQuery['operatorFilters']['units'],
      operators: OperatorFiltersQuery['operatorFilters']['operators'],
      minDate: OperatorFiltersQuery['operatorFilters']['minDate'],
    ) => void;
    setSite: (value: number) => void;
    clearFilters: () => void;
    setDate: (dateFrom: string | Date, dateTo: string | Date) => void;
    setOptions: (val: OptionUnionType, selectorName: 'units' | 'operators') => void;
    changeOperators: () => void;
  };
}

const initialState = {
  site: {
    selectedValue: [],
    valueForDispatch: 0,
    changed: false,
  },
  units: {
    ...allValueFilter,
  },
  operators: {
    ...allValueFilter,
    allOptions: [],
  },
  date: {
    createdFrom: initialCurrentStartDate,
    createdTo: createdToDateNow,
    changed: false,
  },
  isFiltersExist: false,
  isNeedDateReset: false,
  minDate: '',
};

export const createDepartmentsTableFilters: StoreSlice<DepartmentsTableFilters> = set => ({
  departmentsFilters: {
    ...initialState,
    setFilters: (units, operators, minDate) =>
      set(state => {
        const unitsOptions = getOptions(units);
        const operatorsOptions = getOperatorOptions(operators);

        return {
          departmentsFilters: {
            ...state.departmentsFilters,
            units: {
              ...state.departmentsFilters.units,
              selectedValue: unitsOptions,
              options: unitsOptions,
            },
            operators: {
              ...state.departmentsFilters.operators,
              selectedValue: operatorsOptions,
              options: operatorsOptions,
              allOptions: operatorsOptions,
            },
            minDate,
          },
        };
      }),
    setSite: value =>
      set(state => ({
        departmentsFilters: {
          ...state.departmentsFilters,
          site: {
            selectedValue: value,
            valueForDispatch: value,
            changed: true,
          },
          units: {
            ...state.departmentsFilters.units,
            valueForDispatch: null,
            changed: true,
          },
          operators: {
            ...state.departmentsFilters.operators,
            valueForDispatch: null,
            changed: true,
          },
          date: {
            ...initialState.date,
            changed: true,
          },
          isFiltersExist: true,
          isNeedDateReset: false,
        },
      })),
    clearFilters: () =>
      set(state => {
        const resetValues = {
          valueForDispatch: null,
          changed: false,
        };
        return {
          departmentsFilters: {
            ...state.departmentsFilters,
            site: {
              ...initialState.site,
            },
            date: { createdFrom: '', createdTo: '', changed: false },
            units: {
              ...state.departmentsFilters.units,
              ...resetValues,
            },
            operators: {
              ...state.departmentsFilters.operators,
              ...resetValues,
            },
            isFiltersExist: false,
            isNeedDateReset: true,
          },
        };
      }),
    setDate: (dateFrom, dateTo) =>
      set(state => {
        const createdFrom = formatDate(dateFrom, 'YYYY-MM-DD 00:00:00');
        const createdTo = dateTo ? formatDate(dateTo, 'YYYY-MM-DD 23:59:59') : null;
        const newDate = {
          date: {
            createdFrom,
            createdTo,
            changed: true,
          },
        };
        return {
          departmentsFilters: {
            ...state.departmentsFilters,
            ...newDate,
          },
        };
      }),
    setOptions: (val, selectorName) =>
      set(state => {
        const values = getOnlyValues(val);
        const valueForDispatch =
          state.departmentsFilters[selectorName].options.length === values?.length ||
          values?.length === 0
            ? null
            : values;
        return {
          departmentsFilters: {
            ...state.departmentsFilters,
            [selectorName]: {
              ...state.departmentsFilters[selectorName],
              selectedValue: val,
              valueForDispatch,
              changed: true,
            },
          },
        };
      }),
    changeOperators: () =>
      set(state => {
        const { operators, units } = state.departmentsFilters;
        if (units.valueForDispatch?.length > 0) {
          const filterOperators = operators.allOptions.filter(operator =>
            units.valueForDispatch.some(unitId => operator.unitIds?.some(id => id === unitId)),
          );
          return {
            departmentsFilters: {
              ...state.departmentsFilters,
              operators: {
                ...operators,
                selectedValue:
                  filterOperators.length === operators.options.length &&
                  containsArray(filterOperators, operators.selectedValue)
                    ? operators.selectedValue
                    : filterOperators,
                options: filterOperators,
                valueForDispatch: null,
              },
            },
          };
        }
        if (units.valueForDispatch === null) {
          return {
            departmentsFilters: {
              ...state.departmentsFilters,
              operators: {
                ...operators,
                selectedValue: operators.allOptions,
                options: operators.allOptions,
                valueForDispatch: null,
              },
            },
          };
        }
        return state;
      }),
  },
});
