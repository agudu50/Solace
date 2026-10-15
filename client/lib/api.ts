const API_BASE_URL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface AuditRequestPayload {
  codeSnippet: string;
  isPostDeployment?: boolean;
}

export interface Vulnerability {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  recommendation: string;
}

export interface AuditReportData {
  riskScore: number;
  isSecure: boolean;
  summary: string;
  vulnerabilities: Vulnerability[];
  postDeploymentRecommendations: string[];
  modelUsed?: string;
}

export interface AuditApiResponse {
  success: boolean;
  data?: AuditReportData;
  report?: AuditReportData;
  contractHash?: string;
  auditType?: string;
  onChainPayload?: {
    functionName: string;
    contractId: string | null;
    parameters: Record<string, any>;
    cliCommand: string;
  };
  error?: string;
}

export interface HealthCheckResponse {
  healthy: boolean;
  success?: boolean;
  service?: string;
  status?: string;
  model?: string;
  engine?: string;
  candidateModels?: string[];
  timestamp?: string;
}

export async function requestAudit({
  codeSnippet,
  isPostDeployment = false,
}: AuditRequestPayload): Promise<AuditApiResponse> {
  const response = await fetch(`${API_BASE_URL}/api/audit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ codeSnippet, isPostDeployment }),
  });

  const data: AuditApiResponse = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || 'Failed to complete smart contract security analysis.');
  }

  return data;
}

export async function checkServerHealth(): Promise<HealthCheckResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    if (!response.ok) return { healthy: false };
    const data = await response.json();
    return { healthy: data.status === 'healthy', ...data };
  } catch {
    return { healthy: false };
  }
}

export async function fetchContractInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/contract/info`);
    if (!response.ok) throw new Error('Failed to fetch contract info');
    return await response.json();
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function fetchOnChainAudit(hash: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/contract/audit/${encodeURIComponent(hash)}`);
    if (!response.ok) throw new Error('Failed to fetch on-chain audit');
    return await response.json();
  } catch (error: any) {
    return { success: false, found: false, error: error.message };
  }
}
