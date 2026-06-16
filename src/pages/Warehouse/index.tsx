import { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Grid3X3,
  CheckCircle,
  AlertCircle,
  X,
  MapPin,
  Thermometer,
  FileText,
} from 'lucide-react';
import StatusBadge from '@/components/Status/StatusBadge';
import AlertPanel from '@/components/Status/AlertPanel';
import { useProductionStore } from '@/store/useProductionStore';
import type { SegregationLevel } from '@/types';

const segregationLevels: { value: SegregationLevel | ''; label: string; color: string }[] = [
  { value: '', label: '全部等级', color: 'bg-steel-600' },
  { value: 'C1.0', label: 'C1.0 优良', color: 'bg-green-500' },
  { value: 'C1.5', label: 'C1.5 合格', color: 'bg-blue-500' },
  { value: 'C2.0', label: 'C2.0 可接收', color: 'bg-yellow-500' },
  { value: 'C2.5', label: 'C2.5 需处理', color: 'bg-orange-500' },
  { value: 'C3.0', label: 'C3.0 不合格', color: 'bg-red-500' },
];

const bayOptions = [
  { value: 'ALL', label: '全部跨区', icon: '🏭' },
  { value: 'A', label: 'A跨 (特钢)', icon: '🅰️' },
  { value: 'B', label: 'B跨 (普碳)', icon: '🅱️' },
  { value: 'C', label: 'C跨 (成品)', icon: '🅲' },
];

interface BaySlotDetail {
  bay: string;
  row: number;
  col: number;
  position: string;
  slab: ReturnType<typeof useProductionStore.getState>['slabList'][number] | null;
}

export default function WarehousePage() {
  const {
    slabList,
    updateSlabWarehouse,
    ladleList,
  } = useProductionStore();

  // Form state
  const [selectedSlabId, setSelectedSlabId] = useState('');
  const [position, setPosition] = useState('');
  const [segregationLevel, setSegregationLevel] = useState<SegregationLevel | ''>('');
  const [centerSegregation, setCenterSegregation] = useState('');
  const [surfaceQuality, setSurfaceQuality] = useState('');
  const [segFilter, setSegFilter] = useState<SegregationLevel | ''>('');
  const [bayFilter, setBayFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [slotDetail, setSlotDetail] = useState<BaySlotDetail | null>(null);

  // Data derived from store
  const bayLayout = useMemo(() => {
    const bays: string[] = ['A', 'B', 'C'];
    const rows = 6;
    const cols = 8;

    // Lookup: position -> slab
    const posMap = new Map<string, typeof slabList[number]>();
    for (const s of slabList) {
      if (s.position) posMap.set(s.position, s);
    }

    return bays.map((bay) => {
      const slots: { pos: string; occupied: boolean; slab?: typeof slabList[number]; row: number; col: number }[] = [];
      for (let r = 1; r <= rows; r++) {
        for (let c = 1; c <= cols; c++) {
          const pos = `${bay}-${r.toString().padStart(2, '0')}-${c.toString().padStart(2, '0')}`;
          const slab = posMap.get(pos);
          slots.push({ pos, occupied: !!slab, slab, row: r, col: c });
        }
      }
      return { bay, slots, rows, cols };
    });
  }, [slabList]);

  // Filter by bay for rendering
  const filteredBays = bayFilter === 'ALL' ? bayLayout : bayLayout.filter((b) => b.bay === bayFilter);

  // Slabs ready for warehouse (cleaned and not yet warehoused, or any slab not in stock)
  const availableSlabs = useMemo(() => {
    return slabList.filter(
      (s) =>
        s.status !== 'warehoused' &&
        !s.position &&
        (s.status === 'cut' || s.status === 'cleaned' || s.status === 'pending_cut')
    );
  }, [slabList]);

  // Warehoused slabs, filtered
  const warehousedSlabs = useMemo(() => {
    return slabList
      .filter((s) => s.status === 'warehoused' || s.position)
      .filter((s) => {
        if (segFilter && s.segregationLevel !== segFilter) return false;
        if (bayFilter !== 'ALL' && !s.position?.startsWith(bayFilter)) return false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matches =
            s.slabNo.toLowerCase().includes(q) ||
            (s.position || '').toLowerCase().includes(q) ||
            (s.steelGrade || '').toLowerCase().includes(q) ||
            (s.heatNo || '').toLowerCase().includes(q) ||
            (s.ladleNo || '').toLowerCase().includes(q);
          if (!matches) return false;
        }
        return true;
      });
  }, [slabList, segFilter, bayFilter, searchQuery]);

  // Occupied positions
  const occupiedPositions = useMemo(() => new Set(slabList.filter((s) => s.position).map((s) => s.position)), [slabList]);

  const currentSlab = selectedSlabId ? slabList.find((s) => s.id === selectedSlabId) : null;
  const isSlabAlreadyWarehoused = !!currentSlab?.position;

  const handleWarehouse = () => {
    if (!selectedSlabId) {
      alert('请选择板坯');
      return;
    }
    if (isSlabAlreadyWarehoused) {
      alert('该板坯已入库，禁止重复入库');
      return;
    }
    if (!position) {
      alert('请选择库位');
      return;
    }
    if (occupiedPositions.has(position)) {
      alert('该库位已被其他板坯占用');
      return;
    }
    if (!segregationLevel) {
      alert('请选择偏析等级');
      return;
    }

    updateSlabWarehouse(selectedSlabId, {
      position,
      segregationLevel,
      centerSegregation: centerSegregation || undefined,
      surfaceQuality: surfaceQuality || undefined,
      warehouseTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    });

    setSelectedSlabId('');
    setPosition('');
    setSegregationLevel('');
    setCenterSegregation('');
    setSurfaceQuality('');
  };

  // Stats
  const totalSlots = bayLayout.reduce((sum, b) => sum + b.slots.length, 0);
  const occupiedCount = occupiedPositions.size;
  const utilization = Math.round((occupiedCount / totalSlots) * 100);

  const bayStats = bayLayout.map((b) => {
    const occ = b.slots.filter((s) => s.occupied).length;
    return {
      bay: b.bay,
      occupied: occ,
      total: b.slots.length,
      utilization: Math.round((occ / b.slots.length) * 100),
    };
  });

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">已入库板坯</p>
              <p className="text-xl font-mono font-bold text-white">{warehousedSlabs.length}</p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Grid3X3 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">库位利用率</p>
              <p className="text-xl font-mono font-bold text-white">
                {utilization}% <span className="text-sm text-steel-500">({occupiedCount}/{totalSlots})</span>
              </p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">待入库</p>
              <p className="text-xl font-mono font-bold text-white">{availableSlabs.length}</p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">一等品率</p>
              <p className="text-xl font-mono font-bold text-white">
                {warehousedSlabs.length > 0
                  ? `${Math.round(
                      (warehousedSlabs.filter(
                        (s) => s.segregationLevel === 'C1.0' || s.segregationLevel === 'C1.5'
                      ).length /
                        warehousedSlabs.length) *
                        100
                    )}%`
                  : '--'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bay Stats Mini */}
      <div className="grid grid-cols-3 gap-4">
        {bayStats.map((b) => (
          <div
            key={b.bay}
            className={`card-industrial p-4 border-l-4 transition-colors ${
              bayFilter === b.bay ? 'border-industrial-500 cursor-pointer' : 'border-transparent'
            }`}
            onClick={() => setBayFilter(bayFilter === b.bay ? 'ALL' : b.bay)}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-steel-300 font-medium">{b.bay} 跨</span>
              <span className="text-xs text-steel-500">
                点击{bayFilter === b.bay ? '取消筛选' : '筛选'}
              </span>
            </div>
            <p className="text-lg font-mono text-white mb-2">
              {b.occupied} / {b.total} 库位
            </p>
            <div className="h-2 bg-steel-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-industrial-500 to-green-500 rounded-full"
                style={{ width: `${b.utilization}%` }}
              ></div>
            </div>
            <p className="text-right text-xs text-steel-400 mt-1">{b.utilization}%</p>
          </div>
        ))}
      </div>

      {/* Warehouse Layout */}
      <div className="card-industrial">
        <div className="card-header flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-industrial-500" />
            <h2 className="card-title">库区分布图</h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Bay Filter Tabs */}
            <div className="flex gap-1 bg-steel-800/50 rounded-lg p-1">
              {bayOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setBayFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-md text-xs transition-colors flex items-center gap-1 ${
                    bayFilter === opt.value
                      ? 'bg-industrial-600 text-white'
                      : 'text-steel-400 hover:text-white hover:bg-steel-700/50'
                  }`}
                >
                  <span>{opt.icon}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 text-xs text-steel-400 ml-2">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-green-500/50 border border-green-500"></div>
                <span>占用</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-steel-800 border border-steel-600"></div>
                <span>空库位</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-8">
          {filteredBays.map(({ bay, slots, cols }) => (
            <div key={bay}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1 bg-industrial-600/30 border border-industrial-500 rounded">
                    <span className="text-industrial-400 font-bold text-lg">{bay}</span>
                    <span className="text-steel-400 text-xs ml-2">跨区</span>
                  </div>
                  <span className="text-xs text-steel-500">
                    {slots.filter((s) => s.occupied).length} / {slots.length} 已占用
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {Array.from({ length: cols }, (_, i) => (
                    <div
                      key={i}
                      className="w-8 md:w-12 text-[10px] text-center text-steel-500 font-mono"
                    >
                      C{i + 1}
                    </div>
                  ))}
                </div>
              </div>
              {Array.from(new Set(slots.map((s) => s.row))).map((row) => (
                <div key={`${bay}-${row}`} className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 text-[10px] text-steel-500 font-mono text-right">R{row}</div>
                  {slots
                    .filter((s) => s.row === row)
                    .map((slot) => {
                      const isSelectedInForm = position === slot.pos;
                      const classes = [
                        'flex-1 aspect-[1.4] rounded border text-[10px] md:text-xs flex flex-col items-center justify-center cursor-pointer transition-all',
                        slot.occupied
                          ? slot.slab?.segregationLevel === 'C1.0' || slot.slab?.segregationLevel === 'C1.5'
                            ? 'bg-green-500/30 border-green-500/60 hover:bg-green-500/50 hover:scale-105'
                            : slot.slab?.segregationLevel === 'C2.5' || slot.slab?.segregationLevel === 'C3.0'
                            ? 'bg-red-500/30 border-red-500/60 hover:bg-red-500/50 hover:scale-105'
                            : 'bg-industrial-500/30 border-industrial-500/60 hover:bg-industrial-500/50 hover:scale-105'
                          : isSelectedInForm
                          ? 'bg-industrial-600 border-industrial-400 ring-2 ring-industrial-400 ring-opacity-50'
                          : 'bg-steel-800/50 border-steel-700 hover:bg-steel-700 hover:border-steel-500 hover:scale-105',
                      ].join(' ');

                      return (
                        <div
                          key={slot.pos}
                          className={classes}
                          title={
                            slot.occupied
                              ? `${slot.slab?.slabNo} @ ${slot.pos}`
                              : `空库位 ${slot.pos}`
                          }
                          onClick={() => {
                            if (slot.occupied) {
                              setSlotDetail({
                                bay,
                                row: slot.row,
                                col: slot.col,
                                position: slot.pos,
                                slab: slot.slab || null,
                              });
                            } else {
                              // Select position for form if we have a selected slab
                              setPosition(slot.pos);
                            }
                          }}
                        >
                          {slot.occupied ? (
                            <>
                              <div className="font-mono truncate w-full text-center px-0.5 text-white font-bold">
                                {slot.slab?.slabNo.slice(-5)}
                              </div>
                              <div className="text-[9px] text-steel-300 opacity-80">
                                {slot.slab?.segregationLevel}
                              </div>
                            </>
                          ) : (
                            <span className="text-steel-600 font-mono">
                              {slot.row}{slot.col < 10 ? `0${slot.col}` : slot.col}
                            </span>
                          )}
                        </div>
                      );
                    })}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Warehouse Form + Records */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inbound Form */}
        <div className="card-industrial">
          <div className="card-header">
            <h2 className="card-title">入库登记与检验</h2>
            <StatusBadge status="running" text="待入库操作" size="sm" />
          </div>
          <div className="p-4 space-y-4">
            {/* Slab Selection */}
            <div>
              <label className="block text-sm text-steel-400 mb-1.5">选择板坯</label>
              <select
                value={selectedSlabId}
                onChange={(e) => setSelectedSlabId(e.target.value)}
                className="input-field"
              >
                <option value="">-- 请选择待入库板坯 --</option>
                {availableSlabs.map((slab) => (
                  <option key={slab.id} value={slab.id}>
                    {slab.slabNo} | {slab.steelGrade} | {slab.length}m
                    {slab.ladleNo ? ` | 钢包:${slab.ladleNo}` : ''}
                  </option>
                ))}
              </select>
              {availableSlabs.length === 0 && (
                <p className="text-xs text-green-400 mt-1">✓ 所有板坯已入库</p>
              )}
              {isSlabAlreadyWarehoused && (
                <p className="text-xs text-red-400 mt-1">⚠ 该板坯已入库 ({currentSlab?.position})，禁止重复入库</p>
              )}
            </div>

            {/* Selected Slab info */}
            {currentSlab && !isSlabAlreadyWarehoused && (
              <div className="bg-steel-800/50 border border-steel-700 rounded p-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-steel-400">板坯号</span>
                  <span className="text-white font-mono">{currentSlab.slabNo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel-400">尺寸 (W×T×L)</span>
                  <span className="text-white font-mono">
                    {currentSlab.width}×{currentSlab.thickness}×{currentSlab.length}mm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-steel-400">钢种</span>
                  <span className="text-white">{currentSlab.steelGrade}</span>
                </div>
                {currentSlab.ladleNo && (
                  <div className="flex justify-between">
                    <span className="text-steel-400">来源钢包</span>
                    <span className="text-orange-400 font-mono">{currentSlab.ladleNo}</span>
                  </div>
                )}
                {currentSlab.ladleTemp != null && (
                  <div className="flex justify-between">
                    <span className="text-steel-400">钢水温度</span>
                    <span className="text-orange-400 font-mono">{currentSlab.ladleTemp}℃</span>
                  </div>
                )}
              </div>
            )}

            {/* Position Selection - use dropdown instead of click on bay chart */}
            <div>
              <label className="block text-sm text-steel-400 mb-1.5">
                选择库位 {position && <span className="text-green-400">已选: {position}</span>}
              </label>
              <select
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                className="input-field"
              >
                <option value="">-- 请选择或点击上方库位 --</option>
                {bayLayout.flatMap((bay) =>
                  bay.slots.map((slot) => {
                    const occupied = occupiedPositions.has(slot.pos);
                    // also disable if slab is already in this position (shouldn't happen)
                    return (
                      <option key={slot.pos} value={slot.pos} disabled={occupied}>
                        {slot.pos} {occupied ? `[占用:${slot.slab?.slabNo.slice(-5)}]` : ' [空]'}
                      </option>
                    );
                  })
                )}
              </select>
              <p className="text-[11px] text-steel-500 mt-1">
                格式: 跨区-行号-列号 （已占用库位在下拉中禁用）
              </p>
            </div>

            {/* Segregation Inspection */}
            <div className="pt-2 border-t border-steel-700/30">
              <p className="text-sm text-industrial-400 mb-3 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                低倍偏析检验
              </p>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-steel-400 mb-1.5">中心偏析描述</label>
                  <input
                    type="text"
                    value={centerSegregation}
                    onChange={(e) => setCenterSegregation(e.target.value)}
                    className="input-field text-sm"
                    placeholder="如: 轻微中心偏析"
                  />
                </div>
                <div>
                  <label className="block text-xs text-steel-400 mb-1.5">表面质量</label>
                  <input
                    type="text"
                    value={surfaceQuality}
                    onChange={(e) => setSurfaceQuality(e.target.value)}
                    className="input-field text-sm"
                    placeholder="如: 良好/轻微划痕"
                  />
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-xs text-steel-400 mb-2">偏析等级 (必填)</label>
                <div className="flex flex-wrap gap-1.5">
                  {segregationLevels.slice(1).map((lv) => (
                    <button
                      key={lv.value}
                      onClick={() => setSegregationLevel(lv.value as SegregationLevel)}
                      className={`px-2.5 py-1.5 rounded text-xs transition-all ${
                        segregationLevel === lv.value
                          ? `${lv.color} text-white ring-2 ring-white/20 scale-105`
                          : 'bg-steel-700/50 text-steel-300 hover:bg-steel-700'
                      }`}
                    >
                      {lv.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={handleWarehouse}
              className="btn-primary w-full"
              disabled={
                !selectedSlabId ||
                !position ||
                !segregationLevel ||
                isSlabAlreadyWarehoused ||
                occupiedPositions.has(position)
              }
            >
              确认入库并登记
            </button>

            {(!selectedSlabId || !position || !segregationLevel) && (
              <p className="text-[11px] text-yellow-400 text-center">
                {!selectedSlabId && '请先选择板坯 | '}
                {!position && '请选择库位 | '}
                {!segregationLevel && '请选择偏析等级'}
              </p>
            )}
          </div>
        </div>

        {/* Warehouse Records */}
        <div className="card-industrial">
          <div className="card-header flex-wrap gap-3">
            <h2 className="card-title">入库记录与板坯查询</h2>
          </div>

          <div className="p-4 space-y-3">
            {/* Search & Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-steel-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-9"
                  placeholder="搜索: 板坯号 / 库位 / 钢种 / 钢包 / 炉号..."
                />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {segregationLevels.map((lv) => (
                  <button
                    key={lv.value}
                    onClick={() => setSegFilter(lv.value)}
                    className={`px-2 py-1 rounded text-[11px] transition-colors ${
                      segFilter === lv.value
                        ? lv.value
                          ? `${lv.color} text-white`
                          : 'bg-industrial-600 text-white'
                        : 'bg-steel-700/30 text-steel-400 hover:text-white'
                    }`}
                  >
                    {lv.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Records Table */}
            <div className="max-h-[420px] overflow-y-auto -mx-4">
              {warehousedSlabs.length > 0 ? (
                <table className="w-full">
                  <thead className="sticky top-0 bg-steel-800 z-10">
                    <tr className="border-b border-steel-700/50">
                      <th className="table-header text-left px-3 py-2 text-xs">板坯号</th>
                      <th className="table-header text-left px-3 py-2 text-xs">库位</th>
                      <th className="table-header text-left px-3 py-2 text-xs">等级</th>
                      <th className="table-header text-left px-3 py-2 text-xs">入库时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehousedSlabs.map((slab) => (
                      <tr
                        key={slab.id}
                        className="border-b border-steel-800/50 hover:bg-steel-800/40 transition-colors cursor-pointer"
                        onClick={() => {
                          setSlotDetail({
                            bay: slab.position?.slice(0, 1) || '',
                            row: parseInt(slab.position?.slice(2, 4) || '0'),
                            col: parseInt(slab.position?.slice(5, 7) || '0'),
                            position: slab.position || '',
                            slab,
                          });
                        }}
                      >
                        <td className="table-cell px-3 py-2">
                          <p className="font-mono text-white text-xs">{slab.slabNo}</p>
                          <p className="text-[10px] text-steel-500">
                            {slab.steelGrade} · {slab.length}m
                            {slab.ladleNo ? ` · ${slab.ladleNo}` : ''}
                          </p>
                        </td>
                        <td className="table-cell px-3 py-2">
                          <span className="inline-flex items-center gap-1 text-xs text-industrial-400 font-mono">
                            <MapPin className="w-3 h-3" />
                            {slab.position}
                          </span>
                        </td>
                        <td className="table-cell px-3 py-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                              slab.segregationLevel === 'C1.0' || slab.segregationLevel === 'C1.5'
                                ? 'bg-green-500/30 text-green-400'
                                : slab.segregationLevel === 'C2.5' || slab.segregationLevel === 'C3.0'
                                ? 'bg-red-500/30 text-red-400'
                                : 'bg-industrial-500/30 text-industrial-400'
                            }`}
                          >
                            {slab.segregationLevel || '-'}
                          </span>
                        </td>
                        <td className="table-cell px-3 py-2 text-[10px] text-steel-400">
                          {slab.warehouseTime}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 text-steel-500">
                  <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>暂无入库记录</p>
                  <p className="text-xs mt-1">完成入库登记后将在此显示</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Module Alerts */}
      <div className="card-industrial">
        <div className="card-header">
          <h2 className="card-title">本模块告警信息</h2>
        </div>
        <div className="p-3">
          <AlertPanel moduleFilter="warehouse" showAll maxItems={5} />
        </div>
      </div>

      {/* Slot Detail Modal */}
      {slotDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card-industrial w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col animate-[fadeIn_.2s]">
            <div className="card-header">
              <h2 className="card-title flex items-center gap-2">
                <MapPin className="w-4 h-4 text-industrial-500" />
                库位 {slotDetail.position} 详情
                <span className="text-xs text-steel-500 ml-1">
                  ({slotDetail.bay}跨 第{slotDetail.row}行 第{slotDetail.col}列)
                </span>
              </h2>
              <button
                onClick={() => setSlotDetail(null)}
                className="p-1 rounded hover:bg-steel-700 transition-colors text-steel-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {slotDetail.slab ? (
                <>
                  {/* Slab Basic */}
                  <div className="bg-steel-800/60 border border-steel-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-steel-400">板坯基本信息</p>
                      <StatusBadge status="success" text="在库" size="sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-steel-500 mb-0.5">板坯号</p>
                        <p className="font-mono text-white font-bold">{slotDetail.slab.slabNo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-steel-500 mb-0.5">钢种</p>
                        <p className="text-white">{slotDetail.slab.steelGrade}</p>
                      </div>
                      <div>
                        <p className="text-xs text-steel-500 mb-0.5">尺寸 (W×T×L)</p>
                        <p className="font-mono text-white">
                          {slotDetail.slab.width}×{slotDetail.slab.thickness}×{slotDetail.slab.length}mm
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-steel-500 mb-0.5">来源炉号</p>
                        <p className="font-mono text-orange-400">
                          {slotDetail.slab.heatNo || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-steel-500 mb-0.5 flex items-center gap-1">
                          <Thermometer className="w-3 h-3" />
                          钢水温度
                        </p>
                        <p className="font-mono text-orange-400">
                          {slotDetail.slab.ladleTemp != null ? `${slotDetail.slab.ladleTemp}℃` : '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-steel-500 mb-0.5">钢包号</p>
                        <p className="font-mono text-orange-400">{slotDetail.slab.ladleNo || '-'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Traceability */}
                  <div className="bg-steel-800/60 border border-steel-700 rounded-lg p-4">
                    <p className="text-xs text-steel-400 mb-3">入库检验信息</p>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-center justify-between py-1 border-b border-steel-700/30">
                        <span className="text-steel-400">偏析等级</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            slotDetail.slab.segregationLevel === 'C1.0' ||
                            slotDetail.slab.segregationLevel === 'C1.5'
                              ? 'bg-green-500/30 text-green-400'
                              : slotDetail.slab.segregationLevel === 'C2.5' ||
                                slotDetail.slab.segregationLevel === 'C3.0'
                              ? 'bg-red-500/30 text-red-400'
                              : 'bg-industrial-500/30 text-industrial-400'
                          }`}
                        >
                          {slotDetail.slab.segregationLevel || '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-steel-700/30">
                        <span className="text-steel-400">中心偏析</span>
                        <span className="text-white">{slotDetail.slab.centerSegregation || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-steel-700/30">
                        <span className="text-steel-400">表面质量</span>
                        <span className="text-white">{slotDetail.slab.surfaceQuality || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-steel-400">入库时间</span>
                        <span className="font-mono text-white">{slotDetail.slab.warehouseTime || '-'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Traceability */}
                  {slotDetail.slab.cutLength != null ||
                  slotDetail.slab.cutTime ||
                  slotDetail.slab.cleaningResult ||
                  slotDetail.slab.defectType ? (
                    <div className="bg-gradient-to-br from-industrial-900/40 to-steel-800/40 border border-industrial-500/30 rounded-lg p-4">
                      <p className="text-xs text-industrial-400 mb-3 flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        全流程追溯快照
                      </p>
                      <div className="space-y-2 text-xs">
                        {slotDetail.slab.cutLength != null && (
                          <div className="flex justify-between">
                            <span className="text-steel-400">定尺长度</span>
                            <span className="font-mono text-white">{slotDetail.slab.cutLength}m</span>
                          </div>
                        )}
                        {slotDetail.slab.cutTime && (
                          <div className="flex justify-between">
                            <span className="text-steel-400">切割时间</span>
                            <span className="text-white">{slotDetail.slab.cutTime}</span>
                          </div>
                        )}
                        {slotDetail.slab.defectType && slotDetail.slab.defectType !== 'none' && (
                          <div className="flex justify-between">
                            <span className="text-steel-400">表面缺陷</span>
                            <span className="text-orange-400">{slotDetail.slab.defectType}</span>
                          </div>
                        )}
                        {slotDetail.slab.cleaningResult && (
                          <div className="flex justify-between">
                            <span className="text-steel-400">清理结果</span>
                            <span
                              className={
                                slotDetail.slab.cleaningResult === 'recheck'
                                  ? 'text-yellow-400'
                                  : 'text-green-400'
                              }
                            >
                              {slotDetail.slab.cleaningResult === 'qualified'
                                ? '合格'
                                : slotDetail.slab.cleaningResult === 'repaired'
                                ? '修磨合格'
                                : '待复检'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="text-center py-16 text-steel-500">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">此库位当前为空</p>
                  <p className="text-xs mt-2 text-steel-600">
                    可在"入库登记"中选择此库位放入板坯
                  </p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-steel-700/50 bg-steel-800/30">
              <button
                onClick={() => setSlotDetail(null)}
                className="btn-primary w-full"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
