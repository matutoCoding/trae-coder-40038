import { useState, useEffect } from 'react';
import { Scissors, Flame, Ruler, Hash, Play, Square, Settings } from 'lucide-react';
import StatusBadge from '@/components/Status/StatusBadge';
import { useProductionStore } from '@/store/useProductionStore';
import { mockCuttingRecords } from '@/data/mockData';

export default function CuttingPage() {
  const { slabList, addSlab, updateSlabStatus } = useProductionStore();
  const [cutLength, setCutLength] = useState('9.5');
  const [flameOn, setFlameOn] = useState(true);
  const [isCutting, setIsCutting] = useState(true);
  const [cutCount, setCutCount] = useState(mockCuttingRecords.length);
  const [records, setRecords] = useState(mockCuttingRecords);
  const [currentPosition, setCurrentPosition] = useState(6.2);

  useEffect(() => {
    if (!isCutting || !flameOn) return;

    const interval = setInterval(() => {
      setCurrentPosition((prev) => {
        const newPos = prev + 0.02;
        const targetLength = parseFloat(cutLength);
        if (newPos >= targetLength) {
          setCutCount((c) => c + 1);
          const newSlab = {
            id: `slab-${Date.now()}`,
            slabNo: `B${new Date().toISOString().slice(2, 10).replace(/-/g, '')}${String(cutCount + 1).padStart(3, '0')}`,
            width: 1500,
            thickness: 220,
            length: targetLength,
            steelGrade: 'Q235B',
            status: 'cut' as const,
            cutTime: new Date().toLocaleString('zh-CN', { hour12: false }),
          };
          addSlab(newSlab);
          setRecords((r) => [
            {
              id: `cut-${Date.now()}`,
              slabNo: newSlab.slabNo,
              cutLength: targetLength,
              cutTime: new Date().toLocaleString('zh-CN', { hour12: false }),
              flameStatus: true,
            },
            ...r,
          ]);
          return 0;
        }
        return newPos;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isCutting, flameOn, cutLength, cutCount, addSlab]);

  const pendingSlabs = slabList.filter((s) => s.status === 'cut');

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-lg">
              <Flame className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">火焰状态</p>
              <p className={`text-xl font-bold ${flameOn ? 'text-orange-400' : 'text-steel-500'}`}>
                {flameOn ? '开启' : '关闭'}
              </p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <Ruler className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">定尺长度</p>
              <p className="text-xl font-mono font-bold text-white">{cutLength} m</p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Hash className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">今日切割数</p>
              <p className="text-xl font-mono font-bold text-white">{cutCount} 块</p>
            </div>
          </div>
        </div>

        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <Scissors className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">切割状态</p>
              <p className={`text-xl font-bold ${isCutting ? 'text-green-400' : 'text-steel-500'}`}>
                {isCutting ? '运行中' : '已停止'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cutting Visualization */}
      <div className="card-industrial">
        <div className="card-header">
          <h2 className="card-title">火焰定尺切割示意图</h2>
          <div className="flex items-center gap-3">
            <StatusBadge status={isCutting && flameOn ? 'running' : 'standby'} text={isCutting && flameOn ? '切割中' : '待机'} size="sm" />
          </div>
        </div>

        <div className="p-6">
          {/* Slab visualization */}
          <div className="relative h-32 bg-steel-800 rounded-lg overflow-hidden border border-steel-700">
            {/* Slab body */}
            <div className="absolute inset-y-4 left-0 right-0 bg-gradient-to-r from-red-700 via-orange-500 to-yellow-500 rounded">
              {/* Scale marks */}
              <div className="absolute inset-0 flex items-end pb-1">
                {[...Array(11)].map((_, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-px h-3 bg-white/30"></div>
                    {i % 2 === 0 && (
                      <span className="text-[10px] text-white/60 font-mono mt-0.5">{i}m</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Cutting torch */}
            <div
              className="absolute top-0 bottom-0 w-1 -ml-0.5 transition-all duration-100"
              style={{ left: `${(currentPosition / parseFloat(cutLength)) * 100}%`, display: 'none' }}
            ></div>

            {/* Fixed cutting position at target length */}
            <div
              className="absolute top-0 bottom-0 w-6 -ml-3 flex flex-col items-center"
              style={{ left: '100%' }}
            >
              {flameOn && (
                <>
                  <div className="w-3 h-6 bg-gradient-to-b from-blue-400 to-orange-500 rounded-b-full animate-pulse"></div>
                  <div className="w-1 h-8 bg-gradient-to-b from-orange-400 via-yellow-400 to-transparent animate-blink"></div>
                </>
              )}
              {!flameOn && <div className="w-3 h-4 bg-gray-500 rounded-b-full"></div>}
            </div>

            {/* Current position indicator */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/50 -ml-px"
              style={{ left: `${(currentPosition / parseFloat(cutLength)) * 100}%` }}
            >
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-steel-900 px-2 py-0.5 rounded text-xs font-mono text-white whitespace-nowrap border border-steel-600">
                {currentPosition.toFixed(2)} m
              </div>
            </div>

            {/* Target line */}
            <div className="absolute top-0 bottom-0 w-0.5 bg-green-500/50 -ml-px" style={{ left: '100%' }}>
              <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-green-400 whitespace-nowrap">
                定尺 {cutLength}m
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-8">
            <div className="flex justify-between text-sm text-steel-400 mb-2">
              <span>切割进度</span>
              <span className="font-mono">{((currentPosition / parseFloat(cutLength)) * 100).toFixed(1)}%</span>
            </div>
            <div className="h-2 bg-steel-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-industrial-500 to-green-500 rounded-full transition-all duration-100"
                style={{ width: `${(currentPosition / parseFloat(cutLength)) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls and Records */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel */}
        <div className="card-industrial">
          <div className="card-header">
            <h2 className="card-title">切割控制</h2>
            <Settings className="w-4 h-4 text-steel-400" />
          </div>
          <div className="p-4 space-y-4">
            <div>
              <label className="block text-sm text-steel-400 mb-1.5">定尺长度 (m)</label>
              <input
                type="number"
                step="0.1"
                value={cutLength}
                onChange={(e) => setCutLength(e.target.value)}
                className="input-field"
              />
              <div className="flex gap-2 mt-2">
                {[6, 8, 9.5, 10, 12].map((val) => (
                  <button
                    key={val}
                    onClick={() => setCutLength(val.toString())}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      parseFloat(cutLength) === val
                        ? 'bg-industrial-600 text-white'
                        : 'bg-steel-700 text-steel-300 hover:bg-steel-600'
                    }`}
                  >
                    {val}m
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-b border-steel-700/30">
              <span className="text-steel-300">火焰开关</span>
              <button
                onClick={() => setFlameOn(!flameOn)}
                className={`w-14 h-7 rounded-full transition-colors relative ${
                  flameOn ? 'bg-orange-500' : 'bg-steel-600'
                }`}
              >
                <div
                  className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-transform ${
                    flameOn ? 'translate-x-8' : 'translate-x-1'
                  }`}
                ></div>
              </button>
            </div>

            <div className="flex gap-3 pt-2">
              {isCutting ? (
                <button
                  onClick={() => setIsCutting(false)}
                  className="btn-danger flex-1 flex items-center justify-center gap-2"
                >
                  <Square className="w-4 h-4" />
                  停止切割
                </button>
              ) : (
                <button
                  onClick={() => setIsCutting(true)}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                  disabled={!flameOn}
                >
                  <Play className="w-4 h-4" />
                  开始切割
                </button>
              )}
            </div>

            <div className="pt-3 border-t border-steel-700/30 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-steel-400">切割枪数</span>
                <span className="text-white font-mono">2 枪</span>
              </div>
              <div className="flex justify-between">
                <span className="text-steel-400">切割速度</span>
                <span className="text-white font-mono">300 mm/min</span>
              </div>
              <div className="flex justify-between">
                <span className="text-steel-400">燃气压力</span>
                <span className="text-white font-mono">0.8 MPa</span>
              </div>
              <div className="flex justify-between">
                <span className="text-steel-400">氧气压力</span>
                <span className="text-white font-mono">1.2 MPa</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Slabs */}
        <div className="card-industrial">
          <div className="card-header">
            <h2 className="card-title">待处理板坯</h2>
            <span className="text-xs text-steel-400">{pendingSlabs.length} 块</span>
          </div>
          <div className="p-2 max-h-[380px] overflow-y-auto">
            {pendingSlabs.length > 0 ? (
              <div className="space-y-1">
                {pendingSlabs.slice(0, 8).map((slab) => (
                  <div
                    key={slab.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-steel-800/50 rounded transition-colors"
                  >
                    <div>
                      <p className="text-sm text-white font-mono">{slab.slabNo}</p>
                      <p className="text-xs text-steel-500">
                        {slab.length}m · {slab.steelGrade}
                      </p>
                    </div>
                    <StatusBadge status="success" text="待清理" size="sm" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-steel-500 text-center py-8">暂无待处理板坯</p>
            )}
          </div>
        </div>

        {/* Cutting Records */}
        <div className="card-industrial">
          <div className="card-header">
            <h2 className="card-title">切割记录</h2>
          </div>
          <div className="p-2 max-h-[380px] overflow-y-auto">
            {records.length > 0 ? (
              <div className="space-y-1">
                {records.slice(0, 10).map((record) => (
                  <div
                    key={record.id}
                    className="flex items-center justify-between px-3 py-2 hover:bg-steel-800/50 rounded transition-colors"
                  >
                    <div>
                      <p className="text-sm text-white font-mono">{record.slabNo}</p>
                      <p className="text-xs text-steel-500">{record.cutTime}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono text-green-400">{record.cutLength}m</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-steel-500 text-center py-8">暂无切割记录</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
