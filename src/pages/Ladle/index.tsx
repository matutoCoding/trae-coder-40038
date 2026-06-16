import { useState } from 'react';
import { Plus, Thermometer, Weight, Clock, CheckCircle, Search } from 'lucide-react';
import StatusBadge from '@/components/Status/StatusBadge';
import { useProductionStore } from '@/store/useProductionStore';
import type { LadleStatus } from '@/types';

const statusMap: Record<LadleStatus, { label: string; status: 'running' | 'warning' | 'standby' | 'success' }> = {
  pending: { label: '待接收', status: 'standby' },
  receiving: { label: '接收中', status: 'warning' },
  pouring: { label: '浇注中', status: 'running' },
  finished: { label: '浇注完成', status: 'success' },
};

export default function LadlePage() {
  const { ladleList, addLadle, setLadleStatus } = useProductionStore();
  const [showForm, setShowForm] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [formData, setFormData] = useState({
    ladleNo: '',
    steelGrade: 'Q235B',
    temperature: '',
    weight: '',
  });

  const filteredList = ladleList.filter(
    (l) =>
      l.ladleNo.toLowerCase().includes(searchText.toLowerCase()) ||
      l.steelGrade.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.ladleNo || !formData.temperature || !formData.weight) return;

    addLadle({
      ladleNo: formData.ladleNo,
      steelGrade: formData.steelGrade,
      temperature: parseFloat(formData.temperature),
      weight: parseFloat(formData.weight),
      receiveTime: new Date().toLocaleString('zh-CN', { hour12: false }),
      status: 'receiving',
      heatNo: `H-${formData.steelGrade}-${Date.now().toString().slice(-4)}`,
    });

    setFormData({ ladleNo: '', steelGrade: 'Q235B', temperature: '', weight: '' });
    setShowForm(false);
  };

  const handleStatusChange = (id: string, newStatus: LadleStatus) => {
    setLadleStatus(id, newStatus);
  };

  const stats = {
    total: ladleList.length,
    pouring: ladleList.filter((l) => l.status === 'pouring').length,
    receiving: ladleList.filter((l) => l.status === 'receiving').length,
    finished: ladleList.filter((l) => l.status === 'finished').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-steel-800 rounded-lg">
              <Clock className="w-5 h-5 text-steel-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">今日总数</p>
              <p className="text-2xl font-mono font-bold text-white">{stats.total}</p>
            </div>
          </div>
        </div>
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500/20 rounded-lg">
              <Thermometer className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">浇注中</p>
              <p className="text-2xl font-mono font-bold text-green-400">{stats.pouring}</p>
            </div>
          </div>
        </div>
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500/20 rounded-lg">
              <Weight className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">接收中</p>
              <p className="text-2xl font-mono font-bold text-yellow-400">{stats.receiving}</p>
            </div>
          </div>
        </div>
        <div className="card-industrial p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-steel-400">已完成</p>
              <p className="text-2xl font-mono font-bold text-blue-400">{stats.finished}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="card-industrial">
        <div className="card-header">
          <h2 className="card-title">钢包钢水接收管理</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-steel-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="搜索钢包号或钢种..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="input-field pl-9 w-60"
              />
            </div>
            <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              新增接收
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-steel-700/50 bg-steel-800/30">
                <th className="table-cell text-left table-header">钢包编号</th>
                <th className="table-cell text-left table-header">钢种</th>
                <th className="table-cell text-left table-header">温度</th>
                <th className="table-cell text-left table-header">重量</th>
                <th className="table-cell text-left table-header">接收时间</th>
                <th className="table-cell text-left table-header">状态</th>
                <th className="table-cell text-left table-header">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((ladle) => (
                <tr
                  key={ladle.id}
                  className="border-b border-steel-700/30 hover:bg-steel-800/30 transition-colors"
                >
                  <td className="table-cell font-mono">{ladle.ladleNo}</td>
                  <td className="table-cell">{ladle.steelGrade}</td>
                  <td className="table-cell">
                    <span
                      className={`font-mono ${
                        ladle.temperature > 1580
                          ? 'text-red-400'
                          : ladle.temperature < 1530
                          ? 'text-yellow-400'
                          : 'text-green-400'
                      }`}
                    >
                      {ladle.temperature > 0 ? `${ladle.temperature}℃` : '--'}
                    </span>
                  </td>
                  <td className="table-cell font-mono">
                    {ladle.weight > 0 ? `${ladle.weight.toFixed(1)} t` : '--'}
                  </td>
                  <td className="table-cell text-steel-400 text-sm">
                    {ladle.receiveTime || '--'}
                  </td>
                  <td className="table-cell">
                    <StatusBadge
                      status={statusMap[ladle.status].status}
                      text={statusMap[ladle.status].label}
                    />
                  </td>
                  <td className="table-cell">
                    <div className="flex items-center gap-2">
                      {ladle.status === 'receiving' && (
                        <button
                          onClick={() => handleStatusChange(ladle.id, 'pouring')}
                          className="text-xs px-2 py-1 bg-green-600 hover:bg-green-500 text-white rounded transition-colors"
                        >
                          开始浇注
                        </button>
                      )}
                      {ladle.status === 'pouring' && (
                        <button
                          onClick={() => handleStatusChange(ladle.id, 'finished')}
                          className="text-xs px-2 py-1 bg-steel-600 hover:bg-steel-500 text-white rounded transition-colors"
                        >
                          结束浇注
                        </button>
                      )}
                      {ladle.status === 'pending' && (
                        <button
                          onClick={() => handleStatusChange(ladle.id, 'receiving')}
                          className="text-xs px-2 py-1 bg-yellow-600 hover:bg-yellow-500 text-white rounded transition-colors"
                        >
                          接收
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card-industrial w-full max-w-md mx-4">
            <div className="card-header">
              <h2 className="card-title">新增钢包接收</h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-steel-400 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-steel-300 mb-1.5">钢包编号</label>
                <input
                  type="text"
                  value={formData.ladleNo}
                  onChange={(e) => setFormData({ ...formData, ladleNo: e.target.value })}
                  className="input-field"
                  placeholder="例如：L-2024-0617-05"
                />
              </div>
              <div>
                <label className="block text-sm text-steel-300 mb-1.5">钢种</label>
                <select
                  value={formData.steelGrade}
                  onChange={(e) => setFormData({ ...formData, steelGrade: e.target.value })}
                  className="input-field"
                >
                  <option value="Q235B">Q235B</option>
                  <option value="Q345B">Q345B</option>
                  <option value="45#">45#</option>
                  <option value="20#">20#</option>
                  <option value="HRB400">HRB400</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-steel-300 mb-1.5">温度 (℃)</label>
                  <input
                    type="number"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                    className="input-field"
                    placeholder="1568"
                  />
                </div>
                <div>
                  <label className="block text-sm text-steel-300 mb-1.5">重量 (t)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.weight}
                    onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                    className="input-field"
                    placeholder="85.6"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary"
                >
                  取消
                </button>
                <button type="submit" className="btn-primary">
                  确认接收
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
