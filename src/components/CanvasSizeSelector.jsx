import { useEffect, useMemo, useContext } from "react";

import { CustomSelect } from "../ui/CustomSelect/CustomSelect";
import { useMarketplace } from "../contexts/contextMarketplace";
import { LanguageContext } from '../contexts/contextLanguage';
import { SIZE_PRESETS_BY_MARKETPLACE } from "../constants/sizePresetsByMarketplace";

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
      <div style={{ width: '220px' }}>
        <CustomSelect
          options={sizeOptions}
          value={currentSize.fileName}
          onChange={handleSizeChange}
          className="canvas-size-dropdown"
        />
      </div>
      
    </div>
  );
};