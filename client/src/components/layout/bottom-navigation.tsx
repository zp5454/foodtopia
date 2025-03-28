import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, Utensils, Activity, BarChart2, Settings } from "lucide-react";

interface BottomNavigationProps {
  currentPath?: string;
}

export default function BottomNavigation({ currentPath }: BottomNavigationProps) {
  const [location] = useLocation();
  const activePath = currentPath || location;
  
  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/food", label: "Food", icon: Utensils },
    { href: "/workout", label: "Workout", icon: Activity },
    { href: "/progress", label: "Progress", icon: BarChart2 },
    { href: "/settings", label: "Settings", icon: Settings },
  ];
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-blue-200 px-4 py-2 flex justify-between items-center max-w-md mx-auto z-10 shadow-lg">
      {links.map((link) => {
        const isActive = activePath === link.href;
        return (
          <Link 
            key={link.href} 
            href={link.href}
            className="flex flex-col items-center justify-center w-1/5"
          >
            <button className={cn(
                "flex flex-col items-center justify-center w-full transition-colors",
                isActive 
                  ? "text-blue-500 font-medium" 
                  : "text-slate-500 hover:text-slate-800"
              )}
            >
              <link.icon className={cn("h-6 w-6", isActive ? "fill-blue-100" : "")} />
              <span className="text-xs mt-1 font-medium">{link.label}</span>
            </button>
          </Link>
        );
      })}
    </nav>
  );
}
