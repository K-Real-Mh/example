import React, { useCallback, useEffect, useRef } from 'react';
import { SelectSearchOption } from 'react-select-search';
import useStore from 'src/store';
import shallow from 'zustand/shallow';

import {
  checkChangeFiltersState,
  valueRenderer,
} from 'src/components/Journal/helpers/filterHelpers';
import { useOperatorFiltersLazyQuery } from 'src/components/Statistic/DepartmentsTable/graphql/DepartmentsTable.generated';
import OperatorsTable from 'src/components/Statistic/DepartmentsTable/OperatorsTable/OperatorsTable';
import { OptionUnionType } from 'src/components/Statistic/types/types';

import { DatePicker, FilterSelect, SquareIconButton, Text as Title, Toggler } from 'src/elements';
import MultiSelect from 'src/elements/MultiSelect/MultiSelect';

import { CloseIcon } from 'src/static/icons';

import { Container, Toolbar } from './styles';

interface Props {
  onToggle: () => void;
  hidden: boolean;
  sites: SelectSearchOption[] | [];
}

const DepartmentsTable = (props: Props) => {
  const { onToggle, hidden, sites } = props;
  const isFirstRender = useRef(true);
  const filters = useStore(({ departmentsFilters }) => departmentsFilters, shallow);
  const {
    site,
    isNeedDateReset,
    date,
    isFiltersExist,
    minDate,
    units,
    operators,
    setFilters,
    setSite,
    clearFilters,
    setDate,
    setOptions,
    changeOperators,
  } = filters;

  const [getFilters] = useOperatorFiltersLazyQuery({
    onCompleted: ({ operatorFilters }) => {
      const { units: newUnits, operators: newOperators, minDate: newMinDate } = operatorFilters;

      // if (units.options.length === 0 || operators.options.length === 0) {
      setFilters(newUnits, newOperators, newMinDate);
      // }
    },
  });

  // Выбор сайта
  const handleChangeSite = (value: number): void => {
    setSite(value);
  };

  // Очистка фильтра
  const handleClearFilters = (): void => {
    clearFilters();
  };

  // Выбор даты
  const handleChangeDate = (dateFrom: string | Date, dateTo: string | Date): void => {
    setDate(dateFrom, dateTo);
  };

  // Выбор отдела или оператора
  const handleChangeSelector = useCallback(
    (val: OptionUnionType, selectorName: 'units' | 'operators'): void => {
      setOptions(val, selectorName);
    },
    [setOptions],
  );

  // Запрос данных фильтра при выборе сайта
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (site.valueForDispatch > 0) {
      getFilters({ variables: { siteId: site.valueForDispatch } });
    }
  }, [getFilters, site.valueForDispatch]);

  // Изменение списка операторов при выборе отделов
  useEffect(() => {
    changeOperators();
  }, [changeOperators, units.valueForDispatch]);

  const isFiltersChanged = checkChangeFiltersState(filters);

  return (
    <Container>
      <Title variant="h1">
        <Toggler onToggle={onToggle} hidden={hidden} />
        Отделы и операторы
      </Title>
      <Toolbar>
        {/* Проект (сайт) */}
        <FilterSelect
          options={sites}
          value={site.selectedValue}
          placeholder="Выберите проект"
          onChange={handleChangeSite}
          changed={Boolean(site.changed && site.valueForDispatch)}
        />
        {/* Даты */}
        <DatePicker
          resetState={isNeedDateReset}
          changed={date.changed && !!minDate && isFiltersExist}
          disabled={!isFiltersExist || !minDate}
          minDate={minDate}
          onChange={handleChangeDate}
          dateFrom={date.createdFrom}
          dateTo={date.createdTo}
        />
        {/* Отделы */}
        <MultiSelect
          disabled={!isFiltersExist || units.options.length === 0}
          changed={units.changed && units.options.length !== 0}
          selectAllLabel="Все отделы"
          options={units.options}
          value={units.selectedValue}
          onChange={value => handleChangeSelector(value, 'units')}
          valueRenderer={valueRenderer('Все отделы')}
          overrideStrings={{
            allItemsAreSelected: 'Все отделы',
          }}
        />
        {/* Операторы */}
        <MultiSelect
          disabled={!isFiltersExist || operators.options.length === 0}
          changed={operators.changed && operators.options.length !== 0}
          selectAllLabel="Все операторы"
          options={operators.options}
          value={operators.selectedValue}
          onChange={value => handleChangeSelector(value, 'operators')}
          valueRenderer={valueRenderer('Все операторы')}
          overrideStrings={{
            allItemsAreSelected: 'Все операторы',
          }}
        />
        <SquareIconButton
          size="s"
          buttonColor="red"
          onClick={handleClearFilters}
          disabled={!isFiltersChanged}
        >
          <CloseIcon />
        </SquareIconButton>
      </Toolbar>
      <OperatorsTable
        siteId={site.valueForDispatch}
        dateFrom={date.createdFrom}
        dateTo={date.createdTo}
        unitIds={units.valueForDispatch}
        operatorSiteIds={operators.valueForDispatch}
        disabled={!isFiltersChanged}
      />
    </Container>
  );
};

export default DepartmentsTable;
