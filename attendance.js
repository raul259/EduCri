(function () {
  function calculateAttendanceRate(rows) {
    const items = Array.isArray(rows) ? rows : [];
    let present = 0;
    let total = 0;
    items.forEach((status) => {
      if (!status) return;
      total += 1;
      if (status === 'present') present += 1;
    });
    return total > 0 ? Math.round((present / total) * 100) : 0;
  }

  window.EducriAttendance = { calculateAttendanceRate };
})();

