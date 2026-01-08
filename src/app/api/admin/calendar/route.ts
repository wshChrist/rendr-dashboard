import { NextResponse } from 'next/server';
import { assertAdminApi } from '@/lib/auth/require-admin';
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function GET() {
  const auth = await assertAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const supabaseAdmin = createServiceRoleClient();
    const { data, error } = await supabaseAdmin
      .from('admin_calendar')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: 'Erreur de base de données', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ events: data || [] }, { status: 200 });
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

export async function POST(request: Request) {
  const auth = await assertAdminApi();
  if (!auth.ok) return auth.response;

  try {
    const body = await request.json();
    const { title, description, start_time, end_time, location, attendees } =
      body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Le titre est requis' },
        { status: 400 }
      );
    }

    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: 'Les dates sont requises' },
        { status: 400 }
      );
    }

    if (new Date(end_time) <= new Date(start_time)) {
      return NextResponse.json(
        { error: 'La date de fin doit être après la date de début' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createServiceRoleClient();
    const { data, error } = await supabaseAdmin
      .from('admin_calendar')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        start_time,
        end_time,
        location: location?.trim() || null,
        attendees: attendees || []
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: 'Erreur de base de données', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ event: data }, { status: 201 });
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
