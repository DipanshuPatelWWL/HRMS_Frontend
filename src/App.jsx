import React, { useContext } from "react";
import { useLocation } from "react-router-dom";

import AppRoutes from "./routes/AppRoutes";
import ChatWidget from "./components/ai/ChatWidget.jsx";
import { AuthContext } from "./context/AuthContext.jsx";

const App = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  // Hide AI assistant on public employee profile
  const hideChat =
    /^\/employee\/[^/]+$/.test(location.pathname);

  return (
    <>
      <AppRoutes />

      {user && !hideChat && <ChatWidget />}
    </>
  );
};

export default App;