import { Box, Stack, Button, styled } from '@mui/material';
import { useRouter } from 'next/router';
import { ExitToApp, Dashboard, LocalOffer } from '@mui/icons-material';
import Image from 'next/image';

const LayoutContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: '100vh',
}));

const HeaderBox = styled(Box)(({ theme }) => ({
  width: '100%',
  padding: theme.spacing(2),
  height: '6rem',
  borderBottom: '2px solid #e2e8f0',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
}));

const SidebarBox = styled(Box)(({ theme }) => ({
  width: '250px',
  padding: theme.spacing(2),
  height: 'calc(100vh - 6rem)',
  borderRight: '2px solid #e2e8f0',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
}));

const ContentBox = styled(Box)(({ theme }) => ({
  flex: 1,
  padding: theme.spacing(4),
}));

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const navItems = [
    { name: 'Dashboard', path: '/dashboard', icon: <Dashboard /> },
    { name: 'Releases', path: '/releases', icon: <LocalOffer /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem('isAuthenticated');
    router.push('/');
  };

  return (
    <LayoutContainer>
      <HeaderBox>
        <Box>
          <Image
            src="/xavia_logo.png"
            width={200}
            height={200}
            style={{ objectFit: 'contain' }}
            alt="Xavia Logo"
          />
        </Box>
      </HeaderBox>
      <Box display="flex" height="calc(100vh - 6rem)">
        <SidebarBox>
          <Stack spacing={2}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                variant={router.pathname === item.path ? 'contained' : 'text'}
                color={router.pathname === item.path ? 'primary' : 'inherit'}
                startIcon={item.icon}
                onClick={() => router.push(item.path)}
                sx={{ justifyContent: 'flex-start' }}
              >
                {item.name}
              </Button>
            ))}
          </Stack>
          <Button
            variant="outlined"
            color="error"
            onClick={handleLogout}
            startIcon={<ExitToApp />}
          >
            Logout
          </Button>
        </SidebarBox>
        <ContentBox>{children}</ContentBox>
      </Box>
    </LayoutContainer>
  );
}
