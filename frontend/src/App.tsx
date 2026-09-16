import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './lib/AuthContext';
import { RequireAuth } from './components/RequireAuth/RequireAuth';
import { UserLayout } from './layouts/UserLayout/UserLayout';
import { AdminLayout } from './layouts/AdminLayout/AdminLayout';
import { Login } from './pages/Login/Login';
import { Home } from './pages/user/Home/Home';
import { AreaList } from './pages/user/AreaList/AreaList';
import { SpaceDetail } from './pages/user/SpaceDetail/SpaceDetail';
import { Reservations } from './pages/user/Reservations/Reservations';
import { AnnouncementList } from './pages/user/AnnouncementList/AnnouncementList';
import { AnnouncementDetail } from './pages/user/AnnouncementDetail/AnnouncementDetail';
import { UserList } from './pages/admin/UserList/UserList';
import { UserDetail } from './pages/admin/UserDetail/UserDetail';
import { AreaSpaceList } from './pages/admin/AreaSpaceList/AreaSpaceList';
import { AreaDetail } from './pages/admin/AreaDetail/AreaDetail';
import { SpaceDetail as AdminSpaceDetail } from './pages/admin/SpaceDetail/SpaceDetail';
import { ScheduleList } from './pages/admin/ScheduleList/ScheduleList';
import { ScheduleDetail } from './pages/admin/ScheduleDetail/ScheduleDetail';
import { Calendar } from './pages/admin/Calendar/Calendar';
import { AnnouncementList as AdminAnnouncementList } from './pages/admin/AnnouncementList/AnnouncementList';
import { AnnouncementDetail as AdminAnnouncementDetail } from './pages/admin/AnnouncementDetail/AnnouncementDetail';
import { NotFound } from './pages/NotFound/NotFound';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route
            path="/"
            element={
              <RequireAuth>
                <UserLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Home />} />
            <Route path="areas" element={<AreaList />} />
            <Route path="spaces/:spaceId" element={<SpaceDetail />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="announcements" element={<AnnouncementList />} />
            <Route path="announcements/:announcementId" element={<AnnouncementDetail />} />
          </Route>

          <Route
            path="/admin"
            element={
              <RequireAuth adminOnly>
                <AdminLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Navigate to="schedules" replace />} />
            <Route path="users" element={<UserList />} />
            <Route path="users/:userId" element={<UserDetail />} />
            <Route path="areas" element={<AreaSpaceList />} />
            <Route path="areas/:areaId" element={<AreaDetail />} />
            <Route path="spaces/:spaceId" element={<AdminSpaceDetail />} />
            <Route path="schedules" element={<ScheduleList />} />
            <Route path="schedules/:reservationId" element={<ScheduleDetail />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="announcements" element={<AdminAnnouncementList />} />
            <Route path="announcements/:announcementId" element={<AdminAnnouncementDetail />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
