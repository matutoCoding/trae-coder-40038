import { useState } from 'react';
import { Sparkles, CheckCircle, AlertTriangle, Search, Plus } from 'lucide-react';
import StatusBadge from '@/components/Status/StatusBadge';
import { useProductionStore } from '@/store/useProductionStore';
import type { SlabStatus } from '@/types';
import { mockCleaningRecords } from '@/data/mockData';

interface CleaningRecord {
  id: string;
  slabNo: string;
  defectType: string;
  defectPosition: string;
  cleaningMethod: string;
  result: string;
  operator: string;
  time: string;
}

export default function CleaningPage() {
  const { slabList, updateSlabStatus } = useProductionStore();
  const [records, setRecords] = useState<CleaningRecord[]>(mockCleaningRecords);
  const [showForm, setShowForm] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [formData, setFormData] = useState({
    slabNo: '',
    defectType: '表面裂纹',
    defectPosition: '上表面',
    cleaningMethod: '火焰清理',
    result: '合格',
    operator: '张工',
  });

  const pendingSlabs = slabList.filter((s) => s.status === 'cut' || s.status === 'cleaning');
  const cleaningSlabs = slabList.filter((s) => s.status === 'cleaning');
  const cleanedSlabs = slabList.filter((s) => s.status === 'cleaned');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.slabNo) return;

    const newRecord: CleaningRecord = {
      id: `clean-${Date.now()}`,
      ...formData,
      time: new Date().toLocaleString('zh-CN', { hour12: false }),
    };
    setRecords([newRecord, ...records]);

    if (formData.result === '合格') {
      updateSlabStatus(slabList.find((s) => s.slabNo === formData.slabNo)?.id || '', 'cleaned');
    }

    setShowForm(false);
    setFormData({
      slabNo: '',
      defectType: '表面裂纹',
      defectPosition: '上表面',
      cleaningMethod: '火焰清理',
      result: '合格',
      operator: '张工',
    });
  };

  const startCleaning = (slabId: string, slabNo: string) => {
    updateSlabStatus(slabId, 'cleaning');
    setFormData((prev) => ({ ...prev, slabNo }));
    setShowForm(true);
  };

  const defectTypes = ['表面裂纹', '氧化铁皮', '气孔', '夹渣', '划伤', '凹坑', '无缺陷'];
  const defectPositions = ['上表面', '下表面', '左侧面', '右侧面', '角部'];
  const cleaningMethods = ['火焰清理', '抛丸清理', '砂轮打磨', '酸洗', '机械清理'];

  const stats = {
    pending: pendingSlabs.length,
    cleaning: cleaningSlabs.length,
    cleaned: cleanedSlabs.length,
    passRate: records.length > 0 
      ? ((records.filter((r) => r.result === '合格').length / records.length) * 100).toFixed(1)
      : '0',
  };

  const filteredRecords = records.filter(
    (r) =>
      r.slabNo.toLowerCase().includes(searchText.toLowerCase()) ||
      r.defectType.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Search className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">待清理</p>
              <p className="text-2xl font-mono font-bold text-yellow-400">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">清理中</p>
              <p className="text-2xl font-mono font-bold text-blue-400">{stats.cleaning}</p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">已清理</p>
              <p className="text-2xl font-mono font-bold text-green-400">{stats.cleaned}</p>
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
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Slabs */}
        <div className="card-industrial">
          <div className="card-header">
            <h2 className="card-title">待清理板坯</h2>
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
                      <StatusBadge
                        status={slab.status === 'cleaning' ? 'running' : 'warning'}
                        text={slab.status === 'cleaning' ? '清理中' : '待清理'}
                        size="sm"
                      />
                    </div>
                    <div className="text-xs text-steel-400 space-y-1">
                      <p>规格: {slab.width}×{slab.thickness}×{slab.length}m</p>
                      <p>钢种: {slab.steelGrade}</p>
                    </div>
                    {slab.status === 'cut' && (
                      <button
                        onClick={() => startCleaning(slab.id, slab.slabNo)}
                        className="w-full mt-2 py-1.5 bg-industrial-600 hover:bg-industrial-500 text-white rounded text-xs transition-colors"
                      >
                        开始清理
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-steel-500 text-center py-8">暂无待清理板坯</p>
            )}
          </div>
        </div>

        {/* Cleaning Records */}
        <div className="card-industrial lg:col-span-2">
          <div className="card-header">
            <h2 className="card-title">清理记录</h2>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-steel-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="搜索..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="input-field pl-9 w-48 text-xs"
                />
              </div>
              <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-1 text-xs">
                <Plus className="w-3.5 h-3.5" />
                新增记录
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-steel-900">
                <tr className="border-b border-steel-700/50">
                  <th className="table-cell text-left table-header">板坯号</th>
                  <th className="table-cell text-left table-header">缺陷类型</th>
                  <th className="table-cell text-left table-header">位置</th>
                  <th className="table-cell text-left table-header">清理方式</th>
                  <th className="table-cell text-left table-header">结果</th>
                  <th className="table-cell text-left table-header">操作工</th>
                  <th className="table-cell text-left table-header">时间</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="border-b border-steel-700/30 hover:bg-steel-800/30 transition-colors"
                  >
                    <td className="table-cell font-mono text-sm">{record.slabNo}</td>
                    <td className="table-cell text-sm">
                      <span className={`${
                        record.defectType === '无缺陷' ? 'text-green-400' : 'text-yellow-400'
                      }`}>
                        {record.defectType}
                      </span>
                    </td>
                    <td className="table-cell text-sm text-steel-300">{record.defectPosition}</td>
                    <td className="table-cell text-sm text-steel-300">{record.cleaningMethod}</td>
                    <td className="table-cell">
                      <StatusBadge
                        status={record.result === '合格' ? 'success' : 'warning'}
                        text={record.result}
                        size="sm"
                      />
                    </td>
                    <td className="table-cell text-sm text-steel-300">{record.operator}</td>
                    <td className="table-cell text-sm text-steel-400">{record.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cleaning Quality Analysis */}
      <div className="card-industrial">
        <div className="card-header">
          <h2 className="card-title">缺陷统计分析</h2>
        </div>
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          {defectTypes.slice(0, -1).map((type) => {
            const count = records.filter((r) => r.defectType === type).length;
            const total = records.length;
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
            return (
              <div key={type} className="text-center p-3 bg-steel-800/30 rounded-lg">
                <p className="text-2xl font-mono font-bold text-white">{count}</p>
                <p className="text-xs text-steel-400 mt-1">{type}</p>
                <div className="mt-2 h-1.5 bg-steel-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-industrial-500 rounded-full"
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-steel-500 mt-1">{percentage}%</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card-industrial w-full max-w-lg mx-4">
            <div className="card-header">
              <h2 className="card-title">新增清理记录</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-steel-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-steel-300 mb-1.5">板坯号</label>
                <input
                  type="text"
                  value={formData.slabNo}
                  onChange={(e) => setFormData({ ...formData, slabNo: e.target.value })}
                  className="input-field"
                  placeholder="选择或输入板坯号"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-steel-300 mb-1.5">缺陷类型</label>
                  <select
                    value={formData.defectType}
                    onChange={(e) => setFormData({ ...formData, defectType: e.target.value })}
                    className="input-field"
                  >
                    {defectTypes.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-steel-300 mb-1.5">缺陷位置</label>
                  <select
                    value={formData.defectPosition}
                    onChange={(e) => setFormData({ ...formData, defectPosition: e.target.value })}
                    className="input-field"
                  >
                    {defectPositions.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-steel-300 mb-1.5">清理方式</label>
                  <select
                    value={formData.cleaningMethod}
                    onChange={(e) => setFormData({ ...formData, cleaningMethod: e.target.value })}
                    className="input-field"
                  >
                    {cleaningMethods.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-steel-300 mb-1.5">判定结果</label>
                  <select
                    value={formData.result}
                    onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                    className="input-field"
                  >
                    <option value="合格">合格</option>
                    <option value="待复检">待复检</option>
                    <option value="不合格">不合格</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm text-steel-300 mb-1.5">操作工</label>
                <input
                  type="text"
                  value={formData.operator}
                  onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  确认提交
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
