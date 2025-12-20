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

export default function BillingPage() {
  // Note: Supabase doesn't have built-in organizations or billing
  // This page is simplified to work without Clerk

  return (
    <PageContainer>
      <div className='space-y-6'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Billing & Plans</h1>
          <p className='text-muted-foreground'>
            Manage your subscription and usage limits
          </p>
        </div>

        {/* Info Alert */}
        <Alert>
          <Info className='h-4 w-4' />
          <AlertDescription>
            Billing functionality will be implemented here. You can integrate
            with Stripe, Paddle, or another payment provider.
          </AlertDescription>
        </Alert>

        {/* Placeholder for billing */}
        <Card>
          <CardHeader>
            <CardTitle>Available Plans</CardTitle>
            <CardDescription>
              Choose a plan that fits your needs
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='mx-auto max-w-4xl'>
              <p className='text-muted-foreground text-center'>
                Billing integration coming soon
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
