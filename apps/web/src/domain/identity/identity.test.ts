import { assignBadge, votesCount, type VotingHistory } from './Badge';

const h = (a: string): VotingHistory => {
  const map = { s: 'voted', n: 'did-not-vote', x: 'could-not', u: 'unknown' } as const;
  const [y18, y21, y24] = a.split('').map((c) => map[c as keyof typeof map]);
  return { 2018: y18!, 2021: y21!, 2024: y24! };
};

describe('assignBadge', () => {
  it.each([
    ['sss', 'I2'],
    ['xxs', 'I1'],
    ['sns', 'I3'],
    ['nss', 'I4'],
    ['xns', 'I4'],
    ['nsn', 'I5'],
    ['snn', 'I5'],
    ['nnn', 'I6'],
    ['xxn', 'I6'],
    ['uuu', 'I6'],
  ])('%s → %s', (answers, badge) => {
    expect(assignBadge(h(answers))).toBe(badge);
  });

  it('«No recuerdo» is not counted as a vote', () => {
    expect(votesCount(h('usu'))).toBe(1);
  });
});
