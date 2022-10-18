# Mock Resources

A mock resource is an imagined REST entity that is identified on an endpoint
by one or more attributes.  Say each entity is identified by a single attribute,
id.  A request may come in with the id in the path, in url parameters, or in the
body of the request.  In any case, each unique value of id indicates a unique
mock resource.

How do we determine which attribute or attributes are relevant in identifying a
mock resource?  Instead of introducing a new mechanism, we rely on the existing
system of rules that can be associated with a response.  The attribute or
attributes of relevance are the ones referenced in the rules.

There are some details in the fine print, but essentially a conjunction of rules
on a response, including one based on request number AND one or more based on
other attributes, means that the request number is relative to the mock resource.
Without the other attributes (in a compound rule), the request number is scoped
to the endpoint as normal.

As part of support for mock resources, it is possible to reset a request number
using an X-Mockoon-Request-Number-Reset header. This can be used to reset an
endpoint or a particular mock resource.

## What Problem Are We Solving?
Mockoon provides several ways to vary the response to a particular request
over time.  Unfortunately, it is still difficult to mock the apparently
simple and common behaviour where a value reported by the API is updated
asynchronously.  Consider, for example, the AWS API to check the status
of an EC2 instance.  Immediately after creation, the status is reported
as pending.  Suddenly, it will switch from pending to running, but there's
no telling when.

### The Workaround - Request Number
The ability to reference the request number in a rule provides some relief
as different responses can be associated with different request numbers.
Using request numbers to vary the response is problematic for two reasons:

1. The request number is scoped to the endpoint, and
2. There is no way to reset the request number, shy of restarting the server.

The problem with number 2 is obvious.  The problem with number 1 is that,
in a REST context, it essentially means only one REST entity can be tested
at a time.  Let's say your test creates two EC2 instances and then checks
the status of only the first one until it changes to running.  If the
status of the second instance is then checked, it will come back as
running immediately.

If you know in advance the number and order of requests that will come in
for various entities, then it's possible to accomplish the goal with
complicated rules and templates that switch on some aspect of the request.
The configuration could easily get messy and become brittle.  Worse of
all, it is not always possible to know in advance what order various
requests will come in, with respect to multiple, simultaneously queried
REST entities.  Anyway, it should not be necessary to impose such a
restriction on what can be tested.

### The Solution - Mock Resources: Request Number Reinterpreted
The use of the request number to vary the response is a good idea, but
it needs to be scoped with higher resolution.  It can't be scoped to each
individual request because then the request number would always appear as
one.  Somehow, the server needs to know which aspect of the request is
relevant, for identification, to tie together requests seen at different
times to associate with a single counter (similar to sessionizing).

Mockoon cannot automatically figure out how to group requests, but it 
does not need to.  The rules system already provides a way to indicate
which parameters or elements of the body are relevant for the selection
of a response.  All we have to do is implement some protocol for the use
of rules to provide an altered semantic for the request number.

Normally, the request number refers to the standard request number that
is incremented by every request on an endpoint.  If, howerver, 

1. there is a conjunction of rules joined by AND,
2. at least one rule is based on the request number,
3. at least one rule is based on a parameter or body element, and
4. all the rules are based on a positive match (not inverted)

...then the request number does not refer to the endpoint-scoped
request number.  Instead, we consider each rule from 3 above.  The
rule has a target and a value.  When a request is received, the value
which is included as part of the request that corresponds with the
rule target can be considered the "resolved" value for the rule.
All the resolved values are joined together to create a unique
identifier.  This combination of values represents a mock resource.
The request number is interpreted as being scoped to the resource.

### Additional and Better Approaches
This is not necessarily an ideal solution for the problem presented above.
The rules and response templates can still become unnecessarily complex.
One reason this route was explored it for the minimal impact it has on
the GUI.  All that is required is a way to toggle a feature enabling
request numbers to be scoped to the resource.  Since support for mock
resources amounts to a different semantic for the same constructs, no
further change is needed to the UI.

#### A New Target Type
On the other hand, one could avoid making the user choose whether to
support mock resources in a variety of ways.  For example, instead of
reinterpreting the request_number target, a new entity_request_number
target type could be added.

#### Delayed Rules Activation
Ultimately, there are better ways to solve the problem at hand.  One
idea involves the addition of an optional property on each rule allowing
it's activation to be delayed.  For example, this rule becomes active
after so many seconds since the server was started, or since the endpoint
or mock resource was reset.

#### Inverted Route Definition
In an effort to simplify the configuration, one might consider a sort
of inversion.  Instead of responses being the dominant element of a
route definition, with selection rules attached, what if the rules
were the dominant element.  Instead of

    response A
        rule 1
        rule 2
        rule 3
    response B
        rule 1
        rule 2

it would be

    rule 1 AND rule 2 AND rule 3
        response A
    rule 2 OR rule 3
        response B

My hunch is that by making responses primary, the tendency is
for more responses, less-reusable responses.  By making the rules
primary, the tendency will be for fewer responses, responses that
use templating more to serve multiple cases.

Clearly the logic is more compact in the rules-first approach.
This can make the rules more difficult to read.  On the other
hand, in the response-first approach, the rules are secondary.
As such, it sometimes becomes necessary to implement the logic
in an awkward, inefficient way.  For example, depending on the
details, the rules often need to be defined in a particular
order, or depend on some partial ordering.  As the primary
focus should be on the logic, considerations of order are
unnecessarily distracting.


## How to Use Mock Resources
Let's say we wish to mock an API for prediction models.
Three endpoints are supported:

    POST /model         - create a model
    GET /model/:id      - get model status
    PUT /model/:id/use  - use a model

Upon creation a model has a status of New.  After some time,
the status becomes Ready and the model can be Used.

If the status is checked immediately after creation, it will
likely be New.  If it is checked after a modest delay, it is likely
to be Ready.  If it has already been used by the time it is first
checked, the status will be Used.  Thus, the first call to get the
status may report (N)ew, (R)eady, or (U)sed.  Subsequent calls
may report the same, or different values.  Let's say we wish to
support the following pattern of responses from the "get status"
endpoint.

    code       description
    ---------  -----------------------------------------------
    R          status is Ready forever
    U          status is Used forever
    N          status is New forever
    NR         status is New, then Ready forever
    NRU        status is New, Ready, then Used forever
    RRU        status is Ready 2 times, then Used forever
    NRRRU      status is New, Ready 3 times, then Used forever

Let's call these profiles.  To support these profiles, we include the
profile code in the attribute that identifies a model.  For example,
when creating a model, we supply the id as model-NRU-test.  In
the rules for the "get status" route, we use regular expressions
to identify the profile codes and, thus, select the right response.

There's a bit of an art to crafting the rules and responses to
support mock resources.  Using 5 responses, we can support the
7 profiles above.

    #  request number           query.id          response
    -  -----------------------  ----------------  -------------------
    1  /./                      /-[NU]-/          New or Used
    2  1                        /-N/              New
    3  /^([3456789]|\d{2,})$/   /-[NR]RU/         Used
    4  /^([56789]|\d{2,})$/     /-NRRRU/          Used
    5  /./                      /./               Ready

This means the first response matches on any request number and the
id contains "-N-" or "-U-".  In this case, the status is returned as
New or Used, accordingly, using a templated response.  The second
response, with a status of New, is returned when the request number
is 1 and the id begins with "-N".  The third response checks for
request number >= 3.  And so forth.  The last response acts as a
catch-all and is designated as the default.

The above route definition will work as long as every value of id
contains a valid profile ID.  If we are willing to put more effort
into the route definition, we can also identify invalid profiles.
For example:

    #  request number           query.id          response
    -  -----------------------  ----------------  -------------------
    1  /./                      /-[NRU]-/         New, Ready, or Used
    2  1                        /-(NRU?|NRRRU)-/  New
    3  2                        /-NR(RRU)?-/      Ready
    4  /^[12]$/                 /-RRU-/           Ready
    5  /^([3456789]|\d{2,})$/   /-[NR]RU-/        Used
    6  /^([56789]|\d{2,})$/     /-NRRRU-/         Used
    7  /./                      /-NR((RR)?U)?-/   Ready
    8                                             Invalid Profile

Using either route definition above, arbitrary models can be created.
For example, here are 6 models based on 4 of the 7 profiles.

    model-NRU-test-normal
    model-NRU-test-another-normal
    model-NRRRU-test-slow-to-be-ready
    model-NRRRU-test-triple-ready
    model-R-test-unused
    model-N-test-blocked

Each one of these represents a unique mock resource.  Requests to get
the status of each may be interleaved.  For any particular mock resource,
the sequence of responses is dictated by its profile.
