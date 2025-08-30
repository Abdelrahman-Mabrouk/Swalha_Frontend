const StatusColors = {
  NORMAL: 'bg-green-500',
  HALF_FEES: 'bg-blue-500',
  FIXED_50: 'bg-purple-500',
  EXEMPT: 'bg-yellow-500',
  EXCLUDED: 'bg-red-500'
};

export const StudentStatusBadge = ({ status }) => {
  const isExcluded = status === 'EXCLUDED';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white ${StatusColors[status]}`}>
      {status}
      {isExcluded && <span className="ml-1">(Suspended)</span>}
    </span>
  );
};