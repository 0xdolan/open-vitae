import { describe, expect, it } from 'vitest';

import { ICON_SET_IDS, ICON_SETS, isIconSetId } from '@/config/icon-sets';

import { iconLabel, iconWords, searchIcons } from './search';

const LUCIDE = ['LuMail', 'LuMailOpen', 'LuMapPin', 'LuMapPinned', 'LuPhone', 'LuPhoneCall', 'LuGlobe', 'LuGithub', 'LuBriefcase', 'LuGraduationCap', 'LuSquareCode'];

describe('iconWords', () => {
  it('splits component names into words without the set prefix', () => {
    expect(iconWords('LuMapPin', 'Lu')).toBe('map pin');
    expect(iconWords('FaSquareGithub', 'Fa')).toBe('square github');
    expect(iconWords('BsFillXSquareFill', 'Bs')).toBe('fill x square fill');
    expect(iconWords('Tb3dCubeSphere', 'Tb')).toBe('3d cube sphere');
    expect(iconWords('LuHeading1', 'Lu')).toBe('heading 1');
    expect(iconWords('SiHTML5', 'Si')).toBe('html 5');
  });

  it('makes a readable label', () => {
    expect(iconLabel('LuGraduationCap', 'Lu')).toBe('Graduation cap');
  });
});

describe('searchIcons', () => {
  it('finds icons whose words contain every typed word, whole words first', () => {
    expect(searchIcons(LUCIDE, 'map pin', 'Lu').names).toEqual(['LuMapPin', 'LuMapPinned']);
    expect(searchIcons(LUCIDE, 'mail', 'Lu').names).toEqual(['LuMail', 'LuMailOpen']);
  });

  it('understands common words such as email, location and website', () => {
    expect(searchIcons(LUCIDE, 'email', 'Lu').names[0]).toBe('LuMail');
    expect(searchIcons(LUCIDE, 'location', 'Lu').names).toContain('LuMapPin');
    expect(searchIcons(LUCIDE, 'website', 'Lu').names).toContain('LuGlobe');
    expect(searchIcons(LUCIDE, 'job', 'Lu').names).toEqual(['LuBriefcase']);
  });

  it('returns everything for an empty query, up to the limit, with the total', () => {
    expect(searchIcons(LUCIDE, '  ', 'Lu', 3)).toEqual({ names: ['LuMail', 'LuMailOpen', 'LuMapPin'], total: LUCIDE.length });
  });

  it('returns nothing when a word does not match', () => {
    expect(searchIcons(LUCIDE, 'mail zebra', 'Lu')).toEqual({ names: [], total: 0 });
  });
});

describe('icon sets', () => {
  it('describes every set, with a prefix and a licence', () => {
    for (const id of ICON_SET_IDS) {
      expect(ICON_SETS[id].id).toBe(id);
      expect(ICON_SETS[id].prefix.length).toBeGreaterThan(1);
      expect(ICON_SETS[id].license.length).toBeGreaterThan(1);
    }
    expect(ICON_SETS.lu.label).toBe('Lucide');
    expect(isIconSetId('lu')).toBe(true);
    expect(isIconSetId('nope')).toBe(false);
  });
});
