import { useEffect, useMemo, useContext } from "react";

import { CustomSelect } from "../ui/CustomSelect/CustomSelect";
import { useMarketplace } from "../contexts/contextMarketplace";
import { LanguageContext } from '../contexts/contextLanguage';

// Размеры для каждого маркетплейса
export const SIZE_PRESETS_BY_MARKETPLACE = {
  'WB': [
    { 
      width: 450, 
      height: 600, 
      label: '900px x 1200px', 
      fileName: '900x1200'
    }
  ],
  'OZ': [
    { 
      width: 450, 
      height: 600, 
      label: '900px x 1200px', 
      fileName: '900x1200'
    },
    { 
      width: 708, 
      height: 354, 
      label: '1416px x 708px', 
      fileName: '1416x708'
    },
    { 
      width: 354, 
      height: 354, 
      label: '708px x 708px', 
      fileName: '708x708'
    }
  ],
  'AM': [
    { 
      width: 600, 
      height: 600, 
      label: '1200px x 1200px', 
      fileName: '1200x1200'
    }
  ]
};

export const CanvasSizeSelector = ({
  currentSize,
  onSizeChange
}) => {
  const { marketplace } = useMarketplace();
  const { t } = useContext(LanguageContext);

  // Получаем доступные размеры для текущего маркетплейса
  const availableSizes = useMemo(() => {
    return SIZE_PRESETS_BY_MARKETPLACE[marketplace] || SIZE_PRESETS_BY_MARKETPLACE.WB;
  }, [marketplace]);

  // Создаем options для CustomSelect
  const sizeOptions = useMemo(() => {
    return availableSizes.reduce((acc, preset) => {
      acc[preset.fileName] = preset.label;
      return acc;
    }, {});
  }, [availableSizes]);

  // Проверяем, что текущий размер доступен для маркетплейса
  useEffect(() => {
    const isCurrentSizeAvailable = availableSizes.some(
      size => size.fileName === currentSize.fileName
    );
    
    if (!isCurrentSizeAvailable && availableSizes.length > 0) {
      // Если текущий размер недоступен, переключаем на первый доступный
      onSizeChange(availableSizes[0]);
    }
  }, [marketplace, currentSize, availableSizes, onSizeChange]);

  // Обработчик изменения размера
  const handleSizeChange = (fileName) => {
    const selectedPreset = availableSizes.find(preset => preset.fileName === fileName);
    if (selectedPreset) {
      onSizeChange(selectedPreset);
    }
  };

  return (
    <div className="canvas-size-wrapper">
      <span>{t('views.canvasSizeLabel')}</span>
      <CustomSelect
        options={sizeOptions}
        value={currentSize.fileName}
        onChange={handleSizeChange}
        className="canvas-size-dropdown"
      />
    </div>
  );
};