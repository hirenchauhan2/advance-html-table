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

  const pagination = {
    page: 1,
    pageSize: 10,
    totalItems: 0,
    totalPages: 0,
  };

  const SELECTED_SORT_BTN_CLASS = 'selected';

  // set value for page size selector
  pageSizeSelect.value = pagination.pageSize;

  const data = await loadData();
  if (!data) {
    return;
  }
  // initial data loaded with first 10 rows
  updateTableAndPagination(data, pagination);
  /// initial load done

  // sorting setup
  // finding all th elements in the thead of advance table
  const thList = thead.querySelectorAll('tr>th');

  thList.forEach((th) => {
    const sortKey = th.dataset.col;

    const sortButtonAsc = th.querySelector('button.sort.sort-asc');
    const sortButtonDesc = th.querySelector('button.sort.sort-desc');

    sortButtonAsc.addEventListener('click', (e) => {
      // don't do sorting again on same button if it was previously clicked
      if (sortButtonAsc.classList.contains(SELECTED_SORT_BTN_CLASS)) {
        return;
      }

      // remove the desc button's sorting marker if it was selected
      if (sortButtonDesc.classList.contains(SELECTED_SORT_BTN_CLASS)) {
        sortButtonDesc.classList.remove(SELECTED_SORT_BTN_CLASS);
      }

      // mark the button as selected, for highlighting with CSS later
      sortButtonAsc.classList.add(SELECTED_SORT_BTN_CLASS);

      // sort the data
      sortData(data, sortKey, 1);

      // clear sorting marker on other columns
      clearSortingMarker(th, thList);

      // update table with sorted data
      updateTableAndPagination(data, pagination);
    });

    sortButtonDesc.addEventListener('click', (e) => {
      // don't do sorting again on same button if it was previously clicked
      if (sortButtonDesc.classList.contains(SELECTED_SORT_BTN_CLASS)) {
        return;
      }

      // remove the asc button's sorting marker if it was selected
      if (sortButtonAsc.classList.contains(SELECTED_SORT_BTN_CLASS)) {
        sortButtonAsc.classList.remove(SELECTED_SORT_BTN_CLASS);
      }

      // mark the button as selected, for highlighting with CSS later
      sortButtonDesc.classList.add(SELECTED_SORT_BTN_CLASS);

      // sort the data
      sortData(data, sortKey, -1);

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

      const sortButtonAsc = thEl.querySelector('button.sort.sort-asc');
      const sortButtonDesc = thEl.querySelector('button.sort.sort-desc');

      if (sortButtonAsc.classList.contains(SELECTED_SORT_BTN_CLASS)) {
        sortButtonAsc.classList.remove(SELECTED_SORT_BTN_CLASS);
      }

      if (sortButtonDesc.classList.contains(SELECTED_SORT_BTN_CLASS)) {
        sortButtonDesc.classList.remove(SELECTED_SORT_BTN_CLASS);
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

  function updatePaginationView(data) {
    // update pagination
    pageCountEl.textContent = data.page;
    totalPagesEl.textContent = data.totalPages;

    // disable prev button if we're on first page
    if (data.page === 1) {
      prevBtn.ariaDisabled = true;
      prevBtn.setAttribute('disabled', true);
    } else {
      // enable prev btn
      prevBtn.ariaDisabled = false;
      prevBtn.removeAttribute('disabled');
    }

    // disable next button if we're on last page
    if (data.page === data.totalPages) {
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
})();
