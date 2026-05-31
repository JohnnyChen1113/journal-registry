# Curate Discovered Candidates

`review/boundary-review.json` holds auto-discovered journals (`status: "pending"`)
that OpenAlex found in the registry's topic space but that aren't in the registry
yet. Your job: decide which belong, and fill curation fields.

For each pending entry, edit it in place:

1. **Judge scope.** Keep journals in the registry's domain — evolution / genomics /
   molecular / cell / plant biology, and medicine. Set `domain` to `core-bio` or
   `medicine`. Reject (set `status: "rejected"`) journals outside scope: finance,
   geography, broad ecology, chemistry/physics/materials, social science, pure
   engineering. Boundary rule: evolutionary biology stays; whole-organism ecology
   without a molecular/genomic/evolutionary angle goes.
2. **Set fields.** Replace `suggested_field_tags` with curated `field_tags`
   (lowercase, hyphenated). Set `tier`: `flagship` (the 2-3 field-defining
   journals), `top` (major society/Nature/Cell-level), or `specialist`.
3. **Write `quirks`** if the feed/journal has a gotcha worth recording (one line).
4. **Approve.** Set `status: "approved"` for keepers.

When done, run `node scripts/promote.js` to append approved entries to
`seeds/seed-journals.json`, then `node scripts/build.js` to regenerate. Rejected
entries are dropped from the queue on promote.
