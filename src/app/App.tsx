import { useState } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { I18nProvider } from '@/i18n';
import { useSettings } from '@/state';
import { Toaster } from '@/ui';
import { createRoutes } from './routes';
import { PersistenceNotice } from './PersistenceNotice';
import { ThemeController } from './ThemeController';

export function App() {
  const language = useSettings((s) => s.language);
  const [router] = useState(() => createBrowserRouter(createRoutes()));

  return (
    <I18nProvider language={language}>
      <ThemeController />
      <PersistenceNotice />
      <RouterProvider router={router} />
      <Toaster />
    </I18nProvider>
  );
}
