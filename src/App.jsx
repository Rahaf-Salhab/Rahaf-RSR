import { RouterProvider } from "react-router"
import routes from "./routes"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

 
function App() {
  {/*تخزين الداتا بالمتصفح*/}
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
    <RouterProvider router={routes} />
    <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>

    )
}
export default App
