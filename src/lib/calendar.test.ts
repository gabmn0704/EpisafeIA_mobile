import { groupByDay, monthGrid, shiftMonth } from './calendar';

describe('calendar', () => {
  it('monthGrid empieza en lunes y cubre el mes completo', () => {
    // Noviembre 2026 empieza en domingo: 6 celdas de relleno antes.
    const weeks = monthGrid(2026, 10);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    expect(weeks[0]?.[6]).toEqual({ key: '2026-11-01', day: 1, inMonth: true });
    expect(weeks[0]?.[0]?.inMonth).toBe(false);
    expect(weeks.flat().filter((c) => c.inMonth)).toHaveLength(30);
  });

  it('un mes que empieza en lunes no añade relleno inicial', () => {
    const weeks = monthGrid(2026, 5); // junio 2026 empieza en lunes
    expect(weeks[0]?.[0]).toEqual({ key: '2026-06-01', day: 1, inMonth: true });
  });

  it('groupByDay usa el día local', () => {
    const a = new Date(2026, 10, 3, 23, 30).toISOString();
    const b = new Date(2026, 10, 3, 1, 0).toISOString();
    const c = new Date(2026, 10, 4, 9, 0).toISOString();
    const g = groupByDay([{ startedAt: a }, { startedAt: b }, { startedAt: c }]);
    expect(g.get('2026-11-03')).toHaveLength(2);
    expect(g.get('2026-11-04')).toHaveLength(1);
  });

  it('shiftMonth cruza años', () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 });
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 });
  });
});
