import { useEffect, useRef, useState } from 'react';
import React from 'react';
import {
  MantineProvider,
  Text,
  Stack,
  Divider,
  Button,
  Box,
  ActionIcon,
  Group,
  Paper,
  Title,
  Container,
} from '@mantine/core';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { ResponsiveTabMenu, type TabItem } from 'responsive-tab-menu-react';

const tabs: TabItem[] = [
  { label: 'Home', value: 'home' },
  { label: 'Projects', value: 'projects' },
  { label: 'About', value: 'about' },
  { label: 'Contact', value: 'contact' },
  { label: 'More Items', value: 'more-items' },
  { label: 'Really Long Tab Name', value: 'long-tab' }
];

function DebugMeasurements({
  items,
  containerRef,
}: {
  items: TabItem[];
  containerRef: React.RefObject<HTMLDivElement>;
}) {
  const virtualRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [dimensions, setDimensions] = useState<any>({});
  const [show, setShow] = useState(true);

  const update = () => {
    const containerWidth = containerRef.current?.offsetWidth || 0;
    const availableWidth = containerWidth - 96;

    const tabWidths = virtualRefs.current.map((ref, i) => ({
      label: items[i]?.label,
      width: ref?.offsetWidth || 0,
    }));

    let usedWidth = 0;
    let splitIndex = items.length;

    for (let i = 0; i < tabWidths.length; i++) {
      usedWidth += tabWidths[i].width + 8;
      if (usedWidth > availableWidth) {
        usedWidth -= tabWidths[i].width + 8;
        splitIndex = i;
        break;
      }
    }

    // ✅ Fix for 100% use case
    if (splitIndex === items.length) {
      usedWidth = tabWidths.reduce((acc, tab) => acc + tab.width + 8, 0);
    }

    setDimensions({
      containerWidth,
      availableWidth,
      totalTabs: items.length,
      totalWidth: tabWidths.reduce((acc, tab) => acc + tab.width + 8, 0),
      usedWidth,
      percentUsed: Math.round((usedWidth / availableWidth) * 100),
      visible: tabWidths.slice(0, splitIndex),
      overflow: tabWidths.slice(splitIndex),
    });
  };

  useEffect(() => {
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <>
      <Box
        style={{
          visibility: 'hidden',
          position: 'absolute',
          height: 0,
          overflow: 'hidden',
        }}
      >
        {items.map((item, i) => (
          <Button
            key={'virtual-' + item.value}
            ref={(el) => (virtualRefs.current[i] = el)}
            size="sm"
            variant="subtle"
            radius="sm"
          >
            {item.label}
          </Button>
        ))}
      </Box>

      <Group justify="space-between" mt="xl" mb="xs">
        <Title order={3} fw={700} c="pink.9">
          📐 Passive Tab Debug Panel
        </Title>
        <ActionIcon variant="light" color="pink" onClick={() => setShow((prev) => !prev)}>
          {show ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
        </ActionIcon>
      </Group>

      {show && (
        <Paper
          withBorder
          radius="md"
          p={32}
          style={{
            backgroundColor: '#fff0f0',
            border: '1px solid #fcc',
            fontSize: 14,
          }}
        >
          <Text><strong>Container Width:</strong> {dimensions.containerWidth}px</Text>
          <Text><strong>Available Width (−96px):</strong> {dimensions.availableWidth}px</Text>
          <Text><strong>Total Tabs:</strong> {dimensions.totalTabs}</Text>
          <Text><strong>Total Width Needed:</strong> {dimensions.totalWidth}px</Text>
          <Text>
            <strong>Total Visible Width:</strong> {dimensions.usedWidth}px ({dimensions.percentUsed || 0}% of available)
          </Text>
          <Divider my="sm" />
          <Text fw={600}>Visible Tabs ({dimensions.visible?.length}):</Text>
          <Stack gap={4}>
            {dimensions.visible?.map((tab, idx) => (
              <Text key={`v-${idx}`}>- {tab.label}: {tab.width}px</Text>
            ))}
          </Stack>
          <Divider my="sm" />
          <Text fw={600}>Overflow Tabs ({dimensions.overflow?.length}):</Text>
          <Stack gap={4}>
            {dimensions.overflow?.map((tab, idx) => (
              <Text key={`o-${idx}`}>- {tab.label}: {tab.width}px</Text>
            ))}
          </Stack>
        </Paper>
      )}
    </>
  );
}

function App() {
  const [active, setActive] = useState('home');
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <MantineProvider>
      <Box
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom right, #ffe6e6, #fff)',
        }}
      >
        <Container size="md" py={40} ref={containerRef}>
          <Title order={2} mb="lg" c="pink.9" fw={800}>
            Responsive Tab Menu Demo
          </Title>
          <ResponsiveTabMenu items={tabs} active={active} onChange={setActive} />
          <DebugMeasurements items={tabs} containerRef={containerRef} />
        </Container>
      </Box>
    </MantineProvider>
  );
}

export default App;
