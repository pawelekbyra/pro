import { Button } from "@/components/ui/button";
import MenuIcon from "@/components/icons/MenuIcon";
import BellIcon from "@/components/icons/BellIcon";

const TopBar = () => {
  return (
    <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-black/50 to-transparent flex items-center justify-center text-white p-4 z-10">
      {/* Left Icon */}
      <div className="absolute left-4">
        <Button variant="ghost" size="icon">
          <MenuIcon className="w-6 h-6" />
        </Button>
      </div>

      {/* Center Text */}
      <div className="text-center">
        <p className="font-semibold">Nie masz psychy się zalogować</p>
      </div>

      {/* Right Icon */}
      <div className="absolute right-4">
        <Button variant="ghost" size="icon">
          <BellIcon className="w-6 h-6" />
        </Button>
      </div>
    </div>
  );
};

export default TopBar;
