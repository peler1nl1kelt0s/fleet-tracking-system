import React from 'react';
import { Admin, Resource, CustomRoutes, Layout, Menu } from 'react-admin';
import { Route } from 'react-router-dom';
import dataProvider from './dataProvider';
import { ScenarioList, ScenarioEdit, ScenarioCreate } from './ChatScenarios';
import SystemConfig from './SystemConfig';
import AdminDashboard from './AdminDashboard';

// Icons
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';

const MyMenu = () => (
    <Menu>
        <Menu.Item to="/admin" primaryText="Dashboard" leftIcon={<DashboardIcon />} />
        <Menu.Item to="/admin/chat-scenarios" primaryText="Pulse Chat Scenarios" leftIcon={<ChatBubbleIcon />} />
        <Menu.Item to="/admin/system-config" primaryText="System Config" leftIcon={<SettingsIcon />} />
    </Menu>
);

const MyLayout = (props) => <Layout {...props} menu={MyMenu} />;

const AdminApp = () => (
    <Admin basename="/admin" dataProvider={dataProvider} dashboard={AdminDashboard} layout={MyLayout}>
        <Resource 
            name="chat-scenarios" 
            list={ScenarioList} 
            edit={ScenarioEdit} 
            create={ScenarioCreate}
        />
        <CustomRoutes>
            <Route path="/system-config" element={<SystemConfig />} />
        </CustomRoutes>
    </Admin>
);

export default AdminApp;