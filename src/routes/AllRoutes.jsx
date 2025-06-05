import { Route, Routes } from "react-router-dom";

import Home from "../views/Home";
import Generator from "../views/Generator";
import Gallery from "../views/Gallery";

const AllRoutes = () => {
  
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/template/:id" element={<Generator />} />
      <Route path="/gallery" element={<Gallery />} />
    </Routes>
  );
};

export default AllRoutes;