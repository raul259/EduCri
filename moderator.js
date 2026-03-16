(function () {
  function filterAndPaginate(items, query, predicate, page, pageSize) {
    const list = Array.isArray(items) ? items : [];
    const q = String(query || '').trim().toLowerCase();
    const filtered = q ? list.filter((item) => predicate(item, q)) : list;
    const safePageSize = Math.max(1, Number(pageSize || 10));
    const totalPages = Math.max(1, Math.ceil(filtered.length / safePageSize));
    const currentPage = Math.min(Math.max(1, Number(page || 1)), totalPages);
    const start = (currentPage - 1) * safePageSize;
    const pageItems = filtered.slice(start, start + safePageSize);
    return { filtered, pageItems, totalPages, currentPage };
  }

  window.EducriModerator = { filterAndPaginate };
})();

