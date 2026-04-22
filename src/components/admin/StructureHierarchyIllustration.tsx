/**
 * Decorative org-chart graphic for Terminology / Branch hierarchy admin pages.
 * Pastel violet silhouettes + periwinkle connectors (training UI, not data viz).
 */
export default function StructureHierarchyIllustration({ className }: { className?: string }) {
  const silhouette = '#DDD6FE';
  const silhouetteStroke = '#C4B5FD';
  const line = '#6366F1';
  const base = '#4F46E5';

  return (
    <svg
      viewBox="0 0 280 168"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {/* connectors: stem, tee, three drops to child row */}
      <path
        d="M140 56 L140 70 M50 70 L230 70 M50 70 L50 90 M140 70 L140 90 M230 70 L230 90"
        stroke={line}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* top person */}
      <g transform="translate(140, 28)">
        <circle cx={0} cy={0} r={11} fill={silhouette} stroke={silhouetteStroke} strokeWidth={1} opacity={0.95} />
        <path
          d="M-16 14 Q0 4 16 14"
          fill="none"
          stroke={silhouette}
          strokeWidth={5}
          strokeLinecap="round"
        />
        <rect x={-22} y={18} width={44} height={10} rx={3} fill={base} />
      </g>

      {/* three child people */}
      {[
        { x: 50, y: 100 },
        { x: 140, y: 100 },
        { x: 230, y: 100 },
      ].map(({ x, y }) => (
        <g key={x} transform={`translate(${x}, ${y})`}>
          <circle cx={0} cy={0} r={10} fill={silhouette} stroke={silhouetteStroke} strokeWidth={1} opacity={0.95} />
          <path
            d="M-14 12 Q0 4 14 12"
            fill="none"
            stroke={silhouette}
            strokeWidth={4.5}
            strokeLinecap="round"
          />
          <rect x={-20} y={16} width={40} height={9} rx={3} fill={base} />
        </g>
      ))}
    </svg>
  );
}
