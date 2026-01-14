import type { Tour, TourAttendanceInfo, TourPrices } from '../types';

type Attendance = TourAttendanceInfo | string[] | undefined;

export function getAttendanceMembers(attendance: Attendance): string[] {
  if (!attendance) return [];
  if (Array.isArray(attendance)) return attendance;
  return attendance.members || [];
}

function resolvePriceKey(prices: TourPrices, selectedPriceKey?: string): keyof TourPrices | undefined {
  if (!selectedPriceKey) return undefined;
  const key = selectedPriceKey.trim();
  if (!key) return undefined;

  // Exact match
  if (key in prices) return key as keyof TourPrices;

  const lower = key.toLowerCase();
  const entries = Object.keys(prices) as Array<keyof TourPrices>;

  // Case-insensitive exact match
  const ci = entries.find(k => String(k).toLowerCase() === lower);
  if (ci) return ci;

  // Partial match (backward compatibility)
  const partial = entries.find(k => {
    const kLower = String(k).toLowerCase();
    return kLower.includes(lower) || lower.includes(kLower);
  });
  return partial;
}

export function getPricePerPerson(tour: Tour, attendance?: Attendance): number {
  if (!tour.prices) return tour.price;

  const selectedKey =
    attendance && !Array.isArray(attendance) ? attendance.selectedPriceKey : undefined;

  const resolvedKey = resolvePriceKey(tour.prices, selectedKey);
  const selected = resolvedKey ? tour.prices[resolvedKey] : undefined;

  if (selected && typeof selected.value === 'number') {
    return selected.value;
  }

  return tour.price;
}

export function getAttendanceTotal(tour: Tour, attendance?: Attendance): number {
  const members = getAttendanceMembers(attendance);
  if (members.length === 0) return 0;
  return members.length * getPricePerPerson(tour, attendance);
}

