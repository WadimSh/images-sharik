import { useContext } from 'react';
import { FaImage, FaFont, FaSquare, FaElementor, FaPuzzlePiece } from 'react-icons/fa';
import { MdOutlineLensBlur } from "react-icons/md";
import { SlFrame } from "react-icons/sl";
import { IoImagesOutline } from "react-icons/io5";
import { PiTextAa, PiShapes } from "react-icons/pi";
import { AiOutlineProduct } from "react-icons/ai";

import { Tooltip } from '../Tooltip/Tooltip';
import { LanguageContext } from '../../contexts/contextLanguage';
import './ElementToolbar.css';

export const ElementToolbar = ({ onAddElement, isBackground }) => {
  const { t } = useContext(LanguageContext);

  const tools = [
    { type: 'background', icon: SlFrame, title: isBackground ? 'ui.addedBackground' : 'ui.addBackground'},
    { type: 'image', icon: IoImagesOutline, title: 'ui.addImage' },
    { type: 'text', icon: PiTextAa, title: 'ui.addText' },
    { type: 'shape', icon: PiShapes, title: 'ui.addSquare' },
    { type: 'element', icon: MdOutlineLensBlur, title: 'ui.addElement' },
    { type: 'product', icon: AiOutlineProduct, title: 'ui.addProduct' }    
  ];

  return (
    <div className="element-toolbar">
      {tools.map(tool => (
        <Tooltip 
          key={tool.type}
          content={t(tool.title)}
          position="bottom"
        >
          <button 
            key={tool.type}
            onClick={() => onAddElement(tool.type)}
            disabled={tool.type === 'background' && isBackground}
          >
            <tool.icon size={20} />
          </button>
        </Tooltip>
      ))}
    </div>
  );
}; 