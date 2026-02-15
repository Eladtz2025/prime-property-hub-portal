interface RunItem {
  task: string;
  time: string;
  duration: string;
  summary: string;
  status: string;
  type: 'scan' | 'matching' | 'availability' | 'backfill' | 'cleanup';
  propertyType?: string;
  startedAt: Date;
}

export interface AggregatedRun {
  task: string;
  time: string;
  duration: string;
  summary: string;
  status: string;
  type: RunItem['type'];
  propertyType?: string;
  startedAt: Date;
  batchCount: number;
}

const MAX_GAP_MS = 10 * 60 * 1000; // 10 minutes

function parseSummaryNumbers(summary: string): number[] {
  const matches = summary.match(/[\d,]+/g);
  if (!matches) return [];
  return matches.map(m => parseInt(m.replace(/,/g, ''), 10));
}

function buildAggregatedSummary(summaries: string[]): string {
  if (summaries.length === 0) return '';
  // Extract the "template" from the first summary (words between numbers)
  const template = summaries[0];
  const parts = template.split(/[\d,]+/);
  
  // Sum all numbers across summaries
  const allNumbers = summaries.map(parseSummaryNumbers);
  const summed: number[] = [];
  const maxLen = Math.max(...allNumbers.map(n => n.length));
  for (let i = 0; i < maxLen; i++) {
    summed.push(allNumbers.reduce((acc, nums) => acc + (nums[i] ?? 0), 0));
  }

  // Rebuild: part0 + num0 + part1 + num1 + ...
  let result = '';
  for (let i = 0; i < parts.length; i++) {
    result += parts[i];
    if (i < summed.length) {
      result += summed[i].toLocaleString('he-IL');
    }
  }
  return result;
}

function resolveStatus(statuses: string[]): string {
  if (statuses.includes('running')) return 'running';
  if (statuses.includes('failed')) return 'failed';
  if (statuses.includes('stopped')) return 'stopped';
  return 'completed';
}

export function aggregateConsecutiveRuns(items: RunItem[]): AggregatedRun[] {
  if (!items || items.length === 0) return [];

  // Items are sorted desc by startedAt
  const groups: RunItem[][] = [];
  let currentGroup: RunItem[] = [items[0]];

  for (let i = 1; i < items.length; i++) {
    const prev = currentGroup[currentGroup.length - 1];
    const curr = items[i];
    // Same task and within 10 min gap (prev is newer, curr is older)
    if (curr.task === prev.task && prev.startedAt.getTime() - curr.startedAt.getTime() <= MAX_GAP_MS) {
      currentGroup.push(curr);
    } else {
      groups.push(currentGroup);
      currentGroup = [curr];
    }
  }
  groups.push(currentGroup);

  return groups.map(group => {
    if (group.length === 1) {
      return { ...group[0], batchCount: 1 };
    }

    const newest = group[0];
    const oldest = group[group.length - 1];
    const formatTime = (d: Date) => d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Jerusalem' });

    return {
      task: newest.task,
      time: `${formatTime(oldest.startedAt)}-${formatTime(newest.startedAt)}`,
      duration: `${group.length} באצ׳ים`,
      summary: buildAggregatedSummary(group.map(r => r.summary)),
      status: resolveStatus(group.map(r => r.status)),
      type: newest.type,
      propertyType: newest.propertyType,
      startedAt: newest.startedAt,
      batchCount: group.length,
    };
  });
}
