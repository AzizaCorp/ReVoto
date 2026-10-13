import { election, electionTypeOf } from './Election';

describe('Election (RN-03)', () => {
  it('tells presidential and midterm elections apart', () => {
    expect([2009, 2012, 2015, 2018, 2021, 2024].map((y) => electionTypeOf(y as never))).toEqual([
      'midterm',
      'presidential',
      'midterm',
      'presidential',
      'midterm',
      'presidential',
    ]);
  });

  it('rejects years outside the MVP', () => {
    expect(() => election(2006)).toThrow(RangeError);
  });
});
