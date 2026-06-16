import { create } from 'zustand';
import type {
  Ladle,
  Tundish,
  Mold,
  SecondaryCoolingZone,
  Slab,
  Alert,
  ProductionStats,
  LadleStatus,
  TundishStatus,
  MoldStatus,
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
} from '@/data/mockData';

interface ProductionState {
  ladleList: Ladle[];
  tundish: Tundish;
  mold: Mold;
  secondaryCoolingZones: SecondaryCoolingZone[];
  slabList: Slab[];
  alerts: Alert[];
  productionStats: ProductionStats;
  temperatureHistory: { time: number; value: number }[];
  liquidLevelHistory: { time: number; value: number }[];
  currentTime: string;
  castingSpeed: number;

  setLadleStatus: (id: string, status: LadleStatus) => void;
  setTundishStatus: (status: TundishStatus) => void;
  setMoldStatus: (status: MoldStatus) => void;
  addLadle: (ladle: Ladle) => void;
  addSlab: (slab: Slab) => void;
  updateSlabStatus: (id: string, status: Slab['status']) => void;
  addAlert: (alert: Alert) => void;
  resolveAlert: (id: string) => void;
  updateRealTimeData: () => void;
  updateCastingSpeed: (speed: number) => void;
  updateCoolingZoneWater: (zoneId: string, waterFlow: number) => void;
  updateMoldVibration: (freq: number, amplitude: number) => void;
  updateTundishPowder: (amount: number) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleString('zh-CN', { hour12: false });
};

export const useProductionStore = create<ProductionState>((set, get) => ({
  ladleList: mockLadleList,
  tundish: mockTundish,
  mold: mockMold,
  secondaryCoolingZones: mockSecondaryCoolingZones,
  slabList: mockSlabList,
  alerts: mockAlerts,
  productionStats: mockProductionStats,
  temperatureHistory: mockTemperatureHistory,
  liquidLevelHistory: mockLiquidLevelHistory,
  currentTime: getCurrentTime(),
  castingSpeed: 1.2,

  setLadleStatus: (id, status) =>
    set((state) => ({
      ladleList: state.ladleList.map((l) =>
        l.id === id ? { ...l, status } : l
      ),
    })),

  setTundishStatus: (status) =>
    set((state) => ({
      tundish: { ...state.tundish, status },
    })),

  setMoldStatus: (status) =>
    set((state) => ({
      mold: { ...state.mold, status },
    })),

  addLadle: (ladle) =>
    set((state) => ({
      ladleList: [...state.ladleList, ladle],
    })),

  addSlab: (slab) =>
    set((state) => ({
      slabList: [slab, ...state.slabList],
      productionStats: {
        ...state.productionStats,
        totalSlabs: state.productionStats.totalSlabs + 1,
        todayOutput: state.productionStats.todayOutput + 1,
      },
    })),

  updateSlabStatus: (id, status) =>
    set((state) => ({
      slabList: state.slabList.map((s) =>
        s.id === id ? { ...s, status } : s
      ),
    })),

  addAlert: (alert) =>
    set((state) => ({
      alerts: [alert, ...state.alerts],
    })),

  resolveAlert: (id) =>
    set((state) => ({
      alerts: state.alerts.map((a) =>
        a.id === id ? { ...a, resolved: true } : a
      ),
    })),

  updateRealTimeData: () => {
    const state = get();
    
    const newTemp = [...state.temperatureHistory.slice(1)];
    newTemp.push({
      time: state.temperatureHistory[state.temperatureHistory.length - 1].time + 1,
      value: 1540 + Math.random() * 20 - 10,
    });

    const newLevel = [...state.liquidLevelHistory.slice(1)];
    newLevel.push({
      time: state.liquidLevelHistory[state.liquidLevelHistory.length - 1].time + 1,
      value: 120 + Math.random() * 15 - 7.5,
    });

    set({
      currentTime: getCurrentTime(),
      temperatureHistory: newTemp,
      liquidLevelHistory: newLevel,
      tundish: {
        ...state.tundish,
        temperature: newTemp[newTemp.length - 1].value,
        liquidLevel: 750 + Math.random() * 100 - 50,
      },
      mold: {
        ...state.mold,
        liquidLevel: newLevel[newLevel.length - 1].value,
      },
    });
  },

  updateCastingSpeed: (speed) =>
    set((state) => ({
      castingSpeed: speed,
      productionStats: {
        ...state.productionStats,
        castingSpeed: speed,
      },
    })),

  updateCoolingZoneWater: (zoneId, waterFlow) =>
    set((state) => ({
      secondaryCoolingZones: state.secondaryCoolingZones.map((z) =>
        z.id === zoneId ? { ...z, waterFlow } : z
      ),
    })),

  updateMoldVibration: (freq, amplitude) =>
    set((state) => ({
      mold: { ...state.mold, vibrationFreq: freq, amplitude },
    })),

  updateTundishPowder: (amount) =>
    set((state) => ({
      tundish: { ...state.tundish, powderAmount: state.tundish.powderAmount + amount },
    })),
}));
