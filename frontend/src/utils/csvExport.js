export function toCsv(rows, columns) {
  const headers = columns.map((col) => col.label);
  const lines = rows.map((row) =>
    columns
      .map((col) => {
        const value = typeof col.value === "function" ? col.value(row) : row[col.value];
        return `"${String(value ?? "").replace(/"/g, '""')}"`;
      })
      .join(","),
  );
  return [headers.join(","), ...lines].join("\n");
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function exportCsv(filename, rows, columns) {
  downloadCsv(filename, toCsv(rows, columns));
}
