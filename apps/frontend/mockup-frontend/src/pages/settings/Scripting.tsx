import PageHeader from '../../components/PageHeader'
import NavTabs from '../../components/NavTabs'
import { Outlet } from 'react-router-dom'

export const SettingsScripting = () => (
  <section>
    <PageHeader
      breadcrumbs={[{ label: 'Settings', to: '/settings' }, { label: 'Scripting' }]}
      /* Intentionally omit title to show only breadcrumb and pull content upward */
    />
    <NavTabs items={[
      { label: 'All Scripts', to: '/settings/scripting/list', id: 'scripts-list' },
      { label: 'New Script', to: '/settings/scripting/new', id: 'scripts-new' },
    ]} />
    <div className="mx-auto w-full max-w-6xl px-4 pt-4">
      {/* Role tabpanel handled by child components via ids */}
      <Outlet />
    </div>
  </section>
)

export default SettingsScripting


