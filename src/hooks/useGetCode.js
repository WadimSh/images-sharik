import { useContext } from 'react';
import { LanguageContext } from '../contexts/contextLanguage';
import { codeMappingWB } from '../constants/dataMapWB';
import { codeMappingOZ } from '../constants/dataMapOZ';

export const useGetCode = () => {
  const { t } = useContext(LanguageContext);

  const getCode = (key, type) => {
    if (type === 'WB') {
      return codeMappingWB[key] || t('product.notWB');
    } else if (type === 'OZ') {
      return codeMappingOZ[key] || t('product.notOZ');
    }
    return t('product.notData');
  };

  return getCode;
};