import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import InstallPWA from './components/InstallPWA'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import EquipmentList from './pages/EquipmentList'
import EquipmentDetail from './pages/EquipmentDetail'
import WorkOrders from './pages/WorkOrders'
import Schedule from './pages/Schedule'
import Inventory from './pages/Inventory'
import Lifecycle from './pages/Lifecycle'
import AlertsPage from './pages/AlertsPage'
import Users from './pages/Users'
import EquipmentScan from './pages/EquipmentScan'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token')
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <InstallPWA />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/scan/:id" element={<EquipmentScan />} />
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="equipment" element={<EquipmentList />} />
          <Route path="equipment/:id" element={<EquipmentDetail />} />
          <Route path="work-orders" element={<WorkOrders />} />
          <Route path="schedule" element={<Schedule />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="lifecycle/:id" element={<Lifecycle />} />
          <Route path="alerts" element={<AlertsPage />} />
          <Route path="users" element={<Users />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
