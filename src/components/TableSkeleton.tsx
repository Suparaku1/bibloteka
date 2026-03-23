const TableSkeleton = ({ columns = 5, rows = 5 }: { columns?: number; rows?: number }) => (
  <div className="rounded-xl shadow-smooth bg-card overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-5 py-3">
                <div className="h-3 w-20 bg-muted rounded animate-pulse" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-b border-border last:border-0">
              {Array.from({ length: columns }).map((_, c) => (
                <td key={c} className="px-5 py-3">
                  <div className="h-4 bg-muted/60 rounded animate-pulse" style={{ width: `${50 + Math.random() * 50}%` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default TableSkeleton;
