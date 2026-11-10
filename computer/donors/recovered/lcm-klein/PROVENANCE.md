# Original LCM Klein modules

Copied without source edits from `justappgrabbin/language-contact-model`, commit `85982982785309c298f7621bebef24faa7d7772d`.

- `klein_autoling.py`: SHA-256 `19d0c24c52251e6d482ce29fda0e9f01c2a963694bc6e27b2262646dbe7d83e3`
- `klein_diseminer.py`: SHA-256 `4f57c62840a8dba43a6f00512d34194e5a7d653198c2f871817cffbb659db6c0`

The complete original repository remains in `/workspace/recovered/language-contact-model`; no new license is assigned to these mixed-source materials. Both modules retain their original documentation and scope limitations. They require Python 3 standard-library support; no paid API or neural weights.

Mounted read-only at `/resources/klein` in the local Computer's isolated Linux runtime. Run `python3 /resources/klein/klein_autoling.py` or `python3 /resources/klein/klein_diseminer.py` from Terminal. Foundry Python capabilities can import them with `sys.path.insert(0, '/resources/klein')`.

Source comparison: AUTOLING UWCS TR43 (1968), original Drive ID `1lyBlx1dKfAIp4GdRsKBRegiu_OPnoMpx`, printed p. 10 / PDF p. 13, describes informant-tested sentence substitution, rejected substitutions entering the illegal list, duplicate-rule consolidation and prevention of unexitable loops. The recovered module implements informant tests and illegal-list checks; this does not establish completeness of every original mechanism. The module explicitly leaves class splitting and transformation learning incomplete.
