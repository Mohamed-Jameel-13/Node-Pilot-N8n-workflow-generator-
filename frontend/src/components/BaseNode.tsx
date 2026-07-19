import React from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';

// Map node label to an icon character for quick recognition
function getNodeIcon(label: string): string {
  const l = (label || '').toLowerCase();
  if (l.includes('webhook') || l.includes('trigger')) return '⚡';
  if (l.includes('email') || l.includes('mail')) return '✉️';
  if (l.includes('http') || l.includes('request')) return '🌐';
  if (l.includes('slack')) return '💬';
  if (l.includes('postgres') || l.includes('sql') || l.includes('database') || l.includes('db')) return '🗄️';
  if (l.includes('cron') || l.includes('schedule')) return '🕒';
  if (l.includes('code') || l.includes('function')) return '⚙️';
  if (l.includes('if') || l.includes('condition') || l.includes('branch')) return '🔀';
  if (l.includes('set') || l.includes('transform') || l.includes('enrich')) return '✏️';
  if (l.includes('send') || l.includes('notification')) return '📤';
  if (l.includes('create') || l.includes('new')) return '➕';
  if (l.includes('update') || l.includes('status')) return '🔄';
  if (l.includes('check') || l.includes('exist')) return '🔍';
  if (l.includes('merge')) return '🔗';
  if (l.includes('split')) return '↕️';
  return '📦';
}

export function BaseNode({ data, isConnectable, selected }: NodeProps) {
  let borderClass = 'border-zinc-600';
  let badge = null;

  if (selected) {
    borderClass = 'border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]';
  } else if (data.diffState === 'added') {
    borderClass = 'border-green-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]';
    badge = <div className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] px-1.5 rounded-full font-bold z-10">NEW</div>;
  } else if (data.diffState === 'modified') {
    borderClass = 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.3)]';
    badge = <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-[10px] px-1.5 rounded-full font-bold z-10">EDIT</div>;
  } else if (data.diffState === 'deleted') {
    borderClass = 'border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)] opacity-70';
    badge = <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-1.5 rounded-full font-bold z-10">DEL</div>;
  }

  const icon = getNodeIcon(data.label as string);
  const label = (data.label as string) || 'Unknown Node';
  const params = data.parameters as Record<string, unknown> | undefined;
  const hasParams = Boolean(params && Object.keys(params).length > 0);

  return (
    <div
      className={`relative px-4 py-3 shadow-md rounded-lg bg-zinc-900 border-2 ${borderClass} min-w-[160px] cursor-pointer transition-all duration-150 hover:brightness-125 group`}
      title="Click to view/edit configuration"
    >
      {badge}

      <Handle
        type="target"
        position={Position.Left}
        isConnectable={isConnectable}
        className="!w-3 !h-3 !bg-zinc-400 !border-2 !border-zinc-600 hover:!bg-blue-400 transition-colors"
      />

      <div className="flex flex-col items-center gap-1">
        <span className="text-lg leading-none">{icon}</span>
        <div className="text-sm font-semibold text-white text-center leading-tight">
          {label}
        </div>
        {hasParams && (
          <div className="text-[10px] text-zinc-500 mt-0.5">configured ✓</div>
        )}
      </div>

      {/* Click hint tooltip */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <span className="text-[10px] text-zinc-500 whitespace-nowrap bg-zinc-800 px-1.5 py-0.5 rounded">
          click to configure
        </span>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="!w-3 !h-3 !bg-zinc-400 !border-2 !border-zinc-600 hover:!bg-blue-400 transition-colors"
      />
    </div>
  );
}
