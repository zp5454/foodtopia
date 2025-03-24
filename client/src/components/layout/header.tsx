import { BellIcon } from "lucide-react";
import { Link } from "wouter";

export default function Header() {
  return (
    <header className="bg-white px-4 py-4 border-b border-gray-200 fixed top-0 left-0 right-0 z-10 max-w-md mx-auto">
      <div className="flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
            </svg>
            <h1 className="text-xl font-bold text-gray-800">FitTrack</h1>
          </div>
        </Link>
        <div className="flex items-center gap-3">
          <button className="text-gray-500">
            <BellIcon className="h-6 w-6" />
          </button>
          <button className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
