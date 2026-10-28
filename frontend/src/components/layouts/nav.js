import {
  LayoutDashboard,
  Building2,
  GraduationCap,
  BookOpen,
  ListChecks,
  CalendarRange,
  Users,
  ClipboardCheck,
  History,
  CalendarDays,
  FileText,
  ShieldAlert,
  ChartColumn,
  Target,
  UserRound,
} from 'lucide-react';

/**
 * Single source of truth for every role's navigation. The shell renders the
 * same markup for all four portals — only this data changes.
 */
export const navConfig = {
  admin: {
    portal: 'Administration',
    sections: [
      {
        title: 'Overview',
        items: [{ to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true }],
      },
      {
        title: 'Academics',
        items: [
          { to: '/admin/departments', label: 'Departments', icon: Building2 },
          { to: '/admin/classes', label: 'Classes', icon: GraduationCap },
          { to: '/admin/subjects', label: 'Subjects', icon: BookOpen },
          { to: '/admin/subject-mapping', label: 'Faculty Mapping', icon: ListChecks },
          { to: '/admin/timetable-setup', label: 'Timetable', icon: CalendarRange },
        ],
      },
      {
        title: 'People',
        items: [{ to: '/admin/users', label: 'User Directory', icon: Users }],
      },
    ],
  },

  faculty: {
    portal: 'Faculty',
    sections: [
      {
        title: 'Overview',
        items: [{ to: '/faculty', label: 'Dashboard', icon: LayoutDashboard, end: true }],
      },
      {
        title: 'Teaching',
        items: [
          { to: '/faculty/take-attendance', label: 'Take Attendance', icon: ClipboardCheck },
          { to: '/faculty/history', label: 'History', icon: History },
          { to: '/faculty/timetable', label: 'Schedule', icon: CalendarDays },
          { to: '/faculty/classes', label: 'My Classes', icon: Users },
        ],
      },
      {
        title: 'Requests',
        items: [
          { to: '/faculty/leaves', label: 'Leave Inbox', icon: FileText },
          { to: '/faculty/disputes', label: 'Disputes', icon: ShieldAlert },
        ],
      },
    ],
  },

  student: {
    portal: 'Student',
    sections: [
      {
        title: 'Academics',
        items: [
          { to: '/student', label: 'My Attendance', icon: ChartColumn, end: true },
          { to: '/student/projections', label: 'Projections', icon: Target },
          { to: '/student/timetable', label: 'Schedule', icon: CalendarDays },
        ],
      },
      {
        title: 'Leave',
        items: [
          { to: '/student/apply-leave', label: 'Apply for Leave', icon: FileText },
          { to: '/student/leaves', label: 'Leave History', icon: History },
        ],
      },
      {
        title: 'Account',
        items: [{ to: '/student/profile', label: 'My Profile', icon: UserRound }],
      },
    ],
  },

  parent: {
    portal: 'Parent',
    sections: [
      {
        title: 'Overview',
        items: [{ to: '/parent', label: 'My Wards', icon: Users, end: true }],
      },
    ],
  },
};

export function isActivePath(pathname, item) {
  return item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(`${item.to}/`);
}

export function currentSection(pathname, config) {
  for (const section of config.sections) {
    const item = section.items.find((entry) => isActivePath(pathname, entry));
    if (item) return { section: section.title, item };
  }
  return null;
}
