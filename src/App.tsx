import Router from "./Router";
import { AuthProvider } from "./hooks/useAuth";
import "./index.css";

function App() {
  return (
    <AuthProvider>
      <Router />
    </AuthProvider>
  );
}

export default App;
