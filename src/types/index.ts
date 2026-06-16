export type LadleStatus = 'pending' | 'receiving' | 'pouring' | 'finished';

export type TundishStatus = 'preparing' | 'pouring' | 'stopped';

export type MoldStatus = 'standby' | 'running' | 'fault';

export type SlabStatus = 'pending_cut' | 'cut' | 'cleaning' | 'recheck_pending' | 'cleaned' | 'pending_warehouse' | 'warehoused' | 'outbound' | 'disposal_pending' | 'scrapped';

export type AlertLevel = 'info' | 'warning' | 'danger';

export type AlertModule = 'dashboard' | 'ladle' | 'tundish' | 'mold' | 'cooling' | 'cutting' | 'cleaning' | 'warehouse';

export type SegregationLevel = 'C1.0' | 'C1.5' | 'C2.0' | 'C2.5' | 'C3.0';

export type DefectType = 'none' | 'crack' | 'scar' | 'scratch' | 'bubble' | 'segregation';

export type CleaningMethod = 'manual' | 'grinding' | 'flame' | 'machining';

export type CleaningResult = 'qualified' | 'repaired' | 'recheck';

export interface Ladle {
  id: string;
  steelGrade: string;
  temperature: number;
  weight: number;
  receiveTime: string;
  status: LadleStatus;
  ladleNo: string;
  composition?: {
    C?: number;
    Si?: number;
    Mn?: number;
    P?: number;
    S?: number;
  };
  heatNo?: string;
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
  segregationLevel?: SegregationLevel;
  centerSegregation?: string;
  surfaceQuality?: string;
  heatNo?: string;
  ladleNo?: string;
  ladleTemp?: number;
  cutLength?: number;
  cleaningResult?: CleaningResult;
  defectType?: DefectType;
}

export interface CuttingRecord {
  id: string;
  slabId: string;
  slabNo: string;
  cutLength: number;
  cutTime: string;
  flameStatus: boolean;
}

export interface CleaningRecord {
  id: string;
  slabId: string;
  slabNo: string;
  defectType: DefectType;
  defectLocation: string;
  cleaningMethod: CleaningMethod;
  cleaningResult: CleaningResult;
  operator: string;
  remark?: string;
  cleaningTime: string;
}

export interface Alert {
  id: string;
  level: AlertLevel;
  module: AlertModule;
  message: string;
  time: string;
  resolved: boolean;
  resolvedTime?: string;
  resolvedBy?: string;
  resolvedRemark?: string;
  paramName?: string;
  currentValue?: number;
  threshold?: { min?: number; max?: number };
}

export interface ProductionStats {
  totalSlabs: number;
  todayOutput: number;
  avgTemperature: number;
  castingSpeed: number;
  passRate: number;
  runningTime: number;
}

export interface AlertThresholds {
  tundish: {
    temperature: { min: number; max: number };
    liquidLevel: { min: number; max: number };
  };
  mold: {
    liquidLevel: { min: number; max: number };
    vibrationFreq: { min: number; max: number };
  };
  cooling: {
    castingSpeed: { min: number; max: number };
    waterFlow: { min: number; max: number };
  };
}

export interface ReInspectionRecord {
  id: string;
  slabId: string;
  slabNo: string;
  cleaningRecordId: string;
  inspectionResult: 'qualified' | 'repaired' | 'recheck' | 'scrap' | 'downgrade';
  inspector: string;
  remark: string;
  recheckTime: string;
}

export type TransferType = 'inbound' | 'shift' | 'outbound';

export interface WarehouseTransferRecord {
  id: string;
  slabId: string;
  slabNo: string;
  transferType: TransferType;
  fromPosition: string;
  toPosition: string;
  operator: string;
  reason?: string;
  transferTime: string;
}

export interface OutboundRecord {
  id: string;
  slabId: string;
  slabNo: string;
  position: string;
  destination: string;
  transporter: string;
  operator: string;
  outboundTime: string;
  remark?: string;
}

export type WarehouseHistoryItem =
  | { type: 'inbound'; time: string; position: string; operator: string }
  | { type: 'shift'; time: string; from: string; to: string; operator: string; reason?: string }
  | { type: 'outbound'; time: string; position: string; destination: string; operator: string };

// ====== 新增：质量处置台账 ======
export type DisposalResult = 'rework' | 'concession' | 'scrapped' | 'released';
export type DisposalStatus = 'pending' | 'processing' | 'finished';

export interface QualityDisposalRecord {
  id: string;
  slabId: string;
  slabNo: string;
  sourceType: 'recheck_scrap' | 'recheck_downgrade' | 'manual';
  sourceRecordId?: string;
  reInspectionResult?: 'scrap' | 'downgrade';
  currentDisposalResult?: DisposalResult;
  disposalStatus: DisposalStatus;
  reworkCount: number;
  records: DisposalStepRecord[];
  createdAt: string;
  finishedAt?: string;
}

export interface DisposalStepRecord {
  id: string;
  disposalType: 'rework' | 'concession' | 'scrapped' | 'released';
  operator: string;
  remark: string;
  beforeStatus?: SlabStatus;
  afterStatus?: SlabStatus;
  timestamp: string;
}

// ====== 新增：出库计划 ======
export type OutboundPlanStatus = 'draft' | 'ready' | 'executing' | 'completed' | 'cancelled';

export interface OutboundPlan {
  id: string;
  planNo: string;
  orderNo?: string;
  destination: string;
  transporter?: string;
  planner: string;
  planDate: string;
  remark?: string;
  status: OutboundPlanStatus;
  items: OutboundPlanItem[];
  createdAt: string;
  completedAt?: string;
  cancelledAt?: string;
}

export interface OutboundPlanItem {
  id: string;
  slabId: string;
  slabNo: string;
  position: string;
  steelGrade: string;
  width: number;
  thickness: number;
  length: number;
  weight: number;
  outboundAt?: string;
  outboundOperator?: string;
  outboundRemark?: string;
  status: 'pending' | 'outbound';
}

