# casechek-integration-challenge
This project contains a JavaScript parser that transforms HL7 SIU messages into clean JSON output based on the provided business rules.  
# Casechek Technical Integration Challenge
## Approach
I structured the solutions as one reusable parser function that accepts a raw HL7 SIU message string and returns one clean JSON object in the expected shape. I first split the message into segments and fields, then extracted the required case-level values using the provided field mapping, identified the primary surgeon and procedure description, and parsed implant NTE lines intro structured implant objects. 

I kept the logic modular by using helper functions for field extraction, component parsing, value cleanup, surgery-side parsing, and implant parsing. I chose this structure because it makes the code easier to read, easier to explain, and easier to extend for future HL7 variations. 

## Assumptions
Where the prompt left room for interpretation, I favored a consistent output shape, preservation of partial data, and minimal transformation beyond the states business rules.

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
In a real hospital integration, this SIU message would likely be received from an EHR by an integration engine such as Qvera QIE. My JavaScript function would fit in the transformation/validation stage before the data is sent downstream to Casechek in structured form. 

The message might arrive as a raw HL7 string through MLLP, a file drop, or an API-driven workflow. 

If I were new to Qvera, I would first learn:
- How messages are received and routed
- Where JavaScript runs in the pipeline
- How retries and error queues are handled
- What logging and observability are available
- Whether downstream systems expect raw HL7, JSON, or both

Before building a production integration, I would ask:
- Are multiple AIS/AIL/AIP segments possible?
- Can implant details appear outside NTE?
- Are repeated fields expected?
- What should happen when required case-level fields are missing?
- What is the retry/error-handling strategy?

## Edge Cases
If this were going into production, I would also want to handle:
- Malformed line delimiters
- Missing required segments
- Duplicate segment types
- Repeated HL7 fields/components
- Unexpected implant formatting
- Messages arriving out of order
- Duplicate case updates / idempotency
- Status updates that overwrite earlier scheduling data

## Testing
To verify this in a live environment, I would:
- Unit test representative normal and malformed messages
- Validate output against sample fixtures
- Test through the actual middleware path
- Confirm logging on both success and parse-failure scenarios
- Verify how downstream Casechek services handle partial implant data
