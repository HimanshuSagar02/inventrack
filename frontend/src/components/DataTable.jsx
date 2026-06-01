import React from 'react';
import './DataTable.css';

function DataTable({ columns, data, actions, emptyMessage = 'No data found' }) {
  if (!data || data.length === 0) {
    return (
      <div className="table-empty">
        <span className="table-empty-icon">📭</span>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {actions && <th className="th-actions">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={row.id || row._id || idx}>
              {columns.map((col) => (
                <td key={col.key} data-label={col.label}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
              {actions && (
                <td className="td-actions" data-label="Actions">
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DataTable;
