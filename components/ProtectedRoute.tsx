import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      // Check both localStorage and cookie
      const localAuth = localStorage.getItem('isAuthenticated');
      const authCookie = document.cookie
        .split('; ')
        .find((row) => row.startsWith('isAuthenticated='));

      const isCookieAuth = authCookie && authCookie.split('=')[1] === 'true';

      if (!localAuth && !isCookieAuth) {
        router.push('/');
      } else if (isCookieAuth && !localAuth) {
        // Sync localStorage with cookie
        localStorage.setItem('isAuthenticated', 'true');
      }
    };

    checkAuth();
  }, [router]);

  return <>{children}</>;
}
