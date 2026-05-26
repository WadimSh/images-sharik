export const ProductMetaInfo = ({ 
  initialMetaDateElement 
}) => {
  const productLink = initialMetaDateElement.link !== '#'
    ? (initialMetaDateElement.link.endsWith('/')
        ? initialMetaDateElement.link
        : `${initialMetaDateElement.link}/`)
    : '#';

  return (
  <div className="meta-info">
   {productLink !== '#' ? (
      <a href={productLink} className='meta-link' target="_blank" rel="noopener noreferrer">        <h3 className='meta-title'>
          {initialMetaDateElement.code}
          <span className="meta-subtitle"> {initialMetaDateElement.name}</span>
        </h3>
      </a>
    ) : (
      <h3 className='meta-title'>
        {initialMetaDateElement.code}
        <span className="meta-subtitle"> {initialMetaDateElement.name}</span>
      </h3>
    )}
    {initialMetaDateElement.originProperties.map((item, index) => (
      <div className="meta-row" key={index}>
        <div className="meta-col">
          <div className="meta-subtitle">{item.name}</div>
        </div>
        <div className="meta-col">
          <span className='meta-subtitle'>{item.value}</span>
        </div>
      </div>
    ))}
    {initialMetaDateElement.properties.map((item, index) => (
      <div className="meta-row" key={index}>
        <div className="meta-col">
          <div className="meta-subtitle">{item.name}</div>
        </div>
        <div className="meta-col">
          <span className='meta-subtitle'>{item.value}</span>
        </div>
      </div>
    ))}
  </div>
  );
};