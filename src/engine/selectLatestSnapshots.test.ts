import { describe, it, expect } from 'vitest';
import { selectLatestSnapshots } from './selectLatestSnapshots';

describe('selectLatestSnapshots', () => {
  it('should select the latest record based on EC_Fecha_Toma', () => {
    const records = [
      { nhc: '1', date: 1000, ordenToma: 1 },
      { nhc: '1', date: 2000, ordenToma: 1 },
      { nhc: '2', date: 500, ordenToma: 1 }
    ];
    const result = selectLatestSnapshots(records);
    expect(result.length).toBe(2);
    expect(result.find(r => r.nhc === '1')?.date).toBe(2000);
    expect(result.find(r => r.nhc === '2')?.date).toBe(500);
  });

  it('should use Orden_Toma as a tie-breaker for identical dates', () => {
    const records = [
      { nhc: '1', date: 2000, ordenToma: 1 },
      { nhc: '1', date: 2000, ordenToma: 2 }
    ];
    const result = selectLatestSnapshots(records);
    expect(result.length).toBe(1);
    expect(result[0].ordenToma).toBe(2);
  });

  it('should use idToma as a tie-breaker before Orden_Toma', () => {
    const records = [
      { nhc: '1', date: 2000, idToma: 'T1', ordenToma: 2 },
      { nhc: '1', date: 2000, idToma: 'T2', ordenToma: 1 }
    ];
    const result = selectLatestSnapshots(records);
    expect(result.length).toBe(1);
    expect(result[0].idToma).toBe('T2');
  });

  it('should handle missing or invalid dates gracefully', () => {
    const records = [
      { nhc: '1', date: undefined, ordenToma: 1 },
      { nhc: '1', date: 1000, ordenToma: 1 }
    ] as any;
    const result = selectLatestSnapshots(records);
    expect(result.length).toBe(1);
    expect(result[0].date).toBe(1000);
  });

  it('should return empty array if input is empty', () => {
    expect(selectLatestSnapshots([])).toEqual([]);
  });

  it('should correctly filter case D described in clinical requirements', () => {
    const records = [
      { nhc: '1', date: 1000, ordenToma: 1 },
      { nhc: '1', date: 1000, ordenToma: 5 },
      { nhc: '1', date: 1000, ordenToma: 2 }
    ];
    const result = selectLatestSnapshots(records);
    expect(result.length).toBe(1);
    expect(result[0].ordenToma).toBe(5);
  });
});
