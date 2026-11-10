# Synthia recovery inventory — 2026-11-10

## Preservation and selected foundation

Full Git clones with remote branches are retained at `/workspace/recovered/{SynthAi,Synthai2,klein-agent,language-contact-model}`. Work proceeds in a separate worktree `/workspace/synthia`, branch `build/synthia-master-local-20261110`, based on SynthAi `409c271` (`repair/embedded-linux-computer-20261109`). No upstream branch, Drive document, source archive or asset has been deleted or replaced. A Git bundle and content manifest accompany this milestone.

Selection follows actual source inspection: SynthAi main is an older modular runtime; its repair branch contains the existing Kimi Linux desktop, authenticated local host, file admission, ZIP reader, conversation/execution spine, recovered donors and regression tests. Synthai2 main (`3ffd7cb`) contains the React world, workspace API, Python/container bridges and HD calculators, but its shell command bridge spawns the host shell and is not itself container isolation. It is retained as an integration donor, not substituted for the recovered computer.

## Components and dependencies

| Component | Inspected implementation | Status / next integration |
|---|---|---|
| Computer | SynthAi repair branch: `computer/host/server.mjs`, `computer/ComputerRuntime.mjs` | Existing persistent local host; Android provisions auth cookie. Desktop login/start/stop/recovery need completion. |
| File manager, editors, import, chat | `computer/shell/kimi-linux/src/apps/` | Existing real UI and backend routes. Run build and browser verification before certifying. |
| Persistence | `computer/runtime/json-file-persistence.mjs` | Atomic JSON snapshots; baseline restart tests available. |
| Archive ingestion | `computer/host/zip-members.mjs`, `services/file-admission.mjs` | Existing admission, original preservation, collision allocation and address metadata. Supported formats remain bounded. |
| Execution/builders | `computer/engines/unified-execution-spine`, recovered r21.22 ToolFactory | Existing donor path; inspect receipts and actual outputs. General autonomous coding is not established. |
| Klein Agent | `/workspace/recovered/klein-agent` | Local Python model and sourced tool libraries. Requires Python dependencies/weights. README does not establish general intelligence or broad language accuracy. |
| LCM | `/workspace/recovered/language-contact-model` | Actual Python Klein modules, ordered context, REA and tiny diagnostic weights. Full training unfinished; do not present diagnostic weights as a coding model. |
| Address Engine | recovered donor `canonical-address-runtime`, `computer/services/address-service.mjs` | Preserve implementation. Source correspondence and exact human calculations still require verification. |
| Human Design | Synthai2 calculators; LCM circuitry bridge; recovered address sources | Source inspection required before asserting tropical Personality Sun accuracy or five-chart rules. |
| Swarm | Computer automata gateway and recovered donor organism | Existing execution relationships; not yet verified as arbitrary application construction. |
| Core applications | Existing Computer registry currently exposes 5 system apps | You-N-I-Verse, Social Network, Science Lab, Foundry and Grove are not all integrated in selected shell. GroveStore source recovered in Synthai2: app/tool/template collection. The selected shell now has a real retained-artifact library; cross-user distribution remains unimplemented. |

## Research recovery

Exact `Research_Library_Updated_7_Links.pdf` was not found in the accessible workspace or exact Drive filename search. A related directory, **Resonance_Research_Google_Drive_Links.pdf**, Drive ID `1rmPY96xxviwrQyoX8AjqOSxQw3JfhgAI`, was read and downloaded unchanged. Its 31 embedded original-source links cover Klein, semantic spacetime, Human Design, Bantu, Yijing and Euclid. This is a candidate directory, not an asserted identity match. Directory match confidence varies and is retained in its text.

Read `FOUNDATIONAL_CONTEXT.md`, Drive ID `1WldKLRrP-0p4YNJfNVtELe9cy5GTtlzf`: fixed positions differ from occupants; gate/hexagram identity is unresolved; five dimensions do not specify five-chart mathematics. It directs recovery of SynthAi rather than another primary computer.

Historical r22.2 report (Drive ID `1nv79rYdnXdKp-PmBbmZU0gIKyogJaUKm`) describes PDF/EPUB reading, emulator and Android acceptance. Those historical tests have not been reproduced here; source archive identity is not established from the report alone.

## Integration sequence

1. Preserve source commits and assets; run selected branch baseline and build existing desktop.
2. Complete secure desktop startup, stop, backup and recovery around the existing host. Keep Android session behavior compatible.
3. Exercise UI plus API import, preview/edit, actual execution, restart and recovery, recording failures separately.
4. Extend persistent research and capability records through existing state/VFS services. Import original sources with page/section citations and distinguish statements, derivations, choices and hypotheses.
5. Integrate actual core application donors and builders with testable contracts; recover Grove requirements before defining it.
6. Verify Address Engine, tropical Personality Sun, chart constraints and bodygraph relations against original code and sources. Unknown mathematics stays unresolved and cannot gate early computer usability.

This inventory is preliminary and source-grounded, not a declaration that discovery or the full master build is complete.

## Completed local milestone

The selected Computer now builds and runs locally with desktop sign-in, start/stop, checksummed backup/restore, isolated execution adapters, terminal and user controls. Existing file/edit/import/chat paths were repaired through actual browser acceptance. Five core routes have persistent local foundations. Foundry constructs and retains actual output-verified capabilities; Grove reuses them. Science Lab retains cited findings and revisions. Original LCM AUTOLING/DISEMINER modules are available read-only inside isolation; a real AUTOLING composition has been executed and retained. See `START_HERE.md` and `verification/RESULTS.md`.

Grove's earlier source contains real template imports alongside static community listings whose non-template download handler only reports success. Those listings were not carried over as operational capabilities. The local implementation exposes only actual retained artifacts.

Full neural model integration, verified human chart/address mathematics, advanced swarm construction and autonomous online research remain open. This is an early usable release, not certification of the entire master directive.
