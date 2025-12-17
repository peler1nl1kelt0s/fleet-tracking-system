import React from 'react';
import { Admin, Resource, CustomRoutes, Layout, Menu } from 'react-admin';
import { Route } from 'react-router-dom';
import { createTheme } from '@mui/material/styles';
import dataProvider from './dataProvider';
import { ScenarioList, ScenarioEdit, ScenarioCreate } from './ChatScenarios';
import SystemConfig from './SystemConfig';
import AdminDashboard from './AdminDashboard';

// Icons
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/Dashboard';

// Custom Theme matching Tailwind config
const theme = createTheme({
    palette: {
        primary: {
            main: '#3b82f6', // primary-500
            light: '#60a5fa', // primary-400
            dark: '#2563eb', // primary-600
        },
        secondary: {
            main: '#64748b', // gray-500
            light: '#94a3b8', // gray-400
            dark: '#475569', // gray-600
        },
        background: {
            default: '#f8fafc', // gray-50
            paper: '#ffffff',
        },
    },
    typography: {
        fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    },
    components: {
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: '#1e293b', // gray-800
                },
            },
        },
    },
});

const MyMenu = () => (
    <Menu>
        <Menu.Item to="/admin" primaryText="Dashboard" leftIcon={<DashboardIcon />} />
        <Menu.Item to="/admin/chat-scenarios" primaryText="Pulse Chat Scenarios" leftIcon={<ChatBubbleIcon />} />
        <Menu.Item to="/admin/system-config" primaryText="System Config" leftIcon={<SettingsIcon />} />
    </Menu>
);

const MyLayout = (props) => <Layout {...props} menu={MyMenu} />;

const AdminApp = () => (
    <Admin 
        basename="/admin" 
        dataProvider={dataProvider} 
        dashboard={AdminDashboard} 
        layout={MyLayout}
        theme={theme}
    >
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