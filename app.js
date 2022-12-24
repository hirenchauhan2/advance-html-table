// app main function
(async function app() {
  console.log('App loaded!');

  // get table element
  const table = document.getElementById('advance-table');
  console.log('🚀 ~ file: app.js:7 ~ app ~ table', table);
  const tbody = table.querySelector('tbody');
  console.log('🚀 ~ file: app.js:9 ~ app ~ tbody', tbody);

  const data = await loadData();
  if (!data) {
    return;
  }
  // initial data loaded with first 10 rows
  const firstSlice = paginateTableData(data, 1, 10);

  populateTable(firstSlice.data);


  function populateTable(dataSlice) {
    console.log("🚀 ~ file: app.js:22 ~ populateTable ~ dataSlice", dataSlice)
    const rows = dataSlice.map(data => {
      const tr = document.createElement('tr');

      Object.entries(data).forEach(([_col, value]) => {
        const td = document.createElement('td');
        td.textContent = value;
        tr.appendChild(td);
      });

      return tr;
    });

    tbody.replaceChildren(...rows);
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
})();
