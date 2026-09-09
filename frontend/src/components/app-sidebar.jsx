import * as React from 'react';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  UserCheck,
  Stethoscope,
  Hospital,
} from 'lucide-react';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

export function AppSidebar({ ...props }) {
  const { user } = useAuth();

  // Menu items flat (tanpa nested), disaring sesuai role
  const navItems = React.useMemo(() => {
    const items = [];

    // Dashboard dapat diakses oleh ketiga role (admin, receptionist, doctor)
    items.push({
      title: 'Dashboard',
      url: '/dashboard',
      icon: LayoutDashboard,
    });

    if (user?.role === 'admin' || user?.role === 'receptionist') {
      items.push(
        {
          title: 'Data Pasien',
          url: '/patients',
          icon: Users,
        },
        {
          title: 'Pendaftaran',
          url: '/registrations',
          icon: ClipboardList,
        },
        {
          title: 'Kelola Antrean',
          url: '/queues',
          icon: UserCheck,
        }
      );
    }

    if (user?.role === 'doctor' || user?.role === 'admin') {
      items.push({
        title: 'Pemeriksaan (SOAP)',
        url: '/examination',
        icon: Stethoscope,
      });
    }

    return items;
  }, [user?.role]);

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <div className="flex items-center gap-3 cursor-default">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-teal-600 text-white shadow-sm">
                  <Hospital className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">SIM Klinik</span>
                  <span className="truncate text-xs text-muted-foreground capitalize">
                    {user?.role ? `${user.role}` : 'Sistem Medis'}
                  </span>
                </div>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Menu Navigasi Utama Tanpa Nested */}
        <NavMain items={navItems} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
