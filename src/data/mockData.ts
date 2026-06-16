import type { Ladle, Tundish, Mold, SecondaryCoolingZone, Slab, CuttingRecord, CleaningRecord, Alert, ProductionStats } from '@/types';

export const mockLadle: Ladle = {
  id: 'ladle-001',
  ladleNo: 'L-2024-0617-01',
  steelGrade: 'Q235B',
  temperature: 1568,
  weight: 85.6,
  receiveTime: '2024-06-17 08:30:00',
  status: 'pouring',
};

export const mockLadleList: Ladle[] = [
  {
    id: 'ladle-001',
    ladleNo: 'L-2024-0617-01',
    steelGrade: 'Q235B',
    temperature: 1568,
    weight: 85.6,
    receiveTime: '2024-06-17 08:30:00',
    status: 'pouring',
  },
  {
    id: 'ladle-002',
    ladleNo: 'L-2024-0617-02',
    steelGrade: 'Q345B',
    temperature: 1575,
    weight: 90.2,
    receiveTime: '2024-06-17 09:15:00',
    status: 'receiving',
  },
  {
    id: 'ladle-003',
    ladleNo: 'L-2024-0617-03',
    steelGrade: 'Q235B',
    temperature: 0,
    weight: 0,
    receiveTime: '',
    status: 'pending',
  },
  {
    id: 'ladle-004',
    ladleNo: 'L-2024-0616-24',
    steelGrade: 'Q235B',
    temperature: 1520,
    weight: 2.5,
    receiveTime: '2024-06-16 23:45:00',
    status: 'finished',
  },
];

export const mockTundish: Tundish = {
  id: 'tundish-001',
  tundishNo: 'T-2024-0617-01',
  temperature: 1545,
  liquidLevel: 780,
  powderAmount: 12.5,
  startTime: '2024-06-17 08:45:00',
  status: 'pouring',
};

export const mockMold: Mold = {
  id: 'mold-001',
  moldNo: 'M-01',
  liquidLevel: 125,
  vibrationFreq: 180,
  amplitude: 4.5,
  status: 'running',
};

export const mockSecondaryCoolingZones: SecondaryCoolingZone[] = [
  { id: 'zone-0', zoneName: '足辊区', waterFlow: 120, waterRatio: 0.8, temperature: 1280 },
  { id: 'zone-1', zoneName: '一区', waterFlow: 180, waterRatio: 1.2, temperature: 1150 },
  { id: 'zone-2', zoneName: '二区', waterFlow: 150, waterRatio: 1.0, temperature: 1020 },
  { id: 'zone-3', zoneName: '三区', waterFlow: 100, waterRatio: 0.7, temperature: 920 },
  { id: 'zone-4', zoneName: '四区', waterFlow: 80, waterRatio: 0.5, temperature: 850 },
];

export const mockSlabList: Slab[] = [
  {
    id: 'slab-001',
    slabNo: 'B240617001',
    width: 1500,
    thickness: 220,
    length: 9.5,
    steelGrade: 'Q235B',
    status: 'warehoused',
    cutTime: '2024-06-17 09:05:00',
    cleaningTime: '2024-06-17 09:20:00',
    warehouseTime: '2024-06-17 09:45:00',
    position: 'A-01-03',
    segregationLevel: 'C1.5',
    centerSegregation: '轻微中心偏析',
    surfaceQuality: '良好',
    ladleNo: 'L-2024-0617-01',
    ladleTemp: 1568,
    heatNo: 'H2024061701',
    cutLength: 9.5,
    cleaningResult: 'repaired',
    defectType: 'crack',
  },
  {
    id: 'slab-002',
    slabNo: 'B240617002',
    width: 1500,
    thickness: 220,
    length: 10.2,
    steelGrade: 'Q235B',
    status: 'cleaned',
    cutTime: '2024-06-17 09:18:00',
    cleaningTime: '2024-06-17 09:35:00',
    segregationLevel: 'C1.0',
    ladleNo: 'L-2024-0617-01',
    ladleTemp: 1568,
    heatNo: 'H2024061701',
    cutLength: 10.2,
    cleaningResult: 'qualified',
    defectType: 'none',
  },
  {
    id: 'slab-003',
    slabNo: 'B240617003',
    width: 1500,
    thickness: 220,
    length: 9.8,
    steelGrade: 'Q235B',
    status: 'cut',
    cutTime: '2024-06-17 09:30:00',
    ladleNo: 'L-2024-0617-01',
    ladleTemp: 1565,
    heatNo: 'H2024061701',
    cutLength: 9.8,
  },
  {
    id: 'slab-004',
    slabNo: 'B240617004',
    width: 1500,
    thickness: 220,
    length: 8.5,
    steelGrade: 'Q345B',
    status: 'cut',
    cutTime: '2024-06-17 09:42:00',
    ladleNo: 'L-2024-0617-02',
    ladleTemp: 1575,
    heatNo: 'H2024061702',
    cutLength: 8.5,
  },
  {
    id: 'slab-005',
    slabNo: 'B240617005',
    width: 1500,
    thickness: 220,
    length: 0,
    steelGrade: 'Q345B',
    status: 'pending_cut',
    ladleNo: 'L-2024-0617-02',
    ladleTemp: 1572,
    heatNo: 'H2024061702',
  },
];

export const mockCuttingRecords: CuttingRecord[] = [
  { id: 'cut-001', slabId: 'slab-001', slabNo: 'B240617001', cutLength: 9.5, cutTime: '2024-06-17 09:05:00', flameStatus: true },
  { id: 'cut-002', slabId: 'slab-002', slabNo: 'B240617002', cutLength: 10.2, cutTime: '2024-06-17 09:18:00', flameStatus: true },
  { id: 'cut-003', slabId: 'slab-003', slabNo: 'B240617003', cutLength: 9.8, cutTime: '2024-06-17 09:30:00', flameStatus: true },
  { id: 'cut-004', slabId: 'slab-004', slabNo: 'B240617004', cutLength: 8.5, cutTime: '2024-06-17 09:42:00', flameStatus: true },
];

export const mockCleaningRecords: CleaningRecord[] = [
  { id: 'clean-001', slabId: 'slab-001', slabNo: 'B240617001', defectType: 'crack', defectLocation: '上表面中部', cleaningMethod: 'flame', cleaningResult: 'repaired', operator: '张工', cleaningTime: '2024-06-17 09:20:00', remark: '已修磨，无深度裂纹' },
  { id: 'clean-002', slabId: 'slab-002', slabNo: 'B240617002', defectType: 'none', defectLocation: '-', cleaningMethod: 'manual', cleaningResult: 'qualified', operator: '李工', cleaningTime: '2024-06-17 09:35:00', remark: '目视检查无缺陷' },
];

export const mockAlerts: Alert[] = [
  { id: 'alert-001', level: 'warning', module: 'mold', message: '结晶器液位波动超出正常范围', time: '2024-06-17 09:25:00', resolved: false, paramName: 'liquidLevel' },
  { id: 'alert-002', level: 'info', module: 'cooling', message: '二冷水流量自动调节完成', time: '2024-06-17 09:20:00', resolved: true },
  { id: 'alert-003', level: 'danger', module: 'tundish', message: '中间包温度低于下限值', time: '2024-06-17 09:10:00', resolved: true, paramName: 'temperature' },
  { id: 'alert-004', level: 'warning', module: 'cutting', message: '切割长度偏差 +5mm', time: '2024-06-17 09:05:00', resolved: true },
];

export const mockProductionStats: ProductionStats = {
  totalSlabs: 156,
  todayOutput: 28,
  avgTemperature: 1552,
  castingSpeed: 1.2,
  passRate: 98.5,
  runningTime: 72.5,
};

export const mockTemperatureHistory = Array.from({ length: 60 }, (_, i) => ({
  time: i,
  value: 1540 + Math.random() * 20 - 10,
}));

export const mockLiquidLevelHistory = Array.from({ length: 60 }, (_, i) => ({
  time: i,
  value: 120 + Math.random() * 15 - 7.5,
}));
