import React from 'react';
import { Outlet } from 'react-router-dom'; // ضروري

 import Navbar from '../components/navbar/Navbar';
import Footer from '../components/footer/Footer';

function MainLayout() {
  return (
    <div>
      <Navbar />       
      <Outlet /> 
     <Footer /> 
      
     </div>
  );
}

export default MainLayout;