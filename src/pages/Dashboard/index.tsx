import { useEffect, useState } from 'react';
import {
  Flame,
  Thermometer,
  Gauge,
  CheckCircle2,
  Clock,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  User,
  FileText,
  Layers,
} from 'lucide-react';
import StatCard from '@/components/Card/StatCard';
import TrendChart from '@/components/Chart/TrendChart';
import StatusBadge from '@/components/Status/StatusBadge';
import AlertPanel from '@/components/Status/AlertPanel';
import { useProductionStore } from '@/store/useProductionStore';
import { useNavigate } from 'react-router-dom';
import type { AlertModule } from '@/types';

const processSteps = [
  { key: 'ladle', label: '钢包接收', icon: Flame, path: '/ladle' },
  { key: 'tundish', label: '中间包浇铸', icon: Thermometer, path: '/tundish' },
  { key: 'mold', label: '结晶器', icon: Gauge, path: '/mold' },
  { key: 'cooling', label: '二冷拉矫', icon: TrendingUp, path: '/secondary-cooling' },
  { key: 'cutting', label: '定尺切割', icon: Gauge, path: '/cutting' },
  { key: 'cleaning', label: '表面清理', icon: CheckCircle2, path: '/cleaning' },
  { key: 'warehouse', label: '板坯入库', icon: Clock, path: '/warehouse' },
];

const moduleLabels: Record<AlertModule, string> = {
  dashboard: '总览',
  ladle: '钢包接收',
  tundish: '中间包浇铸',
  mold: '结晶器',
  cooling: '二冷拉矫',
  cutting: '定尺切割',
  cleaning: '表面清理',
  warehouse: '板坯入库',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    productionStats,
    temperatureHistory,
    liquidLevelHistory,
    tundish,
    mold,
    alerts,
    ladleList,
    slabList,
    updateRealTimeData,
  } = useProductionStore();

  const [alertTab, setAlertTab] = useState<'unresolved' | 'resolved'>('unresolved');

  useEffect(() => {
    const interval = setInterval(() => {
      updateRealTimeData();
    }, 2000);
    return () => clearInterval(interval);
  }, [updateRealTimeData]);

  const unresolvedAlerts = alerts.filter((a) => !a.resolved);
  const resolvedAlerts = alerts
    .filter((a) => a.resolved)
    .slice(0, 20);
  const activeLadle = ladleList.find((l) => l.status === 'pouring');
  const processingSlabs = slabList.filter(
    (s) => s.status !== 'warehoused' && s.status !== 'pending_cut'
  );

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard
          title="今日产量"
          value={productionStats.todayOutput}
          unit="块"
          icon={TrendingUp}
          trend={{ value: 5.2, isUp: true }}
        />
        <StatCard
          title="平均温度"
          value={productionStats.avgTemperature.toFixed(0)}
          unit="℃"
          icon={Thermometer}
          status="normal"
        />
        <StatCard
          title="拉速"
          value={productionStats.castingSpeed.toFixed(2)}
          unit="m/min"
          icon={Gauge}
          status="normal"
        />
        <StatCard
          title="合格率"
          value={productionStats.passRate}
          unit="%"
          icon={CheckCircle2}
          status="normal"
        />
        <StatCard
          title="累计板坯"
          value={productionStats.totalSlabs}
          unit="块"
          icon={Clock}
        />
        <StatCard
          title="运行时长"
          value={productionStats.runningTime.toFixed(1)}
          unit="h"
          icon={Clock}
        />
      </div>

      {/* Alert Summary Bar */}
      {unresolvedAlerts.length > 0 && (
        <div className="card-industrial p-3 flex items-center gap-4 border-yellow-500/30">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-blink shadow-[0_0_10px_rgba(239,68,68,0.6)]"></span>
            <span className="text-sm text-yellow-400 font-medium">
              有 {unresolvedAlerts.length} 条告警待处理
            </span>
          </div>
          <div className="flex-1 flex flex-wrap gap-3 text-xs">
            {['tundish', 'mold', 'cooling'].map((m) => {
              const count = unresolvedAlerts.filter((a) => a.module === m).length;
              if (count === 0) return null;
              const label = { tundish: '中间包', mold: '结晶器', cooling: '二冷拉矫' }[m] || m;
              return (
                <span
                  key={m}
                  className="px-2 py-0.5 bg-red-500/10 text-red-400 rounded-full"
                >
                  {label} × {count}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Process Flow */}
      <div className="card-industrial p-4">
        <div className="card-header -mx-4 -mt-4 mb-4">
          <h2 className="card-title">连铸生产流程</h2>
          <StatusBadge status="running" text="生产中" />
        </div>
        <div className="flex items-center justify-between overflow-x-auto pb-2">
          {processSteps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index <= 2;
            return (
              <div key={step.key} className="flex items-center">
                <div
                  onClick={() => navigate(step.path)}
                  className={`flex flex-col items-center cursor-pointer group min-w-[80px]`}
                >
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 transition-all ${
                      isActive
                        ? 'bg-industrial-600 text-white shadow-lg shadow-industrial-500/30'
                        : 'bg-steel-800 text-steel-500'
                    } group-hover:scale-110`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-xs ${
                      isActive ? 'text-white' : 'text-steel-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < processSteps.length - 1 && (
                  <ArrowRight
                    className={`w-5 h-5 mx-2 ${
                      isActive ? 'text-industrial-500' : 'text-steel-700'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Temperature Chart */}
        <div className="card-industrial">
          <div className="card-header">
            <h2 className="card-title">中间包温度趋势</h2>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono font-bold text-orange-400">
                {tundish.temperature.toFixed(1)}
              </span>
              <span className="text-sm text-steel-400">℃</span>
            </div>
          </div>
          <div className="p-4">
            <TrendChart
              data={temperatureHistory}
              color="#f97316"
              height={160}
              yMin={1500}
              yMax={1580}
              unit="℃"
              label="近60秒趋势"
            />
          </div>
        </div>

        {/* Mold Level Chart */}
        <div className="card-industrial">
          <div className="card-header">
            <h2 className="card-title">结晶器液位趋势</h2>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono font-bold text-industrial-400">
                {mold.liquidLevel.toFixed(1)}
              </span>
              <span className="text-sm text-steel-400">mm</span>
            </div>
          </div>
          <div className="p-4">
            <TrendChart
              data={liquidLevelHistory}
              color="#0c8ef0"
              height={160}
              yMin={80}
              yMax={160}
              unit="mm"
              label="近60秒趋势"
            />
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Ladle Info */}
        <div className="card-industrial">
          <div className="card-header">
            <h2 className="card-title">当前钢包</h2>
            <StatusBadge status="running" text="浇注中" size="sm" />
          </div>
          <div className="p-4 space-y-3">
            {activeLadle ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-steel-400 text-sm">钢包号</span>
                  <span className="font-mono text-white">{activeLadle.ladleNo}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-steel-400 text-sm">钢种</span>
                  <span className="text-white font-medium">{activeLadle.steelGrade}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-steel-400 text-sm">温度</span>
                  <span className="font-mono text-orange-400">
                    {activeLadle.temperature}℃
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-steel-400 text-sm">重量</span>
                  <span className="font-mono text-white">
                    {activeLadle.weight.toFixed(1)} t
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-steel-400 text-sm">接收时间</span>
                  <span className="text-sm text-white">{activeLadle.receiveTime}</span>
                </div>
              </>
            ) : (
              <p className="text-steel-500 text-center py-4">暂无浇注中的钢包</p>
            )}
          </div>
        </div>

        {/* Processing Slabs */}
        <div className="card-industrial">
          <div className="card-header">
            <h2 className="card-title">在制板坯</h2>
            <span className="text-xs text-steel-400">{processingSlabs.length} 块</span>
          </div>
          <div className="p-2 max-h-[220px] overflow-y-auto">
            {processingSlabs.length > 0 ? (
              <div className="space-y-1">
                {processingSlabs.map((slab) => (
                  <div
                    key={slab.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-steel-800/50 rounded transition-colors"
                  >
                    <div>
                      <p className="text-sm text-white font-mono">{slab.slabNo}</p>
                      <p className="text-xs text-steel-500">
                        {slab.width}×{slab.thickness}mm
                      </p>
                    </div>
                    <StatusBadge
                      status={
                        slab.status === 'cut' || slab.status === 'cleaned'
                          ? 'success'
                          : slab.status === 'cleaning'
                          ? 'running'
                          : 'pending'
                      }
                      text={
                        slab.status === 'cut'
                          ? '待清理'
                          : slab.status === 'cleaning'
                          ? '清理中'
                          : slab.status === 'cleaned'
                          ? '待入库'
                          : '待切割'
                      }
                      size="sm"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-steel-500 text-center py-4">暂无在制板坯</p>
            )}
          </div>
        </div>

        {/* Alerts - Two Tabs */}
        <div className="card-industrial">
          <div className="card-header flex-col items-stretch !py-3">
            <div className="flex items-center justify-between w-full mb-3">
              <h2 className="card-title">告警信息</h2>
              {unresolvedAlerts.length > 0 && (
                <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                  {unresolvedAlerts.length} 未处理
                </span>
              )}
            </div>
            {/* Tab Switcher */}
            <div className="flex gap-1 bg-steel-800/60 rounded-lg p-1">
              <button
                onClick={() => setAlertTab('unresolved')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                  alertTab === 'unresolved'
                    ? 'bg-industrial-500/20 text-industrial-300 border border-industrial-500/40 shadow-sm'
                    : 'text-steel-400 hover:text-white hover:bg-steel-700/50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                未处理告警
                {unresolvedAlerts.length > 0 && (
                  <span className={`ml-1 px-1.5 rounded-full text-[10px] ${
                    alertTab === 'unresolved'
                      ? 'bg-industrial-500/40 text-white'
                      : 'bg-red-500/20 text-red-400'
                  }`}>
                    {unresolvedAlerts.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setAlertTab('resolved')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
                  alertTab === 'resolved'
                    ? 'bg-industrial-500/20 text-industrial-300 border border-industrial-500/40 shadow-sm'
                    : 'text-steel-400 hover:text-white hover:bg-steel-700/50'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                已处理记录
                {resolvedAlerts.length > 0 && (
                  <span className={`ml-1 px-1.5 rounded-full text-[10px] ${
                    alertTab === 'resolved'
                      ? 'bg-industrial-500/40 text-white'
                      : 'bg-green-500/20 text-green-400'
                  }`}>
                    {resolvedAlerts.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div className="p-2 max-h-[480px] overflow-y-auto">
            {alertTab === 'unresolved' ? (
              <AlertPanel showAll={false} maxItems={20} compact />
            ) : (
              <ResolvedAlertsList alerts={resolvedAlerts} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ResolvedAlertsList({ alerts }: { alerts: ReturnType<typeof Object['values']> }) {
  if (alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-steel-500">
        <CheckCircle2 className="w-10 h-10 mb-2 text-green-500/50" />
        <p className="text-sm">暂无已处理告警记录</p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {alerts.map((alert: any) => (
        <div
          key={alert.id}
          className="flex items-start gap-3 p-3 rounded-lg bg-steel-800/40 border-l-2 border-l-green-600/60"
        >
          <div className="pt-0.5 flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-green-500/70" />
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <p className="text-white text-sm line-through opacity-70">
              {alert.message}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px]">
              <span className="text-steel-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {alert.time}
              </span>
              <span className="px-1.5 py-0.5 rounded bg-steel-700/50 text-steel-300">
                {moduleLabels[alert.module as AlertModule] || alert.module}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] pt-1 border-t border-steel-700/30">
              <span className="text-green-400/80 flex items-center gap-1">
                <User className="w-3 h-3" />
                {alert.resolvedBy || '系统'}
              </span>
              <span className="text-steel-500 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {alert.resolvedTime || '-'}
              </span>
            </div>
            {alert.resolvedRemark && (
              <p className="text-steel-400 text-xs break-words bg-steel-800/50 rounded px-2 py-1 border border-steel-700/30">
                <span className="inline-flex items-center gap-1 text-steel-500 mr-1">
                  <FileText className="w-3 h-3" />
                  处理说明:
                </span>
                {alert.resolvedRemark}
              </p>
            )}
          </div>
        </div>
      ))}
      {alerts.length >= 20 && (
        <p className="text-center text-xs text-steel-500 pt-1">
          仅显示最近 20 条已处理记录
        </p>
      )}
    </div>
  );
}
