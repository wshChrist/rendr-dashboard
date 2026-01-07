import PageContainer from '@/components/layout/page-container';
import { KanbanBoard } from './kanban-board';
import NewTaskDialog from './new-task-dialog';

export default function KanbanViewPage() {
  return (
    <PageContainer
      pageTitle='Kanban'
      pageDescription='Manage tasks by dnd'
      pageHeaderAction={<NewTaskDialog />}
    >
      <div className='relative flex flex-1 flex-col space-y-6 overflow-x-hidden'>
        {/* Main Content */}
        <section className='space-y-4'>
          <KanbanBoard />
        </section>
      </div>
    </PageContainer>
  );
}
