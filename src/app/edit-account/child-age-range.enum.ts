export enum ChildAgeRange {
  MONTHS_0_5,
  MONTHS_6_11,
  YEAR_1,
  YEAR_2,
  YEAR_3,
  YEARS_4_6,
  YEARS_7_PLUS
}


export const CHILD_AGE_RANGE_OPTIONS = [
  { label: '0–5 months', value: ChildAgeRange.MONTHS_0_5 },
  { label: '6–11 months', value: ChildAgeRange.MONTHS_6_11 },
  { label: '1 year', value: ChildAgeRange.YEAR_1 },
  { label: '2 years', value: ChildAgeRange.YEAR_2 },
  { label: '3 years', value: ChildAgeRange.YEAR_3 },
  { label: '4–6 years', value: ChildAgeRange.YEARS_4_6 },
  { label: '7+ years', value: ChildAgeRange.YEARS_7_PLUS },
];
