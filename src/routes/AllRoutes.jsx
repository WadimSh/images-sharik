import { Route, Routes } from "react-router-dom";

import Home from "../views/Home";

const AllRoutes = () => {
  
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
};

export default AllRoutes;