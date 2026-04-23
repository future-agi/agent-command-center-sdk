# Security Policy

## Reporting a Vulnerability

The Future AGI team takes security seriously. If you discover a security vulnerability in the `agentcc` SDKs or any of the `@agentcc/*` packages, please report it privately — **do not open a public GitHub issue.**

**Email:** **security@futureagi.com**

Please include as much of the following as you can:

- Type of issue (e.g. credential leak, SSRF, RCE via deserialization, dependency vulnerability)
- The affected package and version (e.g. `agentcc==1.0.0`, `@agentcc/client@1.0.0`)
- Full paths of source file(s) related to the issue
- Location of the affected source code (tag / branch / commit / direct URL)
- Any special configuration required to reproduce
- Step-by-step instructions to reproduce
- Proof-of-concept or exploit code (if possible)
- Impact — how an attacker might exploit this

## Response timeline

- **Acknowledgement:** within 24 hours of report (Mon–Fri, Pacific & IST)
- **Initial assessment:** within 3 business days
- **Fix target:** depends on severity (see below)
- **Public disclosure:** coordinated with the reporter, typically 7–90 days after a patch is available

### Severity and fix targets

| Severity | Examples | Target |
|---|---|---|
| 🔴 Critical | RCE, credential exposure, remote-triggerable sensitive-data leak | Patch within 72 hours |
| 🟠 High | Auth bypass in SDK integrations, tenant boundary violation via SDK | Patch within 7 days |
| 🟡 Medium | Information disclosure (scoped), prototype pollution in a utility | Patch within 30 days |
| 🟢 Low | Low-impact logging leaks, hardening gaps in examples | Next scheduled release |

## Scope

**In scope:**

- Published SDK packages: `agentcc` (PyPI), `@agentcc/client`, `@agentcc/langchain`, `@agentcc/llamaindex`, `@agentcc/react`, `@agentcc/vercel` (npm)
- Code in this repository on `main` and any release branch

**Out of scope (report to the right place):**

- The Agent Command Center gateway itself — report via the [`future-agi/future-agi`](https://github.com/future-agi/future-agi) repo's security policy
- Future AGI Cloud endpoints (`app.futureagi.com`, `gateway.futureagi.com`, etc.) — report to security@futureagi.com referencing the Cloud scope
- Third-party dependencies or upstream framework bugs (report to the upstream vendor)
- Denial-of-service via traffic volume
- Social-engineering attacks on Future AGI employees
- Spam / brute-force on public marketing pages

## Safe harbor

We will not pursue legal action against security researchers who:

- Make a good-faith effort to avoid privacy violations, destruction of data, and interruption of service
- Only interact with accounts they own or with explicit permission of the account holder
- Do not exploit a vulnerability beyond what is necessary to confirm its existence
- Report the vulnerability promptly
- Do not publicly disclose the vulnerability before a patch is released

## Acknowledgement

We maintain a [Security Researcher Hall of Fame](https://futureagi.com/security/hall-of-fame) and are happy to credit reporters who wish to be named. For qualifying reports, we run a bug bounty via HackerOne — contact security@futureagi.com for details.

## PGP

If you prefer encrypted communication, our PGP key is available at:
<https://futureagi.com/.well-known/pgp-key.txt>

---

Thanks for helping keep Future AGI and our users safe. ❤️
