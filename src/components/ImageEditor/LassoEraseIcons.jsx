const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const LassoPaths = () => (
  <>
    <path d="M3.704 14.467a10 8 0 1 1 3.115 2.375" />
    <path d="M7 22a5 5 0 0 1-2-3.994" />
    <circle cx="5" cy="16" r="2" />
  </>
);

const LassoOutline = ({ scale = 1, offsetX = 0, offsetY = 0 }) => (
  <g transform={`translate(${offsetX} ${offsetY}) scale(${scale})`}>
    <LassoPaths />
  </g>
);

const Cross = ({ x1, y1, x2, y2 }) => (
  <>
    <path d={`M${x1} ${y1} ${x2} ${y2}`} />
    <path d={`M${x2} ${y1} ${x1} ${y2}`} />
  </>
);

const DashedFrame = () => (
  <rect x="0.5" y="1" width="23" height="22" rx="1.5" strokeDasharray="3 3" opacity="0.85" />
);

export const LassoEraseInsideIcon = ({ size = 20, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
  >
    <g {...iconProps}>
      <DashedFrame />
      <g transform="translate(2.4 2) scale(0.82)">
        <LassoPaths />
        <Cross x1={11.5} y1={9.5} x2={16.5} y2={14.5} />
      </g>
    </g>
  </svg>
);

export const LassoEraseOutsideIcon = ({ size = 20, className }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    aria-hidden="true"
  >
    <g {...iconProps}>
      <DashedFrame />
      <Cross x1={2.5} y1={3.5} x2={6.5} y2={7.5} />
      <LassoOutline scale={0.68} offsetX={7.5} offsetY={4.5} />
    </g>
  </svg>
);
