const iconProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

const diamondPath = 'M13.446 2.6l7.955 7.954a2.045 2.045 0 0 1 0 2.892l-7.955 7.955a2.045 2.045 0 0 1 -2.892 0l-7.955 -7.955a2.045 2.045 0 0 1 0 -2.892l7.955 -7.955a2.045 2.045 0 0 1 2.892 0z';

export default function StraightenIcon({ size = 20, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <g {...iconProps}>
        <g transform="rotate(20 12 12)">
          <path d={diamondPath} />
        </g>
        <line x1="1" y1="12" x2="23" y2="12" strokeDasharray="2.5 2.5" />
      </g>
    </svg>
  );
}
