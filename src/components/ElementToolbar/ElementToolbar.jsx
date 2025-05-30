import { FaImage, FaFont, FaSquare, FaElementor, FaPuzzlePiece } from 'react-icons/fa';

export const ElementToolbar = ({ onAddElement }) => {
  const tools = [
    { type: 'image', icon: FaImage, title: 'Добавить изображение' },
    { type: 'text', icon: FaFont, title: 'Добавить текст' },
    { type: 'shape', icon: FaSquare, title: 'Добавить фигуру' },
    { type: 'element', icon: FaElementor, title: 'Добавить элемент' },
    { type: 'product', icon: FaPuzzlePiece, title: 'Добавить товар' }
  ];

  return (
    <div className="element-toolbar">
      {tools.map(tool => (
        <button 
          key={tool.type}
          onClick={() => onAddElement(tool.type)}
          title={tool.title}
        >
          <tool.icon size={20} />
        </button>
      ))}
    </div>
  );
}; 