export const replacePlaceholders = (template, item) => {
  
  return template.map(element => ({
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
