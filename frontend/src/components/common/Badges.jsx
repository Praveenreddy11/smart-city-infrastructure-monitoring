import React from 'react';

export const SeverityBadge = ({ severity }) => {
  const sev = (severity || 'Low').toLowerCase();
  return <span className={`badge badge-${sev}`}>{severity || 'Low'}</span>;
};

export const StatusBadge = ({ status }) => {
  const st = (status || 'Reported').toLowerCase().replace(/\s+/g, '-');
  return <span className={`badge badge-${st}`}>{status || 'Reported'}</span>;
};
