import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import ProductViewPage from '@/features/products/components/product-view-page';

export const metadata = {
  title: 'Dashboard : Product View'
};

type PageProps = { params: Promise<{ productId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  return (
    <PageContainer scrollable>
      <div className='relative flex flex-1 flex-col space-y-6 overflow-x-hidden'>
        {/* Main Content */}
        <section className='space-y-4'>
          <Suspense fallback={<FormCardSkeleton />}>
            <ProductViewPage productId={params.productId} />
          </Suspense>
        </section>
      </div>
    </PageContainer>
  );
}
