import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import "react-day-picker/style.css";

//import App from './App.jsx'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import Login from './pages/Auth/Login.jsx';
import SignUp from './pages/Auth/SignUp.jsx';
import Home from './pages/Home/Home.jsx';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/signup",
    element: <SignUp />,
  },
  {
    path: "/dashboard",
    element: <Home />,
  },
]);


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
   
  </StrictMode>,
)
