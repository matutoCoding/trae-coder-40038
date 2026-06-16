import { useEffect } from 'react';
import {
  Flame,
  Thermometer,
  Gauge,
  CheckCircle2,
  Clock,
  TrendingUp,
  AlertTriangle,
  AlertCircle,
  Info,
  ArrowRight,
} from 'lucide-react';
import StatCard from '@/components/Card/StatCard';
import TrendChart from '@/components/Chart/TrendChart';
import StatusBadge from '@/components/Status/StatusBadge';
import { useProductionStore } from '@/store/useProductionStore';
import { useNavigate } from 'react-router-dom';

const processSteps = [
  { key: 'ladle', label: '钢包接收', icon: Flame, path: '/ladle' },
  { key: 'tundish', label: '中间包浇铸', icon: Thermometer, path: '/tundish' },
  { key: 'mold', label: '结晶器', icon: Gauge, path: '/mold' },
  { key: 'cooling', label: '二冷拉矫', icon: TrendingUp, path: '/secondary-cooling' },
  { key: 'cutting', label: '定尺切割', icon: Gauge, path: '/cutting' },
  { key: 'cleaning', label: '表面清理', icon: CheckCircle2, path: '/cleaning' },
  { key: 'warehouse', label: '板坯入库', icon: Clock, path: '/warehouse' },
];

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

  useEffect(() => {
    const interval = setInterval(() => {
      updateRealTimeData();
    }, 2000);
    return () => clearInterval(interval);
  }, [updateRealTimeData]);

  const unresolvedAlerts = alerts.filter((a) => !a.resolved);
  const activeLadle = ladleList.find((l) => l.status === 'pouring');
  const processingSlabs = slabList.filter(
    (s) => s.status !== 'warehoused' && s.status !== 'pending_cut'
  );

  const getAlertIcon = (level: string) => {
    switch (level) {
      case 'danger':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default:
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

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

        {/* Alerts */}
        <div className="card-industrial">
          <div className="card-header">
            <h2 className="card-title">告警信息</h2>
            {unresolvedAlerts.length > 0 && (
              <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">
                {unresolvedAlerts.length} 未处理
              </span>
            )}
          </div>
          <div className="p-2 max-h-[220px] overflow-y-auto">
            {alerts.length > 0 ? (
              <div className="space-y-1">
                {alerts.slice(0, 8).map((alert) => (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 px-3 py-2 rounded transition-colors ${
                      alert.resolved ? 'opacity-60' : 'hover:bg-steel-800/50'
                    }`}
                  >
                    {getAlertIcon(alert.level)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{alert.message}</p>
                      <p className="text-xs text-steel-500">
                        {alert.module} · {alert.time}
                      </p>
                    </div>
                    {alert.resolved && (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-steel-500 text-center py-4">暂无告警</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
