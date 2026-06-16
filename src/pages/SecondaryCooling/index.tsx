import { useState, useEffect } from 'react';
import { Droplets, Gauge, Thermometer, AlertTriangle, Settings } from 'lucide-react';
import StatusBadge from '@/components/Status/StatusBadge';
import AlertPanel from '@/components/Status/AlertPanel';
import { useProductionStore } from '@/store/useProductionStore';

export default function SecondaryCoolingPage() {
  const { secondaryCoolingZones, castingSpeed, updateCastingSpeed, updateCoolingZoneWater, updateRealTimeData } = useProductionStore();
  const [speedInput, setSpeedInput] = useState(castingSpeed.toString());
  const [bulgeDetected, setBulgeDetected] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      updateRealTimeData();
    }, 2000);
    return () => clearInterval(interval);
  }, [updateRealTimeData]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBulgeDetected(Math.random() > 0.85);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleSpeedChange = () => {
    const speed = parseFloat(speedInput);
    if (speed > 0 && speed <= 3) {
      updateCastingSpeed(speed);
    }
  };

  const handleWaterFlowChange = (zoneId: string, value: number) => {
    updateCoolingZoneWater(zoneId, value);
  };

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-industrial-500/20 rounded-lg">
              <Gauge className="w-5 h-5 text-industrial-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">拉速</p>
              <p className="text-2xl font-mono font-bold text-white">
                {castingSpeed.toFixed(2)} <span className="text-sm text-steel-500">m/min</span>
              </p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Droplets className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">总冷却水量</p>
              <p className="text-2xl font-mono font-bold text-white">
                {secondaryCoolingZones.reduce((sum, z) => sum + z.waterFlow, 0)} <span className="text-sm text-steel-500">L/min</span>
              </p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Thermometer className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">出坯温度</p>
              <p className="text-2xl font-mono font-bold text-white">
                {secondaryCoolingZones[secondaryCoolingZones.length - 1]?.temperature || 0} <span className="text-sm text-steel-500">℃</span>
              </p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${bulgeDetected ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
              <AlertTriangle className={`w-5 h-5 ${bulgeDetected ? 'text-red-400 animate-blink' : 'text-green-400'}`} />
            </div>
            <div>
              <p className="text-sm text-steel-400">鼓肚检测</p>
              <p className={`text-2xl font-bold ${bulgeDetected ? 'text-red-400' : 'text-green-400'}`}>
                {bulgeDetected ? '异常' : '正常'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cooling Zones Schematic */}
        <div className="card-industrial lg:col-span-2">
          <div className="card-header">
            <h2 className="card-title">二冷区冷却示意图</h2>
            <StatusBadge status="running" text="运行中" size="sm" />
          </div>
          <div className="p-6">
            {/* Casting direction indicator */}
            <div className="flex items-center justify-center mb-6">
              <div className="text-sm text-steel-400 mr-4">铸坯流动方向</div>
              <div className="flex-1 max-w-md h-2 bg-steel-700 rounded-full overflow-hidden">
                <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-industrial-500 to-transparent animate-flow bg-[length:200%_100%]"></div>
              </div>
              <div className="text-sm text-steel-400 ml-4">→</div>
            </div>

            {/* Zones */}
            <div className="space-y-4">
              {secondaryCoolingZones.map((zone, index) => (
                <div key={zone.id} className="relative">
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-right">
                      <p className="text-sm font-medium text-white">{zone.zoneName}</p>
                      <p className="text-xs text-steel-500">{zone.temperature}℃</p>
                    </div>

                    <div className="flex-1 bg-steel-800 rounded-lg p-3 border border-steel-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-steel-400">水量 {zone.waterFlow} L/min</span>
                        <span className="text-xs text-steel-400">水比 {zone.waterRatio} L/kg</span>
                      </div>
                      <div className="h-3 bg-steel-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-500"
                          style={{ width: `${(zone.waterFlow / 250) * 100}%` }}
                        ></div>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <input
                          type="range"
                          min="30"
                          max="250"
                          value={zone.waterFlow}
                          onChange={(e) => handleWaterFlowChange(zone.id, parseInt(e.target.value))}
                          className="flex-1 h-1.5 bg-steel-700 rounded-lg appearance-none cursor-pointer accent-industrial-500"
                        />
                      </div>
                    </div>

                    {/* Spray nozzles indicator */}
                    <div className="w-16 flex justify-center">
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className="w-1.5 h-4 bg-blue-400/60 rounded-b-full animate-pulse"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          ></div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {index < secondaryCoolingZones.length - 1 && (
                    <div className="absolute left-24 top-full w-px h-4 bg-steel-600"></div>
                  )}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-steel-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-cyan-400 rounded"></div>
                <span>冷却水流量</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400/60 rounded"></div>
                <span>喷淋状态</span>
              </div>
            </div>
          </div>
        </div>

        {/* Control Panel */}
        <div className="space-y-6">
          {/* Speed Control */}
          <div className="card-industrial">
            <div className="card-header">
              <h2 className="card-title">拉速控制</h2>
              <Settings className="w-4 h-4 text-steel-400" />
            </div>
            <div className="p-4 space-y-4">
              <div className="text-center py-4">
                <div className="text-5xl font-mono font-bold text-industrial-400">
                  {castingSpeed.toFixed(2)}
                </div>
                <div className="text-sm text-steel-500 mt-1">m/min</div>
              </div>

              <div>
                <label className="block text-sm text-steel-400 mb-2">拉速调节</label>
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.05"
                  value={castingSpeed}
                  onChange={(e) => {
                    setSpeedInput(e.target.value);
                    updateCastingSpeed(parseFloat(e.target.value));
                  }}
                  className="w-full h-2 bg-steel-700 rounded-lg appearance-none cursor-pointer accent-industrial-500"
                />
                <div className="flex justify-between text-xs text-steel-500 mt-1">
                  <span>0.5</span>
                  <span>3.0</span>
                </div>
              </div>

              <div className="flex gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={speedInput}
                  onChange={(e) => setSpeedInput(e.target.value)}
                  className="input-field flex-1"
                />
                <button onClick={handleSpeedChange} className="btn-primary">
                  设定
                </button>
              </div>

              <div className="flex gap-2">
                {[0.8, 1.0, 1.2, 1.5].map((val) => (
                  <button
                    key={val}
                    onClick={() => {
                      setSpeedInput(val.toString());
                      updateCastingSpeed(val);
                    }}
                    className={`flex-1 py-2 rounded text-sm transition-colors ${
                      Math.abs(castingSpeed - val) < 0.01
                        ? 'bg-industrial-600 text-white'
                        : 'bg-steel-700 text-steel-300 hover:bg-steel-600'
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bulge Detection */}
          <div className="card-industrial">
            <div className="card-header">
              <h2 className="card-title">铸坯鼓肚检测</h2>
              <StatusBadge
                status={bulgeDetected ? 'danger' : 'running'}
                text={bulgeDetected ? '检测到异常' : '正常'}
                size="sm"
              />
            </div>
            <div className="p-4 space-y-3">
              <div className="flex justify-between py-2 border-b border-steel-700/30">
                <span className="text-steel-400">检测位置</span>
                <span className="text-white">二冷区出口</span>
              </div>
              <div className="flex justify-between py-2 border-b border-steel-700/30">
                <span className="text-steel-400">标准厚度</span>
                <span className="text-white font-mono">220 mm</span>
              </div>
              <div className="flex justify-between py-2 border-b border-steel-700/30">
                <span className="text-steel-400">实测厚度</span>
                <span className={`font-mono ${bulgeDetected ? 'text-red-400' : 'text-green-400'}`}>
                  {bulgeDetected ? '223.5 mm' : '220.2 mm'}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-steel-400">偏差值</span>
                <span className={`font-mono ${bulgeDetected ? 'text-red-400' : 'text-green-400'}`}>
                  {bulgeDetected ? '+3.5 mm' : '+0.2 mm'}
                </span>
              </div>

              {bulgeDetected && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-red-400 font-medium">鼓肚超标告警</p>
                      <p className="text-xs text-steel-400 mt-1">
                        铸坯鼓肚量超过允许偏差 ±3mm，建议降低拉速或增加二冷水量
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Zone Parameters Table */}
      <div className="card-industrial">
        <div className="card-header">
          <h2 className="card-title">各冷却区工艺参数</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-steel-700/50 bg-steel-800/30">
                <th className="table-cell text-left table-header">冷却区</th>
                <th className="table-cell text-left table-header">设定水量 (L/min)</th>
                <th className="table-cell text-left table-header">实际水量 (L/min)</th>
                <th className="table-cell text-left table-header">水比 (L/kg)</th>
                <th className="table-cell text-left table-header">入口温度 (℃)</th>
                <th className="table-cell text-left table-header">出口温度 (℃)</th>
                <th className="table-cell text-left table-header">喷嘴数</th>
                <th className="table-cell text-left table-header">状态</th>
              </tr>
            </thead>
            <tbody>
              {secondaryCoolingZones.map((zone) => (
                <tr
                  key={zone.id}
                  className="border-b border-steel-700/30 hover:bg-steel-800/30 transition-colors"
                >
                  <td className="table-cell font-medium">{zone.zoneName}</td>
                  <td className="table-cell font-mono">{zone.waterFlow}</td>
                  <td className="table-cell font-mono text-green-400">{(zone.waterFlow * 0.98).toFixed(1)}</td>
                  <td className="table-cell font-mono">{zone.waterRatio}</td>
                  <td className="table-cell font-mono">28</td>
                  <td className="table-cell font-mono">{(zone.temperature / 15).toFixed(1)}</td>
                  <td className="table-cell font-mono">{8 + parseInt(zone.id.slice(-1)) * 4}</td>
                  <td className="table-cell">
                    <StatusBadge status="running" text="正常" size="sm" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Module Alerts */}
      <div className="card-industrial">
        <div className="card-header">
          <h2 className="card-title">本模块告警信息</h2>
        </div>
        <div className="p-3">
          <AlertPanel moduleFilter="cooling" showAll maxItems={5} />
        </div>
      </div>
    </div>
  );
}
