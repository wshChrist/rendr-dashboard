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

export default function TeamPage() {
  // Note: Supabase doesn't have built-in organizations like Clerk
  // This page is simplified to work without Clerk

  return (
    <PageContainer
      pageTitle='Team Management'
      pageDescription='Manage your workspace team, members, roles, security and more.'
    >
      <div className='space-y-6'>
        <Alert>
          <Info className='h-4 w-4' />
          <AlertDescription>
            Team management functionality will be implemented here. You can
            create custom team management using Supabase tables and RLS
            policies.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Team Management</CardTitle>
            <CardDescription>
              Manage your workspace team members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground text-center'>
              Team management coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
