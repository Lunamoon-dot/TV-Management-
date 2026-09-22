import { Outlet } from 'react-router'
import { AccountNav } from '../../features/auth/components/AccountNav'

export function CustomerLayout() {
  return <>
    <AccountNav />
    <Outlet />
  </>
}
