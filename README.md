# casechek-technical-challenge
This project contains a JavaScript parser that transforms HL7 SIU messages into clean JSON output based on the provided business rules.  
# Casechek Technical Integration Challenge
## Approach
I structured the solutions as one reusable parser function that accepts a raw HL7 SIU message string and returns one clean JSON object in the expected shape. I first split the message into segments and fields, then extracted the required case-level values using the provided field mapping, identified the primary surgeon and procedure description, and parsed implant NTE lines intro structured implant objects. 

I kept the logic modular by using helper functions for field extraction, component parsing, value cleanup, surgery-side parsing, and implant parsing. I chose this structure because it makes the code easier to read, easier to explain, and easier to extend for future HL7 variations. 

## Assumptions
Where the prompt left room for interpretation, I favored a consistent output shape, preservation of partial data, and minimal transformation beyond the stated business rules.

1. **Scheduling uses the descriptive status value.**  
I used `SCH-25` component 2 for the `scheduling` field, which produces values like `Scheduled`, `Cancelled`, and `Booked` instead of shorthand values like `Sch`, `Can`, or `Bkd`. I chose this because the field mapping explicitly points to `SCH-25 (component 2)`, and component 2 is the clearer business-facing value. 

2. **`surgerySides` is always returned as an array.**  
Even when only one side is present, I return it as an array such as `["Left"]` or `["Bilateral"]`. I made this decision because the expected output shape shows `surgerySides` as an array, so keeping that structure consistent avoids mixing strings and arrays across messages.

3. **HL7 timestamps stay in raw HL7 format.**  
I kept `surgeryDateTime` in the original HL7 timestamp format from `AIS-4` instead of converting it into a JavaScript date or a more human-readable format. I chose that because the prompt specifies the source field but does not ask for date reformatting, and leaving it unchanged avoids introducing assumptions about time zones or formatting standards.

4. **Malformed implant rows are still included.**  
If an implant NTE line is missing a description, missing a lot number, missing a quantity, or contains a non-numeric quantity, I still include it in the `implants` array. Any value that cannot be reliably extracted is set to `null`, and the record gets `parseError: true`. I made this decision because the business rules explicitly say malformed implant rows should still be included rather than dropped.

5. **`parseError` means a required implant field is missing or invalid.**  
I treated an implant row as unparseable when any core implant field could not be reliably extracted: missing description, missing quantity, non-numeric quantity, or missing lot number. I chose that interpretation because the prompt specifically lists those kinds of issues as examples of malformed or unparseable implant data. 

6. **`requiresReview` is only set when quantity is a valid integer greater than 2.**  
I only set `requiresReview: true` when quantity was successfully parsed as an integer and that integer was greater than 2. If quantity was malformed, I left `requiresReview` as false instead of guessing. I chose that because the rule says to flag implants with a quantity greater than 2, which requires the quantity to be parseable first. 

7. **Non-implant NTE segments are excluded from the main output except for counting.**  
NTE segments that are neither implant lines nor the procedure description are not added to the `implants` array or the `procedureDescription` field. Instead, they are counted in `meta.unrecognizedNteCount`. I followed that approach because the business rules explicitly say to exclude those NTE segments while tracking how many were found. 

8. **The Primary AIP segment is used for surgeon information.**  
When multiple `AIP` segments are present, I use the one marked `Primary` to populate `surgeonId`, `surgeonGivenName`, and `surgeonFamilyName`. If none is clearly marked, I fall back to the first AIP segment as defensive handling. I chose this because the field mapping says surgeon data should come from the Primary Surgeon AIP segment. 

9. **The parser is reusable across all provided HL7 messages.**  
I designed the solution as one parser function that accepts any incoming HL7 message string rather than writing separate logic for each sample file. I made that decision because the challenge asks for a JavaScript function plus test cases, which suggests the sample HL7 files are meant to validate one reusable solution.

10. **Blank values are normalized to `null`.**  
When a field is present but empty, I normalize it to `null` rather than leaving it as an empty string. I chose that because it creates a cleaner and more consistent JSON output, and it matches the prompt’s instruction to set unextractable implant fields to `null`.

## HL7 Context
In a real hospital integration, I would expect this SIU^S14 message to originate in the hospital’s EHR and pass through an integration engine such as Qvera before reaching Casechek. My JavaScript function would fit into the transformation stage of that pipeline, after the message is received and routed but before the data is sent downstream in structured form. Its role would be to extract the required scheduling and implant data, apply the business rules, and return clean JSON that Casechek can ingest.
 
By the time my code runs, I would expect to be working with the HL7 message in its original text form, since the parser is designed to read the segments and delimiters directly.

Because I have not worked directly with Qvera before, my approach would be to learn it from the standpoint of where custom parsing logic fits into the overall interface workflow. I would first want to understand how messages are received, where transformation code runs, how errors are logged, and how failed messages are retried or replayed. 

Before building a production integration, I would want clear answers on the expected input format, how to handle missing or malformed fields, whether implant details always arrive in NTE segments, and how duplicate or out-of-order scheduling messages should be managed downstream. 

## Edge Cases
If this were going into production, I would want to harden the parser beyond the sample cases by planning for message variations and operational edge cases that are common in real integrations. That would include malformed or inconsistent segment delimiters, missing required segments, duplicate segment types, repeated fields, and messages that arrive out of order or represent updates to an existing case rather than a brand-new event. I would also want to think through idempotency, so the same message is not processed twice, and establish clear rules for what should be accepted with warnings versus what should be flagged for review. In a real environment, the goal would not just be to parse the HL7 successfully, but to make the integration reliable when incoming data is incomplete, inconsistent, or operationally messy.

## Testing
To verify this in a live environment, I would:
- Unit test representative normal and malformed messages
- Validate output against sample fixtures
- Test through the actual middleware path
- Confirm logging on both success and parse-failure scenarios
- Verify how downstream Casechek services handle partial implant data
