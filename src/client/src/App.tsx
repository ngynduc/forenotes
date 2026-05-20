import { useRoutes } from "react-router";
import { routes } from "@/config/routes";

export default function App() {
  const element = useRoutes(routes);
  return element;
}
