export interface Threat {
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface Packet {
  id: string;
  timestamp: string;
  protocol: string;
  srcIp: string;
  dstIp: string;
  srcPort: number;
  dstPort: number;
  size: number;
  info: string;
  threat: Threat | null;
}

export interface TrafficStats {
  protocol: string;
  count: number;
}

export interface TimeSeriesData {
  time: string;
  packets: number;
}
