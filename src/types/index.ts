export type LadleStatus = 'pending' | 'receiving' | 'pouring' | 'finished';

export type TundishStatus = 'preparing' | 'pouring' | 'stopped';

export type MoldStatus = 'standby' | 'running' | 'fault';

export type SlabStatus = 'pending_cut' | 'cut' | 'cleaning' | 'cleaned' | 'pending_warehouse' | 'warehoused';

export type AlertLevel = 'info' | 'warning' | 'danger';

export interface Ladle {
  id: string;
  steelGrade: string;
  temperature: number;
  weight: number;
  receiveTime: string;
  status: LadleStatus;
  ladleNo: string;
}

export interface Tundish {
  id: string;
  temperature: number;
  liquidLevel: number;
  powderAmount: number;
  startTime: string;
  status: TundishStatus;
  tundishNo: string;
}

export interface Mold {
  id: string;
  liquidLevel: number;
  vibrationFreq: number;
  amplitude: number;
  status: MoldStatus;
  moldNo: string;
}

export interface SecondaryCoolingZone {
  id: string;
  zoneName: string;
  waterFlow: number;
  waterRatio: number;
  temperature: number;
}

export interface Slab {
  id: string;
  slabNo: string;
  width: number;
  thickness: number;
  length: number;
  steelGrade: string;
  status: SlabStatus;
  cutTime?: string;
  cleaningTime?: string;
  warehouseTime?: string;
  position?: string;
  segregationLevel?: string;
}

export interface CuttingRecord {
  id: string;
  slabNo: string;
  cutLength: number;
  cutTime: string;
  flameStatus: boolean;
}

export interface CleaningRecord {
  id: string;
  slabNo: string;
  defectType: string;
  defectPosition: string;
  cleaningMethod: string;
  result: string;
  operator: string;
  time: string;
}

export interface Alert {
  id: string;
  level: AlertLevel;
  module: string;
  message: string;
  time: string;
  resolved: boolean;
}

export interface ProductionStats {
  totalSlabs: number;
  todayOutput: number;
  avgTemperature: number;
  castingSpeed: number;
  passRate: number;
  runningTime: number;
}
