import { useState, useMemo } from 'react';
import {
  Brush,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Eye,
  RotateCcw,
  X,
} from 'lucide-react';
import StatusBadge from '@/components/Status/StatusBadge';
import AlertPanel from '@/components/Status/AlertPanel';
import { useProductionStore } from '@/store/useProductionStore';
import type { CleaningMethod, DefectType, CleaningResult, ReInspectionRecord } from '@/types';

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

type CleanTab = 'clean' | 'recheck' | 'history';

export default function CleaningPage() {
  const {
    slabList,
    cleaningRecords,
    addCleaningRecord,
    reInspectionRecords,
    addReInspectionRecord,
  } = useProductionStore();

  const [activeTab, setActiveTab] = useState<CleanTab>('clean');

  // ---- Cleaning Form State ----
  const [selectedSlabId, setSelectedSlabId] = useState('');
  const [defectType, setDefectType] = useState<DefectType>('none');
  const [defectLocation, setDefectLocation] = useState('');
  const [cleaningMethod, setCleaningMethod] = useState<CleaningMethod>('grinding');
  const [cleaningResult, setCleaningResult] = useState<CleaningResult>('qualified');
  const [operator, setOperator] = useState('张工');
  const [remark, setRemark] = useState('');

  // ---- Re-inspection Form State ----
  const [recheckSlabId, setRecheckSlabId] = useState('');
  const [inspectionResult, setInspectionResult] = useState<'qualified' | 'repaired' | 'recheck' | 'scrap'>('qualified');
  const [inspector, setInspector] = useState('质检-王工');
  const [recheckRemark, setRecheckRemark] = useState('');

  // ---- Slab selection for detail view ----
  const [detailSlabId, setDetailSlabId] = useState<string | null>(null);

  // ============== Derived ==============
  // Slabs ready for first-time cleaning (cut and not yet cleaned)
  const pendingCleanSlabs = useMemo(() => {
    const cleanedSlabIds = new Set(cleaningRecords.map((r) => r.slabId));
    return slabList.filter(
      (s) => s.status === 'cut' && !cleanedSlabIds.has(s.id)
    );
  }, [slabList, cleaningRecords]);

  // Slabs pending re-inspection
  const recheckPendingSlabs = useMemo(() => {
    return slabList.filter((s) => s.status === 'recheck_pending');
  }, [slabList]);

  // All cleaned slabs (with or without recheck)
  const allCleanedSlabs = useMemo(() => {
    return slabList.filter(
      (s) =>
        s.status === 'cleaned' ||
        s.status === 'recheck_pending' ||
        cleaningRecords.some((r) => r.slabId === s.id)
    );
  }, [slabList, cleaningRecords]);

  const getCleaningRecordOfSlab = (slabId: string) =>
    cleaningRecords.find((r) => r.slabId === slabId);

  const getReInspectionsOfSlab = (slabId: string): ReInspectionRecord[] =>
    reInspectionRecords.filter((r) => r.slabId === slabId);

  // ============== Actions ==============
  const handleSubmitClean = () => {
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

    // Reset form
    setSelectedSlabId('');
    setDefectType('none');
    setDefectLocation('');
    setCleaningMethod('grinding');
    setCleaningResult('qualified');
    setRemark('');
  };

  const handleSubmitRecheck = () => {
    if (!recheckSlabId) {
      alert('请选择待复检板坯');
      return;
    }
    const slab = slabList.find((s) => s.id === recheckSlabId);
    if (!slab) return;

    const cleanRec = getCleaningRecordOfSlab(recheckSlabId);

    addReInspectionRecord({
      slabId: recheckSlabId,
      slabNo: slab.slabNo,
      cleaningRecordId: cleanRec?.id || '',
      inspectionResult,
      inspector,
      remark: recheckRemark,
      recheckTime: new Date().toLocaleString('zh-CN', { hour12: false }),
    });

    setRecheckSlabId('');
    setInspectionResult('qualified');
    setRecheckRemark('');
  };

  // ============== Helpers ==============
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

  const getResultLabel = (r: CleaningResult) => {
    return r === 'qualified' ? '合格' : r === 'repaired' ? '修磨合格' : '待复检';
  };

  const getResultStatus = (r: CleaningResult) => {
    return r === 'recheck' ? 'warning' : 'success';
  };

  const inspectionResultOptions: { value: typeof inspectionResult; label: string; color: string }[] = [
    { value: 'qualified', label: '合格放行', color: 'bg-green-500' },
    { value: 'repaired', label: '修磨后合格', color: 'bg-blue-500' },
    { value: 'recheck', label: '再次复检', color: 'bg-yellow-500' },
    { value: 'scrap', label: '判废', color: 'bg-red-500' },
  ];

  const detailSlab = detailSlabId ? slabList.find((s) => s.id === detailSlabId) : null;
  const detailCleanRec = detailSlabId ? getCleaningRecordOfSlab(detailSlabId) : null;
  const detailRechecks = detailSlabId ? getReInspectionsOfSlab(detailSlabId) : [];

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
              <p className="text-xl font-mono font-bold text-white">{pendingCleanSlabs.length}</p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">待复检</p>
              <p className="text-xl font-mono font-bold text-white">{recheckPendingSlabs.length}</p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <FileCheck className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">已清理放行</p>
              <p className="text-xl font-mono font-bold text-white">
                {cleaningRecords.filter((r) => r.cleaningResult !== 'recheck').length}
              </p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">缺陷检出率</p>
              <p className="text-xl font-mono font-bold text-white">
                {cleaningRecords.length > 0
                  ? `${Math.round(
                      (cleaningRecords.filter((r) => r.defectType !== 'none').length /
                        cleaningRecords.length) *
                        100
                    )}%`
                  : '--'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card-industrial">
        <div className="border-b border-steel-700/50">
          <div className="flex gap-1 px-3 pt-3">
            {[
              { key: 'clean', label: '初次清理', icon: Brush },
              { key: 'recheck', label: '复检确认', icon: RotateCcw },
              { key: 'history', label: '清理记录', icon: FileCheck },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key as CleanTab)}
                className={`px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors flex items-center gap-2 ${
                  activeTab === t.key
                    ? 'bg-steel-800 text-industrial-400 border-t border-l border-r border-steel-700/80 -mb-px'
                    : 'text-steel-400 hover:text-white hover:bg-steel-800/30'
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
                {t.key === 'recheck' && recheckPendingSlabs.length > 0 && (
                  <span className="px-1.5 py-0.5 text-[10px] bg-orange-500/30 text-orange-400 rounded-full">
                    {recheckPendingSlabs.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {/* ============ Tab: Clean ============ */}
          {activeTab === 'clean' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Form */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-semibold text-steel-200 mb-2">初次清理登记</h3>

                <div>
                  <label className="block text-sm text-steel-400 mb-1.5">选择待清理板坯</label>
                  <select
                    value={selectedSlabId}
                    onChange={(e) => setSelectedSlabId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">-- 仅显示已切割完成的板坯 --</option>
                    {pendingCleanSlabs.map((slab) => (
                      <option key={slab.id} value={slab.id}>
                        {slab.slabNo} | {slab.steelGrade} | {slab.length}m
                        {slab.ladleNo ? ` | ${slab.ladleNo}` : ''}
                      </option>
                    ))}
                  </select>
                  {pendingCleanSlabs.length === 0 && (
                    <p className="text-xs text-green-400 mt-1">✓ 所有已切割板坯均已完成清理</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-steel-400 mb-1.5">缺陷类型</label>
                    <select
                      value={defectType}
                      onChange={(e) => setDefectType(e.target.value as DefectType)}
                      className="input-field text-sm"
                    >
                      {defectOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-steel-400 mb-1.5">清理方式</label>
                    <select
                      value={cleaningMethod}
                      onChange={(e) => setCleaningMethod(e.target.value as CleaningMethod)}
                      className="input-field text-sm"
                    >
                      {cleaningMethods.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-steel-400 mb-1.5">缺陷位置</label>
                  <input
                    type="text"
                    value={defectLocation}
                    onChange={(e) => setDefectLocation(e.target.value)}
                    className="input-field text-sm"
                    placeholder="例: 上表面距头部2m处"
                  />
                </div>

                <div>
                  <label className="block text-xs text-steel-400 mb-2">清理结果判定</label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { v: 'qualified', label: '合格', color: 'bg-green-500' },
                      { v: 'repaired', label: '修磨合格', color: 'bg-blue-500' },
                      { v: 'recheck', label: '待复检', color: 'bg-yellow-500' },
                    ].map((opt) => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => setCleaningResult(opt.v as CleaningResult)}
                        className={`px-3 py-1.5 rounded text-xs transition-all ${
                          cleaningResult === opt.v
                            ? `${opt.color} text-white ring-2 ring-white/20`
                            : 'bg-steel-700/40 text-steel-300 hover:bg-steel-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-steel-400 mb-1.5">操作工</label>
                    <input
                      type="text"
                      value={operator}
                      onChange={(e) => setOperator(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-steel-400 mb-1.5">备注</label>
                    <input
                      type="text"
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                      className="input-field text-sm"
                      placeholder="选填"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmitClean}
                  className="btn-primary w-full"
                  disabled={!selectedSlabId}
                >
                  提交清理记录
                </button>
              </div>

              {/* List */}
              <div className="lg:col-span-3">
                <h3 className="text-sm font-semibold text-steel-200 mb-3">
                  待清理列表
                  <span className="text-xs text-steel-500 ml-2">
                    仅显示到达「已切割」阶段的板坯
                  </span>
                </h3>
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-2">
                  {pendingCleanSlabs.length > 0 ? (
                    pendingCleanSlabs.map((slab) => (
                      <div
                        key={slab.id}
                        className="bg-steel-800/30 border border-steel-700/50 rounded-lg p-3 hover:bg-steel-800/60 transition-colors cursor-pointer"
                        onClick={() => setSelectedSlabId(slab.id)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-white font-medium">{slab.slabNo}</span>
                            <StatusBadge status="warning" text="待清理" size="sm" />
                          </div>
                          <span className="text-xs text-steel-500">
                            {slab.cutTime || '待切割时间'}
                          </span>
                        </div>
                        <div className="flex gap-4 text-[11px] text-steel-400">
                          <span>
                            {slab.width}×{slab.thickness}×{slab.length} mm
                          </span>
                          <span>{slab.steelGrade}</span>
                          {slab.ladleNo && <span>钢包:{slab.ladleNo}</span>}
                          {slab.cutLength != null && <span>定尺:{slab.cutLength}m</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 text-steel-500">
                      <Brush className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">暂无待清理板坯</p>
                      <p className="text-xs mt-1">切割完成后板坯会自动进入此处</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============ Tab: Recheck ============ */}
          {activeTab === 'recheck' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              {/* Form */}
              <div className="lg:col-span-2 space-y-4">
                <h3 className="text-sm font-semibold text-steel-200 mb-2">复检确认登记</h3>

                <div>
                  <label className="block text-sm text-steel-400 mb-1.5">选择待复检板坯</label>
                  <select
                    value={recheckSlabId}
                    onChange={(e) => setRecheckSlabId(e.target.value)}
                    className="input-field"
                  >
                    <option value="">-- 仅显示状态为待复检的板坯 --</option>
                    {recheckPendingSlabs.map((slab) => {
                      const rec = getCleaningRecordOfSlab(slab.id);
                      return (
                        <option key={slab.id} value={slab.id}>
                          {slab.slabNo} | {slab.steelGrade} | 缺陷:
                          {defectOptions.find((d) => d.value === rec?.defectType)?.label ||
                            rec?.defectType}
                        </option>
                      );
                    })}
                  </select>
                  {recheckPendingSlabs.length === 0 && (
                    <p className="text-xs text-green-400 mt-1">✓ 无待复检板坯</p>
                  )}
                </div>

                {recheckSlabId &&
                  (() => {
                    const rec = getCleaningRecordOfSlab(recheckSlabId);
                    if (!rec) return null;
                    return (
                      <div className="bg-steel-800/50 border border-steel-700 rounded p-3 text-xs space-y-1.5">
                        <p className="text-steel-400 font-medium mb-1">上次清理信息</p>
                        <div className="flex justify-between">
                          <span className="text-steel-500">缺陷类型</span>
                          <span className={getSeverityColor(rec.defectType)}>
                            {defectOptions.find((d) => d.value === rec.defectType)?.label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-steel-500">缺陷位置</span>
                          <span className="text-white">{rec.defectLocation || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-steel-500">清理方式</span>
                          <span className="text-white">
                            {cleaningMethods.find((m) => m.value === rec.cleaningMethod)?.label}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-steel-500">清理时间</span>
                          <span className="text-white">{rec.cleaningTime}</span>
                        </div>
                      </div>
                    );
                  })()}

                <div>
                  <label className="block text-xs text-steel-400 mb-2">复检结论</label>
                  <div className="grid grid-cols-2 gap-2">
                    {inspectionResultOptions.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setInspectionResult(opt.value)}
                        className={`px-3 py-2 rounded text-xs transition-all ${
                          inspectionResult === opt.value
                            ? `${opt.color} text-white ring-2 ring-white/20 scale-[1.02]`
                            : 'bg-steel-700/40 text-steel-300 hover:bg-steel-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-steel-400 mb-1.5">质检员</label>
                    <input
                      type="text"
                      value={inspector}
                      onChange={(e) => setInspector(e.target.value)}
                      className="input-field text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-steel-400 mb-1.5">复检备注</label>
                    <input
                      type="text"
                      value={recheckRemark}
                      onChange={(e) => setRecheckRemark(e.target.value)}
                      className="input-field text-sm"
                      placeholder="选填"
                    />
                  </div>
                </div>

                <button
                  onClick={handleSubmitRecheck}
                  className="btn-primary w-full"
                  disabled={!recheckSlabId}
                >
                  提交复检结论
                </button>
              </div>

              {/* List */}
              <div className="lg:col-span-3">
                <h3 className="text-sm font-semibold text-steel-200 mb-3">
                  待复检队列
                  <span className="text-xs text-steel-500 ml-2">
                    仅显示标记为「待复检」的板坯
                  </span>
                </h3>
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-2">
                  {recheckPendingSlabs.length > 0 ? (
                    recheckPendingSlabs.map((slab) => {
                      const rec = getCleaningRecordOfSlab(slab.id);
                      const rechecks = getReInspectionsOfSlab(slab.id);
                      return (
                        <div
                          key={slab.id}
                          className="bg-steel-800/30 border border-yellow-500/30 rounded-lg p-3 hover:bg-steel-800/60 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-white font-medium">{slab.slabNo}</span>
                              <StatusBadge status="warning" text="待复检" size="sm" />
                            </div>
                            <button
                              onClick={() => setRecheckSlabId(slab.id)}
                              className="text-xs text-industrial-400 hover:text-industrial-300 flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              处理
                            </button>
                          </div>
                          <div className="flex gap-4 text-[11px] text-steel-400 mb-2">
                            <span>钢种: {slab.steelGrade}</span>
                            <span>
                              缺陷:{' '}
                              <span className={getSeverityColor(rec?.defectType || 'none')}>
                                {defectOptions.find((d) => d.value === rec?.defectType)?.label}
                              </span>
                            </span>
                          </div>
                          {rechecks.length > 0 && (
                            <div className="pt-2 border-t border-steel-700/40 text-[11px] text-steel-500">
                              已复检 {rechecks.length} 次 · 最近: {rechecks[0].recheckTime}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-16 text-steel-500">
                      <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40 text-green-400" />
                      <p className="text-sm">暂无待复检板坯</p>
                      <p className="text-xs mt-1">清理结果选「待复检」后板坯会进入此处</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============ Tab: History ============ */}
          {activeTab === 'history' && (
            <div>
              <h3 className="text-sm font-semibold text-steel-200 mb-3">
                全部清理 &amp; 复检记录
              </h3>
              <div className="space-y-3 max-h-[560px] overflow-y-auto pr-2">
                {allCleanedSlabs.length > 0 ? (
                  allCleanedSlabs.map((slab) => {
                    const rec = getCleaningRecordOfSlab(slab.id);
                    const rechecks = getReInspectionsOfSlab(slab.id);
                    if (!rec) return null;
                    return (
                      <div
                        key={slab.id}
                        className="bg-steel-800/30 border border-steel-700/50 rounded-lg p-4 hover:bg-steel-800/50 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <span className="font-mono text-white font-semibold">{slab.slabNo}</span>
                            <StatusBadge
                              status={
                                slab.status === 'recheck_pending' ? 'warning' : 'success'
                              }
                              text={
                                slab.status === 'recheck_pending'
                                  ? '待复检'
                                  : slab.status === 'cleaned'
                                  ? '已放行'
                                  : '处理中'
                              }
                              size="sm"
                            />
                            {rechecks.length > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full">
                                复检 {rechecks.length} 次
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => setDetailSlabId(slab.id)}
                            className="text-xs text-industrial-400 hover:text-industrial-300 flex items-center gap-1"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            详情
                          </button>
                        </div>

                        {/* Primary cleaning record */}
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs mb-3">
                          <div>
                            <p className="text-steel-500 mb-0.5">缺陷类型</p>
                            <p className={getSeverityColor(rec.defectType)}>
                              {defectOptions.find((d) => d.value === rec.defectType)?.label}
                            </p>
                          </div>
                          <div>
                            <p className="text-steel-500 mb-0.5">清理方式</p>
                            <p className="text-white">
                              {cleaningMethods.find((m) => m.value === rec.cleaningMethod)?.label}
                            </p>
                          </div>
                          <div>
                            <p className="text-steel-500 mb-0.5">清理结果</p>
                            <StatusBadge
                              status={getResultStatus(rec.cleaningResult)}
                              text={getResultLabel(rec.cleaningResult)}
                              size="sm"
                            />
                          </div>
                          <div>
                            <p className="text-steel-500 mb-0.5">操作工</p>
                            <p className="text-white">{rec.operator}</p>
                          </div>
                          <div>
                            <p className="text-steel-500 mb-0.5">清理时间</p>
                            <p className="text-white">{rec.cleaningTime}</p>
                          </div>
                        </div>

                        {/* Re-inspection history */}
                        {rechecks.length > 0 && (
                          <div className="pt-3 border-t border-steel-700/40">
                            <p className="text-[11px] text-steel-400 mb-2">复检历史</p>
                            <div className="space-y-1.5">
                              {rechecks.map((r, idx) => (
                                <div
                                  key={r.id}
                                  className="flex items-center gap-3 text-[11px] bg-steel-800/50 rounded px-2.5 py-1.5"
                                >
                                  <span className="text-steel-500 font-mono">#{rechecks.length - idx}</span>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-white ${
                                      r.inspectionResult === 'qualified'
                                        ? 'bg-green-500'
                                        : r.inspectionResult === 'repaired'
                                        ? 'bg-blue-500'
                                        : r.inspectionResult === 'recheck'
                                        ? 'bg-yellow-500'
                                        : 'bg-red-500'
                                    }`}
                                  >
                                    {inspectionResultOptions.find(
                                      (o) => o.value === r.inspectionResult
                                    )?.label}
                                  </span>
                                  <span className="text-steel-300 flex-1 truncate">
                                    {r.remark || '-'}
                                  </span>
                                  <span className="text-steel-500">{r.inspector}</span>
                                  <span className="text-steel-500 ml-auto">{r.recheckTime}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-16 text-steel-500">
                    <FileCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">暂无清理记录</p>
                  </div>
                )}
              </div>
            </div>
          )}
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

      {/* Detail Modal */}
      {detailSlab && detailCleanRec && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card-industrial w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
            <div className="card-header">
              <h2 className="card-title">
                {detailSlab.slabNo} 清理 &amp; 复检详情
              </h2>
              <button
                onClick={() => setDetailSlabId(null)}
                className="p-1 rounded hover:bg-steel-700 transition-colors text-steel-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 overflow-y-auto flex-1 space-y-5">
              {/* Slab basic */}
              <div className="bg-steel-800/50 rounded-lg p-4">
                <p className="text-xs text-steel-400 mb-2">板坯基本信息</p>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs text-steel-500 mb-0.5">钢种</p>
                    <p className="text-white">{detailSlab.steelGrade}</p>
                  </div>
                  <div>
                    <p className="text-xs text-steel-500 mb-0.5">尺寸</p>
                    <p className="text-white font-mono">
                      {detailSlab.width}×{detailSlab.thickness}×{detailSlab.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-steel-500 mb-0.5">当前状态</p>
                    <StatusBadge
                      status={detailSlab.status === 'recheck_pending' ? 'warning' : 'success'}
                      text={
                        detailSlab.status === 'recheck_pending'
                          ? '待复检'
                          : detailSlab.status === 'cleaned'
                          ? '已放行'
                          : detailSlab.status
                      }
                      size="sm"
                    />
                  </div>
                </div>
              </div>

              {/* Primary cleaning */}
              <div>
                <p className="text-xs text-industrial-400 mb-2 flex items-center gap-1">
                  <Brush className="w-3.5 h-3.5" />
                  初次清理记录
                </p>
                <div className="grid grid-cols-2 gap-3 text-sm bg-steel-800/30 rounded p-3">
                  <div className="flex justify-between">
                    <span className="text-steel-500">缺陷类型</span>
                    <span className={getSeverityColor(detailCleanRec.defectType)}>
                      {defectOptions.find((d) => d.value === detailCleanRec.defectType)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel-500">缺陷位置</span>
                    <span className="text-white">{detailCleanRec.defectLocation || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel-500">清理方式</span>
                    <span className="text-white">
                      {cleaningMethods.find((m) => m.value === detailCleanRec.cleaningMethod)?.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel-500">清理结果</span>
                    <span className="text-white">{getResultLabel(detailCleanRec.cleaningResult)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel-500">操作工</span>
                    <span className="text-white">{detailCleanRec.operator}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-steel-500">时间</span>
                    <span className="text-white">{detailCleanRec.cleaningTime}</span>
                  </div>
                  {detailCleanRec.remark && (
                    <div className="col-span-2 flex justify-between">
                      <span className="text-steel-500">备注</span>
                      <span className="text-white">{detailCleanRec.remark}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Re-inspection history */}
              {detailRechecks.length > 0 && (
                <div>
                  <p className="text-xs text-industrial-400 mb-2 flex items-center gap-1">
                    <RotateCcw className="w-3.5 h-3.5" />
                    复检记录（{detailRechecks.length} 次）
                  </p>
                  <div className="space-y-2">
                    {detailRechecks.map((r, idx) => (
                      <div
                        key={r.id}
                        className="bg-steel-800/30 border border-steel-700/50 rounded p-3 text-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-steel-500">
                            第 {detailRechecks.length - idx} 次复检
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs text-white ${
                              r.inspectionResult === 'qualified'
                                ? 'bg-green-500'
                                : r.inspectionResult === 'repaired'
                                ? 'bg-blue-500'
                                : r.inspectionResult === 'recheck'
                                ? 'bg-yellow-500'
                                : 'bg-red-500'
                            }`}
                          >
                            {inspectionResultOptions.find((o) => o.value === r.inspectionResult)?.label}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-steel-500">质检员</span>
                            <span className="text-white">{r.inspector}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-steel-500">时间</span>
                            <span className="text-white">{r.recheckTime}</span>
                          </div>
                          {r.remark && (
                            <div className="col-span-2 flex justify-between">
                              <span className="text-steel-500">备注</span>
                              <span className="text-white">{r.remark}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
