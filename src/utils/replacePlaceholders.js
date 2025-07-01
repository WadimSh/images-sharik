const applyTemplateStyles = (template, styleVariant = 'default') => {
  return template.map(element => {
    if (!element.styles) return element;
    
    const style = element.styles[styleVariant] || element.styles.default;
    
    return {
      ...element,
      ...style
    };
  });
};

export const replacePlaceholders = (template, item, styleVariant = 'default') => {
  const styledTemplate = applyTemplateStyles(template, styleVariant);
  
  return styledTemplate.map(element => ({
    ...element,
    image: element.image === "{{ITEM_IMAGE}}" ? item.image : element.image,
    text: element.text
      ? element.text
        .replace("{{CATEGORY}}", `воздушные шары ${item.category}`)
        .replace("{{TITLE}}", item.title)
        .replace("{{MULTIPLICITY}}", item.multiplicity)
        .replace("{{SIZE}}", item.size)
        .replace("{{BRAND}}", item.brand)
      : element.text
  }));
};
