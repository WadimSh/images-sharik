import { Route, Routes } from "react-router-dom";

import SignUp from "../views/SignUp";
import SignIn from "../views/SignIn";
import ResetPassword from "../views/ResetPassword";

import Home from "../views/Home";
import Generator from "../views/Generator";
import Gallery from "../views/Gallery";
import { NewGallery } from "../views/Gallery/NewGallery";
import Template from "../views/Template";
import ProtectedRoute from "./ProtectedRoute";

const AllRoutes = () => {
  
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/sign-up" element={<SignUp />} />
      <Route path="/sign-in" element={<SignIn />} />
      
      <Route 
        path="/template/:id" 
        element={
          <ProtectedRoute>
            <Generator />
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/gallery" 
        element={
          <ProtectedRoute>
            <NewGallery />
          </ProtectedRoute>
        } 
      />
      
      {/*<Route 
        path="/create" 
        element={
          <ProtectedRoute>
            <Template />
          </ProtectedRoute>
        } 
      />*/}
    </Routes>
  );
};

export default AllRoutes;