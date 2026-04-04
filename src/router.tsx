import { createBrowserRouter, Navigate } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import HelpLayout from "./components/layout/HelpLayout";
import PlannerPage from "./pages/PlannerPage";
import HelpHubPage from "./pages/HelpHubPage";
import FaqPage from "./pages/FaqPage";
import HowToUsePage from "./pages/HowToUsePage";
import ChangelogPage from "./pages/ChangelogPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <PlannerPage />,
      },
      {
        path: "help",
        element: <HelpLayout />,
        children: [
          {
            index: true,
            element: <HelpHubPage />,
          },
          {
            path: "faq",
            element: <FaqPage />,
          },
          {
            path: "how-to",
            element: <HowToUsePage />,
          },
          {
            path: "changelog",
            element: <ChangelogPage />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
