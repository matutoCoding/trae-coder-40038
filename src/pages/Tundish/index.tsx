import { useEffect, useState } from 'react';
import { Thermometer, Droplets, Clock, Play, Square, Plus, Minus } from 'lucide-react';
import StatusBadge from '@/components/Status/StatusBadge';
import TrendChart from '@/components/Chart/TrendChart';
import LevelGauge from '@/components/Chart/LevelGauge';
import AlertPanel from '@/components/Status/AlertPanel';
import { useProductionStore } from '@/store/useProductionStore';
import type { TundishStatus } from '@/types';

export default function TundishPage() {
  const { tundish, temperatureHistory, setTundishStatus, updateTundishPowder, updateRealTimeData } = useProductionStore();
  const [powderAmount, setPowderAmount] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      updateRealTimeData();
    }, 2000);
    return () => clearInterval(interval);
  }, [updateRealTimeData]);

  const handleStatusChange = (status: TundishStatus) => {
    setTundishStatus(status);
  };

  const handleAddPowder = () => {
    const amount = parseFloat(powderAmount);
    if (amount > 0) {
      updateTundishPowder(amount);
      setPowderAmount('');
    }
  };

  const statusConfig = {
    preparing: { label: '准备中', status: 'warning' as const },
    pouring: { label: '浇铸中', status: 'running' as const },
    stopped: { label: '停浇', status: 'standby' as const },
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="card-industrial">
        <div className="card-header">
          <div className="flex items-center gap-4">
            <h2 className="card-title">中间包 #{tundish.tundishNo}</h2>
            <StatusBadge
              status={statusConfig[tundish.status].status}
              text={statusConfig[tundish.status].label}
            />
          </div>
          <div className="flex items-center gap-2">
            {tundish.status === 'preparing' && (
              <button
                onClick={() => handleStatusChange('pouring')}
                className="btn-primary flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                开浇
              </button>
            )}
            {tundish.status === 'pouring' && (
              <button
                onClick={() => handleStatusChange('stopped')}
                className="btn-danger flex items-center gap-2"
              >
                <Square className="w-4 h-4" />
                停浇
              </button>
            )}
            {tundish.status === 'stopped' && (
              <button
                onClick={() => handleStatusChange('preparing')}
                className="btn-secondary flex items-center gap-2"
              >
                重置
              </button>
            )}
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-sm text-steel-400 mb-2">钢水温度</div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-mono text-4xl font-bold text-orange-400">
                {tundish.temperature.toFixed(1)}
              </span>
              <span className="text-lg text-steel-500">℃</span>
            </div>
            <div className="mt-1">
              <Thermometer className="w-4 h-4 text-orange-400 inline mr-1" />
              <span className="text-xs text-steel-500">实时温度</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-steel-400 mb-2">液位高度</div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-mono text-4xl font-bold text-industrial-400">
                {tundish.liquidLevel.toFixed(0)}
              </span>
              <span className="text-lg text-steel-500">mm</span>
            </div>
            <div className="mt-1">
              <Droplets className="w-4 h-4 text-industrial-400 inline mr-1" />
              <span className="text-xs text-steel-500">目标值 800mm</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-steel-400 mb-2">保护渣加入量</div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-mono text-4xl font-bold text-green-400">
                {tundish.powderAmount.toFixed(1)}
              </span>
              <span className="text-lg text-steel-500">kg</span>
            </div>
            <div className="mt-1">
              <Plus className="w-4 h-4 text-green-400 inline mr-1" />
              <span className="text-xs text-steel-500">累计加入</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-steel-400 mb-2">浇铸时长</div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-mono text-4xl font-bold text-white">
                {tundish.status === 'pouring' ? '2.5' : '0'}
              </span>
              <span className="text-lg text-steel-500">h</span>
            </div>
            <div className="mt-1">
              <Clock className="w-4 h-4 text-steel-400 inline mr-1" />
              <span className="text-xs text-steel-500">{tundish.startTime}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Temperature Trend */}
        <div className="card-industrial lg:col-span-2">
          <div className="card-header">
            <h2 className="card-title">温度趋势曲线</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-steel-400">上限: <span className="text-red-400 font-mono">1580℃</span></span>
              <span className="text-steel-400">下限: <span className="text-yellow-400 font-mono">1530℃</span></span>
            </div>
          </div>
          <div className="p-4">
            <TrendChart
              data={temperatureHistory}
              color="#f97316"
              height={220}
              yMin={1500}
              yMax={1600}
              unit="℃"
              label="近60秒温度趋势"
            />
          </div>
        </div>

        {/* Level Gauge */}
        <div className="card-industrial">
          <div className="card-header">
            <h2 className="card-title">中间包液位</h2>
            <StatusBadge status="running" text="正常" size="sm" />
          </div>
          <div className="p-6 flex justify-center">
            <LevelGauge
              value={tundish.liquidLevel}
              min={0}
              max={1000}
              unit="mm"
              height={220}
              color="#0c8ef0"
            />
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Powder Control */}
        <div className="card-industrial">
          <div className="card-header">
            <h2 className="card-title">保护渣加入控制</h2>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-sm text-steel-400 mb-1.5">加入量 (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={powderAmount}
                  onChange={(e) => setPowderAmount(e.target.value)}
                  className="input-field"
                  placeholder="输入加入量"
                />
              </div>
              <button onClick={handleAddPowder} className="btn-primary h-10 px-6">
                加入
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {[0.5, 1, 2, 5].map((val) => (
                <button
                  key={val}
                  onClick={() => {
                    updateTundishPowder(val);
                  }}
                  className="px-3 py-1.5 bg-steel-700 hover:bg-steel-600 text-white rounded text-sm transition-colors"
                >
                  +{val} kg
                </button>
              ))}
            </div>

            <div className="pt-3 border-t border-steel-700/50">
              <p className="text-xs text-steel-500">
                提示：保护渣应均匀加入，保持渣层厚度在 10-15mm 范围内
              </p>
            </div>
          </div>
        </div>

        {/* Parameter Info */}
        <div className="card-industrial">
          <div className="card-header">
            <h2 className="card-title">工艺参数</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between py-2 border-b border-steel-700/30">
              <span className="text-steel-400">中间包容量</span>
              <span className="text-white font-mono">45 t</span>
            </div>
            <div className="flex justify-between py-2 border-b border-steel-700/30">
              <span className="text-steel-400">目标温度范围</span>
              <span className="text-white font-mono">1530 - 1580 ℃</span>
            </div>
            <div className="flex justify-between py-2 border-b border-steel-700/30">
              <span className="text-steel-400">目标液位</span>
              <span className="text-white font-mono">750 - 850 mm</span>
            </div>
            <div className="flex justify-between py-2 border-b border-steel-700/30">
              <span className="text-steel-400">渣层厚度</span>
              <span className="text-white font-mono">10 - 15 mm</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-steel-400">浸入式水口</span>
              <span className="text-white">SEN-120 型</span>
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
          <AlertPanel moduleFilter="tundish" showAll maxItems={5} />
        </div>
      </div>
    </div>
  );
}
