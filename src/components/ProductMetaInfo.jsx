export const ProductMetaInfo = ({ 
  initialMetaDateElement 
}) => (
  <div className="meta-info">
    <a href={initialMetaDateElement.link} className='meta-link' target="_blank" rel="noopener noreferrer">
      <h3 className='meta-title'>
        {initialMetaDateElement.code}
        <span className="meta-subtitle"> {initialMetaDateElement.name}</span>
      </h3>
    </a>
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