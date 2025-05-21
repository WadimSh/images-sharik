export const replaceCollage = (template, item) => {
  const images = item.images || [];
  const imagesLength = images.length;
  
  return template.map((element, index) => {
    const newElement = { ...element };
    
    if (newElement.image === "{{ITEM_IMAGE}}") {
      // Если есть изображения - повторяем их по кругу
      if (imagesLength > 0) {
        const imageIndex = index % imagesLength;
        newElement.image = images[imageIndex];
      } else {
        // Если изображений нет - оставляем плейсхолдер
        newElement.image = "{{ITEM_IMAGE}}";
      }
    }

    return newElement;
  });
};