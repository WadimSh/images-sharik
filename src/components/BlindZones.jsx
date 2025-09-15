export const BlindZones = ({ show, containerSize = { width: 450, height: 600 }, zones = [] }) => {
  if (!show) return null;

  // Если zones не переданы, используем стандартные угловые зоны 50x50px
  const defaultZones = zones.length > 0 ? zones : [
    { id: 'top-left', x: 0, y: 0, width: 50, height: 50 },
    { id: 'top-right', x: containerSize.width - 50, y: 0, width: 50, height: 50 },
    { id: 'bottom-left', x: 0, y: containerSize.height - 50, width: 50, height: 50 },
    { id: 'bottom-right', x: containerSize.width - 50, y: containerSize.height - 50, width: 50, height: 50 }
  ];

  const zoneStyle = {
    position: 'absolute',
    backdropFilter: 'blur(8px)',
    backgroundColor: 'rgba(240, 240, 240, 0.2)', // Слегка сероватое стеклянное оформление
    border: '1px dashed rgba(255, 0, 0, 1)',
    zIndex: 9998,
    boxSizing: 'border-box'
  };

  return (
    <>
      {defaultZones.map(zone => (
        <div
          key={zone.id}
          style={{
            ...zoneStyle,
            left: `${zone.x}px`,
            top: `${zone.y}px`,
            width: `${zone.width}px`,
            height: `${zone.height}px`
          }}
        />
      ))}
    </>
  );
};