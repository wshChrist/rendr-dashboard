'use client';

import PageContainer from '@/components/layout/page-container';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function WorkspacesPage() {
  // Note: Supabase doesn't have built-in organizations like Clerk
  // This page is simplified to work without Clerk

  return (
    <PageContainer
      pageTitle='Workspaces'
      pageDescription='Manage your workspaces and switch between them'
    >
      <div className='space-y-6'>
        <Alert>
          <Info className='h-4 w-4' />
          <AlertDescription>
            Workspace functionality will be implemented here. You can create
            custom organization/workspace management using Supabase tables.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Workspaces</CardTitle>
            <CardDescription>Create and manage your workspaces</CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground text-center'>
              Workspace management coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
