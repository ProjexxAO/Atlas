/**
 * Shared logging utilities for Temple OS Edge Functions
 */

export async function logService(
  supabase: any,
  request_id: string,
  user_id: string | null,
  org_id: string | null,
  service_name: string,
  log_level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  metadata: Record<string, any> = {}
) {
  try {
    await supabase.from('service_logs').insert({
      request_id,
      user_id,
      org_id,
      service_name,
      log_level,
      message,
      metadata,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log to database:', error);
  }

  // Also log to console for Edge Function logs
  console.log(`[${service_name}] [${log_level.toUpperCase()}] ${message}`, metadata);
}

export async function logMetric(
  supabase: any,
  request_id: string,
  user_id: string | null,
  org_id: string | null,
  metric_name: string,
  metric_value: number,
  unit: string = 'ms',
  metadata: Record<string, any> = {}
) {
  try {
    await supabase.from('metrics').insert({
      request_id,
      user_id,
      org_id,
      metric_name,
      metric_value,
      unit,
      metadata,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to log metric to database:', error);
  }
}

export class ServiceLogger {
  constructor(
    private supabase: any,
    private request_id: string,
    private user_id: string | null,
    private org_id: string | null,
    private service_name: string
  ) {}

  async debug(message: string, metadata: Record<string, any> = {}) {
    await logService(this.supabase, this.request_id, this.user_id, this.org_id, this.service_name, 'debug', message, metadata);
  }

  async info(message: string, metadata: Record<string, any> = {}) {
    await logService(this.supabase, this.request_id, this.user_id, this.org_id, this.service_name, 'info', message, metadata);
  }

  async warn(message: string, metadata: Record<string, any> = {}) {
    await logService(this.supabase, this.request_id, this.user_id, this.org_id, this.service_name, 'warn', message, metadata);
  }

  async error(message: string, metadata: Record<string, any> = {}) {
    await logService(this.supabase, this.request_id, this.user_id, this.org_id, this.service_name, 'error', message, metadata);
  }

  async metric(metric_name: string, metric_value: number, unit: string = 'ms', metadata: Record<string, any> = {}) {
    await logMetric(this.supabase, this.request_id, this.user_id, this.org_id, metric_name, metric_value, unit, metadata);
  }
}
