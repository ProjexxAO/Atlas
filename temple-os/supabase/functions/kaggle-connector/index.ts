// ============================================================
// KAGGLE CONNECTOR — Dataset Integration for Sonic Agents
// ============================================================
// Enables agents to search, discover, and fetch Kaggle datasets
// ============================================================

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.224.0/encoding/base64.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const KAGGLE_API_BASE = 'https://www.kaggle.com/api/v1';

type KaggleAction = 'search' | 'list' | 'info' | 'download_url' | 'trending' | 'assign_to_agent';

interface KaggleRequest {
  action: KaggleAction;
  query?: string;
  owner?: string;
  dataset?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  fileType?: string;
  agentId?: string;
  sector?: string;
}

interface KaggleDataset {
  ref: string;
  title: string;
  subtitle: string;
  creator: string;
  totalBytes: number;
  downloadCount: number;
  voteCount: number;
  usabilityRating: number;
  lastUpdated: string;
  tags: string[];
}

function getKaggleAuth(): string {
  const username = Deno.env.get('KAGGLE_USERNAME');
  const key = Deno.env.get('KAGGLE_KEY');

  if (!username || !key) {
    throw new Error('Kaggle credentials not configured. Add KAGGLE_USERNAME and KAGGLE_KEY to secrets.');
  }

  const credentials = `${username}:${key}`;
  const encoded = base64Encode(new TextEncoder().encode(credentials));
  return `Basic ${encoded}`;
}

function createSupabase() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Missing Supabase credentials');
  return createClient(url, key);
}

// Map sectors to relevant Kaggle search terms
const SECTOR_KEYWORDS: Record<string, string[]> = {
  FINANCE: ['finance', 'stock market', 'cryptocurrency', 'banking', 'trading'],
  BIOTECH: ['biology', 'genetics', 'pharmaceutical', 'drug discovery', 'genomics'],
  SECURITY: ['cybersecurity', 'malware', 'network security', 'fraud detection'],
  DATA: ['machine learning', 'deep learning', 'NLP', 'computer vision', 'AI'],
  CREATIVE: ['art', 'music', 'design', 'images', 'video'],
  UTILITY: ['energy', 'infrastructure', 'IoT', 'smart city'],
  LEGAL: ['legal', 'contracts', 'court', 'law'],
  HEALTHCARE: ['healthcare', 'medical', 'patient', 'disease', 'diagnosis'],
  EDUCATION: ['education', 'students', 'learning', 'courses', 'academic'],
  ENGINEERING: ['engineering', 'manufacturing', 'CAD', 'robotics'],
  MARKETING: ['marketing', 'advertising', 'social media', 'customer'],
  SALES: ['sales', 'ecommerce', 'retail', 'customer behavior'],
  HR: ['HR', 'employee', 'recruitment', 'workforce'],
  OPERATIONS: ['operations', 'logistics', 'supply chain', 'inventory'],
  RESEARCH: ['research', 'scientific', 'experiment', 'study'],
  GOVERNMENT: ['government', 'public', 'census', 'policy'],
  REAL_ESTATE: ['real estate', 'housing', 'property', 'construction'],
  ENERGY: ['energy', 'renewable', 'oil', 'electricity', 'solar'],
  MANUFACTURING: ['manufacturing', 'production', 'quality', 'factory'],
  RETAIL: ['retail', 'shopping', 'consumer', 'products'],
  MEDIA: ['media', 'news', 'entertainment', 'movies', 'tv'],
  TELECOM: ['telecom', 'mobile', 'network', '5G', 'communications'],
  TRANSPORTATION: ['transportation', 'traffic', 'vehicles', 'aviation', 'shipping'],
  AGRICULTURE: ['agriculture', 'farming', 'crop', 'weather', 'food'],
};

async function searchDatasets(query: string, page: number = 1, pageSize: number = 20): Promise<KaggleDataset[]> {
  const auth = getKaggleAuth();

  const params = new URLSearchParams({
    search: query,
    page: page.toString(),
    pageSize: pageSize.toString(),
  });

  const response = await fetch(`${KAGGLE_API_BASE}/datasets/list?${params}`, {
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Kaggle API error: ${response.status} - ${error}`);
  }

  const datasets = await response.json();

  return datasets.map((d: any) => ({
    ref: d.ref,
    title: d.title,
    subtitle: d.subtitle || '',
    creator: d.ownerName || d.creatorName,
    totalBytes: d.totalBytes,
    downloadCount: d.downloadCount,
    voteCount: d.voteCount,
    usabilityRating: d.usabilityRating,
    lastUpdated: d.lastUpdated,
    tags: d.tags?.map((t: any) => t.name || t) || [],
  }));
}

async function getDatasetInfo(owner: string, dataset: string): Promise<any> {
  const auth = getKaggleAuth();

  const response = await fetch(`${KAGGLE_API_BASE}/datasets/view/${owner}/${dataset}`, {
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Kaggle API error: ${response.status}`);
  }

  return await response.json();
}

async function getTrendingDatasets(page: number = 1): Promise<KaggleDataset[]> {
  const auth = getKaggleAuth();

  const params = new URLSearchParams({
    sortBy: 'hottest',
    page: page.toString(),
    pageSize: '20',
  });

  const response = await fetch(`${KAGGLE_API_BASE}/datasets/list?${params}`, {
    headers: {
      'Authorization': auth,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Kaggle API error: ${response.status}`);
  }

  const datasets = await response.json();

  return datasets.map((d: any) => ({
    ref: d.ref,
    title: d.title,
    subtitle: d.subtitle || '',
    creator: d.ownerName || d.creatorName,
    totalBytes: d.totalBytes,
    downloadCount: d.downloadCount,
    voteCount: d.voteCount,
    usabilityRating: d.usabilityRating,
    lastUpdated: d.lastUpdated,
    tags: d.tags?.map((t: any) => t.name || t) || [],
  }));
}

function getDownloadUrl(owner: string, dataset: string): string {
  return `${KAGGLE_API_BASE}/datasets/download/${owner}/${dataset}`;
}

async function assignDatasetToAgent(
  supabase: any,
  agentId: string,
  dataset: KaggleDataset
): Promise<boolean> {
  // Store dataset reference in agent memory
  const { error } = await supabase.from('agent_memory').insert({
    agent_id: agentId,
    memory_type: 'kaggle_dataset',
    content: `[KAGGLE DATASET] ${dataset.title}: ${dataset.subtitle}`,
    importance_score: Math.min(dataset.usabilityRating / 10, 1),
    context: {
      source: 'kaggle',
      dataset_ref: dataset.ref,
      creator: dataset.creator,
      download_count: dataset.downloadCount,
      vote_count: dataset.voteCount,
      tags: dataset.tags,
      size_bytes: dataset.totalBytes,
    },
  });

  if (error) {
    console.error('Failed to assign dataset:', error);
    return false;
  }

  // Update agent specializations
  const { data: agent } = await supabase
    .from('sonic_agents')
    .select('task_specializations')
    .eq('id', agentId)
    .single();

  if (agent) {
    const specs = agent.task_specializations || {};
    specs['data_analysis'] = Math.min((specs['data_analysis'] || 0) + 0.05, 1);
    specs['kaggle_research'] = Math.min((specs['kaggle_research'] || 0) + 0.1, 1);

    await supabase
      .from('sonic_agents')
      .update({ task_specializations: specs })
      .eq('id', agentId);
  }

  return true;
}

async function findDatasetsForSector(sector: string, page: number = 1): Promise<KaggleDataset[]> {
  const keywords = SECTOR_KEYWORDS[sector] || ['data'];
  const randomKeyword = keywords[Math.floor(Math.random() * keywords.length)];
  return await searchDatasets(randomKeyword, page);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const body: KaggleRequest = await req.json().catch(() => ({}));
    const supabase = createSupabase();

    let response: any;

    switch (body.action) {
      case 'search':
        if (!body.query) throw new Error('Query required for search');
        response = {
          datasets: await searchDatasets(body.query, body.page || 1, body.pageSize || 20),
        };
        break;

      case 'list':
        if (body.sector) {
          response = {
            sector: body.sector,
            datasets: await findDatasetsForSector(body.sector, body.page || 1),
          };
        } else {
          response = {
            datasets: await searchDatasets('popular', body.page || 1),
          };
        }
        break;

      case 'trending':
        response = {
          datasets: await getTrendingDatasets(body.page || 1),
        };
        break;

      case 'info':
        if (!body.owner || !body.dataset) throw new Error('Owner and dataset required');
        response = {
          dataset: await getDatasetInfo(body.owner, body.dataset),
        };
        break;

      case 'download_url':
        if (!body.owner || !body.dataset) throw new Error('Owner and dataset required');
        response = {
          url: getDownloadUrl(body.owner, body.dataset),
          auth_required: true,
          note: 'Use KAGGLE_USERNAME:KAGGLE_KEY as Basic auth',
        };
        break;

      case 'assign_to_agent':
        if (!body.agentId || !body.query) throw new Error('Agent ID and query required');
        const datasets = await searchDatasets(body.query, 1, 5);
        if (datasets.length === 0) {
          response = { success: false, message: 'No datasets found' };
        } else {
          const assigned = await assignDatasetToAgent(supabase, body.agentId, datasets[0]);
          response = {
            success: assigned,
            dataset: datasets[0],
            agentId: body.agentId,
          };
        }
        break;

      default:
        // Return available actions
        response = {
          availableActions: ['search', 'list', 'trending', 'info', 'download_url', 'assign_to_agent'],
          sectors: Object.keys(SECTOR_KEYWORDS),
          example: {
            search: { action: 'search', query: 'machine learning' },
            list_by_sector: { action: 'list', sector: 'FINANCE' },
            trending: { action: 'trending' },
            assign: { action: 'assign_to_agent', agentId: 'uuid', query: 'stock market' },
          },
        };
    }

    return new Response(JSON.stringify({
      success: true,
      ...response,
      processingTimeMs: Date.now() - startTime,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      processingTimeMs: Date.now() - startTime,
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
