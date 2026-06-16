import { useState } from 'react';
import { Warehouse, Package, CheckCircle, Search, Plus, Layers } from 'lucide-react';
import StatusBadge from '@/components/Status/StatusBadge';
import { useProductionStore } from '@/store/useProductionStore';

export default function WarehousePage() {
  const { slabList, updateSlabStatus } = useProductionStore();
  const [searchText, setSearchText] = useState('');
  const [showInspectForm, setShowInspectForm] = useState(false);
  const [selectedSlab, setSelectedSlab] = useState<string>('');
  const [inspectResult, setInspectResult] = useState({
    segregationLevel: '合格',
    centerSegregation: '0.5',
    surfaceQuality: '良好',
    position: '',
  });

  const pendingSlabs = slabList.filter((s) => s.status === 'cleaned' || s.status === 'pending_warehouse');
  const warehousedSlabs = slabList.filter((s) => s.status === 'warehoused');

  const stats = {
    pending: pendingSlabs.length,
    warehoused: warehousedSlabs.length,
    passRate: warehousedSlabs.length > 0
      ? '98.5'
      : '0',
    total: slabList.length,
  };

  const bayLayout = [
    ['A-01', 'A-02', 'A-03', 'A-04', 'A-05'],
    ['B-01', 'B-02', 'B-03', 'B-04', 'B-05'],
    ['C-01', 'C-02', 'C-03', 'C-04', 'C-05'],
  ];

  const getBayStatus = (bay: string) => {
    const slab = warehousedSlabs.find((s) => s.position === bay);
    return slab ? 'occupied' : 'empty';
  };

  const handleInspect = (slabId: string, slabNo: string) => {
    setSelectedSlab(slabId);
    setInspectResult((prev) => ({ ...prev, position: '', segregationLevel: '合格' }));
    setShowInspectForm(true);
  };

  const handleWarehouseIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlab || !inspectResult.position) return;

    updateSlabStatus(selectedSlab, 'warehoused');
    
    const slab = slabList.find((s) => s.id === selectedSlab);
    if (slab) {
      slab.position = inspectResult.position;
      slab.segregationLevel = inspectResult.segregationLevel;
      slab.warehouseTime = new Date().toLocaleString('zh-CN', { hour12: false });
    }

    setShowInspectForm(false);
  };

  const filteredWarehoused = warehousedSlabs.filter(
    (s) =>
      s.slabNo.toLowerCase().includes(searchText.toLowerCase()) ||
      (s.position && s.position.toLowerCase().includes(searchText.toLowerCase()))
  );

  const segregationLevels = ['合格', '轻微偏析', '中度偏析', '严重偏析'];

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Package className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">待入库</p>
              <p className="text-2xl font-mono font-bold text-yellow-400">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Warehouse className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">已入库</p>
              <p className="text-2xl font-mono font-bold text-green-400">{stats.warehoused}</p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">合格率</p>
              <p className="text-2xl font-mono font-bold text-purple-400">{stats.passRate}%</p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Layers className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">总计</p>
              <p className="text-2xl font-mono font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Inspection */}
        <div className="card-industrial">
          <div className="card-header">
            <h2 className="card-title">待检验入库</h2>
            <span className="text-xs text-steel-400">{pendingSlabs.length} 块</span>
          </div>
          <div className="p-2 max-h-[400px] overflow-y-auto">
            {pendingSlabs.length > 0 ? (
              <div className="space-y-2">
                {pendingSlabs.map((slab) => (
                  <div
                    key={slab.id}
                    className="p-3 bg-steel-800/50 rounded-lg border border-steel-700/50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-white text-sm">{slab.slabNo}</span>
                      <StatusBadge status="warning" text="待入库" size="sm" />
                    </div>
                    <div className="text-xs text-steel-400 space-y-1">
                      <p>规格: {slab.width}×{slab.thickness}×{slab.length}m</p>
                      <p>钢种: {slab.steelGrade}</p>
                    </div>
                    <button
                      onClick={() => handleInspect(slab.id, slab.slabNo)}
                      className="w-full mt-2 py-1.5 bg-industrial-600 hover:bg-industrial-500 text-white rounded text-xs transition-colors"
                    >
                      检验入库
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-steel-500 text-center py-8">暂无待入库板坯</p>
            )}
          </div>
        </div>

        {/* Warehouse Layout */}
        <div className="card-industrial lg:col-span-2">
          <div className="card-header">
            <h2 className="card-title">板坯库堆垛布局</h2>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span className="text-steel-400">有料</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 bg-steel-700 rounded border border-steel-600"></div>
                <span className="text-steel-400">空库位</span>
              </div>
            </div>
          </div>
          <div className="p-6">
            {bayLayout.map((row, rowIndex) => (
              <div key={rowIndex} className="mb-4">
                <div className="text-xs text-steel-500 mb-2">
                  {rowIndex === 0 ? 'A 跨' : rowIndex === 1 ? 'B 跨' : 'C 跨'}
                </div>
                <div className="grid grid-cols-5 gap-3">
                  {row.map((bay) => {
                    const status = getBayStatus(bay);
                    const slab = warehousedSlabs.find((s) => s.position === bay);
                    return (
                      <div
                        key={bay}
                        className={`aspect-[4/3] rounded-lg border-2 flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 ${
                          status === 'occupied'
                            ? 'bg-green-500/20 border-green-500/50'
                            : 'bg-steel-800/50 border-steel-700 hover:border-steel-500'
                        }`}
                      >
                        <span className={`text-xs font-medium ${
                          status === 'occupied' ? 'text-green-400' : 'text-steel-500'
                        }`}>
                          {bay}
                        </span>
                        {slab && (
                          <>
                            <span className="text-[10px] text-steel-300 font-mono mt-1">
                              {slab.slabNo.slice(-6)}
                            </span>
                            <span className="text-[10px] text-steel-500">
                              {slab.length}m
                            </span>
                          </>
                        )}
                        {!slab && (
                          <span className="text-[10px] text-steel-600 mt-1">空位</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-steel-700/50 flex items-center justify-between text-xs">
              <div className="text-steel-400">
                库位利用率: <span className="text-white font-mono">
                  {((warehousedSlabs.length / 15) * 100).toFixed(1)}%
                </span>
              </div>
              <div className="text-steel-400">
                共 15 个库位，已用 <span className="text-green-400">{warehousedSlabs.length}</span> 个
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Low倍 Segregation Inspection Records */}
      <div className="card-industrial">
        <div className="card-header">
          <h2 className="card-title">低倍偏析检验记录</h2>
          <div className="relative">
            <Search className="w-4 h-4 text-steel-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索板坯号或库位..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="input-field pl-9 w-60 text-xs"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-steel-900">
              <tr className="border-b border-steel-700/50">
                <th className="table-cell text-left table-header">板坯号</th>
                <th className="table-cell text-left table-header">钢种</th>
                <th className="table-cell text-left table-header">规格</th>
                <th className="table-cell text-left table-header">中心偏析</th>
                <th className="table-cell text-left table-header">表面质量</th>
                <th className="table-cell text-left table-header">偏析等级</th>
                <th className="table-cell text-left table-header">库位</th>
                <th className="table-cell text-left table-header">入库时间</th>
              </tr>
            </thead>
            <tbody>
              {filteredWarehoused.length > 0 ? (
                filteredWarehoused.map((slab) => (
                  <tr
                    key={slab.id}
                    className="border-b border-steel-700/30 hover:bg-steel-800/30 transition-colors"
                  >
                    <td className="table-cell font-mono text-sm">{slab.slabNo}</td>
                    <td className="table-cell text-sm">{slab.steelGrade}</td>
                    <td className="table-cell text-sm text-steel-400">
                      {slab.width}×{slab.thickness}×{slab.length}m
                    </td>
                    <td className="table-cell text-sm font-mono">0.5级</td>
                    <td className="table-cell text-sm text-green-400">良好</td>
                    <td className="table-cell">
                      <StatusBadge
                        status={slab.segregationLevel === '合格' ? 'success' : 'warning'}
                        text={slab.segregationLevel || '合格'}
                        size="sm"
                      />
                    </td>
                    <td className="table-cell text-sm font-mono text-industrial-400">
                      {slab.position || '--'}
                    </td>
                    <td className="table-cell text-sm text-steel-400">
                      {slab.warehouseTime || '--'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="table-cell text-center text-steel-500 py-8">
                    暂无入库记录
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspection Form Modal */}
      {showInspectForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card-industrial w-full max-w-lg mx-4">
            <div className="card-header">
              <h2 className="card-title">低倍偏析检验 & 入库</h2>
              <button
                onClick={() => setShowInspectForm(false)}
                className="text-steel-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleWarehouseIn} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-steel-300 mb-1.5">板坯号</label>
                <div className="input-field bg-steel-800/50">
                  {slabList.find((s) => s.id === selectedSlab)?.slabNo}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-steel-300 mb-1.5">中心偏析等级</label>
                  <select
                    value={inspectResult.centerSegregation}
                    onChange={(e) => setInspectResult({ ...inspectResult, centerSegregation: e.target.value })}
                    className="input-field"
                  >
                    <option value="0">0级</option>
                    <option value="0.5">0.5级</option>
                    <option value="1.0">1.0级</option>
                    <option value="1.5">1.5级</option>
                    <option value="2.0">2.0级</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-steel-300 mb-1.5">表面质量</label>
                  <select
                    value={inspectResult.surfaceQuality}
                    onChange={(e) => setInspectResult({ ...inspectResult, surfaceQuality: e.target.value })}
                    className="input-field"
                  >
                    <option value="优秀">优秀</option>
                    <option value="良好">良好</option>
                    <option value="一般">一般</option>
                    <option value="较差">较差</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-steel-300 mb-1.5">综合判定</label>
                <div className="flex gap-2">
                  {segregationLevels.map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setInspectResult({ ...inspectResult, segregationLevel: level })}
                      className={`flex-1 py-2 rounded text-xs transition-colors ${
                        inspectResult.segregationLevel === level
                          ? 'bg-industrial-600 text-white'
                          : 'bg-steel-700 text-steel-300 hover:bg-steel-600'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm text-steel-300 mb-1.5">堆垛位置</label>
                <select
                  value={inspectResult.position}
                  onChange={(e) => setInspectResult({ ...inspectResult, position: e.target.value })}
                  className="input-field"
                >
                  <option value="">选择库位</option>
                  {bayLayout.flat().map((bay) => {
                    const occupied = warehousedSlabs.some((s) => s.position === bay);
                    return (
                      <option key={bay} value={bay} disabled={occupied}>
                        {bay} {occupied ? '(已占用)' : '(可用)'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInspectForm(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-primary flex items-center gap-2"
                  disabled={!inspectResult.position}
                >
                  <Plus className="w-4 h-4" />
                  确认入库
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
