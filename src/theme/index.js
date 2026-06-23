import { createTheme } from "@mui/material";
import { dark } from "@mui/material/styles/createPalette";

  const theme =(mode)=> createTheme({
    typography :{
        button:{
            fontSize :'14px'
        }
    },
    palette: {
        mode: mode,
    },
   
})
export default theme;