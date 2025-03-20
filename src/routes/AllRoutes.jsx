import { Route, Routes } from "react-router-dom";

import Home from "../views/Home";
import Generator from "../views/Generator";

const AllRoutes = () => {
  
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/template/:id" element={<Generator />} />
    </Routes>
  );
};

export default AllRoutes;