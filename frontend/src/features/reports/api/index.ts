import { httpClient } from '@/api/client';
import { type ApiResponse, type ReportSummary } from '@/types/api.types';

export const getReportsSummary = async (
  startDate?: string,
  endDate?: string
): Promise<ApiResponse<ReportSummary>> => {
  const response = await httpClient.get<ApiResponse<ReportSummary>>('/reports', {
    params: {
      startDate,
      endDate,
    },
  });
  return response.data;
};
