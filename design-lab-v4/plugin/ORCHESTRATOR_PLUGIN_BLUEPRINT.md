# Optional Orchestrator Plugin / MCP Blueprint

This is a blueprint, not a finished deployable plugin.

A future SpeakKai Design Lab MCP server could expose:

## `archive_experiment_set`

Inputs:

- repository path
- route range
- reference search strings

Outputs:

- git ref
- archive paths
- screenshot paths
- matched reference route

## `get_verified_content`

Inputs:

- content category
- stakeholder
- route/test

Outputs:

- verified copy blocks
- provenance
- prohibited/unverified claims

## `create_asset_job`

Inputs:

- test number
- tool preference
- input asset
- output specification
- prompt

Outputs:

- job JSON
- status
- fallback plan

## `register_experiment`

Inputs:

- design specification
- route
- component path
- asset dependencies

Outputs:

- registry update
- duplicate-signature warnings

## `capture_experiment`

Inputs:

- route
- viewports
- reduced-motion mode

Outputs:

- screenshots
- console logs
- overflow metrics

## `score_experiment`

Inputs:

- screenshots
- QA metrics
- stakeholder reviews
- design signature

Outputs:

- scorecard
- duplicate warnings
- redesign recommendation

## `publish_candidate`

Inputs:

- selected test
- destination route
- production flags

Outputs:

- deployment plan
- regression checklist

## Safety/quality requirements

- no credential storage
- no deletion before archive
- no fabricated content
- user-approved asset provenance
- deterministic audit logs
- dry-run mode
- explicit distinction between experiment and production
