import { createTheme } from "@mui/material";

  const theme =(mode)=> createTheme({
    typography :{
        button:{
            fontSize :'14px'
        }
    },
    palette: {
        mode: mode,
    }
})
export default theme;