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
    <nav className="fixed bottom-0 left-0 right-0 bg-background border-t border-border px-4 py-2 flex justify-between items-center max-w-md mx-auto z-10">
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
                  ? "text-primary font-medium" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <link.icon className="h-6 w-6" />
              <span className="text-xs mt-1">{link.label}</span>
            </button>
          </Link>
        );
      })}
    </nav>
  );
}
