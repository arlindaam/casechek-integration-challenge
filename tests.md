Test 1: Parses a normal case correctly
- Input: HL7-3
- Expect scheduling = "Booked"
- Expect hospitalId = "CEDARSSINAI"
- Expect surgeonId = "5587"
- Expect implants.length = 6
- Expect meta.unrecognizedNteCount = 1

Test 2: Flags high-quantity implants
- Input: HL7-3
- Expect implant with Qty 8 to have requiresReview = true
- Expect implant with Qty 3 to have requiresReview = true
- Expect implant with Qty 2 to have requiresReview = false

Test 3: Keeps malformed implant with non-numeric quantity
- Input: HL7-1
- Expect "Stryker Triathlon Patella Button" implant to be included
- Expect quantity = null
- Expect parseError = true

Test 4: Keeps malformed implant with missing lot number
- Input: HL7-2
- Expect "Smith & Nephew Polar3 Liner" implant to be included
- Expect lotNumber = null
- Expect parseError = true

Test 5: Keeps malformed implant with missing description
- Input: HL7-2
- Expect implant row with lot "SN-2024-40002" to be included
- Expect description = null
- Expect quantity = 1
- Expect parseError = true

Test 6: Counts non-implant NTE rows correctly
- Input: HL7-1
- Expect meta.unrecognizedNteCount = 2
- Input: HL7-2
- Expect meta.unrecognizedNteCount = 3
