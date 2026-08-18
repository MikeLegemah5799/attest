export type DocumentSummary = {
  slug: string;
  name: string;
  title: string;
  type: string;
  verifiedFilled: number;
  verifiedTotal: number;
  verifiedPercent: number;
  flags: number;
  expires: string;
};

export const documents: DocumentSummary[] = [
  {
    slug: "123-main-st",
    name: "123 Main St — Office",
    title: "123 Main St — Office Lease",
    type: "Office",
    verifiedFilled: 3,
    verifiedTotal: 5,
    verifiedPercent: 82,
    flags: 2,
    expires: "Mar 2027",
  },
  {
    slug: "400-park-ave",
    name: "400 Park Ave — Suite 1200",
    title: "400 Park Ave — Suite 1200 Lease",
    type: "Office",
    verifiedFilled: 5,
    verifiedTotal: 5,
    verifiedPercent: 100,
    flags: 0,
    expires: "Nov 2028",
  },
  {
    slug: "riverside-plaza",
    name: "Riverside Plaza — Bldg C",
    title: "Riverside Plaza — Bldg C Lease",
    type: "Office",
    verifiedFilled: 2,
    verifiedTotal: 5,
    verifiedPercent: 44,
    flags: 4,
    expires: "Jun 2026",
  },
  {
    slug: "harbor-point",
    name: "Harbor Point — Floor 3",
    title: "Harbor Point — Floor 3 Lease",
    type: "Office",
    verifiedFilled: 4,
    verifiedTotal: 5,
    verifiedPercent: 91,
    flags: 1,
    expires: "Aug 2029",
  },
];
