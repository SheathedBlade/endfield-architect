import { Outlet, useLocation } from "react-router-dom";
import HelpNav from "../navigation/HelpNav";

const HelpLayout = () => {
  const location = useLocation();

  return (
    <div className="help-layout">
      <HelpNav />
      <div key={location.pathname} className="help-content page-transition">
        <Outlet />
      </div>
    </div>
  );
};

export default HelpLayout;
