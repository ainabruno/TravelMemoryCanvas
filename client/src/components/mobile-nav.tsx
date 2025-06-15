import { Home, MapPin, Plus, Images, User } from "lucide-react";

export default function MobileNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-4 py-2">
      <div className="flex justify-around items-center">
        <button className="flex flex-col items-center py-2 text-adventure-blue">
          <Home className="text-xl mb-1" />
          <span className="text-xs">Home</span>
        </button>
        <button className="flex flex-col items-center py-2 text-slate-600 hover:text-adventure-blue">
          <MapPin className="text-xl mb-1" />
          <span className="text-xs">Trips</span>
        </button>
        <button className="flex flex-col items-center py-2 text-slate-600 hover:text-adventure-blue">
          <Plus className="text-xl mb-1" />
          <span className="text-xs">Add</span>
        </button>
        <button className="flex flex-col items-center py-2 text-slate-600 hover:text-adventure-blue">
          <Images className="text-xl mb-1" />
          <span className="text-xs">Albums</span>
        </button>
        <button className="flex flex-col items-center py-2 text-slate-600 hover:text-adventure-blue">
          <User className="text-xl mb-1" />
          <span className="text-xs">Profile</span>
        </button>
      </div>
    </div>
  );
}
