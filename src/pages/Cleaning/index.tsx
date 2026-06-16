import { useState } from 'react';
import { Brush, FileCheck, AlertTriangle, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import StatusBadge from '@/components/Status/StatusBadge';
import AlertPanel from '@/components/Status/AlertPanel';
import { useProductionStore } from '@/store/useProductionStore';
import type { CleaningMethod, DefectType } from '@/types';

const defectOptions: { value: DefectType; label: string }[] = [
  { value: 'none', label: '无缺陷' },
  { value: 'crack', label: '裂纹' },
  { value: 'scar', label: '结疤' },
  { value: 'scratch', label: '划痕' },
  { value: 'bubble', label: '气泡' },
  { value: 'segregation', label: '偏析' },
];

const cleaningMethods: { value: CleaningMethod; label: string }[] = [
  { value: 'manual', label: '人工清理' },
  { value: 'grinding', label: '砂轮打磨' },
  { value: 'flame', label: '火焰清理' },
  { value: 'machining', label: '机械加工' },
];

export default function CleaningPage() {
  const {
    slabList,
    cleaningRecords,
    addCleaningRecord,
  } = useProductionStore();

  const [selectedSlabId, setSelectedSlabId] = useState('');
  const [defectType, setDefectType] = useState<DefectType>('none');
  const [defectLocation, setDefectLocation] = useState('');
  const [cleaningMethod, setCleaningMethod] = useState<CleaningMethod>('grinding');
  const [cleaningResult, setCleaningResult] = useState<'qualified' | 'repaired' | 'recheck'>('qualified');
  const [operator, setOperator] = useState('张工');
  const [remark, setRemark] = useState('');

  // Slabs that are ready for cleaning (status: cut) or have been cleaned
  const cleanedSlabIds = new Set(cleaningRecords.map((r) => r.slabId));
  const cleanedSlabs = slabList.filter((s) => cleanedSlabIds.has(s.id));
  const pendingSlabs = slabList.filter(
    (s) => (s.status === 'cut' || s.status === 'cleaned' || s.status === 'pending_cut') && !cleanedSlabIds.has(s.id)
  );

  const records = cleaningRecords;

  const handleSubmit = () => {
    if (!selectedSlabId) {
      alert('请先选择板坯');
      return;
    }

    const slab = slabList.find((s) => s.id === selectedSlabId);
    if (!slab) return;

    addCleaningRecord({
      slabId: selectedSlabId,
      slabNo: slab.slabNo,
      defectType,
      defectLocation,
      cleaningMethod,
      cleaningResult,
      operator,
      remark,
      cleaningTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    });

    // Reset
    setSelectedSlabId('');
    setDefectType('none');
    setDefectLocation('');
    setCleaningMethod('grinding');
    setCleaningResult('qualified');
    setRemark('');
  };

  const getSeverityColor = (type: DefectType) => {
    switch (type) {
      case 'none':
        return 'text-green-400';
      case 'crack':
      case 'segregation':
        return 'text-red-400';
      case 'scar':
      case 'bubble':
        return 'text-orange-400';
      default:
        return 'text-yellow-400';
    }
  };

  const getResultIcon = (result: 'qualified' | 'repaired' | 'recheck') => {
    switch (result) {
      case 'qualified':
        return <CheckCircle2 className="w-4 h-4 text-green-400" />;
      case 'repaired':
        return <CheckCircle2 className="w-4 h-4 text-blue-400" />;
      case 'recheck':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Brush className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">待清理</p>
              <p className="text-xl font-mono font-bold text-white">{pendingSlabs.length}</p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <FileCheck className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">已清理</p>
              <p className="text-xl font-mono font-bold text-white">{cleaningRecords.length}</p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">合格率</p>
              <p className="text-xl font-mono font-bold text-white">
                {cleaningRecords.length > 0
                  ? `${Math.round(
                      (cleaningRecords.filter((r) => r.cleaningResult !== 'recheck').length /
                        cleaningRecords.length) *
                        100
                    )}%`
                  : '--'}
              </p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">缺陷检出</p>
              <p className="text-xl font-mono font-bold text-white">
                {cleaningRecords.filter((r) => r.defectType !== 'none').length} 块
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cleaning Record Form */}
        <div className="card-industrial">
          <div className="card-header">
            <h2 className="card-title">清理记录登记</h2>
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
                <option value="">-- 请选择待清理板坯 --</option>
                {pendingSlabs.map((slab) => (
                  <option key={slab.id} value={slab.id}>
                    {slab.slabNo} | {slab.steelGrade} | {slab.length}m
                    {slab.ladleNo ? ` | ${slab.ladleNo}` : ''}
                  </option>
                ))}
              </select>
              {pendingSlabs.length === 0 && (
                <p className="text-xs text-steel-500 mt-1">所有板坯已完成清理</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-steel-400 mb-1.5">缺陷类型</label>
                <select
                  value={defectType}
                  onChange={(e) => setDefectType(e.target.value as DefectType)}
                  className="input-field"
                >
                  {defectOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-steel-400 mb-1.5">缺陷位置</label>
                <input
                  type="text"
                  value={defectLocation}
                  onChange={(e) => setDefectLocation(e.target.value)}
                  className="input-field"
                  placeholder="例: 上表面距头部2m处"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-steel-400 mb-1.5">清理方式</label>
                <select
                  value={cleaningMethod}
                  onChange={(e) => setCleaningMethod(e.target.value as CleaningMethod)}
                  className="input-field"
                >
                  {cleaningMethods.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm text-steel-400 mb-1.5">清理结果</label>
                <select
                  value={cleaningResult}
                  onChange={(e) =>
                    setCleaningResult(e.target.value as 'qualified' | 'repaired' | 'recheck')
                  }
                  className="input-field"
                >
                  <option value="qualified">合格</option>
                  <option value="repaired">修磨合格</option>
                  <option value="recheck">待复检</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-steel-400 mb-1.5">操作工</label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="input-field"
              />
            </div>

            <div>
              <label className="block text-sm text-steel-400 mb-1.5">备注</label>
              <textarea
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={2}
                className="input-field resize-none"
                placeholder="清理详情说明..."
              />
            </div>

            <button onClick={handleSubmit} className="btn-primary w-full" disabled={!selectedSlabId}>
              提交清理记录
            </button>
          </div>
        </div>

        {/* Pending and Cleaned Lists */}
        <div className="space-y-6">
          {/* Pending */}
          <div className="card-industrial">
            <div className="card-header">
              <h2 className="card-title">待清理板坯</h2>
              <span className="text-xs text-yellow-400">{pendingSlabs.length} 块</span>
            </div>
            <div className="p-2 max-h-[240px] overflow-y-auto">
              {pendingSlabs.length > 0 ? (
                <div className="space-y-1">
                  {pendingSlabs.map((slab) => (
                    <div
                      key={slab.id}
                      className="flex items-center justify-between px-3 py-2 hover:bg-steel-800/50 rounded transition-colors cursor-pointer"
                      onClick={() => setSelectedSlabId(slab.id)}
                    >
                      <div>
                        <p className="text-sm text-white font-mono">{slab.slabNo}</p>
                        <p className="text-xs text-steel-500">
                          {slab.length}m · {slab.steelGrade}
                          {slab.cutTime ? ` · ${slab.cutTime}` : ''}
                        </p>
                      </div>
                      <StatusBadge status="warning" text="待清理" size="sm" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-steel-500 text-center py-8">暂无待清理板坯</p>
              )}
            </div>
          </div>

          {/* Recently Cleaned */}
          <div className="card-industrial">
            <div className="card-header">
              <h2 className="card-title">最近清理记录 (已持久化)</h2>
            </div>
            <div className="p-2 max-h-[260px] overflow-y-auto">
              {records.length > 0 ? (
                <div className="space-y-2">
                  {records.slice(0, 6).map((record) => (
                    <div
                      key={record.id}
                      className="px-3 py-2 bg-steel-800/30 rounded hover:bg-steel-800/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-mono text-white">{record.slabNo}</span>
                        <div className="flex items-center gap-2">
                          {getResultIcon(record.cleaningResult)}
                          <span className="text-xs text-steel-400">{record.operator}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        <span className={getSeverityColor(record.defectType)}>
                          {defectOptions.find((d) => d.value === record.defectType)?.label}
                        </span>
                        <span className="text-steel-500">
                          {cleaningMethods.find((m) => m.value === record.cleaningMethod)?.label}
                        </span>
                        <span className="text-steel-500 ml-auto">{record.cleaningTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-steel-500 text-center py-8">暂无清理记录</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Defect Statistics */}
      <div className="card-industrial">
        <div className="card-header">
          <h2 className="card-title">缺陷类型统计</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {defectOptions.map((opt) => {
              const count = records.filter((r) => r.defectType === opt.value).length;
              const totalWithDefect = records.filter((r) => r.defectType !== 'none').length || 1;
              const pct =
                opt.value === 'none'
                  ? records.length > 0
                    ? Math.round((count / records.length) * 100)
                    : 0
                  : Math.round((count / totalWithDefect) * 100);
              return (
                <div key={opt.value} className="bg-steel-800/50 rounded-lg p-3">
                  <p className="text-xs text-steel-400 mb-1">{opt.label}</p>
                  <p className="text-lg font-bold text-white">{count}</p>
                  <div className="mt-2 h-1 bg-steel-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-industrial-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Module Alerts */}
      <div className="card-industrial">
        <div className="card-header">
          <h2 className="card-title">本模块告警信息</h2>
        </div>
        <div className="p-3">
          <AlertPanel moduleFilter="cleaning" showAll maxItems={5} />
        </div>
      </div>
    </div>
  );
}
