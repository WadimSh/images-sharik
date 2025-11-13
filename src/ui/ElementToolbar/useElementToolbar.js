export const useElementToolbar = (
  setElements,
  fileInputRef,
  setIsImageLibraryOpen,
  setIsProductModalOpen
) => {
  const handleAddElement = (type) => {
    switch (type) {
      case 'background':
        const newBackgroundElement = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          type: 'background',
          position: { x: 0, y: 0 },
          width: '100%',
          height: '100%',
          color: '#ccddea'
        };
        setElements(prev => [newBackgroundElement, ...prev]);
        break;
      case 'image':
        fileInputRef.current.click();
        break;
      case 'text':
        const newTextElement = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          type: 'text',
          text: 'Новый текст',
          position: { x: 100, y: 100 },
          fontSize: 32,
          color: '#333333',
          fontFamily: 'HeliosCond',
          width: 164,
          height: 36
        };
        setElements(prev => [...prev, newTextElement]);
        break;
      case 'shape':
        const newShapeElement = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          type: 'shape',
          position: { x: 100, y: 100 },
          width: 100,
          height: 100,
          color: '#cccccc',
          borderWidth: 0,        
          borderColor: '#000000'
        };
        setElements(prev => [...prev, newShapeElement]);
        break;
      case 'line':
        const newLineElement = {
          id: Date.now() + Math.floor(Math.random() * 1000),
          type: 'line',
          position: { x: 170, y: 290 },
          width: 100,
          height: 20,
          color: '#000',
          borderWidth: 0
        };
        setElements(prev => [...prev, newLineElement]);
        break;  
      case 'element':
        setIsImageLibraryOpen(true);
        break;
      case 'product':
        setIsProductModalOpen(true);
        break;
      default:
        break;
    }
  };

  return { handleAddElement };
}; 