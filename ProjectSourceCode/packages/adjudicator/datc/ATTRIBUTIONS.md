# DATC test data attribution

`datc_v2.4_06.txt` holds section 6 of the Diplomacy Adjudicator Test Cases (DATC) version 2.4.

- DATC: copyright Lucas B. Kruijswijk (http://web.inter.nl.net/users/L.B.Kruijswijk/)
- Text format: the [jDip](http://jdip.sourceforge.net/) project
- Source of this copy: the [zond/godip](https://github.com/zond/godip) repository's
  `variants/classical/datc/datc_v2.4_06.txt`, licensed GPL-3.0-or-later; attribution: godip contributors
  (https://github.com/zond/godip/graphs/contributors)

Changes from the godip copy, also recorded in the file header:

- Case 6.A.5: the misspelled power "Germnay" is corrected to "Germany".
- Case 6.F.15 was labeled a second 6.F.14 and had Italy's convoyed unit as a fleet in North Africa, so its convoy could
  never succeed. It is relabeled 6.F.15 and restored to DATC's army, which reaches Wales.
- Cases 6.H.5 and 6.H.5.mod: the Russian support `F con S A ruh-hol` names units that don't exist, so the Turkish fleet
  could never have been dislodged. Restored to DATC's `F con S F bla-ank`.
- Cases 6.H.14 and 6.H.15: the position before and after the retreat listed units where they stood before the movement
  phase. Restored to the position after movement (France in Picardy and Portugal, Germany in Burgundy), and 6.H.15 lists
  the dislodged English fleet.
- Case 6.H.16: `F mid-spa` restored to DATC's `F mid-spa/nc`; without a coast the order is void under 6.B.1, so Spain
  would not be contested.

Our project ships under the same license.
