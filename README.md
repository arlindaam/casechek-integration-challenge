# casechek-integration-challenge
JavaScript HL7 SIU parser for the Casechek Integration Challenge. 
# Casechek Technical Integration Challenge
## Approach
I built a single parser function that:
1. Splits the HL7 message into segments
2. Extracts the core case fields using the provided field map
3. Identifies the primary surgeon from the AIP segment
4. Finds the procedure description from the NTE segment labeled "Procedure Description"
5. Parses implant NTE rows into structured implant objects
6. Counts non-implant, non-procedure NTE rows as unrecognized notes

I kept the implementation small and readable because the challenge emphasizes being able to explain the logic clearly during the panel.

## Assumptions
- `surgerySides` is always returned as an array, even if there is only one side.
- `scheduling` uses SCH-25 component 2, which is the descriptive status value.
- `surgeryDateTime` is returned in raw HL7 timestamp format.
- An implant record gets `parseError: true` when any required implant field cannot be reliably extracted:
  - missing description
  - missing quantity
  - non-numeric quantity
  - missing lot number
- `requiresReview` is only set when quantity is successfully parsed and is greater than 2.
- For MSH, I handled the standard HL7 indexing offset separately because MSH-1 is the field separator.

## HL7 Context
In a real hospital integration, this SIU^S14 message would likely be received by an integration engine such as Qvera QIE from the hospital EHR. My JavaScript function would fit after message receipt and basic routing, at the transformation/validation step before the structured payload is sent to Casechek’s downstream ingestion endpoint or internal service.

The message might arrive as a raw HL7 string over MLLP, from a file drop, or as a message body passed into a transformation script by the middleware.

If I were new to Qvera, I would first learn:
- how messages are received and routed
- where JavaScript runs in the pipeline
- how retries and error queues are handled
- what logging and observability are available
- whether downstream systems expect raw HL7, JSON, or both

Before building a production integration, I would ask:
- Are multiple AIS/AIL/AIP segments possible?
- Can implant details appear outside NTE?
- Are repeated fields expected?
- What should happen when required case-level fields are missing?
- What is the retry/error-handling strategy?

## Edge Cases
In production, I would also handle:
- malformed line delimiters
- missing required segments
- duplicate segment types
- repeated HL7 fields/components
- unexpected implant formatting
- messages arriving out of order
- duplicate case updates / idempotency
- status updates that overwrite earlier scheduling data

## Testing
To verify this in a live environment, I would:
- unit test representative normal and malformed messages
- validate output against sample fixtures
- test through the actual middleware path
- confirm logging on both success and parse-failure scenarios
- verify how downstream Casechek services handle partial implant data
