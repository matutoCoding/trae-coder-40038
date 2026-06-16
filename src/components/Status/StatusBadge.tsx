interface StatusBadgeProps {
  status: 'running' | 'warning' | 'danger' | 'standby' | 'success' | 'pending';
  text: string;
  size?: 'sm' | 'md';
}

const statusConfig = {
  running: { dot: 'status-running', text: 'text-green-400', bg: 'bg-green-500/10' },
  warning: { dot: 'status-warning', text: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  danger: { dot: 'status-danger', text: 'text-red-400', bg: 'bg-red-500/10' },
  standby: { dot: 'status-standby', text: 'text-gray-400', bg: 'bg-gray-500/10' },
  success: { dot: 'status-running', text: 'text-green-400', bg: 'bg-green-500/10' },
  pending: { dot: 'status-standby', text: 'text-gray-400', bg: 'bg-gray-500/10' },
};

export default function StatusBadge({ status, text, size = 'md' }: StatusBadgeProps) {
  const config = statusConfig[status];
  const dotSize = size === 'sm' ? 'w-2 h-2' : 'w-2.5 h-2.5';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full ${config.bg} ${config.text}`}>
      <span className={`status-dot ${config.dot} ${dotSize}`}></span>
      <span className={`font-medium ${textSize}`}>{text}</span>
    </span>
  );
}
