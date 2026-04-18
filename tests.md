# Test Cases

## Test 1: Parse a mostly valid HL7 case correctly
**Why it matters:** Verifies core field extraction and normal implant parsing.

**Pseudocode:**
- Given `HL7-1`
- When I run `parseHl7Case(message)`
- Then `scheduling` should equal `"Scheduled"`
- And `caseId` should equal `"AUTO291847"`
- And `hospitalId` should equal `"MERCY"`
- And `operatingRoom` should equal `"OR SUITE 4"`
- And `surgeryLocation` should equal `"NORTH WING"`
- And `surgeonId` should equal `"289"`
- And `surgeonGivenName` should equal `"James"`
- And `surgeonFamilyName` should equal `"Smith"`
- And `surgerySides` should equal `["Bilateral"]`
- And `procedureType` should equal `"TOTAL KNEE ARTHROPLASTY"`
- And `procedureDescription` should equal `"TOTAL KNEE ARTHROPLASTY - IMPLANT REQUIRED"`
- And `meta.totalImplants` should equal `4`

## Test 2: High-quantity implants are flagged for review
**Why it matters:** Verifies the business rule that quantities greater than 2 require review.

**Pseudocode:**
- Given `HL7-3`
- When I run `parseHl7Case(message)`
- Then implants with quantities `8`, `3`, and `4` should have `requiresReview = true`
- And implants with quantities `1` or `2` should have `requiresReview = false`

## Test 3: Non-numeric quantity becomes null and sets parseError
**Why it matters:** Verifies malformed implant rows are preserved instead of dropped.

**Pseudocode:**
- Given `HL7-1`
- When I run `parseHl7Case(message)`
- Then the implant `"Stryker Triathlon Patella Button"` should still be included
- And `quantity` should be `null`
- And `lotNumber` should be `null`
- And `parseError` should be `true`

## Test 4: Missing lot number still keeps implant record
**Why it matters:** Verifies the parser handles missing lot numbers according to the rules.

**Pseudocode:**
- Given `HL7-2`
- When I run `parseHl7Case(message)`
- Then `"Smith & Nephew Polar3 Liner"` should still be included
- And `quantity` should be `1`
- And `lotNumber` should be `null`
- And `parseError` should be `true`

## Test 5: Missing description still keeps implant record
**Why it matters:** Verifies the parser preserves partial implant data even when the description is missing.

**Pseudocode:**
- Given `HL7-2`
- When I run `parseHl7Case(message)`
- Then the implant with `lotNumber = "SN-2024-40002"` should still be included
- And `description` should be `null`
- And `quantity` should be `1`
- And `parseError` should be `true`

## Test 6: Non-implant NTE lines are counted correctly
**Why it matters:** Verifies unrelated NTE segments are excluded from the implant list and counted in metadata.

**Pseudocode:**
- Given `HL7-1`
- When I run `parseHl7Case(message)`
- Then `meta.unrecognizedNteCount` should equal `2`

- Given `HL7-2`
- When I run `parseHl7Case(message)`
- Then `meta.unrecognizedNteCount` should equal `3`
