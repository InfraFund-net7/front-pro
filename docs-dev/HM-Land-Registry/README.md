<!-- cspell:words ISBG toomanyproperties novalidtitlefound invalidaddresscriteria nopropertyfound -->

# HM Land Registry - Online Owner Verification

Source: https://landregistry.github.io/bgtechdoc/services/online_owner_verification/

## Overview

Use this HM Land Registry Business Gateway service to verify property ownership data against HM Land Registry property titles in real time.

The service provides information on:

- historical name matching from 2005 onwards
- partial matching to increase the chances of a match
- whether there are other legal owners on the title
- searching by title number to make sure a registered address is available

## For software developers

Use this document to integrate Online Owner Verification data into your system.

## Process flow

The validation process flow has been converted separately to Mermaid and is available in [online-owner-verification-process.md](./online-owner-verification-process.md).

## Validation

The Online Owner Verification validation diagram details the validation that each request goes through.

### Business rules

| Business rule | Decision point |
| --- | --- |
| BRL-ISBG-002 | The postcode must be a valid UK postcode that exists on Land Registry systems. |
| BRL-ISBG-003 | The system must retrieve a maximum of 50 property matches. |
| BRL-ISBG-011 | The title number must exist and must not be recorded on Land Registry systems as a closed title, a Scheme Title, or a New Title allocated to a new title dealing. |
| BRL-ISBG-081 | A valid address must contain a minimum of either: building name or number and postcode; or building name or number, street and city. |
| BRL-ISBG-099 | Where no tenure has been supplied, the system must search against all tenures. |

### Rejection messages

| Message ID | Rejection reason | Rejection code |
| --- | --- | --- |
| MSG-BG-004 | Please provide valid postcode. | `bg.postcode.invalid` |
| MSG-BG-002 | The property address you entered has matched with a large number of properties on our database. Please request again with refined address details. | `bg.properties.toomanyproperties` |
| MSG-BG-010 | Title number is invalid. | `bg.title.invalid` |
| MSG-BG-137 | No valid title number has been identified from the data supplied for this service. | `bg.properties.novalidtitlefound` |
| MSG-BG-136 | Insufficient address details. Please provide house name or number and postcode OR house name or number, street and city. | `bg.address.invalidaddresscriteria` |
| MSG-BG-003 | No title number has been identified from the data supplied. This does not necessarily mean that a register of a title does not exist but only that insufficient data has matched. | `bg.properties.nopropertyfound` |

## Output

The service outputs a list of properties and title numbers.

## Schemas

The schemas have already been downloaded into this directory:

- [RequestOnlineOwnershipVerificationV1_0.xsd](./RequestOnlineOwnershipVerificationV1_0.xsd)
- [ResponseOnlineOwnershipVerificationV1_0.xsd](./ResponseOnlineOwnershipVerificationV1_0.xsd)
- [PollRequest.xsd](./PollRequest.xsd)

## Interface specification

Website with interface specification :

- [Interface specification](https://landregistry.github.io/bgtechdoc/documents/online_owner_verification/OOV_Interface_Spec.html)

## Vendor testing

Website with documents the data required for testing the service.

- [Vendor Test data](https://landregistry.github.io/bgtechdoc/documents/online_owner_verification/OOV_Vendor_test_data.html)
