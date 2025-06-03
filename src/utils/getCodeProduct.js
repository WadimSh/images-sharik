import { codeMappingWB } from '../constants/dataMapWB';
import { codeMappingOZ } from '../constants/dataMapOZ';

export const getCode = (key, type) => {
  if (type === 'WB') {
    return codeMappingWB[key] || 'нет на WB';
  } else if (type === 'OZ') {
    return codeMappingOZ[key] || 'нет на OZON';
  }
  return 'нет данных';
};
