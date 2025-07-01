export const getAvailableStyleVariants = (template) => {
  const variants = new Set(['default']);
  
  if (!template) return Array.from(variants);
  
  // Обрабатываем как массив шаблонов
  const templateToCheck = Array.isArray(template[0]) ? template[0] : template;
  
  templateToCheck.forEach(element => {
    if (element?.styles) {
      Object.keys(element.styles).forEach(variant => {
        variants.add(variant);
      });
    }
  });
  
  return Array.from(variants);
};