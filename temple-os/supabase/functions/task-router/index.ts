// ============================================================
// TASK ROUTER — Sonic Agent Work Distribution System
// ============================================================
// Routes tasks to the best-suited agents based on:
// - Sector expertise
// - Success rate
// - Availability
// - Skill matching
// ============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================
// TYPES
// ============================================================

type TaskAction = 'create' | 'assign' | 'start' | 'complete' | 'cancel' | 'status' | 'batch_create' | 'process_queue';

interface TaskRequest {
  action: TaskAction;
  taskId?: string;
  tasks?: TaskInput[];
  task?: TaskInput;
  result?: TaskResult;
  limit?: number;
}

interface TaskInput {
  title: string;
  description?: string;
  taskType: string;
  sector?: string;
  tribe?: string;
  class?: string;
  minSuccessRate?: number;
  requiredSkills?: string[];
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  userId?: string;
  tenantId?: string;
  deadline?: string;
}

interface TaskResult {
  success: boolean;
  data?: Record<string, unknown>;
  confidence?: number;
  notes?: string;
}

interface Agent {
  id: string;
  name: string;
  tribe: string;
  sector: string;
  class: string;
  success_rate: number;
  learning_velocity: number;
  task_specializations: Record<string, number>;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function createSupabase(): SupabaseClient {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

function priorityToInt(priority: string): number {
  switch (priority) {
    case 'CRITICAL': return 100;
    case 'HIGH': return 75;
    case 'MEDIUM': return 50;
    case 'LOW': return 25;
    default: return 50;
  }
}

// ============================================================
// TASK OPERATIONS
// ============================================================

async function createTask(
  supabase: SupabaseClient,
  task: TaskInput
): Promise<{ taskId: string; assigned: boolean; agentId?: string; agentName?: string }> {
  // Create the task
  const { data: newTask, error: taskError } = await supabase
    .from('sonic_tasks')
    .insert({
      title: task.title,
      description: task.description,
      task_type: task.taskType,
      required_sector: task.sector || null,
      required_tribe: task.tribe || null,
      required_class: task.class || null,
      min_success_rate: task.minSuccessRate || 0.5,
      required_skills: task.requiredSkills || [],
      priority: task.priority || 'MEDIUM',
      user_id: task.userId || null,
      tenant_id: task.tenantId || null,
      deadline: task.deadline || null,
      status: 'PENDING',
    })
    .select('id')
    .single();

  if (taskError) throw new Error(`Failed to create task: ${taskError.message}`);

  const taskId = newTask.id;

  // Try to auto-assign to best available agent
  const agent = await findBestAgent(supabase, task);

  if (agent) {
    const assigned = await assignTask(supabase, taskId, agent.id);
    if (assigned) {
      return { taskId, assigned: true, agentId: agent.id, agentName: agent.name };
    }
  }

  // Add to queue if no agent available
  await supabase.from('task_queue').insert({
    task_id: taskId,
    priority: priorityToInt(task.priority || 'MEDIUM'),
  });

  return { taskId, assigned: false };
}

async function findBestAgent(
  supabase: SupabaseClient,
  requirements: Partial<TaskInput>
): Promise<Agent | null> {
  let query = supabase
    .from('sonic_agents')
    .select(`
      id, name, tribe, sector, class, success_rate, learning_velocity, task_specializations,
      agent_availability!inner(is_available, tasks_in_progress, max_concurrent_tasks, total_tasks_today, daily_task_limit)
    `)
    .eq('status', 'ACTIVE')
    .eq('agent_availability.is_available', true)
    .gte('success_rate', requirements.minSuccessRate || 0.5);

  if (requirements.sector) {
    query = query.eq('sector', requirements.sector);
  }
  if (requirements.tribe) {
    query = query.eq('tribe', requirements.tribe);
  }
  if (requirements.class) {
    query = query.eq('class', requirements.class);
  }

  const { data: agents, error } = await query
    .order('success_rate', { ascending: false })
    .order('learning_velocity', { ascending: false })
    .limit(10);

  if (error || !agents?.length) return null;

  // Filter by availability constraints
  const availableAgents = agents.filter((a: any) => {
    const avail = a.agent_availability;
    return avail.tasks_in_progress < avail.max_concurrent_tasks &&
           avail.total_tasks_today < avail.daily_task_limit;
  });

  if (!availableAgents.length) return null;

  // Score agents by skill match if required skills specified
  if (requirements.requiredSkills?.length) {
    const scored = availableAgents.map((agent: any) => {
      const specs = agent.task_specializations || {};
      let skillScore = 0;
      for (const skill of requirements.requiredSkills!) {
        skillScore += (specs[skill] as number) || 0;
      }
      return { ...agent, skillScore };
    });
    scored.sort((a: any, b: any) => b.skillScore - a.skillScore);
    return scored[0];
  }

  return availableAgents[0];
}

async function assignTask(
  supabase: SupabaseClient,
  taskId: string,
  agentId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('assign_task_to_agent', {
    p_task_id: taskId,
    p_agent_id: agentId,
  });

  return !error && data === true;
}

async function startTask(
  supabase: SupabaseClient,
  taskId: string
): Promise<{ success: boolean; agent?: Agent }> {
  const { data: task, error } = await supabase
    .from('sonic_tasks')
    .update({
      status: 'IN_PROGRESS',
      started_at: new Date().toISOString(),
    })
    .eq('id', taskId)
    .eq('status', 'ASSIGNED')
    .select('assigned_agent_id')
    .single();

  if (error || !task) return { success: false };

  // Get agent details
  const { data: agent } = await supabase
    .from('sonic_agents')
    .select('id, name, tribe, sector, class, success_rate, task_specializations')
    .eq('id', task.assigned_agent_id)
    .single();

  return { success: true, agent };
}

async function completeTask(
  supabase: SupabaseClient,
  taskId: string,
  result: TaskResult
): Promise<{ success: boolean; agentUpdated: boolean }> {
  const { data, error } = await supabase.rpc('complete_task', {
    p_task_id: taskId,
    p_success: result.success,
    p_result: result.data || null,
    p_confidence: result.confidence || null,
    p_notes: result.notes || null,
  });

  return { success: !error && data === true, agentUpdated: data === true };
}

async function cancelTask(
  supabase: SupabaseClient,
  taskId: string
): Promise<boolean> {
  // Get task info
  const { data: task } = await supabase
    .from('sonic_tasks')
    .select('assigned_agent_id, status')
    .eq('id', taskId)
    .single();

  if (!task) return false;

  // Update task status
  const { error } = await supabase
    .from('sonic_tasks')
    .update({ status: 'CANCELLED' })
    .eq('id', taskId)
    .in('status', ['PENDING', 'ASSIGNED', 'IN_PROGRESS']);

  if (error) return false;

  // Free up agent if assigned
  if (task.assigned_agent_id && task.status !== 'PENDING') {
    await supabase
      .from('agent_availability')
      .update({
        tasks_in_progress: supabase.rpc('greatest', { a: 0, b: -1 }), // Decrement but not below 0
        is_available: true,
        current_task_id: null,
        updated_at: new Date().toISOString(),
      })
      .eq('agent_id', task.assigned_agent_id);
  }

  // Remove from queue
  await supabase.from('task_queue').delete().eq('task_id', taskId);

  return true;
}

async function getTaskStatus(
  supabase: SupabaseClient,
  taskId: string
): Promise<Record<string, unknown> | null> {
  const { data: task, error } = await supabase
    .from('sonic_tasks')
    .select(`
      *,
      agent:sonic_agents!assigned_agent_id(id, name, tribe, sector, success_rate)
    `)
    .eq('id', taskId)
    .single();

  if (error) return null;
  return task;
}

async function batchCreateTasks(
  supabase: SupabaseClient,
  tasks: TaskInput[]
): Promise<{ created: number; assigned: number; queued: number }> {
  let created = 0;
  let assigned = 0;
  let queued = 0;

  for (const task of tasks) {
    try {
      const result = await createTask(supabase, task);
      created++;
      if (result.assigned) {
        assigned++;
      } else {
        queued++;
      }
    } catch (e) {
      console.error('Failed to create task:', e);
    }
  }

  return { created, assigned, queued };
}

async function processQueue(
  supabase: SupabaseClient,
  limit: number = 50
): Promise<{ processed: number; assigned: number }> {
  // Get pending tasks from queue
  const { data: queueItems, error } = await supabase
    .from('task_queue')
    .select(`
      id,
      task_id,
      sonic_tasks!inner(
        id, required_sector, required_tribe, required_class,
        min_success_rate, required_skills, status
      )
    `)
    .eq('sonic_tasks.status', 'PENDING')
    .is('locked_by', null)
    .order('priority', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error || !queueItems?.length) {
    return { processed: 0, assigned: 0 };
  }

  let processed = 0;
  let assigned = 0;

  for (const item of queueItems) {
    const task = (item as any).sonic_tasks;

    const agent = await findBestAgent(supabase, {
      sector: task.required_sector,
      tribe: task.required_tribe,
      class: task.required_class,
      minSuccessRate: task.min_success_rate,
      requiredSkills: task.required_skills,
    });

    if (agent) {
      const success = await assignTask(supabase, task.id, agent.id);
      if (success) {
        // Remove from queue
        await supabase.from('task_queue').delete().eq('id', item.id);
        assigned++;
      }
    }

    processed++;
  }

  return { processed, assigned };
}

// ============================================================
// STATS & ANALYTICS
// ============================================================

async function getSystemStats(supabase: SupabaseClient): Promise<Record<string, unknown>> {
  // Get task counts by status
  const { data: taskStats } = await supabase
    .from('sonic_tasks')
    .select('status')
    .then(({ data }) => {
      const counts: Record<string, number> = {};
      data?.forEach((t: any) => {
        counts[t.status] = (counts[t.status] || 0) + 1;
      });
      return { data: counts };
    });

  // Get available agents count
  const { count: availableAgents } = await supabase
    .from('agent_availability')
    .select('*', { count: 'exact', head: true })
    .eq('is_available', true);

  // Get queue size
  const { count: queueSize } = await supabase
    .from('task_queue')
    .select('*', { count: 'exact', head: true });

  // Get today's completed tasks
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count: completedToday } = await supabase
    .from('sonic_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'COMPLETED')
    .gte('completed_at', today.toISOString());

  return {
    tasks: taskStats,
    availableAgents,
    queueSize,
    completedToday,
  };
}

// ============================================================
// MAIN HANDLER
// ============================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();
  const requestId = crypto.randomUUID();

  try {
    const body: TaskRequest = await req.json().catch(() => ({}));
    const supabase = createSupabase();

    console.log(`[TaskRouter] ${requestId}: action=${body.action}`);

    let response: Record<string, unknown>;

    switch (body.action) {
      case 'create':
        if (!body.task) throw new Error('Task data required');
        const createResult = await createTask(supabase, body.task);
        response = {
          success: true,
          action: 'create',
          ...createResult,
        };
        break;

      case 'batch_create':
        if (!body.tasks?.length) throw new Error('Tasks array required');
        const batchResult = await batchCreateTasks(supabase, body.tasks);
        response = {
          success: true,
          action: 'batch_create',
          ...batchResult,
        };
        break;

      case 'assign':
        if (!body.taskId) throw new Error('Task ID required');
        const agent = await findBestAgent(supabase, {});
        if (!agent) {
          response = { success: false, error: 'No available agents' };
        } else {
          const assigned = await assignTask(supabase, body.taskId, agent.id);
          response = {
            success: assigned,
            action: 'assign',
            agentId: agent.id,
            agentName: agent.name,
          };
        }
        break;

      case 'start':
        if (!body.taskId) throw new Error('Task ID required');
        const startResult = await startTask(supabase, body.taskId);
        response = {
          success: startResult.success,
          action: 'start',
          agent: startResult.agent,
        };
        break;

      case 'complete':
        if (!body.taskId || !body.result) throw new Error('Task ID and result required');
        const completeResult = await completeTask(supabase, body.taskId, body.result);
        response = {
          success: completeResult.success,
          action: 'complete',
          ...completeResult,
        };
        break;

      case 'cancel':
        if (!body.taskId) throw new Error('Task ID required');
        const cancelled = await cancelTask(supabase, body.taskId);
        response = {
          success: cancelled,
          action: 'cancel',
        };
        break;

      case 'status':
        if (!body.taskId) throw new Error('Task ID required');
        const task = await getTaskStatus(supabase, body.taskId);
        response = {
          success: !!task,
          action: 'status',
          task,
        };
        break;

      case 'process_queue':
        const queueResult = await processQueue(supabase, body.limit || 50);
        response = {
          success: true,
          action: 'process_queue',
          ...queueResult,
        };
        break;

      default:
        // Return system stats if no action
        const stats = await getSystemStats(supabase);
        response = {
          success: true,
          action: 'stats',
          ...stats,
        };
    }

    const duration = Date.now() - startTime;

    return new Response(JSON.stringify({
      ...response,
      metadata: {
        requestId,
        service: 'task-router',
        processingTimeMs: duration,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[TaskRouter] Error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        requestId,
        service: 'task-router',
        processingTimeMs: Date.now() - startTime,
      },
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
