IN THE VOID — PDF Forensic Fingerprinting

This add-on fingerprints PDF downloads without changing the visible filename, page content, or layout.

Behavior:
1) Downloads can receive a user-specific fingerprint containing user name, role, date, day and time.
2) Re-uploaded fingerprinted copies can preserve parent fingerprints and append the current downloader fingerprint.
3) Direct downloads of the clean/original file do not inherit another user's fingerprint.
4) The visible PDF does not display a fingerprint label.
5) The marker is repeated on every page as tiny/off-page content and the final PDF SHA-256 is stored server-side.
6) The server-side record stores fingerprint, user, role, material, date, day, time, parent fingerprints and final SHA-256.

Security limitation: a PDF rebuilt from scratch can discard embedded markers. Missing/invalid markers should be treated as tampered/untrusted.

Supabase: run MIDAD_PDF_FINGERPRINT.sql once in the project SQL editor.
