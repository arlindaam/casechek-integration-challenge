# casechek-technical-challenge
This project contains a JavaScript parser that transforms HL7 SIU messages into clean JSON output based on the provided business rules.  
# Casechek Technical Integration Challenge
## Approach
I structured the solutions as one reusable parser function that accepts a raw HL7 SIU message string and returns one clean JSON object in the expected shape. I first split the message into segments and fields, then extracted the required case-level values using the provided field mapping, identified the primary surgeon and procedure description, and parsed implant NTE lines intro structured implant objects. 

I kept the logic modular by using helper functions for field extraction, component parsing, value cleanup, surgery-side parsing, and implant parsing. I chose this structure because it makes the code easier to read, easier to explain, and easier to extend for future HL7 variations. 

## Assumptions
. scheduling should use the descriptive status, not the shorthand code
I decided to use SCH-25 component 2 as the final scheduling value, so outputs become things like Scheduled, Cancelled, and Booked rather than Sch, Can, or Bkd. I made that choice because the field map explicitly points to SCH-25 (component 2) for scheduling, and component 2 is the clearer business-friendly value.

## HL7 Context
In a real hospital integration, this SIU message would likely be received from an EHR by an integration engine such as Qvera QIE. My JavaScript function would fit in the transformation/validation stage before the data is sent downstream to Casechek in structured form. 

The message might arrive as a raw HL7 string through MLLP, a file drop, or an API-driven workflow. 

I would approach Qvera by learning:
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
