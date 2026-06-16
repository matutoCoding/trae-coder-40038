import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
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

  const filtered = alerts.filter((a) => {
    if (moduleFilter) {
      // 如果按模块过滤，也展示所有未解决的（因为总览也能看到其他模块）
      // 但以当前模块为主
      return a.module === moduleFilter || showAll ? true : false;
    }
    return true;
  });

  const list = showAll ? filtered : filtered.filter((a) => !a.resolved);
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
          </div>
          {!alert.resolved && (
            <button
              onClick={() => resolveAlert(alert.id)}
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
  );
}
