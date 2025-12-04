/**
 * Center types for ProofArrive
 * Types for centers/sites fetched from the API
 */

/**
 * Raw center data from API
 */
export interface RawCenterData {
  id: number;
  name: string;
  fullname: string;
  geozone: string;
  gzone_id: number;
  siteid: number;
  groupid: number;
  groupname: string;
  manager?: string;
  distance?: number;
  sitetype?: number;
  time1?: string;
  time2?: string;
  saturday?: string;
  sunday?: string;
  breakstart?: string;
  breakstop?: string;
  timeoutin?: number;
  timeoutin_str?: string;
  timeoutin_muros?: number;
  timeoutin_muros_str?: string;
  [key: string]: any;
}

/**
 * Parsed center data structure
 */
export interface ParsedCenter {
  id: number; // Center ID
  name: string;
  fullname: string;
  geozone: string;
  gzoneId: number; // Geozone ID
  siteId: number;
  groupId: number;
  groupName: string;
  manager?: string;
  distance?: number;
  siteType?: number;
  time1?: string;
  time2?: string;
  saturday?: string;
  sunday?: string;
  breakStart?: string;
  breakStop?: string;
  timeoutIn?: number;
  timeoutInStr?: string;
  timeoutInMuros?: number;
  timeoutInMurosStr?: string;
}

/**
 * Center API response structure
 */
export interface CenterApiResponse {
  success: boolean;
  totalCount: number;
  rows: RawCenterData[];
  [key: string]: any;
}









