# Fixture Sources

Provenance for every PDF in `fixtures/leases/`. All five were downloaded directly
from SEC EDGAR (`www.sec.gov/Archives/...`) with a descriptive `User-Agent`
header (`Attest-TakeHome-Research michaellegemah@gmail.com`) per SEC's fair-access
policy, and verified to have a genuine embedded text layer via `pdftotext` before
being kept (see "Verification" below).

## Why only 5, and why these particular filings

The overwhelming majority of EX-10 lease exhibits on EDGAR (2001–present) are
filed as `.htm`/`.txt`, not PDF — SEC's electronic filing rules push filers
toward HTML, and PDF is the exception. A broad, systematic search (SEC EDGAR
full-text search, `efts.sec.gov`, across dozens of lease-related phrase queries,
crossed with `forms=10-K,10-Q,8-K,S-1,S-11,20-F,6-K,10-KSB,10SB12G,SB-2` and
essentially every year 2001–2019) turned up tens of thousands of lease-related
exhibit hits and only a small number of `.pdf`-suffixed exhibits among them.
Most of those PDFs turned out to be: whole-filing "courtesy PDF" renditions of
an entire 10-K/10-Q (not a standalone lease exhibit), lease *amendments* only,
subleases, non-office (industrial/retail) leases, blank lease-summary templates
with no filled-in terms, or scanned forms with garbled/unreliable OCR text.

What did work: a handful of filers/filing-agents between roughly 2001 and 2012
dual-rendered every exhibit as both `.htm` and a matching Acrobat-Distiller-generated
`.pdf` "courtesy copy," and among those, several were genuine, fully filled-in,
standalone office leases. The five kept here all come from that pattern. Two are
from the same tenant (8x8, Inc.) because that company's filings on EDGAR happen to
include two distinct, unrelated PDF-native office leases (different buildings,
different landlords, different years) — each is independently a real, complete,
signed lease, not a duplicate.

Candidates found and rejected (not kept):
- **E-Loan, Inc., Exhibit 10.9** (same 10-Q as the kept Metro Square lease) —
  "First Amendment to Lease" for a different property (South Park Corporate
  Center, Jacksonville FL). Rejected: amendment only, no base lease attached.
- **E-Loan, Inc., Exhibit 10.95** (FY2002 10-K, accession 0001082337-03-000001) —
  full sublease between Allstate Insurance Co. (sublandlord) and E-Loan
  (subtenant). Rejected in favor of primary (non-sub) leases; kept the set to
  direct landlord/tenant office leases only.
- **E-Loan, Inc., Exhibit 10.13** (10-Q, accession 0001082337-03-000005) — a
  sublease of Building D, Pleasanton Corporate Commons (Charles Schwab & Co. as
  sublandlord). Same reason: sublease, not a primary lease.
- **Kyphon Inc., Exhibit 10.18** (8-K/10-Q era filing, accession
  0001123313-05-000044) — "First Amendment to Lease Agreement" expanding Kyphon's
  Sunnyvale, CA space by ~43,000 sq ft. Substantial (21 pages) but still an
  amendment to a base lease that was itself only ever filed as HTML (by a
  different filing agent) — the underlying base lease PDF doesn't exist on EDGAR.
- **Disaboom, Inc., Exhibit 10.1** (8-K, accession 0001079973-07-000503) — a full,
  genuine 83-page sublease (Merlin Technical Solutions as sublandlord, Financial
  Plaza, Greenwood Village CO) with real text layer. Rejected as a sublease, kept
  as a documented near-miss.
- **Aquentium, Inc., Exhibit 10.1** (accession 0001023175-07-000235) — "Commercial
  Lease Agreement" with Halleck Family Trust. Rejected: scanned CAR (California
  Association of Realtors) form with badly garbled OCR text (not a clean text
  layer) and mostly blank/unfilled fields — fails both the text-quality and
  filled-in-terms checks.
- **DVS Shanghai Fangyuan Digital Technology Co. (Digital Video Systems, Inc.),
  Exhibit 10.1** (accession 0001009395-03-000032) — real text layer, real filled
  terms, but a factory-building lease in Shanghai, PRC (industrial use, foreign
  law) — out of scope (office leases only).
- **Scott's Liquid Gold, Inc., Exhibit 10.1** (accession 0000088000-06-000016) —
  bundled asset-purchase/bill-of-sale/lease exhibit for a plastic-parts
  production facility (Keltec Dispensing Systems) — industrial use, not office.
- **Parkway Properties, Inc., 8-K/A** ("111 East Wacker" / One Illinois Center,
  accession 0000729237-06-000018) — real PDF, real text, but it's the 8-K
  narrative describing a $198M building *acquisition*, not a lease document.
- Numerous other PDF hits were whole-filing "courtesy PDF" copies of entire
  10-Ks/10-Qs/8-Ks (MAXXAM Inc., Cross Country Healthcare, China Youth Media,
  Bank of America, Cullen/Frost Bankers, NTS Properties IV/V/VI/VII, Behringer
  Harvard REIT entities, Nationwide Health Properties, CBL & Associates) — not
  standalone lease exhibits, so not usable as single-document lease fixtures.

## Kept fixtures

### 1. `eloan-metro-square-jacksonville.pdf`
- **Lease**: "Metro Square Office Lease Agreement," dated February 4, 2000,
  between Southpark Corporate Center, L.L.C. (Landlord) and E-Loan, Inc.
  (Tenant) — Building E, Metro Square office development, 3563 Philips
  Highway, Jacksonville, FL 32207.
- **Filer**: E Loan Inc (CIK 0001082337)
- **Filing**: Form 10-Q, period ended 2003-03-31, filed 2003-05-15
- **Accession Number**: 0001082337-03-000003
- **Exhibit**: 10.8 (filed in both HTML and PDF; this is the PDF rendition)
- **EDGAR URL**: https://www.sec.gov/Archives/edgar/data/1082337/000108233703000003/exhibit10-8.pdf
- **Pages**: 52
- Note: page 1–2 is a "Lease Summary" quick-reference cover sheet that is
  itself unfilled boilerplate, but the actual lease document beginning on
  page 3 ("THIS METRO SQUARE OFFICE LEASE AGREEMENT...") is fully executed
  with real, specific terms.

### 2. `8x8-sunnyvale-maude-ave.pdf`
- **Lease**: Office lease dated May 1, 2009, between Silicon Valley CA-I, LLC
  (Landlord, managed by RREEF Management Co.) and 8x8, Inc. (Tenant) — 810 West
  Maude Avenue, Sunnyvale, CA 94089; 51,680 rentable sq ft; 36-month term,
  commencing September 1, 2009.
- **Filer**: 8x8, Inc. /DE/ (CIK 0001023731)
- **Filing**: Form 10-K, period ended 2009-03-31, filed 2009-05-26
- **Accession Number**: 0001136261-09-000185
- **Exhibit**: 10.11 (filed in both HTML and PDF; this is the PDF rendition)
- **EDGAR URL**: https://www.sec.gov/Archives/edgar/data/1023731/000113626109000185/exhibit10-11.pdf
- **Pages**: 49

### 3. `8x8-san-jose-onel-drive.pdf`
- **Lease**: "Lease Agreement," dated April 27, 2012, between O'Nel Office
  Holdings, LLC (Landlord) and 8x8, Inc. (Tenant) — 2125 O'Nel Drive, San Jose,
  CA (Santa Clara County); single building of approximately 104,657 rentable
  sq ft.
- **Filer**: 8x8, Inc. /DE/ (CIK 0001023731)
- **Filing**: Form 10-K, period ended 2012-03-31, filed 2012-05-24
- **Accession Number**: 0001136261-12-000328
- **Exhibit**: 10.12 (filed in both HTML and PDF; this is the PDF rendition)
- **EDGAR URL**: https://www.sec.gov/Archives/edgar/data/1023731/000113626112000328/exhibit10-12.pdf
- **Pages**: 20

### 4. `heritage-bank-walnut-creek-ygnacio-plaza.pdf`
- **Lease**: "101 Ygnacio Plaza Office Lease," dated April 27, 2007, between
  101 Ygnacio Plaza Property, LLC (Landlord) and Heritage Bank of Commerce, a
  California corporation (Tenant, subsidiary of Heritage Commerce Corp) —
  Walnut Creek, CA; approximately 3,723 rentable sq ft.
- **Filer**: Heritage Commerce Corp (CIK 0001053352)
- **Filing**: Form 8-K, period of report 2007-05-02, filed 2007-05-03
- **Accession Number**: 0001053352-07-000050
- **Exhibit**: 99.1 (filed in both HTML and PDF; this is the PDF rendition)
- **EDGAR URL**: https://www.sec.gov/Archives/edgar/data/1053352/000105335207000050/exhibit99-1.pdf
- **Pages**: 43

### 5. `tekelec-morrisville-paramount-parkway.pdf`
- **Lease**: "Office Lease," executed August 19, 2009, effective August 1,
  2009, between Duke Realty Limited Partnership (Landlord, doing business as
  Duke Realty of Indiana Limited Partnership in NC) and Tekelec, a California
  corporation doing business in NC as Tekelec, Inc. (Tenant) — Suite 100,
  5200 East Paramount Parkway, Morrisville, NC 27560 (Perimeter Park);
  approximately 154,853 rentable sq ft; 9-year term.
- **Filer**: Tekelec (CIK 0000790705)
- **Filing**: Form 10-Q, period ended 2009-09-30, filed 2009-11-04
- **Accession Number**: 0001136261-09-000327
- **Exhibit**: 10.3 (filed in both HTML and PDF; this is the PDF rendition)
- **EDGAR URL**: https://www.sec.gov/Archives/edgar/data/790705/000113626109000327/exhibit10-3.pdf
- **Pages**: 44
- Note: a companion Exhibit 10.2 in the same filing is a near-duplicate lease
  for the same suite naming "Duke Construction Limited Partnership" as
  landlord (the build-to-suit construction-phase counterpart) — not included
  here to avoid a near-duplicate fixture.

## Verification

For each file: downloaded via `curl` with the User-Agent above; opened and
spot-checked the extracted text for a real, dated, named-parties lease body
(not a blank template, not amendment-only, not a sublease-summary stub); and
ran `pdftotext <file> - | head -c 2000` to confirm a genuine, non-garbled
embedded text layer. All five pass with English-language lease body text.
