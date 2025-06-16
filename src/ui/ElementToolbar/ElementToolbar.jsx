import { useContext } from 'react';
import { FaImage, FaFont, FaSquare, FaElementor, FaPuzzlePiece } from 'react-icons/fa';

import { LanguageContext } from '../../context/contextLanguage';

export const ElementToolbar = ({ onAddElement }) => {
  const { t } = useContext(LanguageContext);

  const tools = [
    { type: 'image', icon: FaImage, title: 'ui.addImage' },
    { type: 'text', icon: FaFont, title: 'ui.addText' },
    { type: 'shape', icon: FaSquare, title: 'ui.addSquare' },
    { type: 'element', icon: FaElementor, title: 'ui.addElement' },
    { type: 'product', icon: FaPuzzlePiece, title: 'ui.addProduct' }
  ];

  return (
    <div className="element-toolbar">
      {tools.map(tool => (
        <button 
          key={tool.type}
          onClick={() => onAddElement(tool.type)}
          title={t(tool.title)}
        >
          <tool.icon size={20} />
        </button>
      ))}
    </div>
  );
}; 