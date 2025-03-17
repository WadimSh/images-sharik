import { Suspense } from 'react';
import AllRoutes from '../routes/AllRoutes';

const Views = () => {
  
  return (
    <Suspense fallback={<></>}>
      <AllRoutes />
    </Suspense>
  )
};

export default Views;