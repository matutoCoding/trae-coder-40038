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
  updateSlabWarehouse: (id: string, data: Partial<Slab>) => void;

  // Cutting records
  addCuttingRecord: (record: Omit<CuttingRecord, 'id'>) => void;

  // Cleaning records
  addCleaningRecord: (record: Omit<CleaningRecord, 'id'>) => void;

  // Alerts
  addAlert: (alert: Omit<Alert, 'id' | 'time' | 'resolved'>) => string;
  resolveAlert: (id: string) => void;
  checkThresholds: () => void;

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

  updateSlabWarehouse: (id, data) => {
    set((s) => ({
      slabList: s.slabList.map((slab) =>
        slab.id === id ? { ...slab, ...data, status: 'warehoused' } : slab
      ),
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
      set((s) => ({
        slabList: s.slabList.map((slab) =>
          slab.id === record.slabId
            ? {
                ...slab,
                cleaningResult: record.cleaningResult,
                defectType: record.defectType,
                cleaningTime: record.cleaningTime,
                status: 'cleaned' as const,
              }
            : slab
        ),
      }));
    }
    get()._persist();
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

  resolveAlert: (id) => {
    set((s) => ({
      alerts: s.alerts.map((a) =>
        a.id === id
          ? { ...a, resolved: true, resolvedTime: getCurrentTime(), resolvedBy: '当前用户' }
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
