import { NavLink } from 'react-router-dom';
import { Home, Calendar, BarChart2, Users } from 'lucide-react';

const links = [
  { to: '/',        label: 'Inicio',   icon: Home },
  { to: '/ranking', label: 'Ranking',  icon: BarChart2 },
  { to: '/admin',   label: 'Admin',    icon: Users },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100
                    flex items-center justify-around px-2 pb-safe">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 py-3 px-4 rounded-xl transition-colors
             ${isActive ? 'text-blue-600' : 'text-gray-400'}`
          }
        >
          <Icon className="w-5 h-5" />
          <span className="text-xs font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}