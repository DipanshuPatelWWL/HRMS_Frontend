import React from 'react'
import AppRoutes from "./routes/AppRoutes";
import ChatWidget from "./components/ai/ChatWidget.jsx";
import { useContext } from 'react';
import { AuthContext } from './context/AuthContext.jsx';

const App = () => {
  const { user } = useContext(AuthContext);

  return (
    <>
      <AppRoutes />
      {user && <ChatWidget />}
    </>
  );
}

export default App