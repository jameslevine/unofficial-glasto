import { describe, expect, it } from 'vitest';
import { greatCircleKm, walkingMinutes } from '../src/walking.js';

const PYRAMID = { lat: 51.1539, lon: -2.5871 };
const PARK = { lat: 51.1614, lon: -2.5847 };

describe('walking', () => {
  it('great-circle distance between Pyramid and Park is ~0.86 km', () => {
    const km = greatCircleKm(PYRAMID, PARK);
    expect(km).toBeGreaterThan(0.7);
    expect(km).toBeLessThan(1.0);
  });

  it('walking minutes Pyramid → Park is around 14–18 min with detour factor', () => {
    const min = walkingMinutes(PYRAMID, PARK);
    expect(min).toBeGreaterThanOrEqual(12);
    expect(min).toBeLessThanOrEqual(20);
  });

  it('returns 0 for the same point', () => {
    expect(walkingMinutes(PYRAMID, PYRAMID)).toBe(0);
  });
});
