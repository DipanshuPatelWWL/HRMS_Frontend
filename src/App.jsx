import React, { useContext } from "react";
import { useLocation } from "react-router-dom";

import AppRoutes from "./routes/AppRoutes";
import { AuthContext } from "./context/AuthContext.jsx";

const App = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  return (
    <>
      <AppRoutes />
    </>
  );
};

export default App;