import { useNavigate } from "react-router-dom";
import { LayoutDashboard, Settings, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";

export function UserProfileMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const userInitial = user?.email?.[0]?.toUpperCase() || "U";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
        aria-label="User menu"
      >
        <Avatar className="h-10 w-10 cursor-pointer ring-2 ring-white/20 hover:ring-blue-400/50 hover:ring-4">
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
            {userInitial}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 bg-gradient-to-br from-gray-900 to-indigo-900 border border-blue-500/30 shadow-xl shadow-blue-500/20 backdrop-blur-xl"
      >
        <DropdownMenuLabel className="text-white/90">{user?.email}</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          onClick={() => navigate("/dashboard")}
          className="gap-2 cursor-pointer text-white/80 focus:bg-white/10 focus:text-white"
        >
          <LayoutDashboard className="h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => navigate("/settings")}
          className="gap-2 cursor-pointer text-white/80 focus:bg-white/10 focus:text-white"
        >
          <Settings className="h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/10" />
        <DropdownMenuItem
          onClick={handleSignOut}
          className="gap-2 cursor-pointer text-red-400 focus:bg-red-500/20 focus:text-red-300"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
