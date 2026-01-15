import Router from "./Router";
import { AuthProvider } from "./hooks/useAuth";
import { Toaster } from "sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import "./index.css";

function App() {
  return (
    <AuthProvider>
      <TooltipProvider delayDuration={300}>
        <Router />
        <Toaster position="top-right" theme="dark" richColors />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;
