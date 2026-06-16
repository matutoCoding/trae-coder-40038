import { useState, useMemo } from 'react';
import {
  AlertTriangle,
  Wrench,
  CheckCircle2,
  XCircle,
  FileCheck,
  Search,
  Filter,
  Clock,
  ChevronDown,
  ChevronRight,
  Send,
  X,
} from 'lucide-react';
import { useProductionStore } from '@/store/useProductionStore';
import StatusBadge from '@/components/Status/StatusBadge';
import AlertPanel from '@/components/Status/AlertPanel';
import type { QualityDisposalRecord, Slab } from '@/types';

const sourceLabels: Record<string, string> = {
  recheck_scrap: '复检判废',
  recheck_downgrade: '复检降级',
  manual: '人工发起',
};

const resultLabels: Record<string, { text: string; status: 'success' | 'warning' | 'danger' | 'pending' | 'running' }> = {
  rework: { text: '返修处理', status: 'warning' },
  concession: { text: '让步接收', status: 'success' },
  scrapped: { text: '报废确认', status: 'danger' },
  released: { text: '直接放行', status: 'success' },
};

const stepLabels: Record<string, { text: string; color: string; iconColor: string }> = {
  rework: { text: '返修', color: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30', iconColor: 'border-yellow-400' },
  concession: { text: '让步接收', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', iconColor: 'border-blue-400' },
  scrapped: { text: '报废', color: 'bg-red-500/10 text-red-400 border-red-500/30', iconColor: 'border-red-400' },
  released: { text: '放行', color: 'bg-green-500/10 text-green-400 border-green-500/30', iconColor: 'border-green-400' },
  recheck_passed: { text: '复检通过', color: 'bg-green-500/10 text-green-400 border-green-500/30', iconColor: 'border-green-400' },
};

export default function QualityDisposalPage() {
  const {
    qualityDisposalRecords,
    slabList,
    addDisposalStep,
    createQualityDisposal,
    reInspectionRecords,
  } = useProductionStore();

  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'finished'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'rework' | 'concession' | 'scrapped' | 'released'>('rework');
  const [operator, setOperator] = useState('');
  const [remark, setRemark] = useState('');

  // Manual create form
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualSlabId, setManualSlabId] = useState('');
  const [manualRemark, setManualRemark] = useState('');

  const pendingCount = qualityDisposalRecords.filter((d) => d.disposalStatus !== 'finished').length;
  const totalCount = qualityDisposalRecords.length;
  const scrappedCount = qualityDisposalRecords.filter((d) => d.currentDisposalResult === 'scrapped').length;

  const filtered = useMemo(() => {
    let list = qualityDisposalRecords;
    if (statusFilter !== 'all') {
      list = list.filter((d) => d.disposalStatus === statusFilter);
    }
    if (searchText) {
      const s = searchText.toLowerCase();
      list = list.filter(
        (d) => d.slabNo.toLowerCase().includes(s) || d.id.toLowerCase().includes(s)
      );
    }
    return list;
  }, [qualityDisposalRecords, statusFilter, searchText]);

  const getSlab = (slabId: string): Slab | undefined => slabList.find((s) => s.id === slabId);

  // Candidates for manual disposal: cleaned / recheck_pending without open disposal
  const manualCandidates = slabList.filter((s) => {
    if (s.status === 'scrapped' || s.status === 'outbound') return false;
    const hasOpen = qualityDisposalRecords.some(
      (d) => d.slabId === s.id && d.disposalStatus !== 'finished'
    );
    return !hasOpen && (s.status === 'cleaned' || s.status === 'recheck_pending' || s.status === 'cut');
  });

  const getLatestReinspection = (slabId: string) => {
    return reInspectionRecords
      .filter((r) => r.slabId === slabId)
      .sort((a, b) => new Date(b.recheckTime).getTime() - new Date(a.recheckTime).getTime())[0];
  };

  const submitAction = () => {
    if (!actingId || !operator.trim()) return;
    addDisposalStep(actingId, {
      disposalType: actionType,
      operator: operator.trim(),
      remark: remark.trim(),
    });
    setActingId(null);
    setActionType('rework');
    setOperator('');
    setRemark('');
  };

  const submitManual = () => {
    if (!manualSlabId) return;
    createQualityDisposal(manualSlabId, 'manual');
    if (manualRemark.trim() && operator.trim()) {
      // If also do an action immediately
    }
    setShowManualForm(false);
    setManualSlabId('');
    setManualRemark('');
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-xs text-steel-400">待处置</p>
              <p className="text-2xl font-semibold text-white font-mono">{pendingCount}</p>
            </div>
          </div>
        </div>
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <FileCheck className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-steel-400">处置总数</p>
              <p className="text-2xl font-semibold text-white font-mono">{totalCount}</p>
            </div>
          </div>
        </div>
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-red-500/10">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-xs text-steel-400">报废数量</p>
              <p className="text-2xl font-semibold text-white font-mono">{scrappedCount}</p>
            </div>
          </div>
        </div>
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-steel-400">放行率</p>
              <p className="text-2xl font-semibold text-white font-mono">
                {totalCount === 0
                  ? '—'
                  : `${Math.round(((totalCount - scrappedCount) / totalCount) * 100)}%`}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card-industrial p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <h2 className="text-base font-semibold text-white">质量处置台账</h2>
          </div>
          <div className="flex-1" />
          <div className="relative">
            <Search className="w-4 h-4 text-steel-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="搜索板坯号/处置编号..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="input-field pl-9 w-64"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-steel-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="input-field w-40"
            >
              <option value="all">全部状态</option>
              <option value="pending">待处置</option>
              <option value="processing">处理中</option>
              <option value="finished">已完成</option>
            </select>
          </div>
          <button onClick={() => setShowManualForm(true)} className="btn-primary">
            <Wrench className="w-4 h-4" />
            人工发起处置
          </button>
        </div>
      </div>

      {/* Record list */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="card-industrial p-12 text-center text-steel-500">
            <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-green-500/30" />
            <p>暂无质量处置记录</p>
          </div>
        )}
        {filtered.map((d) => (
          <DisposalCard
            key={d.id}
            disposal={d}
            slab={getSlab(d.slabId)}
            expanded={expandedId === d.id}
            onToggle={() => setExpandedId(expandedId === d.id ? null : d.id)}
            onAct={() => setActingId(d.id)}
            latestReinspection={getLatestReinspection(d.slabId)}
            reInspectionRecords={reInspectionRecords}
          />
        ))}
      </div>

      {/* Alert panel */}
      <div className="card-industrial p-4">
        <h2 className="card-title">本模块告警</h2>
        <AlertPanel moduleFilter="cleaning" showAll maxItems={5} />
      </div>

      {/* Action Modal */}
      {actingId && (
        <DisposalActionModal
          onClose={() => setActingId(null)}
          actionType={actionType}
          setActionType={setActionType}
          operator={operator}
          setOperator={setOperator}
          remark={remark}
          setRemark={setRemark}
          onSubmit={submitAction}
        />
      )}

      {/* Manual Create Modal */}
      {showManualForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="card-industrial w-full max-w-lg overflow-hidden">
            <div className="card-header flex justify-between items-center">
              <h3 className="text-base font-semibold text-white">人工发起质量处置</h3>
              <button onClick={() => setShowManualForm(false)} className="text-steel-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs text-steel-400 mb-1.5">选择板坯</label>
                <select
                  value={manualSlabId}
                  onChange={(e) => setManualSlabId(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">请选择板坯...</option>
                  {manualCandidates.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.slabNo} ({s.steelGrade} / {s.width}×{s.thickness}×{s.length}mm / 状态: {s.status})
                    </option>
                  ))}
                </select>
                {manualCandidates.length === 0 && (
                  <p className="text-xs text-steel-500 mt-2">暂无可发起处置的板坯</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-steel-400 mb-1.5">处置备注</label>
                <textarea
                  value={manualRemark}
                  onChange={(e) => setManualRemark(e.target.value)}
                  rows={3}
                  placeholder="简述发起原因..."
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-xs text-steel-400 mb-1.5">操作人</label>
                <input
                  type="text"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  placeholder="请输入姓名"
                  className="input-field w-full"
                />
              </div>
            </div>
            <div className="card-header border-t flex justify-end gap-3">
              <button onClick={() => setShowManualForm(false)} className="btn-secondary">
                取消
              </button>
              <button
                onClick={submitManual}
                disabled={!manualSlabId}
                className="btn-primary disabled:opacity-50"
              >
                确认发起
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DisposalCard({
  disposal,
  slab,
  expanded,
  onToggle,
  onAct,
  latestReinspection,
  reInspectionRecords,
}: {
  disposal: QualityDisposalRecord;
  slab?: Slab;
  expanded: boolean;
  onToggle: () => void;
  onAct: () => void;
  latestReinspection?: { inspectionResult: string; remark: string; recheckTime: string; inspector: string };
  reInspectionRecords: Array<{ id: string; inspectionResult: string; remark: string; recheckTime: string; inspector: string }>;
}) {
  const isFinished = disposal.disposalStatus === 'finished';
  return (
    <div className="card-industrial overflow-hidden">
      <div className="p-4 cursor-pointer hover:bg-steel-800/30 transition-colors" onClick={onToggle}>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex-shrink-0">
            {expanded ? (
              <ChevronDown className="w-5 h-5 text-industrial-400" />
            ) : (
              <ChevronRight className="w-5 h-5 text-steel-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="text-white font-semibold font-mono">{disposal.slabNo}</span>
              <span className="text-xs text-steel-500 font-mono">| 处置编号 {disposal.id}</span>
              {slab?.steelGrade && (
                <span className="text-xs px-2 py-0.5 rounded bg-steel-700/50 text-steel-300">
                  {slab.steelGrade}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-steel-400">
              <span>来源：{sourceLabels[disposal.sourceType] || disposal.sourceType}</span>
              {disposal.reInspectionResult && (
                <span>
                  复检结论：
                  {disposal.reInspectionResult === 'scrap' ? (
                    <span className="text-red-400">判废</span>
                  ) : (
                    <span className="text-orange-400">降级</span>
                  )}
                </span>
              )}
              <span>发起时间：{disposal.createdAt}</span>
              {disposal.reworkCount > 0 && <span>返修次数：{disposal.reworkCount}</span>}
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {disposal.currentDisposalResult && (
              <StatusBadge
                status={resultLabels[disposal.currentDisposalResult]?.status || 'pending'}
                text={resultLabels[disposal.currentDisposalResult]?.text || '处理中'}
                size="sm"
              />
            )}
            <StatusBadge
              status={isFinished ? 'success' : disposal.disposalStatus === 'processing' ? 'warning' : 'pending'}
              text={isFinished ? '已完成' : disposal.disposalStatus === 'processing' ? '处理中' : '待处置'}
              size="sm"
            />
            {!isFinished && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onAct();
                }}
                className="btn-primary !py-1.5 !px-3 !text-xs"
              >
                执行处置
              </button>
            )}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-steel-700/50 p-4 space-y-4 bg-steel-900/40">
          {slab && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-xs text-steel-500 mb-1">板坯规格</p>
                <p className="text-sm text-white font-mono">
                  {slab.width}×{slab.thickness}×{slab.length} mm
                </p>
              </div>
              <div>
                <p className="text-xs text-steel-500 mb-1">钢种</p>
                <p className="text-sm text-white">{slab.steelGrade}</p>
              </div>
              <div>
                <p className="text-xs text-steel-500 mb-1">当前状态</p>
                <p className="text-sm text-white">{slab.status}</p>
              </div>
              <div>
                <p className="text-xs text-steel-500 mb-1">钢包号</p>
                <p className="text-sm text-white font-mono">{slab.ladleNo || '—'}</p>
              </div>
            </div>
          )}

          {latestReinspection && (
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-xs text-yellow-400 mb-2 font-semibold">最近一次复检结论</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-steel-500">结果：</span>
                  <span className="text-white">
                    {latestReinspection.inspectionResult === 'scrap'
                      ? '判废'
                      : latestReinspection.inspectionResult === 'downgrade'
                      ? '降级'
                      : latestReinspection.inspectionResult}
                  </span>
                </div>
                <div>
                  <span className="text-steel-500">检验员：</span>
                  <span className="text-white">{latestReinspection.inspector}</span>
                </div>
                <div>
                  <span className="text-steel-500">时间：</span>
                  <span className="text-white font-mono">{latestReinspection.recheckTime}</span>
                </div>
                {latestReinspection.remark && (
                  <div className="col-span-2 md:col-span-1">
                    <span className="text-steel-500">备注：</span>
                    <span className="text-white">{latestReinspection.remark}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 完整流转链时间线 */}
          {(disposal.records.length > 0 || disposal.sourceRecordId) && (
            <div>
              <p className="text-xs text-steel-400 mb-3">完整流转链</p>
              <div className="relative pl-5 border-l-2 border-steel-700/60 space-y-3">
                {(() => {
                  const sourceRecord = disposal.sourceRecordId
                    ? reInspectionRecords.find((r) => r.id === disposal.sourceRecordId)
                    : null;
                  const sortedRecords = disposal.records
                    .slice()
                    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

                  const items: Array<{
                    key: string;
                    type: string;
                    title: string;
                    borderClass: string;
                    dotClass: string;
                    content: React.ReactNode;
                  }> = [];

                  if (sourceRecord) {
                    items.push({
                      key: 'source-' + sourceRecord.id,
                      type: 'source',
                      title: '来源复检结论：' + (sourceRecord.inspectionResult === 'scrap' ? '判废' : '降级'),
                      borderClass: 'border-orange-500/30 bg-orange-500/10 text-orange-400',
                      dotClass: 'border-orange-400',
                      content: (
                        <div className="text-xs space-y-0.5 opacity-90">
                          <p>检验员：{sourceRecord.inspector}</p>
                          <p>时间：{sourceRecord.recheckTime}</p>
                          {sourceRecord.remark && <p>备注：{sourceRecord.remark}</p>}
                        </div>
                      ),
                    });
                  }

                  let reworkCounter = 0;
                  sortedRecords.forEach((rec) => {
                    const meta = stepLabels[rec.disposalType];
                    if (rec.disposalType === 'rework') reworkCounter++;

                    let title = meta.text;
                    let extraContent: React.ReactNode = null;

                    if (rec.disposalType === 'rework') {
                      title = `第 ${reworkCounter} 次返修`;
                      extraContent = <p className="text-yellow-300 mt-1">→ 转入复检页等待复检</p>;
                    } else if (rec.disposalType === 'concession') {
                      title = '让步接收';
                    } else if (rec.disposalType === 'scrapped') {
                      title = '报废确认';
                    } else if (rec.disposalType === 'released') {
                      title = '直接放行';
                    } else if (rec.disposalType === 'recheck_passed') {
                      title = '复检通过（自动闭环）';
                      const resultText =
                        rec.reInspectionResult === 'qualified'
                          ? '复检合格'
                          : rec.reInspectionResult === 'repaired'
                          ? '修磨后合格'
                          : rec.reInspectionResult || '';
                      extraContent = (
                        <>
                          <p>
                            复检结论：
                            <span className="text-green-300">{resultText}</span>
                          </p>
                          {rec.reInspectionRecordId && (
                            <p>关联复检编号：{rec.reInspectionRecordId.slice(0, 8)}...</p>
                          )}
                        </>
                      );
                    }

                    items.push({
                      key: rec.id,
                      type: rec.disposalType,
                      title,
                      borderClass: meta.color,
                      dotClass: meta.iconColor,
                      content: (
                        <div className="text-xs space-y-0.5 opacity-90">
                          <p>操作人：{rec.operator}</p>
                          <p>时间：{rec.timestamp}</p>
                          {rec.remark && <p>备注：{rec.remark}</p>}
                          {extraContent}
                        </div>
                      ),
                    });
                  });

                  return items.map((item) => (
                    <div key={item.key} className="relative">
                      <span
                        className={`absolute -left-[22px] top-1 w-3 h-3 rounded-full bg-steel-900 border-2 ${item.dotClass}`}
                      />
                      <div className={`rounded-lg p-3 border ${item.borderClass}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-semibold">{item.title}</span>
                        </div>
                        {item.content}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {!isFinished && disposal.records.length === 0 && (
            <div className="bg-steel-800/20 border border-steel-700/30 rounded-lg p-6 text-center text-steel-500 text-sm">
              尚未执行处置操作
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DisposalActionModal({
  onClose,
  actionType,
  setActionType,
  operator,
  setOperator,
  remark,
  setRemark,
  onSubmit,
}: {
  onClose: () => void;
  actionType: 'rework' | 'concession' | 'scrapped' | 'released';
  setActionType: (t: 'rework' | 'concession' | 'scrapped' | 'released') => void;
  operator: string;
  setOperator: (s: string) => void;
  remark: string;
  setRemark: (s: string) => void;
  onSubmit: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="card-industrial w-full max-w-lg overflow-hidden">
        <div className="card-header flex justify-between items-center">
          <h3 className="text-base font-semibold text-white">执行质量处置</h3>
          <button onClick={onClose} className="text-steel-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs text-steel-400 mb-2">处置方式</label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ['rework', '返修处理', '回到复检', 'warning'],
                  ['concession', '让步接收', '放行入库', 'success'],
                  ['released', '直接放行', '放行入库', 'success'],
                  ['scrapped', '报废确认', '标记报废', 'danger'],
                ] as const
              ).map(([val, title, desc, tone]) => (
                <button
                  key={val}
                  onClick={() => setActionType(val)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    actionType === val
                      ? tone === 'warning'
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : tone === 'danger'
                        ? 'border-red-500 bg-red-500/10'
                        : 'border-green-500 bg-green-500/10'
                      : 'border-steel-700 hover:border-steel-500 bg-steel-800/30'
                  }`}
                >
                  <p
                    className={`text-sm font-semibold ${
                      actionType === val
                        ? tone === 'warning'
                          ? 'text-yellow-400'
                          : tone === 'danger'
                          ? 'text-red-400'
                          : 'text-green-400'
                        : 'text-white'
                    }`}
                  >
                    {title}
                  </p>
                  <p className="text-xs text-steel-500 mt-1">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs text-steel-400 mb-1.5">操作人 *</label>
            <input
              type="text"
              value={operator}
              onChange={(e) => setOperator(e.target.value)}
              placeholder="请输入姓名"
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-xs text-steel-400 mb-1.5">处置说明</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={3}
              placeholder="请填写处置原因、依据等信息..."
              className="input-field w-full"
            />
          </div>
        </div>
        <div className="card-header border-t flex justify-end gap-3">
          <button onClick={onClose} className="btn-secondary">
            取消
          </button>
          <button
            onClick={onSubmit}
            disabled={!operator.trim()}
            className="btn-primary disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            确认提交
          </button>
        </div>
      </div>
    </div>
  );
}
