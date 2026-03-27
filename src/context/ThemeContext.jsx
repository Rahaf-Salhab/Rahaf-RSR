import React, { createContext } from "react";

 export const ThemeContext = createContext();

 export default function ThemeContextProvider({ children }) {
  return <ThemeContext.Provider value={{}}>{children}</ThemeContext.Provider>;
}
