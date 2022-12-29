// app main function
(async function app() {
  console.log('App loaded!');

  // get table element
  const table = document.getElementById('advance-table');
  const thead = table.querySelector('thead');
  const tbody = table.querySelector('tbody');

  const paginationEl = document.getElementById('pagination');
  const prevBtn = paginationEl.querySelector('#prev');
  const nextBtn = paginationEl.querySelector('#next');
  const pageSizeSelect = paginationEl.querySelector('select');
  const pageCountEl = document.getElementById('page');
  const totalPagesEl = document.getElementById('totalPages');
  const currentRangeEl = document.getElementById('range');
  const totalItemsEl = document.getElementById('totalRecords');
  const selectAllRowsCheckbox = document.getElementById('selectAllRows');

  // checkbox template
  const checkboxTemplate = document.querySelector('#cell-checkbox');

  const pagination = {
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  };

  const selectedRowsState = new Set();

  const SORT_ASCENDING = 'ascending';
  const SORT_DESCENDING = 'descending';

  // set value for page size selector
  pageSizeSelect.value = pagination.pageSize;

  const data = await loadData();
  if (!data) {
    return;
  }
  // initial data loaded with first 10 rows
  updateTableAndPagination(data, pagination);
  /// initial load done

  // handle select all rows
  selectAllRowsCheckbox.addEventListener('change', (e) => {
    const checked = e.target.checked;
    const currentSlice = paginateTableData(
      data,
      pagination.page,
      pagination.pageSize
    );

    if (checked) {
      const start = performance.now();
      currentSlice.data.forEach((row) => {
        selectedRowsState.add(row.id);
        // mark checkbox as checked
        const checkbox = tbody.querySelector(`#row-${row.id}`);
        checkbox.checked = true;
      });
      console.log(`Updated the table in ${performance.now() - start}ms`);
    } else {
      const start = performance.now();

      currentSlice.data.forEach((row) => {
        selectedRowsState.delete(row.id);

        const checkbox = tbody.querySelector(`#row-${row.id}`);
        checkbox.checked = false;
      });
      console.log(`Updated the table in ${performance.now() - start}ms`);
    }
    console.log(...selectedRowsState);

    // TODO: check if going by selecting each row by querySelector is faster
    //      or rendering whole tbody is faster
  });

  // sorting setup
  // finding all th elements in the thead of advance table
  const thList = thead.querySelectorAll('tr>th');

  thList.forEach((th) => {
    const sortKey = th.dataset.col;

    const sortButton = th.querySelector('button.sort');

    sortButton.addEventListener('click', (e) => {
      let sortOrder = sortButton.classList.contains(SORT_ASCENDING) ? -1 : 1;

      // flip the sorting icon
      if (sortOrder === 1) {
        sortButton.classList.add(SORT_ASCENDING);
        sortButton.classList.remove(SORT_DESCENDING);
      } else {
        sortButton.classList.remove(SORT_ASCENDING);
        sortButton.classList.add(SORT_DESCENDING);
      }

      // sort the data
      sortData(data, sortKey, sortOrder);

      // clear sorting marker on other columns
      clearSortingMarker(th, thList);

      // update table with sorted data
      updateTableAndPagination(data, pagination);
    });
  });

  // pagination handlers
  prevBtn.addEventListener('click', (e) => {
    // go to prev page
    pagination['page'] -= 1;

    updateTableAndPagination(data, pagination);
  });
  nextBtn.addEventListener('click', (e) => {
    // go to prev page
    pagination['page'] += 1;

    updateTableAndPagination(data, pagination);
  });

  // page size select change handler
  pageSizeSelect.addEventListener('change', (e) => {
    const value = parseInt(e.target.value, 10);
    pagination['pageSize'] = value;
    updateTableAndPagination(data, pagination);
  });

  function clearSortingMarker(current, thList) {
    // remove other button's selected class
    thList.forEach((thEl) => {
      // ignore the self
      if (thEl === current) {
        return;
      }

      const sortButton = thEl.querySelector('button.sort');

      if (sortButton.classList.contains(SORT_ASCENDING)) {
        sortButton.classList.remove(SORT_ASCENDING);
      }

      if (sortButton.classList.contains(SORT_DESCENDING)) {
        sortButton.classList.remove(SORT_DESCENDING);
      }
    });
  }

  function updateTableAndPagination(data, pagination) {
    // update table
    const slice = paginateTableData(data, pagination.page, pagination.pageSize);
    populateTable(slice);
    // update pagination
    pagination['totalItems'] = slice.totalItems;
    pagination['totalPages'] = slice.totalPages;
    updatePaginationView(pagination);
  }

  function populateTable(dataSlice) {
    const start = performance.now();
    console.log('Populating table...');
    const rows = dataSlice.data.map((data) => {
      const tr = document.createElement('tr');

      // add checkbox in first cell
      const templateClone = checkboxTemplate.content.cloneNode(true);
      let td = templateClone.querySelector('td');

      // get checkbox from td
      const checkbox = td.querySelector('input[type=checkbox]');
      // populate row's id to checkbox's data attribute
      checkbox.dataset['rowId'] = data.id;
      checkbox.id = `row-${data.id}`;

      // check if the row was previously selected or not
      // if it was checked the then mark it as checked
      if (selectedRowsState.has(data.id)) {
        checkbox.checked = true;
      }
      checkbox.addEventListener('change', handleRowSelect);

      tr.appendChild(td);

      Object.entries(data).forEach(([_col, value]) => {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });

      return tr;
    });

    // update table data
    tbody.replaceChildren(...rows);
    const end = performance.now() - start;
    console.log(`Populated table in ${end}ms`);
  }

  function updatePaginationView(paginationData) {
    // update pagination
    pageCountEl.textContent = paginationData.page;
    totalPagesEl.textContent = paginationData.totalPages;

    // update progress
    let range = '';
    if (paginationData.page === 1 && paginationData.totalItems === 0) {
      range = '0-0';
      console.log('First page and no items');
    }

    if (
      paginationData.page === 1 &&
      paginationData.totalItems > 0 &&
      paginationData.totalItems <= paginationData.pageSize
    ) {
      console.log('First page and less items');
      range = `1-${paginationData.totalItems}`;
    }

    if (
      paginationData.page >= 1 &&
      paginationData.totalItems > 0 &&
      paginationData.totalItems > paginationData.pageSize
    ) {
      const start = paginationData.page * paginationData.pageSize + 1;
      const end =
        paginationData.page * paginationData.pageSize + paginationData.pageSize;
      range = `${start - paginationData.pageSize}-${
        end - paginationData.pageSize
      }`;
    }

    currentRangeEl.textContent = range;
    totalItemsEl.textContent = paginationData.totalItems;

    // disable prev button if we're on first page
    if (paginationData.page === 1) {
      prevBtn.ariaDisabled = true;
      prevBtn.setAttribute('disabled', true);
    } else {
      // enable prev btn
      prevBtn.ariaDisabled = false;
      prevBtn.removeAttribute('disabled');
    }

    // disable next button if we're on last page
    if (paginationData.page === paginationData.totalPages) {
      nextBtn.ariaDisabled = true;
      nextBtn.setAttribute('disabled', true);
    } else {
      // enable prev btn
      nextBtn.ariaDisabled = false;
      nextBtn.removeAttribute('disabled');
    }
  }

  async function loadData() {
    try {
      const res = await fetch('data.json');

      if (res.ok) {
        const data = await res.json();
        return data;
      } else {
        console.error('There was some error');
      }
    } catch (error) {
      console.error('Network error!', error);
    }

    return null;
  }

  /**
   *
   * @param {*[]} data data array
   * @param {number} page page number
   * @param {number} pageSize page size
   * @returns paginated slice from the data
   */
  function paginateTableData(data, page = 1, pageSize = 10) {
    if (page < 1) throw new Error('Page cannot be 0 or negative');

    // data is less than or equal to the page size
    if (data.length <= pageSize) {
      if (page > 1) {
        return [];
      }
      return data;
    }

    // data has more elements than page size
    const start = (page - 1) * pageSize;
    const slice = data.slice(start, start + pageSize);

    const totalItems = data.length;

    return {
      data: slice,
      page,
      pageSize,
      totalItems,
      totalPages:
        Math.floor(totalItems / pageSize) +
        (totalItems % pageSize === 0 ? 0 : 1),
    };
  }

  /**
   * sort the data by sort key and sort direction.
   *
   * Note: this function will mutate the existing array.
   * We can return a new instance by cloning the existing array.
   * But, for simplicity we'll mutate the existing array.
   * @param {*[]} data data
   * @param {string} sortKey sort key to sort data by
   * @param {1|-1} sortDirection sorting direction. 1 for ascending order and -1 for descending order
   */
  function sortData(data, sortKey, sortDirection = 1) {
    data.sort((a, b) => {
      // numbered value check
      if (typeof a[sortKey] === 'number' || typeof a[sortKey] === 'boolean') {
        return sortDirection === 1
          ? a[sortKey] - b[sortKey]
          : b[sortKey] - a[sortKey];
      }

      if (typeof a[sortKey] === 'string') {
        return sortDirection === 1
          ? a[sortKey].localeCompare(b[sortKey])
          : b[sortKey].localeCompare(a[sortKey]);
      }

      // throw error for unsupported type
      throw new Error('no sorting on objects');
    });
  }

  function handleRowSelect(e) {
    const rowId = parseInt(e.target.dataset.rowId, 10);
    // toggle row selection
    if (selectedRowsState.has(rowId)) {
      selectedRowsState.delete(rowId);
    } else {
      selectedRowsState.add(rowId);
    }
  }
})();
