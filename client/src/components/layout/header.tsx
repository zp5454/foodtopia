import { BellIcon, Utensils } from "lucide-react";
import { Link } from "wouter";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Header() {
  const isMobile = useIsMobile();
  
  return (
    <header className="bg-white px-4 py-4 border-b border-blue-200 fixed top-0 left-0 right-0 z-10 max-w-md mx-auto shadow-sm">
      <div className="flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <Utensils className="w-7 h-7 text-blue-500" />
            <div className="relative">
              <h1 className="text-xl font-bold bg-gradient-to-r from-blue-500 to-blue-400 bg-clip-text text-transparent">
                Foodtopia
              </h1>
              <span className="absolute text-[10px] font-bold top-0 -right-9 bg-blue-500 text-white px-1 py-0.5 rounded-sm">
                BETA
              </span>
            </div>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <button className="text-slate-500 hover:text-slate-700 transition-colors">
            <BellIcon className="h-6 w-6" />
          </button>
          <button className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
