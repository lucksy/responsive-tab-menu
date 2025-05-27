import { useState } from 'react';
import { ResponsiveTabMenu, TabItem } from 'responsive-tab-menu-react';
import { Container, Title, Paper } from '@mantine/core'; // For basic layout

// Sample tabs - can be simpler than the full Mantine demo
const initialTabs: TabItem[] = [
  { label: 'Home', value: 'home' },
  { label: 'Profile', value: 'profile' },
  { label: 'Settings', value: 'settings' },
  { label: 'Messages', value: 'messages' },
  { label: 'Notifications', value: 'notifications' },
  { label: 'Users', value: 'users' },
  { label: 'Tasks', value: 'tasks' },
];

function App() {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <Container py="lg">
      <Title order={2} mb="lg">React Responsive Tab Menu</Title>
      <Paper shadow="xs" p="md" withBorder>
        <ResponsiveTabMenu
          items={initialTabs}
          active={activeTab}
          onChange={(value) => {
            console.log('React Demo: Active tab changed to', value);
            setActiveTab(value);
          }}
          menuLabel="More Options"
        />
      </Paper>
      <div style={{ marginTop: '20px', padding: '10px', border: '1px solid #eee' }}>
        Current Active Tab: <strong>{activeTab}</strong>
      </div>
    </Container>
  );
}

export default App;
