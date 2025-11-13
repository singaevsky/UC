import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';

const supabase = getServerClient();

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderItemId = searchParams.get('order_item_id');
    const status = searchParams.get('status');
    const assignedTo = searchParams.get('assigned_to');

    let query = supabase.from('production_stages').select('*');

    if (orderItemId) query = query.eq('order_item_id', Number(orderItemId));
    if (status) query = query.eq('status', status);
    if (assignedTo) query = query.eq('assigned_to', assignedTo);

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const stage = await req.json();

    const stageData: any = { ...stage };
    if (stage.status === 'in_progress') {
      stageData.started_at = new Date().toISOString();
    } else if (stage.status === 'completed') {
      stageData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('production_stages')
      .insert([stageData])
      .select()
      .single();

    if (error) throw error;

    // Создаем следующий этап автоматически
    if (stage.status === 'completed') {
      const nextStageNames = {
        'preparation': 'baking',
        'baking': 'cooling',
        'cooling': 'decoration',
        'decoration': 'final_check',
        'final_check': 'packaging'
      };

      const nextStage = nextStageNames[stage.stage_name as keyof typeof nextStageNames];
      if (nextStage) {
        await supabase.from('production_stages').insert([{
          order_item_id: stage.order_item_id,
          stage_name: nextStage,
          assigned_to: stage.assigned_to
        }]);
      }
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...updates } = await req.json();

    const updateData: any = { ...updates };
    if (updates.status === 'in_progress' && !updates.started_at) {
      updateData.started_at = new Date().toISOString();
    } else if (updates.status === 'completed' && !updates.completed_at) {
      updateData.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('production_stages')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
