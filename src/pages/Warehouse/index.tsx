import { useState, useMemo } from 'react';
import {
  Package,
  Search,
  MapPin,
  ArrowRightLeft,
  Truck,
  Clock,
  FileText,
  X,
  AlertCircle,
  History,
} from 'lucide-react';
import StatusBadge from '@/components/Status/StatusBadge';
import AlertPanel from '@/components/Status/AlertPanel';
import { useProductionStore } from '@/store/useProductionStore';
import type { SegregationLevel, WarehouseHistoryItem } from '@/types';

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

type DetailAction = 'info' | 'transfer' | 'outbound';

export default function WarehousePage() {
  const {
    slabList,
    updateSlabWarehouse,
    transferSlab,
    outboundSlab,
    getSlabWarehouseHistory,
    outboundRecords,
  } = useProductionStore();

  // Filters
  const [segFilter, setSegFilter] = useState<SegregationLevel | ''>('');
  const [bayFilter, setBayFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [recordTab, setRecordTab] = useState<'in_stock' | 'outbound'>('in_stock');

  // Inbound form
  const [selectedSlabId, setSelectedSlabId] = useState('');
  const [position, setPosition] = useState('');
  const [segregationLevel, setSegregationLevel] = useState<SegregationLevel | ''>('');
  const [centerSegregation, setCenterSegregation] = useState('');
  const [surfaceQuality, setSurfaceQuality] = useState('');
  const [warehouseOperator, setWarehouseOperator] = useState('仓管-李工');

  // Slot detail modal
  const [detailSlabId, setDetailSlabId] = useState<string | null>(null);
  const [detailAction, setDetailAction] = useState<DetailAction>('info');

  // Outbound history modal (只读)
  const [historySlabId, setHistorySlabId] = useState<string | null>(null);

  // Transfer form
  const [transferToPosition, setTransferToPosition] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferOperator, setTransferOperator] = useState('仓管-李工');

  // Outbound form
  const [outboundDestination, setOutboundDestination] = useState('');
  const [outboundTransporter, setOutboundTransporter] = useState('');
  const [outboundOperator, setOutboundOperator] = useState('仓管-李工');
  const [outboundRemark, setOutboundRemark] = useState('');

  // ============== Derived ==============
  const bayLayout = useMemo(() => {
    const bays: string[] = ['A', 'B', 'C'];
    const rows = 6;
    const cols = 8;

    const posMap = new Map<string, typeof slabList[number]>();
    for (const s of slabList) {
      if (s.position && s.status === 'warehoused') posMap.set(s.position, s);
    }

    return bays.map((bay) => {
      const slots: {
        pos: string;
        occupied: boolean;
        slab?: typeof slabList[number];
        row: number;
        col: number;
      }[] = [];
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

  const filteredBays =
    bayFilter === 'ALL' ? bayLayout : bayLayout.filter((b) => b.bay === bayFilter);

  // Occupied positions (in stock only)
  const occupiedPositions = useMemo(
    () => new Set(slabList.filter((s) => s.position && s.status === 'warehoused').map((s) => s.position)),
    [slabList]
  );

  // Slabs ready for warehouse (cleaned, not yet in stock, not outbound)
  const availableSlabs = useMemo(() => {
    return slabList.filter((s) => s.status === 'cleaned' && !s.position);
  }, [slabList]);

  // In-stock slabs, filtered
  const inStockSlabs = useMemo(() => {
    return slabList
      .filter((s) => s.status === 'warehoused' && s.position)
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

  // Outbound slabs (records)
  const outboundSlabList = useMemo(() => {
    if (!searchQuery && bayFilter === 'ALL') return outboundRecords;
    return outboundRecords.filter((r) => {
      if (bayFilter !== 'ALL' && !r.position.startsWith(bayFilter)) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          r.slabNo.toLowerCase().includes(q) ||
          r.position.toLowerCase().includes(q) ||
          r.destination.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [outboundRecords, searchQuery, bayFilter]);

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

  const currentSlab = selectedSlabId ? slabList.find((s) => s.id === selectedSlabId) : null;
  const detailSlab = detailSlabId ? slabList.find((s) => s.id === detailSlabId) : null;
  const detailHistory: WarehouseHistoryItem[] = detailSlabId
    ? getSlabWarehouseHistory(detailSlabId)
    : [];
  const historySlab = historySlabId ? slabList.find((s) => s.id === historySlabId) : null;
  const historyTimeline: WarehouseHistoryItem[] = historySlabId
    ? getSlabWarehouseHistory(historySlabId)
    : [];
  const historyOutboundRec = historySlabId
    ? outboundRecords.find((r) => r.slabId === historySlabId)
    : null;

  // ============== Actions ==============
  const handleWarehouse = () => {
    if (!selectedSlabId || !position || !segregationLevel) return;
    if (occupiedPositions.has(position)) {
      alert('该库位已被占用');
      return;
    }

    updateSlabWarehouse(selectedSlabId, {
      position,
      segregationLevel,
      centerSegregation: centerSegregation || undefined,
      surfaceQuality: surfaceQuality || undefined,
      warehouseTime: new Date().toLocaleString('zh-CN', { hour12: false }),
      operator: warehouseOperator,
    });

    // Reset
    setSelectedSlabId('');
    setPosition('');
    setSegregationLevel('');
    setCenterSegregation('');
    setSurfaceQuality('');
  };

  const handleTransfer = () => {
    if (!detailSlabId || !transferToPosition) return;
    if (occupiedPositions.has(transferToPosition)) {
      alert('目标库位已被占用');
      return;
    }

    transferSlab(detailSlabId, transferToPosition, transferOperator, transferReason);
    setDetailAction('info');
    setTransferToPosition('');
    setTransferReason('');
  };

  const handleOutbound = () => {
    if (!detailSlabId || !outboundDestination || !outboundTransporter) return;
    outboundSlab(detailSlabId, outboundDestination, outboundTransporter, outboundOperator, outboundRemark);
    setDetailAction('info');
    setOutboundDestination('');
    setOutboundTransporter('');
    setOutboundRemark('');
  };

  const openSlotDetail = (bay: string, row: number, col: number, pos: string, slab: any) => {
    if (slab) {
      setDetailSlabId(slab.id);
      setDetailAction('info');
    } else {
      // Empty slot: select position for inbound
      setPosition(pos);
    }
  };

  // ============== Render ==============
  const renderHistoryTimeline = (history: WarehouseHistoryItem[]) => {
    if (history.length === 0) {
      return (
        <p className="text-center text-steel-500 text-sm py-4">暂无历史记录</p>
      );
    }

    return (
      <div className="relative pl-5 space-y-3">
        {/* Line */}
        <div className="absolute left-[6px] top-1 bottom-1 w-0.5 bg-steel-700"></div>

        {history.map((item, idx) => (
          <div key={idx} className="relative">
            {/* Dot */}
            <div
              className={`absolute -left-5 top-1 w-3 h-3 rounded-full border-2 bg-steel-900 ${
                item.type === 'inbound'
                  ? 'border-green-500'
                  : item.type === 'shift'
                  ? 'border-blue-500'
                  : 'border-orange-500'
              }`}
            ></div>

            <div className="bg-steel-800/40 border border-steel-700/50 rounded p-2.5 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] text-white ${
                    item.type === 'inbound'
                      ? 'bg-green-500'
                      : item.type === 'shift'
                      ? 'bg-blue-500'
                      : 'bg-orange-500'
                  }`}
                >
                  {item.type === 'inbound'
                    ? '入库'
                    : item.type === 'shift'
                    ? '调拨移位'
                    : '出库'}
                </span>
                <span className="text-steel-500">{item.time}</span>
              </div>

              {item.type === 'inbound' && (
                <p className="text-steel-300">
                  入库到 <span className="text-industrial-400 font-mono">{item.position}</span>
                  <span className="text-steel-500"> · 操作: {item.operator}</span>
                </p>
              )}

              {item.type === 'shift' && (
                <p className="text-steel-300 flex items-center gap-1.5 flex-wrap">
                  <span className="text-steel-400 font-mono">{item.from}</span>
                  <ArrowRightLeft className="w-3 h-3 text-blue-400" />
                  <span className="text-industrial-400 font-mono">{item.to}</span>
                  <span className="text-steel-500"> · 操作: {item.operator}</span>
                  {item.reason && (
                    <span className="text-steel-400"> · 原因: {item.reason}</span>
                  )}
                </p>
              )}

              {item.type === 'outbound' && (
                <p className="text-steel-300">
                  发往 <span className="text-orange-400">{item.destination}</span>
                  <span className="text-steel-500"> · 操作: {item.operator}</span>
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

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
              <p className="text-sm text-steel-400">在库板坯</p>
              <p className="text-xl font-mono font-bold text-white">{inStockSlabs.length}</p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <MapPin className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">库位利用率</p>
              <p className="text-xl font-mono font-bold text-white">
                {utilization}%
                <span className="text-sm text-steel-500"> ({occupiedCount}/{totalSlots})</span>
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
              <Truck className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">已出库</p>
              <p className="text-xl font-mono font-bold text-white">{outboundRecords.length}</p>
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
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-industrial-600 border border-industrial-400"></div>
                <span>选中</span>
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
                  <div className="w-6 text-[10px] text-steel-500 font-mono text-right">
                    R{row}
                  </div>
                  {slots
                    .filter((s) => s.row === row)
                    .map((slot) => {
                      const isSelected = position === slot.pos;
                      const classes = [
                        'flex-1 aspect-[1.4] rounded border text-[10px] md:text-xs flex flex-col items-center justify-center cursor-pointer transition-all',
                        slot.occupied
                          ? slot.slab?.segregationLevel === 'C1.0' ||
                            slot.slab?.segregationLevel === 'C1.5'
                            ? 'bg-green-500/30 border-green-500/60 hover:bg-green-500/50 hover:scale-105'
                            : slot.slab?.segregationLevel === 'C2.5' ||
                              slot.slab?.segregationLevel === 'C3.0'
                            ? 'bg-red-500/30 border-red-500/60 hover:bg-red-500/50 hover:scale-105'
                            : 'bg-industrial-500/30 border-industrial-500/60 hover:bg-industrial-500/50 hover:scale-105'
                          : isSelected
                          ? 'bg-industrial-600 border-industrial-400 ring-2 ring-industrial-400 ring-opacity-50'
                          : 'bg-steel-800/50 border-steel-700 hover:bg-steel-700 hover:border-steel-500 hover:scale-105',
                      ].join(' ');

                      return (
                        <div
                          key={slot.pos}
                          className={classes}
                          title={
                            slot.occupied
                              ? `${slot.slab?.slabNo} @ ${slot.pos} - 点击查看详情`
                              : `空库位 ${slot.pos} - 点击选为入库库位`
                          }
                          onClick={() =>
                            openSlotDetail(bay, slot.row, slot.col, slot.pos, slot.slab)
                          }
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
                              {slot.row}
                              {slot.col < 10 ? `0${slot.col}` : slot.col}
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
                <option value="">-- 仅显示已清理放行的板坯 --</option>
                {availableSlabs.map((slab) => (
                  <option key={slab.id} value={slab.id}>
                    {slab.slabNo} | {slab.steelGrade} | {slab.length}m
                    {slab.ladleNo ? ` | 钢包:${slab.ladleNo}` : ''}
                  </option>
                ))}
              </select>
              {availableSlabs.length === 0 ? (
                <p className="text-xs text-green-400 mt-1">✓ 所有已清理板坯均已入库</p>
              ) : (
                <p className="text-[11px] text-steel-500 mt-1">
                  按工序顺序：仅显示状态为「已清理放行」的板坯，待复检的板坯请先处理复检
                </p>
              )}
            </div>

            {/* Selected Slab info */}
            {currentSlab && (
              <div className="bg-steel-800/50 border border-steel-700 rounded p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-steel-400">板坯号</span>
                  <span className="text-white font-mono font-medium">{currentSlab.slabNo}</span>
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
                {currentSlab.cleaningResult && (
                  <div className="flex justify-between">
                    <span className="text-steel-400">清理结果</span>
                    <span className="text-green-400">
                      {currentSlab.cleaningResult === 'qualified'
                        ? '合格'
                        : currentSlab.cleaningResult === 'repaired'
                        ? '修磨合格'
                        : '待复检'}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Position Selection */}
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
                    return (
                      <option key={slot.pos} value={slot.pos} disabled={occupied}>
                        {slot.pos}{' '}
                        {occupied
                          ? `[占用:${slot.slab?.slabNo.slice(-5)}]`
                          : ' [空]'}
                      </option>
                    );
                  })
                )}
              </select>
              <p className="text-[11px] text-steel-500 mt-1">
                格式: 跨区-行号-列号 （已占用库位在下拉中禁用，也可直接点击上方库区图选位）
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

              <div className="mt-3">
                <label className="block text-xs text-steel-400 mb-1.5">入库操作人</label>
                <input
                  type="text"
                  value={warehouseOperator}
                  onChange={(e) => setWarehouseOperator(e.target.value)}
                  className="input-field text-sm"
                />
              </div>
            </div>

            <button
              onClick={handleWarehouse}
              className="btn-primary w-full"
              disabled={!selectedSlabId || !position || !segregationLevel}
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
            <h2 className="card-title">板坯查询记录</h2>
          </div>

          <div className="p-4 space-y-3">
            {/* Tabs */}
            <div className="flex gap-1 bg-steel-800/40 rounded-lg p-1">
              <button
                onClick={() => setRecordTab('in_stock')}
                className={`flex-1 px-3 py-2 rounded-md text-xs transition-colors flex items-center justify-center gap-1.5 ${
                  recordTab === 'in_stock'
                    ? 'bg-industrial-600 text-white'
                    : 'text-steel-400 hover:text-white'
                }`}
              >
                <Package className="w-3.5 h-3.5" />
                在库板坯 ({inStockSlabs.length})
              </button>
              <button
                onClick={() => setRecordTab('outbound')}
                className={`flex-1 px-3 py-2 rounded-md text-xs transition-colors flex items-center justify-center gap-1.5 ${
                  recordTab === 'outbound'
                    ? 'bg-industrial-600 text-white'
                    : 'text-steel-400 hover:text-white'
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                出库记录 ({outboundSlabList.length})
              </button>
            </div>

            {/* Search & Filter */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-steel-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-field pl-9 text-sm"
                  placeholder={
                    recordTab === 'in_stock'
                      ? '搜索: 板坯号 / 库位 / 钢种 / 钢包 / 炉号...'
                      : '搜索: 板坯号 / 库位 / 目的地...'
                  }
                />
              </div>

              {recordTab === 'in_stock' && (
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
              )}
            </div>

            {/* Records Table */}
            <div className="max-h-[420px] overflow-y-auto -mx-4">
              {recordTab === 'in_stock' ? (
                inStockSlabs.length > 0 ? (
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
                      {inStockSlabs.map((slab) => (
                        <tr
                          key={slab.id}
                          className="border-b border-steel-800/50 hover:bg-steel-800/40 transition-colors cursor-pointer"
                          onClick={() => {
                            setDetailSlabId(slab.id);
                            setDetailAction('info');
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
                                slab.segregationLevel === 'C1.0' ||
                                slab.segregationLevel === 'C1.5'
                                  ? 'bg-green-500/30 text-green-400'
                                  : slab.segregationLevel === 'C2.5' ||
                                    slab.segregationLevel === 'C3.0'
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
                    <p>暂无在库板坯</p>
                  </div>
                )
              ) : outboundSlabList.length > 0 ? (
                <table className="w-full">
                  <thead className="sticky top-0 bg-steel-800 z-10">
                    <tr className="border-b border-steel-700/50">
                      <th className="table-header text-left px-3 py-2 text-xs">板坯号</th>
                      <th className="table-header text-left px-3 py-2 text-xs">原库位</th>
                      <th className="table-header text-left px-3 py-2 text-xs">目的地</th>
                      <th className="table-header text-left px-3 py-2 text-xs">出库时间</th>
                      <th className="table-header text-left px-3 py-2 text-xs w-24">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outboundSlabList.map((rec) => (
                      <tr
                        key={rec.id}
                        className="border-b border-steel-800/50 hover:bg-steel-800/40 transition-colors"
                      >
                        <td className="table-cell px-3 py-2">
                          <p className="font-mono text-white text-xs">{rec.slabNo}</p>
                          <p className="text-[10px] text-steel-500">
                            运输: {rec.transporter} · 操作: {rec.operator}
                          </p>
                        </td>
                        <td className="table-cell px-3 py-2">
                          <span className="text-xs text-steel-400 font-mono">{rec.position}</span>
                        </td>
                        <td className="table-cell px-3 py-2">
                          <span className="text-xs text-orange-400">{rec.destination}</span>
                        </td>
                        <td className="table-cell px-3 py-2 text-[10px] text-steel-400">
                          {rec.outboundTime}
                        </td>
                        <td className="table-cell px-3 py-2">
                          <button
                            onClick={() => setHistorySlabId(rec.slabId)}
                            className="text-xs px-2 py-1 rounded bg-industrial-500/20 text-industrial-400 hover:bg-industrial-500/30 transition-colors inline-flex items-center gap-1"
                          >
                            <History className="w-3 h-3" />
                            查看轨迹
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="text-center py-12 text-steel-500">
                  <Truck className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>暂无出库记录</p>
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

      {/* ============== Outbound History Modal (只读) ============== */}
      {historySlabId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card-industrial w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="card-header">
              <h2 className="card-title flex items-center gap-2">
                <History className="w-4 h-4 text-industrial-500" />
                板坯库位轨迹
                {historySlab && (
                  <span className="font-mono text-industrial-400 text-sm">
                    {historySlab.slabNo}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setHistorySlabId(null)}
                className="p-1 rounded hover:bg-steel-700 transition-colors text-steel-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {historySlab && (
                <div className="bg-steel-800/60 border border-steel-700 rounded-lg p-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-steel-500 mb-0.5">板坯号</p>
                      <p className="font-mono text-white font-bold">{historySlab.slabNo}</p>
                    </div>
                    <div>
                      <p className="text-xs text-steel-500 mb-0.5">钢种</p>
                      <p className="text-white">{historySlab.steelGrade}</p>
                    </div>
                    <div>
                      <p className="text-xs text-steel-500 mb-0.5">尺寸 (W×T×L)</p>
                      <p className="font-mono text-white text-xs">
                        {historySlab.width}×{historySlab.thickness}×{historySlab.length}mm
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {historyOutboundRec && (
                <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-4">
                  <p className="text-xs text-orange-400 mb-2 font-semibold flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5" />
                    出库信息
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="flex justify-between py-0.5 border-b border-steel-700/30 md:border-0 md:block">
                      <span className="text-steel-500">原库位：</span>
                      <span className="text-industrial-400 font-mono">{historyOutboundRec.position}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-steel-700/30 md:border-0 md:block">
                      <span className="text-steel-500">目的地：</span>
                      <span className="text-orange-400">{historyOutboundRec.destination}</span>
                    </div>
                    <div className="flex justify-between py-0.5 border-b border-steel-700/30 md:border-0 md:block">
                      <span className="text-steel-500">运输：</span>
                      <span className="text-white">{historyOutboundRec.transporter}</span>
                    </div>
                    <div className="flex justify-between py-0.5 md:border-0 md:block">
                      <span className="text-steel-500">操作人：</span>
                      <span className="text-white">{historyOutboundRec.operator}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div>
                <p className="text-xs text-industrial-400 mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  库位时间线（{historyTimeline.length} 条记录）
                </p>
                {renderHistoryTimeline(historyTimeline)}
              </div>
            </div>

            <div className="p-4 border-t border-steel-700/50 bg-steel-800/30">
              <button onClick={() => setHistorySlabId(null)} className="btn-primary w-full">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============== Slot / Slab Detail Modal ============== */}
      {detailSlab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card-industrial w-full max-w-2xl max-h-[88vh] overflow-hidden flex flex-col">
            <div className="card-header">
              <h2 className="card-title flex items-center gap-2">
                <MapPin className="w-4 h-4 text-industrial-500" />
                {detailSlab.position || '未定位'} · {detailSlab.slabNo}
              </h2>
              <button
                onClick={() => setDetailSlabId(null)}
                className="p-1 rounded hover:bg-steel-700 transition-colors text-steel-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Action tabs */}
            {detailSlab.status === 'warehoused' && (
              <div className="flex gap-1 px-4 pt-3 border-b border-steel-700/50">
                {[
                  { key: 'info', label: '基本信息', icon: FileText },
                  { key: 'transfer', label: '调拨移位', icon: ArrowRightLeft },
                  { key: 'outbound', label: '出库登记', icon: Truck },
                ].map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setDetailAction(t.key as DetailAction)}
                    className={`px-3 py-2 text-xs rounded-t-lg transition-colors flex items-center gap-1.5 -mb-px ${
                      detailAction === t.key
                        ? 'bg-steel-800 text-industrial-400 border-t border-l border-r border-steel-700/80'
                        : 'text-steel-400 hover:text-white hover:bg-steel-800/30'
                    }`}
                  >
                    <t.icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>
            )}

            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {/* ========== Info Tab ========== */}
              {(detailAction === 'info' || detailSlab.status !== 'warehoused') && (
                <>
                  {/* Slab Basic */}
                  <div className="bg-steel-800/60 border border-steel-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-steel-400">板坯基本信息</p>
                      <StatusBadge
                        status={
                          detailSlab.status === 'warehoused'
                            ? 'success'
                            : detailSlab.status === 'outbound'
                            ? 'standby'
                            : 'warning'
                        }
                        text={
                          detailSlab.status === 'warehoused'
                            ? '在库'
                            : detailSlab.status === 'outbound'
                            ? '已出库'
                            : detailSlab.status
                        }
                        size="sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-steel-500 mb-0.5">板坯号</p>
                        <p className="font-mono text-white font-bold">{detailSlab.slabNo}</p>
                      </div>
                      <div>
                        <p className="text-xs text-steel-500 mb-0.5">钢种</p>
                        <p className="text-white">{detailSlab.steelGrade}</p>
                      </div>
                      <div>
                        <p className="text-xs text-steel-500 mb-0.5">尺寸 (W×T×L)</p>
                        <p className="font-mono text-white text-xs">
                          {detailSlab.width}×{detailSlab.thickness}×{detailSlab.length}mm
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-steel-500 mb-0.5">炉号</p>
                        <p className="font-mono text-orange-400">{detailSlab.heatNo || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-steel-500 mb-0.5">钢包</p>
                        <p className="font-mono text-orange-400">{detailSlab.ladleNo || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-steel-500 mb-0.5">钢水温度</p>
                        <p className="font-mono text-orange-400">
                          {detailSlab.ladleTemp != null ? `${detailSlab.ladleTemp}℃` : '-'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Inspection */}
                  <div className="bg-steel-800/60 border border-steel-700 rounded-lg p-4">
                    <p className="text-xs text-steel-400 mb-3">入库检验信息</p>
                    <div className="space-y-2.5 text-sm">
                      <div className="flex items-center justify-between py-1 border-b border-steel-700/30">
                        <span className="text-steel-400">偏析等级</span>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            detailSlab.segregationLevel === 'C1.0' ||
                            detailSlab.segregationLevel === 'C1.5'
                              ? 'bg-green-500/30 text-green-400'
                              : detailSlab.segregationLevel === 'C2.5' ||
                                detailSlab.segregationLevel === 'C3.0'
                              ? 'bg-red-500/30 text-red-400'
                              : 'bg-industrial-500/30 text-industrial-400'
                          }`}
                        >
                          {detailSlab.segregationLevel || '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-steel-700/30">
                        <span className="text-steel-400">中心偏析</span>
                        <span className="text-white">{detailSlab.centerSegregation || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-steel-700/30">
                        <span className="text-steel-400">表面质量</span>
                        <span className="text-white">{detailSlab.surfaceQuality || '-'}</span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-steel-400">入库时间</span>
                        <span className="font-mono text-white text-xs">
                          {detailSlab.warehouseTime || '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* History */}
                  <div>
                    <p className="text-xs text-industrial-400 mb-3 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      库位历史记录
                    </p>
                    {renderHistoryTimeline(detailHistory)}
                  </div>
                </>
              )}

              {/* ========== Transfer Tab ========== */}
              {detailAction === 'transfer' && detailSlab.status === 'warehoused' && (
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 text-xs text-blue-300">
                    将板坯从当前库位移到新库位，系统会记录调拨原因和操作人
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-steel-400 mb-1.5">当前库位</p>
                      <div className="input-field text-steel-500 bg-steel-800/50">
                        {detailSlab.position}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-steel-400 mb-1.5">目标库位</p>
                      <select
                        value={transferToPosition}
                        onChange={(e) => setTransferToPosition(e.target.value)}
                        className="input-field"
                      >
                        <option value="">-- 请选择空库位 --</option>
                        {bayLayout.flatMap((bay) =>
                          bay.slots
                            .filter((s) => !s.occupied && s.pos !== detailSlab.position)
                            .map((slot) => (
                              <option key={slot.pos} value={slot.pos}>
                                {slot.pos} [空]
                              </option>
                            ))
                        )}
                      </select>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-steel-400 mb-1.5">调拨原因</p>
                    <input
                      type="text"
                      value={transferReason}
                      onChange={(e) => setTransferReason(e.target.value)}
                      className="input-field text-sm"
                      placeholder="例: 板坯重新堆垛、按订单集中存放等"
                    />
                  </div>

                  <div>
                    <p className="text-xs text-steel-400 mb-1.5">操作人</p>
                    <input
                      type="text"
                      value={transferOperator}
                      onChange={(e) => setTransferOperator(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>

                  <button
                    onClick={handleTransfer}
                    className="btn-primary w-full"
                    disabled={!transferToPosition}
                  >
                    确认调拨移位
                  </button>
                </div>
              )}

              {/* ========== Outbound Tab ========== */}
              {detailAction === 'outbound' && detailSlab.status === 'warehoused' && (
                <div className="space-y-4">
                  <div className="bg-orange-500/10 border border-orange-500/30 rounded p-3 text-xs text-orange-300">
                    板坯出库后将从库区图移除，状态变为「已出库」，出库记录可在「出库记录」Tab查看
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-steel-400 mb-1.5">出库库位</p>
                      <div className="input-field text-steel-500 bg-steel-800/50">
                        {detailSlab.position}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-steel-400 mb-1.5">目的地 / 客户</p>
                      <input
                        type="text"
                        value={outboundDestination}
                        onChange={(e) => setOutboundDestination(e.target.value)}
                        className="input-field text-sm"
                        placeholder="例: 热轧车间/XX客户"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-steel-400 mb-1.5">运输方式 / 车号</p>
                      <input
                        type="text"
                        value={outboundTransporter}
                        onChange={(e) => setOutboundTransporter(e.target.value)}
                        className="input-field text-sm"
                        placeholder="例: 天车/平板车-03"
                      />
                    </div>
                    <div>
                      <p className="text-xs text-steel-400 mb-1.5">出库操作人</p>
                      <input
                        type="text"
                        value={outboundOperator}
                        onChange={(e) => setOutboundOperator(e.target.value)}
                        className="input-field text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-steel-400 mb-1.5">备注</p>
                    <textarea
                      value={outboundRemark}
                      onChange={(e) => setOutboundRemark(e.target.value)}
                      rows={2}
                      className="input-field text-sm resize-none"
                      placeholder="选填..."
                    />
                  </div>

                  <button
                    onClick={handleOutbound}
                    className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-medium py-2.5 px-4 rounded transition-colors w-full"
                    disabled={!outboundDestination || !outboundTransporter}
                  >
                    确认出库
                  </button>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-steel-700/50 bg-steel-800/30">
              <button onClick={() => setDetailSlabId(null)} className="btn-primary w-full">
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
