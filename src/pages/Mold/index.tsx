import { useEffect, useState } from 'react';
import { Gauge, Activity, Settings2, AlertTriangle } from 'lucide-react';
import StatusBadge from '@/components/Status/StatusBadge';
import TrendChart from '@/components/Chart/TrendChart';
import LevelGauge from '@/components/Chart/LevelGauge';
import AlertPanel from '@/components/Status/AlertPanel';
import { useProductionStore } from '@/store/useProductionStore';
import type { MoldStatus } from '@/types';

export default function MoldPage() {
  const { mold, liquidLevelHistory, setMoldStatus, updateMoldVibration, updateRealTimeData } = useProductionStore();
  const [vibFreq, setVibFreq] = useState(mold.vibrationFreq.toString());
  const [amplitude, setAmplitude] = useState(mold.amplitude.toString());

  useEffect(() => {
    const interval = setInterval(() => {
      updateRealTimeData();
    }, 2000);
    return () => clearInterval(interval);
  }, [updateRealTimeData]);

  const handleStatusChange = (status: MoldStatus) => {
    setMoldStatus(status);
  };

  const handleApplyVibration = () => {
    const freq = parseFloat(vibFreq);
    const amp = parseFloat(amplitude);
    if (freq > 0 && amp > 0) {
      updateMoldVibration(freq, amp);
    }
  };

  const statusConfig = {
    standby: { label: '待机', status: 'standby' as const },
    running: { label: '运行中', status: 'running' as const },
    fault: { label: '故障', status: 'danger' as const },
  };

  const getLevelStatus = () => {
    if (mold.liquidLevel > 150 || mold.liquidLevel < 90) return 'danger';
    if (mold.liquidLevel > 140 || mold.liquidLevel < 100) return 'warning';
    return 'normal';
  };

  const levelStatus = getLevelStatus();

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="card-industrial">
        <div className="card-header">
          <div className="flex items-center gap-4">
            <h2 className="card-title">结晶器 #{mold.moldNo}</h2>
            <StatusBadge
              status={statusConfig[mold.status].status}
              text={statusConfig[mold.status].label}
            />
          </div>
          <div className="flex items-center gap-2">
            {mold.status === 'standby' && (
              <button
                onClick={() => handleStatusChange('running')}
                className="btn-primary"
              >
                启动
              </button>
            )}
            {mold.status === 'running' && (
              <button
                onClick={() => handleStatusChange('standby')}
                className="btn-secondary"
              >
                停机
              </button>
            )}
            {mold.status === 'fault' && (
              <button
                onClick={() => handleStatusChange('standby')}
                className="btn-primary"
              >
                复位
              </button>
            )}
          </div>
        </div>

        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-sm text-steel-400 mb-2">结晶器液位</div>
            <div className="flex items-baseline justify-center gap-1">
              <span
                className={`font-mono text-4xl font-bold ${
                  levelStatus === 'danger'
                    ? 'text-red-400'
                    : levelStatus === 'warning'
                    ? 'text-yellow-400'
                    : 'text-industrial-400'
                }`}
              >
                {mold.liquidLevel.toFixed(1)}
              </span>
              <span className="text-lg text-steel-500">mm</span>
            </div>
            {levelStatus !== 'normal' && (
              <div className="mt-1 flex items-center justify-center gap-1">
                <AlertTriangle className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-yellow-400">液位波动</span>
              </div>
            )}
          </div>

          <div className="text-center">
            <div className="text-sm text-steel-400 mb-2">振动频率</div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-mono text-4xl font-bold text-green-400">
                {mold.vibrationFreq}
              </span>
              <span className="text-lg text-steel-500">cpm</span>
            </div>
            <div className="mt-1">
              <Activity className="w-4 h-4 text-green-400 inline mr-1" />
              <span className="text-xs text-steel-500">正弦振动</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-steel-400 mb-2">振幅</div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-mono text-4xl font-bold text-purple-400">
                {mold.amplitude}
              </span>
              <span className="text-lg text-steel-500">mm</span>
            </div>
            <div className="mt-1">
              <Gauge className="w-4 h-4 text-purple-400 inline mr-1" />
              <span className="text-xs text-steel-500">冲程</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-sm text-steel-400 mb-2">负滑脱时间</div>
            <div className="flex items-baseline justify-center gap-1">
              <span className="font-mono text-4xl font-bold text-white">
                0.12
              </span>
              <span className="text-lg text-steel-500">s</span>
            </div>
            <div className="mt-1">
              <Settings2 className="w-4 h-4 text-steel-400 inline mr-1" />
              <span className="text-xs text-steel-500">计算值</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Level Trend */}
        <div className="card-industrial lg:col-span-2">
          <div className="card-header">
            <h2 className="card-title">液位实时曲线</h2>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-steel-400">上限: <span className="text-red-400">150mm</span></span>
              <span className="text-steel-400">下限: <span className="text-yellow-400">90mm</span></span>
            </div>
          </div>
          <div className="p-4">
            <TrendChart
              data={liquidLevelHistory}
              color="#0c8ef0"
              height={260}
              yMin={70}
              yMax={170}
              unit="mm"
              label="近60秒液位趋势"
            />
          </div>
        </div>

        {/* Level Gauge */}
        <div className="card-industrial">
          <div className="card-header">
            <h2 className="card-title">液位计</h2>
            <StatusBadge
              status={levelStatus === 'normal' ? 'running' : levelStatus === 'warning' ? 'warning' : 'danger'}
              text={levelStatus === 'normal' ? '正常' : levelStatus === 'warning' ? '预警' : '异常'}
              size="sm"
            />
          </div>
          <div className="p-6 flex justify-center">
            <LevelGauge
              value={mold.liquidLevel}
              min={0}
              max={200}
              unit="mm"
              height={260}
              color={levelStatus === 'normal' ? '#0c8ef0' : levelStatus === 'warning' ? '#eab308' : '#ef4444'}
            />
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Vibration Control */}
        <div className="card-industrial">
          <div className="card-header">
            <h2 className="card-title">振动参数设置</h2>
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm text-steel-400 mb-1.5">振动频率 (cpm)</label>
              <input
                type="number"
                value={vibFreq}
                onChange={(e) => setVibFreq(e.target.value)}
                className="input-field"
              />
              <div className="flex gap-2 mt-2">
                {[120, 150, 180, 200, 240].map((val) => (
                  <button
                    key={val}
                    onClick={() => setVibFreq(val.toString())}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      parseInt(vibFreq) === val
                        ? 'bg-industrial-600 text-white'
                        : 'bg-steel-700 text-steel-300 hover:bg-steel-600'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm text-steel-400 mb-1.5">振幅 (mm)</label>
              <input
                type="number"
                step="0.1"
                value={amplitude}
                onChange={(e) => setAmplitude(e.target.value)}
                className="input-field"
              />
              <div className="flex gap-2 mt-2">
                {[3, 3.5, 4, 4.5, 5].map((val) => (
                  <button
                    key={val}
                    onClick={() => setAmplitude(val.toString())}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      parseFloat(amplitude) === val
                        ? 'bg-industrial-600 text-white'
                        : 'bg-steel-700 text-steel-300 hover:bg-steel-600'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleApplyVibration}
              className="btn-primary w-full mt-2"
              disabled={mold.status !== 'running'}
            >
              应用参数
            </button>
          </div>
        </div>

        {/* Process Info */}
        <div className="card-industrial">
          <div className="card-header">
            <h2 className="card-title">结晶器参数</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between py-2 border-b border-steel-700/30">
              <span className="text-steel-400">结晶器规格</span>
              <span className="text-white font-mono">1500×220 mm</span>
            </div>
            <div className="flex justify-between py-2 border-b border-steel-700/30">
              <span className="text-steel-400">结晶器长度</span>
              <span className="text-white font-mono">900 mm</span>
            </div>
            <div className="flex justify-between py-2 border-b border-steel-700/30">
              <span className="text-steel-400">铜板厚度</span>
              <span className="text-white font-mono">25 mm</span>
            </div>
            <div className="flex justify-between py-2 border-b border-steel-700/30">
              <span className="text-steel-400">冷却水流量</span>
              <span className="text-white font-mono">320 m³/h</span>
            </div>
            <div className="flex justify-between py-2 border-b border-steel-700/30">
              <span className="text-steel-400">进出水温差</span>
              <span className="text-white font-mono">6.5 ℃</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-steel-400">润滑方式</span>
              <span className="text-white">保护渣润滑</span>
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
          <AlertPanel moduleFilter="mold" showAll maxItems={5} />
        </div>
      </div>
    </div>
  );
}
