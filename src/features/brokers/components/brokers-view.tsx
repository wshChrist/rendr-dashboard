'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MyBrokers } from './my-brokers';
import { AvailableBrokers } from './available-brokers';

export function BrokersView() {
  return (
    <Tabs defaultValue='my-brokers' className='space-y-4'>
      <TabsList>
        <TabsTrigger value='my-brokers'>Mes Comptes</TabsTrigger>
        <TabsTrigger value='available'>Brokers Partenaires</TabsTrigger>
      </TabsList>
      <TabsContent value='my-brokers' className='space-y-4'>
        <MyBrokers />
      </TabsContent>
      <TabsContent value='available' className='space-y-4'>
        <AvailableBrokers />
      </TabsContent>
    </Tabs>
  );
}
