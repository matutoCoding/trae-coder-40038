import { useState, useMemo } from 'react';
import {
  Calendar,
  ClipboardList,
  Package,
  Truck,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  X,
  FileText,
  Layers,
  Play,
  Square,
  MapPin,
  User,
  Hash,
  ChevronRight,
  Trash2,
  ArrowRightCircle,
  AlertCircle,
  Clock,
  Edit3,
  Save,
  CheckSquare,
  Square as SquareIcon,
  Weight,
  Ruler,
} from 'lucide-react';
import StatusBadge from '@/components/Status/StatusBadge';
import AlertPanel from '@/components/Status/AlertPanel';
import { useProductionStore } from '@/store/useProductionStore';
import type { OutboundPlan, OutboundPlanItem, Slab, OutboundPlanStatus } from '@/types';

const planStatusLabels: Record<OutboundPlanStatus, { text: string; status: 'success' | 'warning' | 'danger' | 'pending' | 'running' }> = {
  draft: { text: '草稿', status: 'pending' },
  ready: { text: '待执行', status: 'warning' },
  executing: { text: '执行中', status: 'running' },
  completed: { text: '已完成', status: 'success' },
  cancelled: { text: '已取消', status: 'danger' },
};

const transporterOptions = [
  { value: '天车-01', label: '天车-01' },
  { value: '天车-02', label: '天车-02' },
  { value: '平板车-01', label: '平板车-01' },
  { value: '平板车-02', label: '平板车-02' },
  { value: '叉车-01', label: '叉车-01' },
  { value: '外部车辆', label: '外部车辆' },
];

const calcWeight = (w: number, t: number, l: number) => {
  return Math.round((w * t * l * 7.85) / 1000000 * 100) / 100;
};

const formatDate = (d: string) => {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

type DetailTab = 'info' | 'slab' | 'execute';

export default function OutboundPlanPage() {
  const {
    outboundPlans,
    slabList,
    createOutboundPlan,
    updateOutboundPlan,
    addPlanItems,
    removePlanItem,
    executePlanItemOutbound,
    completeOutboundPlan,
    cancelOutboundPlan,
  } = useProductionStore();

  // ===== Filters =====
  const [statusFilter, setStatusFilter] = useState<'all' | OutboundPlanStatus>('all');
  const [destFilter, setDestFilter] = useState('');
  const [orderFilter, setOrderFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // ===== Modals =====
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailPlanId, setDetailPlanId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>('info');

  // ===== Create form =====
  const [createOrderNo, setCreateOrderNo] = useState('');
  const [createDestination, setCreateDestination] = useState('');
  const [createTransporter, setCreateTransporter] = useState('');
  const [createPlanner, setCreatePlanner] = useState('调度-王工');
  const [createPlanDate, setCreatePlanDate] = useState(todayStr());
  const [createRemark, setCreateRemark] = useState('');

  // ===== Detail edit form =====
  const [editOrderNo, setEditOrderNo] = useState('');
  const [editDestination, setEditDestination] = useState('');
  const [editTransporter, setEditTransporter] = useState('');
  const [editPlanner, setEditPlanner] = useState('');
  const [editPlanDate, setEditPlanDate] = useState('');
  const [editRemark, setEditRemark] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // ===== Slab selection =====
  const [selectedSlabIds, setSelectedSlabIds] = useState<string[]>([]);
  const [slabSearchQuery, setSlabSearchQuery] = useState('');

  // ===== Execute out form =====
  const [executeOpId, setExecuteOpId] = useState('');
  const [executeOperator, setExecuteOperator] = useState('出库-赵工');
  const [executeRemark, setExecuteRemark] = useState('');

  // ===== Derived: stats =====
  const stats = useMemo(() => {
    const today = todayStr();
    const todayPlans = outboundPlans.filter((p) => p.planDate === today);
    const pendingSlabs = outboundPlans.reduce((sum, p) => {
      if (p.status === 'executing' || p.status === 'ready') {
        return sum + p.items.filter((i) => i.status === 'pending').length;
      }
      return sum;
    }, 0);
    const completedCount = outboundPlans.filter((p) => p.status === 'completed').length;
    return {
      todayCount: todayPlans.length,
      pendingSlabs,
      completedCount,
      totalCount: outboundPlans.length,
    };
  }, [outboundPlans]);

  // ===== Derived: filtered plans =====
  const filteredPlans = useMemo(() => {
    let list = outboundPlans;
    if (statusFilter !== 'all') {
      list = list.filter((p) => p.status === statusFilter);
    }
    if (destFilter) {
      list = list.filter((p) => p.destination.includes(destFilter));
    }
    if (orderFilter) {
      list = list.filter((p) => (p.orderNo || '').toLowerCase().includes(orderFilter.toLowerCase()));
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.planNo.toLowerCase().includes(q) ||
          (p.orderNo || '').toLowerCase().includes(q) ||
          p.destination.toLowerCase().includes(q) ||
          p.planner.toLowerCase().includes(q) ||
          p.items.some((i) => i.slabNo.toLowerCase().includes(q))
      );
    }
    return list;
  }, [outboundPlans, statusFilter, destFilter, orderFilter, searchQuery]);

  // ===== Derived: unique destinations =====
  const uniqueDestinations = useMemo(() => {
    const set = new Set(outboundPlans.map((p) => p.destination).filter(Boolean));
    return Array.from(set);
  }, [outboundPlans]);

  // ===== Derived: detail plan =====
  const detailPlan = detailPlanId ? outboundPlans.find((p) => p.id === detailPlanId) : null;

  // ===== Derived: available slabs for selection (warehoused, not in any enabled plan) =====
  const availableSlabsForSelection = useMemo(() => {
    // Slab IDs already in non-cancelled/non-completed plans
    const usedSlabIds = new Set<string>();
    for (const plan of outboundPlans) {
      if (plan.status === 'completed' || plan.status === 'cancelled') continue;
      for (const item of plan.items) {
        usedSlabIds.add(item.slabId);
      }
    }

    let list = slabList.filter(
      (s) => s.status === 'warehoused' && s.position && !usedSlabIds.has(s.id)
    );

    // Exclude slabs already selected in current plan
    if (detailPlan) {
      const planSlabIds = new Set(detailPlan.items.map((i) => i.slabId));
      list = list.filter((s) => !planSlabIds.has(s.id) || selectedSlabIds.includes(s.id));
    }

    if (slabSearchQuery) {
      const q = slabSearchQuery.toLowerCase();
      list = list.filter(
        (s) =>
          s.slabNo.toLowerCase().includes(q) ||
          (s.position || '').toLowerCase().includes(q) ||
          (s.steelGrade || '').toLowerCase().includes(q) ||
          (s.heatNo || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [slabList, outboundPlans, detailPlan, selectedSlabIds, slabSearchQuery]);

  // ===== Open detail & init state =====
  const openDetail = (plan: OutboundPlan) => {
    setDetailPlanId(plan.id);
    setDetailTab('info');
    setIsEditing(false);
    setEditOrderNo(plan.orderNo || '');
    setEditDestination(plan.destination);
    setEditTransporter(plan.transporter || '');
    setEditPlanner(plan.planner);
    setEditPlanDate(plan.planDate);
    setEditRemark(plan.remark || '');
    setSelectedSlabIds([]);
    setSlabSearchQuery('');
    setExecuteOpId('');
    setExecuteOperator('出库-赵工');
    setExecuteRemark('');
  };

  // ===== Create plan =====
  const handleCreatePlan = () => {
    if (!createDestination || !createPlanner || !createPlanDate) return;
    createOutboundPlan({
      orderNo: createOrderNo || undefined,
      destination: createDestination,
      transporter: createTransporter || undefined,
      planner: createPlanner,
      planDate: createPlanDate,
      remark: createRemark || undefined,
      items: [],
    });
    setShowCreateModal(false);
    setCreateOrderNo('');
    setCreateDestination('');
    setCreateTransporter('');
    setCreatePlanner('调度-王工');
    setCreatePlanDate(todayStr());
    setCreateRemark('');
  };

  // ===== Save edit =====
  const handleSaveEdit = () => {
    if (!detailPlanId || !editDestination || !editPlanner || !editPlanDate) return;
    updateOutboundPlan(detailPlanId, {
      orderNo: editOrderNo || undefined,
      destination: editDestination,
      transporter: editTransporter || undefined,
      planner: editPlanner,
      planDate: editPlanDate,
      remark: editRemark || undefined,
    });
    setIsEditing(false);
  };

  // ===== Start execution =====
  const handleStartExecution = () => {
    if (!detailPlanId) return;
    const plan = outboundPlans.find((p) => p.id === detailPlanId);
    if (!plan) return;
    if (plan.items.length === 0) {
      alert('请先在「选择板坯」Tab 中添加板坯');
      return;
    }
    updateOutboundPlan(detailPlanId, { status: 'executing' });
    setDetailTab('execute');
  };

  // ===== Confirm plan to ready =====
  const handleConfirmPlan = () => {
    if (!detailPlanId) return;
    const plan = outboundPlans.find((p) => p.id === detailPlanId);
    if (!plan) return;
    if (plan.items.length === 0) {
      alert('请先添加板坯');
      return;
    }
    updateOutboundPlan(detailPlanId, { status: 'ready' });
  };

  // ===== Add selected slabs to plan =====
  const handleAddSelectedSlabs = () => {
    if (!detailPlanId || selectedSlabIds.length === 0) return;
    const slabs = slabList.filter((s) => selectedSlabIds.includes(s.id));
    const items: Omit<OutboundPlanItem, 'id' | 'status'>[] = slabs.map((s) => ({
      slabId: s.id,
      slabNo: s.slabNo,
      position: s.position || '',
      steelGrade: s.steelGrade,
      width: s.width,
      thickness: s.thickness,
      length: s.length,
      weight: calcWeight(s.width, s.thickness, s.length),
    }));
    addPlanItems(detailPlanId, items);
    setSelectedSlabIds([]);
  };

  // ===== Toggle slab selection =====
  const toggleSlabSelection = (id: string) => {
    setSelectedSlabIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ===== Execute outbound for item =====
  const handleExecuteOutbound = () => {
    if (!detailPlanId || !executeOpId || !executeOperator) return;
    executePlanItemOutbound(detailPlanId, executeOpId, executeOperator, executeRemark || undefined);
    setExecuteOpId('');
    setExecuteRemark('');
  };

  // ===== Complete plan =====
  const handleCompletePlan = () => {
    if (!detailPlanId) return;
    const plan = outboundPlans.find((p) => p.id === detailPlanId);
    if (!plan) return;
    if (plan.items.length === 0 || !plan.items.every((i) => i.status === 'outbound')) {
      alert('请先完成所有板坯出库');
      return;
    }
    if (confirm('确定要完成该出库计划吗？')) {
      completeOutboundPlan(detailPlanId);
    }
  };

  // ===== Cancel plan =====
  const handleCancelPlan = () => {
    if (!detailPlanId) return;
    const plan = outboundPlans.find((p) => p.id === detailPlanId);
    if (!plan) return;
    if (plan.items.some((i) => i.status === 'outbound')) {
      alert('已执行部分出库的计划不能取消');
      return;
    }
    if (confirm('确定要取消该出库计划吗？')) {
      cancelOutboundPlan(detailPlanId);
    }
  };

  // ===== All outbound done? =====
  const allOutboundDone = detailPlan
    ? detailPlan.items.length > 0 && detailPlan.items.every((i) => i.status === 'outbound')
    : false;

  const canEdit = detailPlan ? detailPlan.status === 'draft' || detailPlan.status === 'executing' : false;

  return (
    <div className="space-y-6">
      {/* ===== Stats ===== */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Calendar className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">今日计划</p>
              <p className="text-xl font-mono font-bold text-white">{stats.todayCount}</p>
            </div>
          </div>
        </div>
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Package className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">待出库板坯</p>
              <p className="text-xl font-mono font-bold text-white">{stats.pendingSlabs}</p>
            </div>
          </div>
        </div>
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">已完成出库</p>
              <p className="text-xl font-mono font-bold text-white">{stats.completedCount}</p>
            </div>
          </div>
        </div>
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <ClipboardList className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">计划总数</p>
              <p className="text-xl font-mono font-bold text-white">{stats.totalCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== Filter Bar ===== */}
      <div className="card-industrial p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-industrial-500" />
            <h2 className="text-base font-semibold text-white">出库计划列表</h2>
          </div>
          <div className="flex-1" />
          <div className="relative">
            <Search className="w-4 h-4 text-steel-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索计划号/订单/目的地/板坯号..."
              className="input-field pl-9 w-72"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-steel-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
              className="input-field w-36"
            >
              <option value="all">全部状态</option>
              <option value="draft">草稿</option>
              <option value="ready">待执行</option>
              <option value="executing">执行中</option>
              <option value="completed">已完成</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
          <div className="relative">
            <input
              type="text"
              value={destFilter}
              onChange={(e) => setDestFilter(e.target.value)}
              placeholder="筛选目的地..."
              className="input-field w-40"
              list="dest-options"
            />
            <datalist id="dest-options">
              {uniqueDestinations.map((d) => (
                <option key={d} value={d} />
              ))}
            </datalist>
          </div>
          <div className="relative">
            <Hash className="w-4 h-4 text-steel-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={orderFilter}
              onChange={(e) => setOrderFilter(e.target.value)}
              placeholder="订单号筛选..."
              className="input-field pl-9 w-44"
            />
          </div>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-1.5">
            <Plus className="w-4 h-4" />
            新建计划
          </button>
        </div>
      </div>

      {/* ===== Plan Cards ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPlans.length === 0 && (
          <div className="col-span-full card-industrial p-12 text-center text-steel-500">
            <ClipboardList className="w-12 h-12 mx-auto mb-3 text-steel-600" />
            <p>暂无出库计划</p>
            <p className="text-xs mt-1">点击右上角「新建计划」创建出库计划</p>
          </div>
        )}
        {filteredPlans.map((plan) => {
          const totalWeight = plan.items.reduce((s, i) => s + i.weight, 0);
          const pendingCount = plan.items.filter((i) => i.status === 'pending').length;
          const outboundCount = plan.items.filter((i) => i.status === 'outbound').length;
          const progress =
            plan.items.length > 0 ? Math.round((outboundCount / plan.items.length) * 100) : 0;
          return (
            <div
              key={plan.id}
              className="card-industrial overflow-hidden cursor-pointer hover:border-industrial-500/60 transition-colors"
              onClick={() => openDetail(plan)}
            >
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-white font-bold text-sm truncate">
                      {plan.planNo}
                    </p>
                    {plan.orderNo && (
                      <p className="text-xs text-steel-400 mt-0.5 truncate">
                        订单号: {plan.orderNo}
                      </p>
                    )}
                  </div>
                  <StatusBadge
                    status={planStatusLabels[plan.status].status}
                    text={planStatusLabels[plan.status].text}
                    size="sm"
                  />
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-1.5 text-steel-400">
                    <MapPin className="w-3 h-3 text-industrial-400" />
                    <span className="text-white truncate">{plan.destination}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-steel-400">
                    <Truck className="w-3 h-3 text-orange-400" />
                    <span className="truncate">{plan.transporter || '未指定运输方式'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-steel-400">
                    <Calendar className="w-3 h-3 text-blue-400" />
                    <span>{plan.planDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-steel-400">
                    <User className="w-3 h-3 text-green-400" />
                    <span>{plan.planner}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-steel-700/40">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-steel-400 flex items-center gap-1">
                      <Layers className="w-3 h-3" />
                      板坯 {plan.items.length} 块
                    </span>
                    <span className="text-industrial-400 font-mono flex items-center gap-1">
                      <Weight className="w-3 h-3" />
                      {totalWeight.toFixed(2)}t
                    </span>
                  </div>
                  {(plan.status === 'executing' || plan.status === 'completed') && (
                    <>
                      <div className="h-1.5 bg-steel-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-industrial-500 to-green-500 transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-steel-500 mt-1">
                        <span>待出库 {pendingCount}</span>
                        <span className="text-industrial-400">{progress}%</span>
                        <span>已出库 {outboundCount}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-steel-500 pt-1">
                  <span>创建: {plan.createdAt}</span>
                  <span className="flex items-center gap-0.5 text-industrial-400 hover:text-white">
                    查看详情
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== Alert Panel ===== */}
      <div className="card-industrial">
        <div className="card-header">
          <h2 className="card-title flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-industrial-500" />
            仓库模块告警信息
          </h2>
        </div>
        <div className="p-3">
          <AlertPanel moduleFilter="warehouse" showAll maxItems={5} />
        </div>
      </div>

      {/* ===== Create Plan Modal ===== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card-industrial w-full max-w-lg overflow-hidden">
            <div className="card-header">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-industrial-500" />
                新建出库计划
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded hover:bg-steel-700 transition-colors text-steel-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-steel-400 mb-1.5 flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    订单号
                  </label>
                  <input
                    type="text"
                    value={createOrderNo}
                    onChange={(e) => setCreateOrderNo(e.target.value)}
                    className="input-field"
                    placeholder="选填"
                  />
                </div>
                <div>
                  <label className="block text-xs text-steel-400 mb-1.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    目的地 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={createDestination}
                    onChange={(e) => setCreateDestination(e.target.value)}
                    className="input-field"
                    placeholder="例: 热轧车间/XX客户"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-steel-400 mb-1.5 flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    运输方式
                  </label>
                  <select
                    value={createTransporter}
                    onChange={(e) => setCreateTransporter(e.target.value)}
                    className="input-field"
                  >
                    <option value="">请选择运输方式</option>
                    {transporterOptions.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-steel-400 mb-1.5 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    计划日期 <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="date"
                    value={createPlanDate}
                    onChange={(e) => setCreatePlanDate(e.target.value)}
                    className="input-field"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-steel-400 mb-1.5 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  计划人 <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={createPlanner}
                  onChange={(e) => setCreatePlanner(e.target.value)}
                  className="input-field"
                  placeholder="请输入姓名"
                />
              </div>
              <div>
                <label className="block text-xs text-steel-400 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  备注
                </label>
                <textarea
                  value={createRemark}
                  onChange={(e) => setCreateRemark(e.target.value)}
                  rows={2}
                  className="input-field resize-none"
                  placeholder="选填..."
                />
              </div>
            </div>
            <div className="card-header border-t flex justify-end gap-3">
              <button onClick={() => setShowCreateModal(false)} className="btn-secondary">
                取消
              </button>
              <button
                onClick={handleCreatePlan}
                disabled={!createDestination || !createPlanner || !createPlanDate}
                className="btn-primary disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                确认创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Detail Plan Modal ===== */}
      {detailPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="card-industrial w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col">
            <div className="card-header flex-wrap gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-industrial-500" />
                  <h3 className="text-base font-semibold text-white font-mono truncate">
                    {detailPlan.planNo}
                  </h3>
                  {detailPlan.orderNo && (
                    <span className="text-xs text-steel-400 truncate">
                      (订单: {detailPlan.orderNo})
                    </span>
                  )}
                </div>
                <StatusBadge
                  status={planStatusLabels[detailPlan.status].status}
                  text={planStatusLabels[detailPlan.status].text}
                  size="sm"
                />
              </div>
              <div className="flex items-center gap-2">
                {detailPlan.status === 'draft' && (
                  <>
                    <button
                      onClick={handleConfirmPlan}
                      className="btn-primary !py-1.5 !px-3 !text-xs flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      确认计划
                    </button>
                    <button
                      onClick={handleCancelPlan}
                      className="btn-danger !py-1.5 !px-3 !text-xs flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      取消计划
                    </button>
                  </>
                )}
                {detailPlan.status === 'ready' && (
                  <>
                    <button
                      onClick={handleStartExecution}
                      className="btn-primary !py-1.5 !px-3 !text-xs flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5" />
                      开始执行
                    </button>
                    <button
                      onClick={handleCancelPlan}
                      className="btn-danger !py-1.5 !px-3 !text-xs flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      取消计划
                    </button>
                  </>
                )}
                {detailPlan.status === 'executing' && (
                  <button
                    onClick={handleCompletePlan}
                    disabled={!allOutboundDone}
                    className="btn-primary !py-1.5 !px-3 !text-xs flex items-center gap-1 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {allOutboundDone ? '完成计划' : '请先完成全部出库'}
                  </button>
                )}
                <button
                  onClick={() => setDetailPlanId(null)}
                  className="p-1.5 rounded hover:bg-steel-700 transition-colors text-steel-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ===== Tabs ===== */}
            <div className="flex gap-1 px-4 pt-3 border-b border-steel-700/50">
              <TabButton
                active={detailTab === 'info'}
                onClick={() => setDetailTab('info')}
                icon={<FileText className="w-3.5 h-3.5" />}
                label="基本信息"
              />
              {detailPlan.status !== 'completed' && detailPlan.status !== 'cancelled' && (
                <TabButton
                  active={detailTab === 'slab'}
                  onClick={() => setDetailTab('slab')}
                  icon={<Layers className="w-3.5 h-3.5" />}
                  label={`选择板坯 (${detailPlan.items.length})`}
                />
              )}
              {detailPlan.status === 'executing' && (
                <TabButton
                  active={detailTab === 'execute'}
                  onClick={() => setDetailTab('execute')}
                  icon={<ArrowRightCircle className="w-3.5 h-3.5" />}
                  label={`执行出库 (${detailPlan.items.filter((i) => i.status === 'outbound').length}/${detailPlan.items.length})`}
                />
              )}
            </div>

            {/* ===== Tab Content ===== */}
            <div className="p-5 overflow-y-auto flex-1">
              {/* ===== Tab 1: Info ===== */}
              {detailTab === 'info' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-industrial-400 font-semibold flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      计划基本信息
                      {!canEdit && detailPlan.status !== 'draft' && detailPlan.status !== 'executing' && (
                        <span className="ml-2 text-steel-500 font-normal">
                          (当前状态不可编辑)
                        </span>
                      )}
                    </p>
                    {canEdit && (
                      <button
                        onClick={() => {
                          if (isEditing) {
                            handleSaveEdit();
                          } else {
                            setIsEditing(true);
                          }
                        }}
                        className={`!py-1 !px-3 !text-xs ${
                          isEditing ? 'btn-primary' : 'btn-secondary'
                        } flex items-center gap-1`}
                      >
                        {isEditing ? (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            保存修改
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-3.5 h-3.5" />
                            编辑
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InfoField
                      label="计划编号"
                      icon={<Hash className="w-3 h-3" />}
                      value={detailPlan.planNo}
                      mono
                      editable={false}
                    />
                    <InfoField
                      label="订单号"
                      icon={<Hash className="w-3 h-3" />}
                      value={editOrderNo}
                      mono
                      editable={isEditing}
                      onChange={setEditOrderNo}
                      placeholder="选填"
                    />
                    <InfoField
                      label="目的地"
                      icon={<MapPin className="w-3 h-3" />}
                      value={editDestination}
                      editable={isEditing}
                      onChange={setEditDestination}
                      required
                    />
                    <InfoField
                      label="运输方式"
                      icon={<Truck className="w-3 h-3" />}
                      value={editTransporter}
                      editable={isEditing}
                      onChange={setEditTransporter}
                      select
                      selectOptions={transporterOptions}
                      placeholder="未指定"
                    />
                    <InfoField
                      label="计划日期"
                      icon={<Calendar className="w-3 h-3" />}
                      value={editPlanDate}
                      type="date"
                      editable={isEditing}
                      onChange={setEditPlanDate}
                      required
                    />
                    <InfoField
                      label="计划人"
                      icon={<User className="w-3 h-3" />}
                      value={editPlanner}
                      editable={isEditing}
                      onChange={setEditPlanner}
                      required
                    />
                    <InfoField
                      label="创建时间"
                      icon={<Clock className="w-3 h-3" />}
                      value={detailPlan.createdAt}
                      mono
                      editable={false}
                    />
                    {detailPlan.completedAt && (
                      <InfoField
                        label="完成时间"
                        icon={<CheckCircle2 className="w-3 h-3" />}
                        value={detailPlan.completedAt}
                        mono
                        editable={false}
                      />
                    )}
                    {detailPlan.cancelledAt && (
                      <InfoField
                        label="取消时间"
                        icon={<X className="w-3 h-3" />}
                        value={detailPlan.cancelledAt}
                        mono
                        editable={false}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs text-steel-400 mb-1.5 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      备注
                    </label>
                    {isEditing ? (
                      <textarea
                        value={editRemark}
                        onChange={(e) => setEditRemark(e.target.value)}
                        rows={3}
                        className="input-field resize-none"
                        placeholder="选填..."
                      />
                    ) : (
                      <div className="input-field bg-steel-800/50 min-h-[72px] text-steel-300">
                        {detailPlan.remark || '无备注'}
                      </div>
                    )}
                  </div>

                  {/* Items summary */}
                  <div className="bg-steel-800/40 border border-steel-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-industrial-400 font-semibold flex items-center gap-1">
                        <Layers className="w-4 h-4" />
                        板坯清单（共 {detailPlan.items.length} 块）
                      </p>
                      <div className="flex items-center gap-4 text-xs">
                        <span className="text-steel-400">
                          待出库:{' '}
                          <span className="text-yellow-400 font-mono">
                            {detailPlan.items.filter((i) => i.status === 'pending').length}
                          </span>
                        </span>
                        <span className="text-steel-400">
                          已出库:{' '}
                          <span className="text-green-400 font-mono">
                            {detailPlan.items.filter((i) => i.status === 'outbound').length}
                          </span>
                        </span>
                        <span className="text-industrial-400 font-mono flex items-center gap-1">
                          <Weight className="w-3 h-3" />
                          总重:{' '}
                          {detailPlan.items.reduce((s, i) => s + i.weight, 0).toFixed(2)}t
                        </span>
                      </div>
                    </div>
                    {detailPlan.items.length === 0 ? (
                      <div className="text-center py-6 text-steel-500 text-sm">
                        <Package className="w-8 h-8 mx-auto mb-2 opacity-40" />
                        暂无板坯，请到「选择板坯」Tab 添加
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto -mx-2">
                        <table className="w-full">
                          <thead className="sticky top-0 bg-steel-800 z-10">
                            <tr className="border-b border-steel-700/50">
                              <th className="table-header text-left px-2 py-2 text-xs">板坯号</th>
                              <th className="table-header text-left px-2 py-2 text-xs">库位</th>
                              <th className="table-header text-left px-2 py-2 text-xs">钢种</th>
                              <th className="table-header text-left px-2 py-2 text-xs">规格(mm)</th>
                              <th className="table-header text-right px-2 py-2 text-xs">重量(t)</th>
                              <th className="table-header text-center px-2 py-2 text-xs">状态</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detailPlan.items.map((item) => (
                              <tr
                                key={item.id}
                                className="border-b border-steel-800/50 hover:bg-steel-800/30"
                              >
                                <td className="table-cell px-2 py-2 text-xs font-mono text-white">
                                  {item.slabNo}
                                </td>
                                <td className="table-cell px-2 py-2 text-xs font-mono text-industrial-400">
                                  {item.position || '-'}
                                </td>
                                <td className="table-cell px-2 py-2 text-xs text-steel-300">
                                  {item.steelGrade}
                                </td>
                                <td className="table-cell px-2 py-2 text-xs text-steel-300 font-mono">
                                  {item.width}×{item.thickness}×{item.length}
                                </td>
                                <td className="table-cell px-2 py-2 text-xs text-white font-mono text-right">
                                  {item.weight.toFixed(2)}
                                </td>
                                <td className="table-cell px-2 py-2 text-xs text-center">
                                  <StatusBadge
                                    status={item.status === 'outbound' ? 'success' : 'pending'}
                                    text={item.status === 'outbound' ? '已出库' : '待出库'}
                                    size="sm"
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===== Tab 2: Select Slabs ===== */}
              {detailTab === 'slab' && (
                <div className="space-y-4">
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-xs text-blue-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      仅显示状态为「已入库」且未在其他启用计划中的板坯。选择需要出库的板坯后点击下方「加入计划」。
                      <br />
                      板坯理论重量按公式计算: <span className="font-mono">宽 × 厚 × 长 × 7.85 ÷ 1000000 (吨)</span>
                    </div>
                  </div>

                  {/* Selected slab action bar */}
                  <div className="flex flex-wrap items-center gap-3 justify-between bg-steel-800/50 border border-steel-700 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-steel-400">
                        已选择:{' '}
                        <span className="text-industrial-400 font-mono text-sm">
                          {selectedSlabIds.length}
                        </span>{' '}
                        块
                      </span>
                      {selectedSlabIds.length > 0 && (
                        <span className="text-xs text-steel-400 flex items-center gap-1">
                          预计总重:{' '}
                          <span className="text-green-400 font-mono text-sm">
                            {slabList
                              .filter((s) => selectedSlabIds.includes(s.id))
                              .reduce((s, x) => s + calcWeight(x.width, x.thickness, x.length), 0)
                              .toFixed(2)}{' '}
                            t
                          </span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-steel-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={slabSearchQuery}
                          onChange={(e) => setSlabSearchQuery(e.target.value)}
                          placeholder="搜索板坯/库位/钢种/炉号..."
                          className="input-field pl-8 !py-1.5 !text-xs w-64"
                        />
                      </div>
                      {selectedSlabIds.length > 0 && (
                        <button
                          onClick={() => setSelectedSlabIds([])}
                          className="btn-secondary !py-1.5 !px-3 !text-xs flex items-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          清空选择
                        </button>
                      )}
                      <button
                        onClick={handleAddSelectedSlabs}
                        disabled={selectedSlabIds.length === 0}
                        className="btn-primary !py-1.5 !px-3 !text-xs flex items-center gap-1 disabled:opacity-50"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        加入计划 ({selectedSlabIds.length})
                      </button>
                    </div>
                  </div>

                  {/* Available slab list */}
                  {availableSlabsForSelection.length === 0 ? (
                    <div className="card-industrial p-12 text-center text-steel-500">
                      <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p>暂无可选板坯</p>
                      <p className="text-xs mt-1">所有在库板坯均已加入其他计划</p>
                    </div>
                  ) : (
                    <div className="max-h-[420px] overflow-y-auto border border-steel-700 rounded-lg">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-steel-800 z-10">
                          <tr className="border-b border-steel-700/50">
                            <th className="table-header px-2 py-2 w-10 text-center">
                              <button
                                onClick={() => {
                                  const ids = availableSlabsForSelection.map((s) => s.id);
                                  const allSelected =
                                    ids.length > 0 &&
                                    ids.every((id) => selectedSlabIds.includes(id));
                                  if (allSelected) {
                                    setSelectedSlabIds((prev) =>
                                      prev.filter((x) => !ids.includes(x))
                                    );
                                  } else {
                                    const merged = new Set([...selectedSlabIds, ...ids]);
                                    setSelectedSlabIds(Array.from(merged));
                                  }
                                }}
                                className="text-steel-400 hover:text-white"
                              >
                                {availableSlabsForSelection.length > 0 &&
                                availableSlabsForSelection.every((s) =>
                                  selectedSlabIds.includes(s.id)
                                ) ? (
                                  <CheckSquare className="w-4 h-4 text-industrial-400" />
                                ) : (
                                  <SquareIcon className="w-4 h-4" />
                                )}
                              </button>
                            </th>
                            <th className="table-header text-left px-2 py-2 text-xs">板坯号</th>
                            <th className="table-header text-left px-2 py-2 text-xs">库位</th>
                            <th className="table-header text-left px-2 py-2 text-xs">钢种</th>
                            <th className="table-header text-left px-2 py-2 text-xs">规格</th>
                            <th className="table-header text-right px-2 py-2 text-xs">重量(t)</th>
                            <th className="table-header text-left px-2 py-2 text-xs">等级</th>
                          </tr>
                        </thead>
                        <tbody>
                          {availableSlabsForSelection.map((slab) => {
                            const checked = selectedSlabIds.includes(slab.id);
                            const w = calcWeight(slab.width, slab.thickness, slab.length);
                            return (
                              <tr
                                key={slab.id}
                                className={`border-b border-steel-800/50 cursor-pointer transition-colors ${
                                  checked ? 'bg-industrial-900/30' : 'hover:bg-steel-800/40'
                                }`}
                                onClick={() => toggleSlabSelection(slab.id)}
                              >
                                <td className="table-cell px-2 py-2 text-center">
                                  {checked ? (
                                    <CheckSquare className="w-4 h-4 text-industrial-400 mx-auto" />
                                  ) : (
                                    <SquareIcon className="w-4 h-4 text-steel-500 mx-auto" />
                                  )}
                                </td>
                                <td className="table-cell px-2 py-2 text-xs font-mono text-white">
                                  {slab.slabNo}
                                </td>
                                <td className="table-cell px-2 py-2 text-xs font-mono text-industrial-400">
                                  {slab.position}
                                </td>
                                <td className="table-cell px-2 py-2 text-xs text-steel-300">
                                  {slab.steelGrade}
                                </td>
                                <td className="table-cell px-2 py-2 text-xs text-steel-300 font-mono flex items-center gap-1">
                                  <Ruler className="w-3 h-3 text-steel-500" />
                                  {slab.width}×{slab.thickness}×{slab.length}
                                </td>
                                <td className="table-cell px-2 py-2 text-xs text-white font-mono text-right flex items-center gap-1 justify-end">
                                  <Weight className="w-3 h-3 text-steel-500" />
                                  {w.toFixed(2)}
                                </td>
                                <td className="table-cell px-2 py-2 text-xs">
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
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
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Plan items with remove */}
                  <div className="bg-steel-800/40 border border-steel-700 rounded-lg">
                    <div className="p-3 border-b border-steel-700/50 flex items-center justify-between">
                      <p className="text-xs text-industrial-400 font-semibold flex items-center gap-1">
                        <Layers className="w-4 h-4" />
                        已加入计划的板坯 ({detailPlan.items.length} 块 /{' '}
                        {detailPlan.items.reduce((s, i) => s + i.weight, 0).toFixed(2)} t)
                      </p>
                    </div>
                    {detailPlan.items.length === 0 ? (
                      <div className="text-center py-8 text-steel-500 text-sm">
                        尚未选择板坯加入计划
                      </div>
                    ) : (
                      <div className="max-h-56 overflow-y-auto">
                        <table className="w-full">
                          <thead className="sticky top-0 bg-steel-800 z-10">
                            <tr className="border-b border-steel-700/50">
                              <th className="table-header text-left px-3 py-2 text-xs">板坯号</th>
                              <th className="table-header text-left px-3 py-2 text-xs">库位</th>
                              <th className="table-header text-left px-3 py-2 text-xs">钢种</th>
                              <th className="table-header text-left px-3 py-2 text-xs">规格</th>
                              <th className="table-header text-right px-3 py-2 text-xs">重量(t)</th>
                              <th className="table-header text-center px-3 py-2 text-xs">状态</th>
                              <th className="table-header text-center px-3 py-2 text-xs w-16">操作</th>
                            </tr>
                          </thead>
                          <tbody>
                            {detailPlan.items.map((item) => (
                              <tr
                                key={item.id}
                                className="border-b border-steel-800/50 hover:bg-steel-800/30"
                              >
                                <td className="table-cell px-3 py-2 text-xs font-mono text-white">
                                  {item.slabNo}
                                </td>
                                <td className="table-cell px-3 py-2 text-xs font-mono text-industrial-400">
                                  {item.position}
                                </td>
                                <td className="table-cell px-3 py-2 text-xs text-steel-300">
                                  {item.steelGrade}
                                </td>
                                <td className="table-cell px-3 py-2 text-xs font-mono text-steel-300">
                                  {item.width}×{item.thickness}×{item.length}
                                </td>
                                <td className="table-cell px-3 py-2 text-xs font-mono text-white text-right">
                                  {item.weight.toFixed(2)}
                                </td>
                                <td className="table-cell px-3 py-2 text-xs text-center">
                                  <StatusBadge
                                    status={item.status === 'outbound' ? 'success' : 'pending'}
                                    text={item.status === 'outbound' ? '已出库' : '待出库'}
                                    size="sm"
                                  />
                                </td>
                                <td className="table-cell px-3 py-2 text-center">
                                  {item.status === 'pending' && (
                                    <button
                                      onClick={() => removePlanItem(detailPlan.id, item.id)}
                                      className="p-1 rounded text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
                                      title="移除"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ===== Tab 3: Execute Outbound ===== */}
              {detailTab === 'execute' && (
                <div className="space-y-4">
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-xs text-green-300 flex items-start gap-2">
                    <Play className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      执行出库模式。对待出库的板坯逐个填写操作人和备注后执行出库。
                      所有板坯出库完成后点击右上角「完成计划」。
                    </div>
                  </div>

                  {/* Progress summary */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-steel-800/40 border border-steel-700 rounded-lg p-3 text-center">
                      <p className="text-xs text-steel-400 mb-1">总计</p>
                      <p className="text-xl font-mono font-bold text-white">
                        {detailPlan.items.length}
                      </p>
                      <p className="text-[10px] text-steel-500 mt-0.5">
                        {detailPlan.items.reduce((s, i) => s + i.weight, 0).toFixed(2)} t
                      </p>
                    </div>
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-yellow-400 mb-1">待出库</p>
                      <p className="text-xl font-mono font-bold text-yellow-400">
                        {detailPlan.items.filter((i) => i.status === 'pending').length}
                      </p>
                      <p className="text-[10px] text-steel-500 mt-0.5">
                        {detailPlan.items
                          .filter((i) => i.status === 'pending')
                          .reduce((s, i) => s + i.weight, 0)
                          .toFixed(2)}{' '}
                        t
                      </p>
                    </div>
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                      <p className="text-xs text-green-400 mb-1">已出库</p>
                      <p className="text-xl font-mono font-bold text-green-400">
                        {detailPlan.items.filter((i) => i.status === 'outbound').length}
                      </p>
                      <p className="text-[10px] text-steel-500 mt-0.5">
                        {detailPlan.items
                          .filter((i) => i.status === 'outbound')
                          .reduce((s, i) => s + i.weight, 0)
                          .toFixed(2)}{' '}
                        t
                      </p>
                    </div>
                  </div>

                  {/* Execute outbound for a pending item */}
                  {detailPlan.items.some((i) => i.status === 'pending') && (
                    <div className="card-industrial overflow-hidden">
                      <div className="card-header">
                        <h4 className="card-title flex items-center gap-2">
                          <ArrowRightCircle className="w-4 h-4 text-industrial-500" />
                          执行出库操作
                        </h4>
                      </div>
                      <div className="p-4 space-y-4">
                        <div>
                          <label className="block text-xs text-steel-400 mb-1.5">
                            选择待出库板坯 <span className="text-red-400">*</span>
                          </label>
                          <select
                            value={executeOpId}
                            onChange={(e) => setExecuteOpId(e.target.value)}
                            className="input-field"
                          >
                            <option value="">-- 请选择待出库板坯 --</option>
                            {detailPlan.items
                              .filter((i) => i.status === 'pending')
                              .map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.slabNo} | {item.position} | {item.steelGrade} |{' '}
                                  {item.width}×{item.thickness}×{item.length}mm | {item.weight.toFixed(2)}t
                                </option>
                              ))}
                          </select>
                        </div>

                        {executeOpId && (() => {
                          const item = detailPlan.items.find((i) => i.id === executeOpId);
                          if (!item) return null;
                          return (
                            <div className="bg-steel-800/50 border border-steel-700 rounded-lg p-3 space-y-2 text-xs">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div>
                                  <p className="text-steel-500 mb-0.5">板坯号</p>
                                  <p className="font-mono text-white">{item.slabNo}</p>
                                </div>
                                <div>
                                  <p className="text-steel-500 mb-0.5">库位</p>
                                  <p className="font-mono text-industrial-400">{item.position}</p>
                                </div>
                                <div>
                                  <p className="text-steel-500 mb-0.5">规格</p>
                                  <p className="font-mono text-steel-300">
                                    {item.width}×{item.thickness}×{item.length}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-steel-500 mb-0.5">重量</p>
                                  <p className="font-mono text-white">{item.weight.toFixed(2)} t</p>
                                </div>
                              </div>
                              <div>
                                <p className="text-steel-500 mb-0.5">钢种</p>
                                <p className="text-steel-300">{item.steelGrade}</p>
                              </div>
                            </div>
                          );
                        })()}

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs text-steel-400 mb-1.5">
                              出库操作人 <span className="text-red-400">*</span>
                            </label>
                            <input
                              type="text"
                              value={executeOperator}
                              onChange={(e) => setExecuteOperator(e.target.value)}
                              className="input-field"
                              placeholder="请输入姓名"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-steel-400 mb-1.5">
                              目的地 / 客户
                            </label>
                            <div className="input-field bg-steel-800/50 text-steel-300 truncate">
                              {detailPlan.destination}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-steel-400 mb-1.5">备注</label>
                          <textarea
                            value={executeRemark}
                            onChange={(e) => setExecuteRemark(e.target.value)}
                            rows={2}
                            className="input-field resize-none"
                            placeholder="出库相关备注..."
                          />
                        </div>

                        <button
                          onClick={handleExecuteOutbound}
                          disabled={!executeOpId || !executeOperator}
                          className="btn-primary w-full disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <ArrowRightCircle className="w-4 h-4" />
                          确认出库当前板坯
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Full list with outbound info */}
                  <div className="card-industrial overflow-hidden">
                    <div className="card-header">
                      <h4 className="card-title flex items-center gap-2">
                        <Layers className="w-4 h-4 text-industrial-500" />
                        出库明细
                      </h4>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full">
                        <thead className="sticky top-0 bg-steel-800 z-10">
                          <tr className="border-b border-steel-700/50">
                            <th className="table-header text-left px-3 py-2 text-xs">板坯号</th>
                            <th className="table-header text-left px-3 py-2 text-xs">库位</th>
                            <th className="table-header text-right px-3 py-2 text-xs">重量</th>
                            <th className="table-header text-center px-3 py-2 text-xs">状态</th>
                            <th className="table-header text-left px-3 py-2 text-xs">出库时间</th>
                            <th className="table-header text-left px-3 py-2 text-xs">操作人</th>
                            <th className="table-header text-left px-3 py-2 text-xs">备注</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailPlan.items.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-steel-800/50 hover:bg-steel-800/30"
                            >
                              <td className="table-cell px-3 py-2 text-xs font-mono text-white">
                                {item.slabNo}
                              </td>
                              <td className="table-cell px-3 py-2 text-xs font-mono text-industrial-400">
                                {item.position}
                              </td>
                              <td className="table-cell px-3 py-2 text-xs font-mono text-white text-right">
                                {item.weight.toFixed(2)} t
                              </td>
                              <td className="table-cell px-3 py-2 text-xs text-center">
                                <StatusBadge
                                  status={item.status === 'outbound' ? 'success' : 'pending'}
                                  text={item.status === 'outbound' ? '已出库' : '待出库'}
                                  size="sm"
                                />
                              </td>
                              <td className="table-cell px-3 py-2 text-xs font-mono text-steel-400">
                                {item.outboundAt || '-'}
                              </td>
                              <td className="table-cell px-3 py-2 text-xs text-steel-300">
                                {item.outboundOperator || '-'}
                              </td>
                              <td className="table-cell px-3 py-2 text-xs text-steel-500 max-w-[180px] truncate">
                                {item.outboundRemark || '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Sub Components =====

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs rounded-t-lg transition-colors flex items-center gap-1.5 -mb-px ${
        active
          ? 'bg-steel-800 text-industrial-400 border-t border-l border-r border-steel-700/80'
          : 'text-steel-400 hover:text-white hover:bg-steel-800/30'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function InfoField({
  label,
  icon,
  value,
  mono,
  editable,
  onChange,
  required,
  placeholder,
  type = 'text',
  select,
  selectOptions,
}: {
  label: string;
  icon: React.ReactNode;
  value: string;
  mono?: boolean;
  editable: boolean;
  onChange?: (s: string) => void;
  required?: boolean;
  placeholder?: string;
  type?: string;
  select?: boolean;
  selectOptions?: { value: string; label: string }[];
}) {
  return (
    <div>
      <label className="block text-xs text-steel-400 mb-1.5 flex items-center gap-1">
        <span className="text-industrial-400">{icon}</span>
        {label}
        {required && editable && <span className="text-red-400">*</span>}
      </label>
      {editable ? (
        select ? (
          <select
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className="input-field"
          >
            <option value="">{placeholder || '请选择'}</option>
            {(selectOptions || []).map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            className={`input-field ${mono ? 'font-mono' : ''}`}
            placeholder={placeholder || ''}
          />
        )
      ) : (
        <div className={`input-field bg-steel-800/50 ${mono ? 'font-mono' : ''} text-steel-200`}>
          {value || placeholder || '-'}
        </div>
      )}
    </div>
  );
}