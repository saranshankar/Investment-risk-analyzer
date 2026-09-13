# SEBI Data-Source Findings & Regulatory Snapshot Documentation

**Document Status:** Hackathon Baseline v1.0  
**Tag:** REQUIRES VERIFICATION for production live API claims  

---

## 1. Regulatory Context

Under SEBI (Investment Advisers) Regulations, 2013 and SEBI (Research Analysts) Regulations, 2014, all entities or individuals offering investment advice, stock recommendations, or trading calls in India must possess a valid, active SEBI registration certificate.

Registration numbers follow standardized formats:
- `INA...`: Registered Investment Advisers (RIA)
- `INH...`: Research Analysts (RA)
- `INZ...`: Stock Brokers and Intermediaries
- `INM...`: Portfolio Managers / Alternative Investment Funds

## 2. Public Registry Availability

- **SEBI Official Web Directory**: SEBI publishes directory tables of registered intermediaries at `https://www.sebi.gov.in/sebiweb/other/OtherAction.do?doRecognisedFpi=yes&intmId=13`.
- **Live Search Availability**: There is currently no publicly authenticated REST API provided by SEBI for instantaneous programmatic queries by third-party applications without web scraping or CAPTCHA barriers.
- **Hackathon Architecture Decision**: In strict accordance with PRD Section 16, TipCheck **does not perform live, fragile scraping during user requests**. Instead, TipCheck utilizes an authoritative, indexed snapshot stored locally / in DynamoDB (`sebi_advisers.json`), timestamped with a `snapshot_date` surfaced on every single verdict card.

## 3. Transparency & Consumer Guidance

- TipCheck explicitly informs users of the exact `snapshot_date` of the registry data.
- Direct links to official grievance redressing mechanisms (SEBI SCORES: `https://scores.sebi.gov.in`) and the National Cyber Crime Reporting Portal (`https://cybercrime.gov.in`) are provided inside the application.
- TipCheck never issues investment advice or declares legal guilt; it surfaces verifiable discrepancies and manipulation risk patterns.
