import { useState } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2, X } from 'lucide-react';
import type { Alert, AlertModule, AlertLevel } from '@/types';
import { useProductionStore } from '@/store/useProductionStore';

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

interface AlertPanelProps {
  moduleFilter?: AlertModule;
  showAll?: boolean;
  maxItems?: number;
  compact?: boolean;
}

const getAlertIcon = (level: AlertLevel) => {
  switch (level) {
    case 'danger':
      return <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0" />;
    default:
      return <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />;
  }
};

const getAlertBorder = (level: AlertLevel, resolved: boolean) => {
  if (resolved) return 'border-l-steel-700';
  switch (level) {
    case 'danger':
      return 'border-l-2 border-l-red-500';
    case 'warning':
      return 'border-l-2 border-l-yellow-500';
    default:
      return 'border-l-2 border-l-blue-500';
  }
};

export default function AlertPanel({
  moduleFilter,
  showAll = false,
  maxItems = 10,
  compact = false,
}: AlertPanelProps) {
  const { alerts, resolveAlert } = useProductionStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [currentAlert, setCurrentAlert] = useState<Alert | null>(null);
  const [resolvedBy, setResolvedBy] = useState('');
  const [resolvedRemark, setResolvedRemark] = useState('');

  const openResolveModal = (alert: Alert) => {
    setCurrentAlert(alert);
    setResolvedBy('');
    setResolvedRemark('');
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setCurrentAlert(null);
    setResolvedBy('');
    setResolvedRemark('');
  };

  const handleConfirm = () => {
    if (currentAlert) {
      resolveAlert(
        currentAlert.id,
        resolvedBy.trim() || undefined,
        resolvedRemark.trim() || undefined
      );
      closeModal();
    }
  };

  const moduleFiltered = alerts.filter((a) => {
    if (moduleFilter) {
      return a.module === moduleFilter;
    }
    return true;
  });

  const list = showAll ? moduleFiltered : moduleFiltered.filter((a) => !a.resolved);
  const displayList = list.slice(0, maxItems);

  if (displayList.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 text-steel-500 ${compact ? 'text-xs' : 'text-sm'}`}>
        <CheckCircle2 className={`${compact ? 'w-6 h-6' : 'w-10 h-10'} mb-2 text-green-500/50`} />
        当前无异常告警
      </div>
    );
  }

  return (
    <>
      <div className={`space-y-1 ${compact ? '' : 'space-y-1.5'}`}>
        {displayList.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start gap-3 p-3 rounded-lg bg-steel-800/40 hover:bg-steel-800/70 transition-colors ${getAlertBorder(
              alert.level,
              alert.resolved
            )} ${compact ? 'py-2 px-3' : ''}`}
          >
            <div className="pt-0.5">{getAlertIcon(alert.level)}</div>
            <div className="flex-1 min-w-0">
              <p
                className={`text-white ${
                  alert.resolved ? 'opacity-60 line-through' : ''
                } ${compact ? 'text-xs' : 'text-sm'}`}
              >
                {alert.message}
              </p>
              <p className={`text-steel-500 mt-0.5 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                {moduleLabels[alert.module] || alert.module} · {alert.time}
                {alert.resolved && alert.resolvedTime && (
                  <span className="ml-2 text-green-500/70">
                    已处理 ({alert.resolvedBy} · {alert.resolvedTime})
                  </span>
                )}
              </p>
              {alert.resolved && alert.resolvedRemark && (
                <p className="text-steel-400 text-xs mt-1 break-words">
                  {alert.resolvedRemark}
                </p>
              )}
            </div>
            {!alert.resolved && (
              <button
                onClick={() => openResolveModal(alert)}
                title="标记已处理"
                className="flex-shrink-0 p-1.5 rounded hover:bg-steel-700 text-steel-400 hover:text-green-400 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {list.length > maxItems && (
          <p className="text-center text-xs text-steel-500 pt-1">
            还有 {list.length - maxItems} 条告警...
          </p>
        )}
      </div>

      {modalOpen && currentAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-md bg-steel-800 rounded-xl border border-steel-700 shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-steel-700">
              <h3 className="text-base font-semibold text-white">处理告警</h3>
              <button
                onClick={closeModal}
                className="p-1 rounded text-steel-400 hover:text-white hover:bg-steel-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="p-3 rounded-lg bg-steel-900/50 space-y-1">
                <p className="text-sm text-white">{currentAlert.message}</p>
                <p className="text-xs text-steel-500">
                  {moduleLabels[currentAlert.module] || currentAlert.module} · {currentAlert.time}
                </p>
              </div>
              <div>
                <label className="block text-xs text-steel-400 mb-1.5">处理人</label>
                <input
                  type="text"
                  value={resolvedBy}
                  onChange={(e) => setResolvedBy(e.target.value)}
                  placeholder="留空使用默认值"
                  className="w-full px-3 py-2 text-sm bg-steel-900 border border-steel-700 rounded-lg text-white placeholder-steel-500 focus:outline-none focus:border-steel-500 focus:ring-1 focus:ring-steel-500"
                />
              </div>
              <div>
                <label className="block text-xs text-steel-400 mb-1.5">处理说明</label>
                <textarea
                  value={resolvedRemark}
                  onChange={(e) => setResolvedRemark(e.target.value)}
                  placeholder="请输入处理说明（可选）"
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-steel-900 border border-steel-700 rounded-lg text-white placeholder-steel-500 focus:outline-none focus:border-steel-500 focus:ring-1 focus:ring-steel-500 resize-none"
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-steel-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm rounded-lg text-steel-300 bg-steel-700 hover:bg-steel-600 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 text-sm rounded-lg text-white bg-green-600 hover:bg-green-500 transition-colors"
              >
                确认处理
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
