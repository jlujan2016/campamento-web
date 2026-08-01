import { NavLink } from 'react-router-dom';
import { Home, BarChart2, Users } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function BottomNav() {
  const { user } = useAuth();

  // El tab de Admin solo se muestra al super admin.
  // PENDIENTE: los admins de evento (que no son super admin) tampoco lo ven —
  // se resuelve agregando is_any_event_admin en /auth/me (opción B)
  const links = [
    { to: '/',        label: 'Inicio',  icon: Home },
    { to: '/ranking', label: 'Ranking', icon: BarChart2 },
    ...(user?.is_super_admin
      ? [{ to: '/admin', label: 'Admin', icon: Users }]
      : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t
                    border-gray-100 flex justify-around py-2 z-40">
      {links.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-4 py-1 text-xs
             ${isActive ? 'text-blue-600' : 'text-gray-400'}`
          }
        >
          <Icon className="w-5 h-5" />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}