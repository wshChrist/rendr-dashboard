import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/auth/require-admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await assertAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    const supabaseAdmin = createServiceRoleClient();
    const { data, error } = await supabaseAdmin
      .from('admin_calendar')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Événement non trouvé' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: 'Erreur de base de données', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ event: data }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error?.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await assertAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const { id } = await params;

    const supabaseAdmin = createServiceRoleClient();
    const { error } = await supabaseAdmin
      .from('admin_calendar')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: 'Erreur de base de données', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Erreur serveur',
        message: error?.message || 'Une erreur est survenue'
      },
      { status: 500 }
    );
  }
}
