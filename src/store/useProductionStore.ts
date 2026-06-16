import { create } from 'zustand';
import type {
  Ladle,
  Tundish,
  Mold,
  SecondaryCoolingZone,
  Slab,
  Alert,
  AlertLevel,
  AlertModule,
  AlertThresholds,
  ProductionStats,
  LadleStatus,
  TundishStatus,
  MoldStatus,
  CuttingRecord,
  CleaningRecord,
  ReInspectionRecord,
  WarehouseTransferRecord,
  OutboundRecord,
  WarehouseHistoryItem,
  TransferType,
  QualityDisposalRecord,
  DisposalStepRecord,
  DisposalResult,
  OutboundPlan,
  OutboundPlanItem,
  DisposalStatus,
  OutboundPlanStatus,
} from '@/types';
import {
  mockLadleList,
  mockTundish,
  mockMold,
  mockSecondaryCoolingZones,
  mockSlabList,
  mockAlerts,
  mockProductionStats,
  mockTemperatureHistory,
  mockLiquidLevelHistory,
  mockCuttingRecords,
  mockCleaningRecords,
} from '@/data/mockData';

const STORAGE_KEY = 'ccms_production_data_v1';

const defaultThresholds: AlertThresholds = {
  tundish: {
    temperature: { min: 1530, max: 1580 },
    liquidLevel: { min: 600, max: 900 },
  },
  mold: {
    liquidLevel: { min: 90, max: 150 },
    vibrationFreq: { min: 100, max: 260 },
  },
  cooling: {
    castingSpeed: { min: 0.5, max: 2.5 },
    waterFlow: { min: 50, max: 220 },
  },
};

interface PersistedState {
  ladleList: Ladle[];
  slabList: Slab[];
  alerts: Alert[];
  cuttingRecords: CuttingRecord[];
  cleaningRecords: CleaningRecord[];
  reInspectionRecords: ReInspectionRecord[];
  warehouseTransferRecords: WarehouseTransferRecord[];
  outboundRecords: OutboundRecord[];
  qualityDisposalRecords: QualityDisposalRecord[];
  outboundPlans: OutboundPlan[];
  tundish: Tundish;
  mold: Mold;
  secondaryCoolingZones: SecondaryCoolingZone[];
  castingSpeed: number;
}

function loadFromStorage(): Partial<PersistedState> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load from localStorage', e);
  }
  return null;
}

function saveToStorage(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save to localStorage', e);
  }
}

const getCurrentTime = () => new Date().toLocaleString('zh-CN', { hour12: false });

const generateId = () => Math.random().toString(36).substring(2, 10);

const stored = loadFromStorage();

interface ProductionState {
  // Core data (persisted)
  ladleList: Ladle[];
  tundish: Tundish;
  mold: Mold;
  secondaryCoolingZones: SecondaryCoolingZone[];
  slabList: Slab[];
  alerts: Alert[];
  cuttingRecords: CuttingRecord[];
  cleaningRecords: CleaningRecord[];
  reInspectionRecords: ReInspectionRecord[];
  warehouseTransferRecords: WarehouseTransferRecord[];
  outboundRecords: OutboundRecord[];
  qualityDisposalRecords: QualityDisposalRecord[];
  outboundPlans: OutboundPlan[];

  // UI state (not persisted)
  productionStats: ProductionStats;
  temperatureHistory: { time: number; value: number }[];
  liquidLevelHistory: { time: number; value: number }[];
  currentTime: string;
  castingSpeed: number;
  thresholds: AlertThresholds;

  // Ladle
  setLadleStatus: (id: string, status: LadleStatus) => void;
  addLadle: (ladle: Omit<Ladle, 'id'>) => void;
  getActiveLadle: () => Ladle | undefined;

  // Tundish
  setTundishStatus: (status: TundishStatus) => void;
  updateTundishPowder: (amount: number) => void;

  // Mold
  setMoldStatus: (status: MoldStatus) => void;
  updateMoldVibration: (freq: number, amplitude: number) => void;

  // Cooling
  updateCoolingZoneWater: (zoneId: string, waterFlow: number) => void;
  updateCastingSpeed: (speed: number) => void;

  // Slab
  addSlab: (slab: Omit<Slab, 'id'>) => void;
  updateSlabStatus: (id: string, status: Slab['status']) => void;
  updateSlabWarehouse: (id: string, data: Partial<Slab> & { operator?: string }) => void;

  // Cutting records
  addCuttingRecord: (record: Omit<CuttingRecord, 'id'>) => void;

  // Cleaning records
  addCleaningRecord: (record: Omit<CleaningRecord, 'id'>) => void;

  // Re-inspection
  addReInspectionRecord: (record: Omit<ReInspectionRecord, 'id'>) => void;
  getReInspectionRecordsBySlab: (slabId: string) => ReInspectionRecord[];

  // Warehouse transfers & outbound
  transferSlab: (slabId: string, toPosition: string, operator: string, reason?: string) => void;
  outboundSlab: (slabId: string, destination: string, transporter: string, operator: string, remark?: string) => void;
  getSlabWarehouseHistory: (slabId: string) => WarehouseHistoryItem[];

  // Alerts
  addAlert: (alert: Omit<Alert, 'id' | 'time' | 'resolved'>) => string;
  resolveAlert: (id: string, resolvedBy?: string, remark?: string) => void;
  checkThresholds: () => void;

  // Quality Disposal
  createQualityDisposal: (
    slabId: string,
    sourceType: 'recheck_scrap' | 'recheck_downgrade' | 'manual',
    sourceRecordId?: string,
    reInspectionResult?: 'scrap' | 'downgrade'
  ) => void;
  addDisposalStep: (
    disposalId: string,
    step: Omit<DisposalStepRecord, 'id' | 'timestamp'>
  ) => void;
  getDisposalBySlab: (slabId: string) => QualityDisposalRecord | undefined;

  // Outbound Plans
  createOutboundPlan: (plan: Omit<OutboundPlan, 'id' | 'createdAt' | 'status' | 'planNo'> & { planNo?: string }) => string;
  updateOutboundPlan: (planId: string, patch: Partial<OutboundPlan>) => void;
  addPlanItems: (planId: string, items: Omit<OutboundPlanItem, 'id' | 'status'>[]) => void;
  removePlanItem: (planId: string, itemId: string) => void;
  executePlanItemOutbound: (
    planId: string,
    itemId: string,
    operator: string,
    remark?: string
  ) => void;
  completeOutboundPlan: (planId: string) => void;
  cancelOutboundPlan: (planId: string) => void;

  // Real-time simulation
  updateRealTimeData: () => void;

  // Persistence
  _persist: () => void;
}

export const useProductionStore = create<ProductionState>((set, get) => ({
  // ===== Initial State =====
  ladleList: stored?.ladleList ?? mockLadleList,
  tundish: stored?.tundish ?? mockTundish,
  mold: stored?.mold ?? mockMold,
  secondaryCoolingZones: stored?.secondaryCoolingZones ?? mockSecondaryCoolingZones,
  slabList: stored?.slabList ?? mockSlabList,
  alerts: stored?.alerts ?? mockAlerts,
  cuttingRecords: stored?.cuttingRecords ?? mockCuttingRecords,
  cleaningRecords: stored?.cleaningRecords ?? mockCleaningRecords,
  reInspectionRecords: stored?.reInspectionRecords ?? [],
  warehouseTransferRecords: stored?.warehouseTransferRecords ?? [],
  outboundRecords: stored?.outboundRecords ?? [],
  qualityDisposalRecords: stored?.qualityDisposalRecords ?? [],
  outboundPlans: stored?.outboundPlans ?? [],

  productionStats: mockProductionStats,
  temperatureHistory: mockTemperatureHistory,
  liquidLevelHistory: mockLiquidLevelHistory,
  currentTime: getCurrentTime(),
  castingSpeed: stored?.castingSpeed ?? 1.2,
  thresholds: defaultThresholds,

  // ===== Helpers =====
  _persist: () => {
    const s = get();
    saveToStorage({
      ladleList: s.ladleList,
      tundish: s.tundish,
      mold: s.mold,
      secondaryCoolingZones: s.secondaryCoolingZones,
      slabList: s.slabList,
      alerts: s.alerts,
      cuttingRecords: s.cuttingRecords,
      cleaningRecords: s.cleaningRecords,
      reInspectionRecords: s.reInspectionRecords,
      warehouseTransferRecords: s.warehouseTransferRecords,
      outboundRecords: s.outboundRecords,
      qualityDisposalRecords: s.qualityDisposalRecords,
      outboundPlans: s.outboundPlans,
      castingSpeed: s.castingSpeed,
    });
  },

  getActiveLadle: () => {
    return get().ladleList.find((l) => l.status === 'pouring');
  },

  // ===== Ladle =====
  setLadleStatus: (id, status) => {
    set((s) => ({
      ladleList: s.ladleList.map((l) => (l.id === id ? { ...l, status } : l)),
    }));
    get()._persist();
  },

  addLadle: (ladle) => {
    const newLadle: Ladle = { ...ladle, id: generateId() };
    set((s) => ({
      ladleList: [newLadle, ...s.ladleList],
    }));
    get()._persist();
  },

  // ===== Tundish =====
  setTundishStatus: (status) => {
    set((s) => ({ tundish: { ...s.tundish, status } }));
    get()._persist();
  },

  updateTundishPowder: (amount) => {
    set((s) => ({
      tundish: { ...s.tundish, powderAmount: s.tundish.powderAmount + amount },
    }));
    get()._persist();
  },

  // ===== Mold =====
  setMoldStatus: (status) => {
    set((s) => ({ mold: { ...s.mold, status } }));
    get()._persist();
  },

  updateMoldVibration: (freq, amplitude) => {
    set((s) => ({ mold: { ...s.mold, vibrationFreq: freq, amplitude } }));
    get()._persist();
  },

  // ===== Cooling =====
  updateCoolingZoneWater: (zoneId, waterFlow) => {
    set((s) => ({
      secondaryCoolingZones: s.secondaryCoolingZones.map((z) =>
        z.id === zoneId ? { ...z, waterFlow } : z
      ),
    }));
    get()._persist();
  },

  updateCastingSpeed: (speed) => {
    set((s) => ({
      castingSpeed: speed,
      productionStats: { ...s.productionStats, castingSpeed: speed },
    }));
    get()._persist();
  },

  // ===== Slab =====
  addSlab: (slab) => {
    const activeLadle = get().getActiveLadle();
    const newSlab: Slab = {
      ...slab,
      id: generateId(),
      heatNo: activeLadle?.heatNo,
      ladleNo: activeLadle?.ladleNo,
      ladleTemp: activeLadle?.temperature,
    };
    set((s) => ({
      slabList: [newSlab, ...s.slabList],
      productionStats: {
        ...s.productionStats,
        totalSlabs: s.productionStats.totalSlabs + 1,
        todayOutput: s.productionStats.todayOutput + 1,
      },
    }));
    get()._persist();
  },

  updateSlabStatus: (id, status) => {
    set((s) => ({
      slabList: s.slabList.map((slab) => (slab.id === id ? { ...slab, status } : slab)),
    }));
    get()._persist();
  },

  // ===== Cutting Records =====
  addCuttingRecord: (record) => {
    const newRecord: CuttingRecord = { ...record, id: generateId() };
    set((s) => ({ cuttingRecords: [newRecord, ...s.cuttingRecords] }));
    // Also link cutLength to slab
    if (record.slabId) {
      set((s) => ({
        slabList: s.slabList.map((slab) =>
          slab.id === record.slabId
            ? { ...slab, cutLength: record.cutLength }
            : slab
        ),
      }));
    }
    get()._persist();
  },

  // ===== Cleaning Records =====
  addCleaningRecord: (record) => {
    const newRecord: CleaningRecord = { ...record, id: generateId() };
    set((s) => ({ cleaningRecords: [newRecord, ...s.cleaningRecords] }));
    // Also link cleaning result to slab
    if (record.slabId) {
      const newStatus = record.cleaningResult === 'recheck' ? 'recheck_pending' : 'cleaned';
      set((s) => ({
        slabList: s.slabList.map((slab) =>
          slab.id === record.slabId
            ? {
                ...slab,
                cleaningResult: record.cleaningResult,
                defectType: record.defectType,
                cleaningTime: record.cleaningTime,
                status: newStatus,
              }
            : slab
        ),
      }));
    }
    get()._persist();
  },

  // ===== Re-inspection Records =====
  addReInspectionRecord: (record) => {
    const newRecord: ReInspectionRecord = { ...record, id: generateId() };
    set((s) => ({ reInspectionRecords: [newRecord, ...s.reInspectionRecords] }));

    // Update slab status based on latest re-inspection result
    if (record.slabId) {
      let newStatus: Slab['status'] = 'recheck_pending';
      if (record.inspectionResult === 'qualified' || record.inspectionResult === 'repaired') {
        newStatus = 'cleaned';
      } else if (record.inspectionResult === 'scrap' || record.inspectionResult === 'downgrade') {
        newStatus = 'disposal_pending';
        // Auto-create quality disposal record
        const slab = get().slabList.find((s) => s.id === record.slabId);
        if (slab) {
          const disposal: QualityDisposalRecord = {
            id: generateId(),
            slabId: slab.id,
            slabNo: slab.slabNo,
            sourceType: record.inspectionResult === 'scrap' ? 'recheck_scrap' : 'recheck_downgrade',
            sourceRecordId: newRecord.id,
            reInspectionResult: record.inspectionResult,
            disposalStatus: 'pending',
            reworkCount: 0,
            records: [],
            createdAt: getCurrentTime(),
          };
          set((s) => ({
            qualityDisposalRecords: [disposal, ...s.qualityDisposalRecords],
          }));
        }
      }
      set((s) => ({
        slabList: s.slabList.map((slab) =>
          slab.id === record.slabId ? { ...slab, status: newStatus } : slab
        ),
      }));
    }

    get()._persist();
  },

  getReInspectionRecordsBySlab: (slabId) => {
    return get().reInspectionRecords.filter((r) => r.slabId === slabId);
  },

  // ===== Slab Warehouse update (with inbound transfer) =====
  updateSlabWarehouse: (id, data) => {
    const { operator, ...slabData } = data;
    set((s) => ({
      slabList: s.slabList.map((slab) =>
        slab.id === id ? { ...slab, ...slabData, status: 'warehoused' } : slab
      ),
    }));

    // Write inbound transfer record
    if (slabData.position) {
      const slab = get().slabList.find((s) => s.id === id);
      if (slab) {
        const transfer: WarehouseTransferRecord = {
          id: generateId(),
          slabId: id,
          slabNo: slab.slabNo,
          transferType: 'inbound',
          fromPosition: '',
          toPosition: slabData.position,
          operator: operator || '系统',
          transferTime: getCurrentTime(),
        };
        set((s) => ({
          warehouseTransferRecords: [transfer, ...s.warehouseTransferRecords],
        }));
      }
    }

    get()._persist();
  },

  // ===== Warehouse Transfer (slab shift) =====
  transferSlab: (slabId, toPosition, operator, reason) => {
    const slab = get().slabList.find((s) => s.id === slabId);
    if (!slab || !slab.position) return;
    if (slab.status !== 'warehoused') return;

    const transfer: WarehouseTransferRecord = {
      id: generateId(),
      slabId,
      slabNo: slab.slabNo,
      transferType: 'shift',
      fromPosition: slab.position,
      toPosition,
      operator,
      reason,
      transferTime: getCurrentTime(),
    };

    set((s) => ({
      warehouseTransferRecords: [transfer, ...s.warehouseTransferRecords],
      slabList: s.slabList.map((sl) =>
        sl.id === slabId ? { ...sl, position: toPosition } : sl
      ),
    }));

    get()._persist();
  },

  // ===== Outbound =====
  outboundSlab: (slabId, destination, transporter, operator, remark) => {
    const slab = get().slabList.find((s) => s.id === slabId);
    if (!slab || !slab.position) return;

    const outbound: OutboundRecord = {
      id: generateId(),
      slabId,
      slabNo: slab.slabNo,
      position: slab.position,
      destination,
      transporter,
      operator,
      outboundTime: getCurrentTime(),
      remark,
    };

    // Also write outbound transfer record
    const transfer: WarehouseTransferRecord = {
      id: generateId(),
      slabId,
      slabNo: slab.slabNo,
      transferType: 'outbound',
      fromPosition: slab.position,
      toPosition: '',
      operator,
      reason: destination,
      transferTime: getCurrentTime(),
    };

    set((s) => ({
      outboundRecords: [outbound, ...s.outboundRecords],
      warehouseTransferRecords: [transfer, ...s.warehouseTransferRecords],
      slabList: s.slabList.map((sl) =>
        sl.id === slabId ? { ...sl, status: 'outbound', position: undefined } : sl
      ),
    }));

    get()._persist();
  },

  getSlabWarehouseHistory: (slabId): WarehouseHistoryItem[] => {
    const transfers = get().warehouseTransferRecords.filter((t) => t.slabId === slabId);
    const slab = get().slabList.find((s) => s.id === slabId);
    const history: WarehouseHistoryItem[] = [];

    for (const t of transfers) {
      if (t.transferType === 'inbound') {
        history.push({
          type: 'inbound',
          time: t.transferTime,
          position: t.toPosition,
          operator: t.operator,
        });
      } else if (t.transferType === 'shift') {
        history.push({
          type: 'shift',
          time: t.transferTime,
          from: t.fromPosition,
          to: t.toPosition,
          operator: t.operator,
          reason: t.reason,
        });
      } else if (t.transferType === 'outbound') {
        history.push({
          type: 'outbound',
          time: t.transferTime,
          position: t.fromPosition,
          destination: t.reason || '',
          operator: t.operator,
        });
      }
    }

    // ===== 历史补全：已有在库板坯但无入库调拨记录的，根据 slab.warehouseTime / position 推断 =====
    const hasInboundRecord = history.some((h) => h.type === 'inbound');
    if (!hasInboundRecord && slab?.warehouseTime && slab.position) {
      history.push({
        type: 'inbound',
        time: slab.warehouseTime,
        position: slab.position,
        operator: '历史数据补录',
      });
    }

    // Sort chronologically (newest first for display)
    return history.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
  },

  // ===== Alerts =====
  addAlert: (alert) => {
    // Check for duplicate unresolved
    const existing = get().alerts.find(
      (a) =>
        !a.resolved &&
        a.module === alert.module &&
        a.paramName === alert.paramName
    );
    if (existing) return existing.id;

    const newAlert: Alert = {
      ...alert,
      id: generateId(),
      time: getCurrentTime(),
      resolved: false,
    };
    set((s) => ({ alerts: [newAlert, ...s.alerts] }));
    get()._persist();
    return newAlert.id;
  },

  resolveAlert: (id, resolvedBy?, remark?) => {
    set((s) => ({
      alerts: s.alerts.map((a) =>
        a.id === id
          ? {
              ...a,
              resolved: true,
              resolvedTime: getCurrentTime(),
              resolvedBy: resolvedBy || '当前用户',
              resolvedRemark: remark,
            }
          : a
      ),
    }));
    get()._persist();
  },

  checkThresholds: () => {
    const s = get();
    const { thresholds } = s;
    const newAlertIds: string[] = [];

    // Tundish Temperature
    if (s.tundish.temperature < thresholds.tundish.temperature.min) {
      newAlertIds.push(
        s.addAlert({
          level: 'danger',
          module: 'tundish',
          paramName: 'temperature',
          message: `中间包温度 ${s.tundish.temperature.toFixed(1)}℃ 低于下限 ${thresholds.tundish.temperature.min}℃`,
          currentValue: s.tundish.temperature,
          threshold: thresholds.tundish.temperature,
        })
      );
    } else if (s.tundish.temperature > thresholds.tundish.temperature.max) {
      newAlertIds.push(
        s.addAlert({
          level: 'warning',
          module: 'tundish',
          paramName: 'temperature',
          message: `中间包温度 ${s.tundish.temperature.toFixed(1)}℃ 超过上限 ${thresholds.tundish.temperature.max}℃`,
          currentValue: s.tundish.temperature,
          threshold: thresholds.tundish.temperature,
        })
      );
    }

    // Tundish Level
    if (
      s.tundish.liquidLevel < thresholds.tundish.liquidLevel.min ||
      s.tundish.liquidLevel > thresholds.tundish.liquidLevel.max
    ) {
      const level: AlertLevel =
        s.tundish.liquidLevel < 500 || s.tundish.liquidLevel > 950 ? 'danger' : 'warning';
      newAlertIds.push(
        s.addAlert({
          level,
          module: 'tundish',
          paramName: 'liquidLevel',
          message: `中间包液位 ${s.tundish.liquidLevel.toFixed(0)}mm 超出正常范围 (${thresholds.tundish.liquidLevel.min}-${thresholds.tundish.liquidLevel.max}mm)`,
          currentValue: s.tundish.liquidLevel,
          threshold: thresholds.tundish.liquidLevel,
        })
      );
    }

    // Mold Level
    if (
      s.mold.liquidLevel < thresholds.mold.liquidLevel.min ||
      s.mold.liquidLevel > thresholds.mold.liquidLevel.max
    ) {
      newAlertIds.push(
        s.addAlert({
          level: 'warning',
          module: 'mold',
          paramName: 'liquidLevel',
          message: `结晶器液位 ${s.mold.liquidLevel.toFixed(1)}mm 超出正常范围 (${thresholds.mold.liquidLevel.min}-${thresholds.mold.liquidLevel.max}mm)`,
          currentValue: s.mold.liquidLevel,
          threshold: thresholds.mold.liquidLevel,
        })
      );
    }

    // Mold Vibration Freq
    if (
      s.mold.vibrationFreq < thresholds.mold.vibrationFreq.min ||
      s.mold.vibrationFreq > thresholds.mold.vibrationFreq.max
    ) {
      newAlertIds.push(
        s.addAlert({
          level: 'info',
          module: 'mold',
          paramName: 'vibrationFreq',
          message: `结晶器振动频率 ${s.mold.vibrationFreq}cpm 超出正常范围`,
          currentValue: s.mold.vibrationFreq,
          threshold: thresholds.mold.vibrationFreq,
        })
      );
    }

    // Casting Speed
    if (
      s.castingSpeed < thresholds.cooling.castingSpeed.min ||
      s.castingSpeed > thresholds.cooling.castingSpeed.max
    ) {
      newAlertIds.push(
        s.addAlert({
          level: 'warning',
          module: 'cooling',
          paramName: 'castingSpeed',
          message: `拉速 ${s.castingSpeed.toFixed(2)}m/min 超出正常范围 (${thresholds.cooling.castingSpeed.min}-${thresholds.cooling.castingSpeed.max}m/min)`,
          currentValue: s.castingSpeed,
          threshold: thresholds.cooling.castingSpeed,
        })
      );
    }

    // Water Flow (any zone)
    s.secondaryCoolingZones.forEach((zone) => {
      if (
        zone.waterFlow < thresholds.cooling.waterFlow.min ||
        zone.waterFlow > thresholds.cooling.waterFlow.max
      ) {
        newAlertIds.push(
          s.addAlert({
            level: 'info' as AlertLevel,
            module: 'cooling' as AlertModule,
            paramName: `waterFlow_${zone.id}`,
            message: `${zone.zoneName} 水量 ${zone.waterFlow}L/min 超出建议范围`,
            currentValue: zone.waterFlow,
            threshold: thresholds.cooling.waterFlow,
          })
        );
      }
    });

    // Auto-resolve alerts whose params are now within range (for temperature & level which fluctuate)
    const paramsToAutoClear = new Set(newAlertIds);
    // (not auto-clearing so user sees history; user manually resolves)
  },

  // ===== Quality Disposal =====
  createQualityDisposal: (slabId, sourceType, sourceRecordId, reInspectionResult) => {
    const slab = get().slabList.find((s) => s.id === slabId);
    if (!slab) return;

    // Avoid duplicate pending disposal for same slab
    const existing = get().qualityDisposalRecords.find(
      (d) => d.slabId === slabId && d.disposalStatus !== 'finished'
    );
    if (existing) return;

    const disposal: QualityDisposalRecord = {
      id: generateId(),
      slabId,
      slabNo: slab.slabNo,
      sourceType,
      sourceRecordId,
      reInspectionResult,
      disposalStatus: 'pending',
      reworkCount: 0,
      records: [],
      createdAt: getCurrentTime(),
    };

    set((s) => ({
      qualityDisposalRecords: [disposal, ...s.qualityDisposalRecords],
      slabList: s.slabList.map((sl) =>
        sl.id === slabId ? { ...sl, status: 'disposal_pending' } : sl
      ),
    }));
    get()._persist();
  },

  addDisposalStep: (disposalId, step) => {
    const disposal = get().qualityDisposalRecords.find((d) => d.id === disposalId);
    if (!disposal) return;

    const stepRecord: DisposalStepRecord = {
      ...step,
      id: generateId(),
      timestamp: getCurrentTime(),
    };

    const newRecords = [stepRecord, ...disposal.records];
    let newStatus: DisposalStatus = 'processing';
    let newReworkCount = disposal.reworkCount;
    let currentResult: DisposalResult | undefined = disposal.currentDisposalResult;
    let slabNewStatus: Slab['status'] | undefined;
    let finishedAt: string | undefined = disposal.finishedAt;

    switch (step.disposalType) {
      case 'rework':
        newReworkCount = disposal.reworkCount + 1;
        currentResult = 'rework';
        slabNewStatus = 'recheck_pending'; // 返修后回到复检
        break;
      case 'concession':
        currentResult = 'concession';
        newStatus = 'finished';
        slabNewStatus = 'cleaned'; // 让步接收 -> 放行到入库候选
        finishedAt = getCurrentTime();
        break;
      case 'scrapped':
        currentResult = 'scrapped';
        newStatus = 'finished';
        slabNewStatus = 'scrapped';
        finishedAt = getCurrentTime();
        break;
      case 'released':
        currentResult = 'released';
        newStatus = 'finished';
        slabNewStatus = 'cleaned'; // 放行 -> 入库候选
        finishedAt = getCurrentTime();
        break;
    }

    set((s) => ({
      qualityDisposalRecords: s.qualityDisposalRecords.map((d) =>
        d.id === disposalId
          ? {
              ...d,
              records: newRecords,
              disposalStatus: newStatus,
              reworkCount: newReworkCount,
              currentDisposalResult: currentResult,
              finishedAt,
            }
          : d
      ),
      slabList: s.slabList.map((sl) =>
        sl.id === disposal.slabId && slabNewStatus ? { ...sl, status: slabNewStatus } : sl
      ),
    }));
    get()._persist();
  },

  getDisposalBySlab: (slabId) => {
    return get().qualityDisposalRecords.find((d) => d.slabId === slabId);
  },

  // ===== Outbound Plans =====
  createOutboundPlan: (plan) => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const existingCount = get().outboundPlans.filter((p) => p.createdAt.slice(0, 10) === new Date().toISOString().slice(0, 10)).length + 1;
    const newPlanNo = plan.planNo || `OUT-${dateStr}-${String(existingCount).padStart(4, '0')}`;

    const newPlan: OutboundPlan = {
      ...plan,
      id: generateId(),
      planNo: newPlanNo,
      status: 'draft',
      items: [],
      createdAt: getCurrentTime(),
    };

    set((s) => ({ outboundPlans: [newPlan, ...s.outboundPlans] }));
    get()._persist();
    return newPlan.id;
  },

  updateOutboundPlan: (planId, patch) => {
    set((s) => ({
      outboundPlans: s.outboundPlans.map((p) =>
        p.id === planId ? { ...p, ...patch } : p
      ),
    }));
    get()._persist();
  },

  addPlanItems: (planId, items) => {
    const plan = get().outboundPlans.find((p) => p.id === planId);
    if (!plan) return;

    // Prevent adding slabs already in this plan
    const existingSlabIds = new Set(plan.items.map((i) => i.slabId));
    const newItems: OutboundPlanItem[] = items
      .filter((it) => !existingSlabIds.has(it.slabId))
      .map((it) => ({ ...it, id: generateId(), status: 'pending' }));

    if (newItems.length === 0) return;

    set((s) => ({
      outboundPlans: s.outboundPlans.map((p) =>
        p.id === planId
          ? { ...p, items: [...p.items, ...newItems] }
          : p
      ),
    }));
    get()._persist();
  },

  removePlanItem: (planId, itemId) => {
    set((s) => ({
      outboundPlans: s.outboundPlans.map((p) =>
        p.id === planId
          ? { ...p, items: p.items.filter((i) => i.id !== itemId) }
          : p
      ),
    }));
    get()._persist();
  },

  executePlanItemOutbound: (planId, itemId, operator, remark) => {
    const plan = get().outboundPlans.find((p) => p.id === planId);
    if (!plan) return;
    const item = plan.items.find((i) => i.id === itemId);
    if (!item || item.status === 'outbound') return;

    // Execute actual outbound (reuse outboundSlab logic)
    const slab = get().slabList.find((s) => s.id === item.slabId);
    if (!slab || !slab.position) return;

    const now = getCurrentTime();

    const outbound: OutboundRecord = {
      id: generateId(),
      slabId: item.slabId,
      slabNo: item.slabNo,
      position: slab.position,
      destination: plan.destination,
      transporter: plan.transporter || item.outboundOperator || '未指定',
      operator,
      outboundTime: now,
      remark,
    };

    const transfer: WarehouseTransferRecord = {
      id: generateId(),
      slabId: item.slabId,
      slabNo: item.slabNo,
      transferType: 'outbound',
      fromPosition: slab.position,
      toPosition: '',
      operator,
      reason: plan.destination,
      transferTime: now,
    };

    set((s) => ({
      outboundRecords: [outbound, ...s.outboundRecords],
      warehouseTransferRecords: [transfer, ...s.warehouseTransferRecords],
      slabList: s.slabList.map((sl) =>
        sl.id === item.slabId ? { ...sl, status: 'outbound', position: undefined } : sl
      ),
      outboundPlans: s.outboundPlans.map((p) =>
        p.id === planId
          ? {
              ...p,
              items: p.items.map((i) =>
                i.id === itemId
                  ? {
                      ...i,
                      status: 'outbound',
                      outboundAt: now,
                      outboundOperator: operator,
                      outboundRemark: remark,
                    }
                  : i
              ),
            }
          : p
      ),
    }));
    get()._persist();
  },

  completeOutboundPlan: (planId) => {
    const plan = get().outboundPlans.find((p) => p.id === planId);
    if (!plan) return;
    if (plan.items.length === 0 || !plan.items.every((i) => i.status === 'outbound')) return;

    set((s) => ({
      outboundPlans: s.outboundPlans.map((p) =>
        p.id === planId ? { ...p, status: 'completed', completedAt: getCurrentTime() } : p
      ),
    }));
    get()._persist();
  },

  cancelOutboundPlan: (planId) => {
    const plan = get().outboundPlans.find((p) => p.id === planId);
    if (!plan) return;
    if (plan.items.some((i) => i.status === 'outbound')) return; // 已执行部分出库的不能取消

    set((s) => ({
      outboundPlans: s.outboundPlans.map((p) =>
        p.id === planId ? { ...p, status: 'cancelled', cancelledAt: getCurrentTime() } : p
      ),
    }));
    get()._persist();
  },

  // ===== Real-time simulation =====
  updateRealTimeData: () => {
    const s = get();

    const newTemp = [...s.temperatureHistory.slice(1)];
    const baseTemp = s.tundish.status === 'pouring' ? 1545 : 1500;
    const lastTemp = newTemp[newTemp.length - 1]?.value ?? baseTemp;
    newTemp.push({
      time: (s.temperatureHistory[s.temperatureHistory.length - 1]?.time ?? 0) + 1,
      value: Math.max(1500, Math.min(1600, lastTemp + (Math.random() * 12 - 6))),
    });

    const newLevel = [...s.liquidLevelHistory.slice(1)];
    const baseLevel = s.mold.status === 'running' ? 120 : 60;
    const lastLevel = newLevel[newLevel.length - 1]?.value ?? baseLevel;
    newLevel.push({
      time: (s.liquidLevelHistory[s.liquidLevelHistory.length - 1]?.time ?? 0) + 1,
      value: Math.max(60, Math.min(180, lastLevel + (Math.random() * 10 - 5))),
    });

    set({
      currentTime: getCurrentTime(),
      temperatureHistory: newTemp,
      liquidLevelHistory: newLevel,
      tundish: {
        ...s.tundish,
        temperature: newTemp[newTemp.length - 1].value,
        liquidLevel: s.tundish.status === 'pouring'
          ? Math.max(500, Math.min(950, s.tundish.liquidLevel + (Math.random() * 30 - 15)))
          : s.tundish.liquidLevel,
      },
      mold: {
        ...s.mold,
        liquidLevel: newLevel[newLevel.length - 1].value,
      },
    });

    // Run threshold check
    get().checkThresholds();
  },
}));
