# Changelog

## [1.3.1](https://github.com/The-Diplomats/Diplomacy/compare/diplomacy-v1.3.0...diplomacy-v1.3.1) (2026-11-19)


### Tests

* **e2e:** add Playwright specs, scenario seeder and required E2E check ([#126](https://github.com/The-Diplomats/Diplomacy/issues/126)) ([c9a6cb8](https://github.com/The-Diplomats/Diplomacy/commit/c9a6cb83d65b201ef7dea371a050a7ee37eb2d8d))


### CI

* deploy dev on merge and promote releases to stage and prod ([#128](https://github.com/The-Diplomats/Diplomacy/issues/128)) ([4bec819](https://github.com/The-Diplomats/Diplomacy/commit/4bec81911883b6ad44b36da3bb29ab5d25b38638))

## [1.3.0](https://github.com/The-Diplomats/Diplomacy/compare/diplomacy-v1.2.0...diplomacy-v1.3.0) (2026-11-18)


### Features

* add invite-only sign-up and maintenance mode ([#113](https://github.com/The-Diplomats/Diplomacy/issues/113)) ([4b22e44](https://github.com/The-Diplomats/Diplomacy/commit/4b22e44d54b87a8cd5beec1af37fde6dd3852820))
* **worker:** add the LLM client and the ai-turns queue ([#122](https://github.com/The-Diplomats/Diplomacy/issues/122)) ([38e649c](https://github.com/The-Diplomats/Diplomacy/commit/38e649cbdf06f71faeededc3f39e07ca8a550f1c))


### Bug Fixes

* **auth:** accept real provider OAuth callbacks ([#102](https://github.com/The-Diplomats/Diplomacy/issues/102)) ([acd3f16](https://github.com/The-Diplomats/Diplomacy/commit/acd3f1605eca32378cf3e95a8b1c60eba389ab5f))
* **auth:** harden OAuth sign-in and document local setup + api scripts ([#106](https://github.com/The-Diplomats/Diplomacy/issues/106)) ([19ed344](https://github.com/The-Diplomats/Diplomacy/commit/19ed3441f6d2d92d2c5d806ffbe39bd1425a52dc))


### Documentation

* **platform:** add the Azure Container Apps runbook ([#118](https://github.com/The-Diplomats/Diplomacy/issues/118)) ([ddaa006](https://github.com/The-Diplomats/Diplomacy/commit/ddaa00662f369c6a891b46d7196dc515a263dc48))
* record Neon setup and Cloudflare DNS decisions ([#109](https://github.com/The-Diplomats/Diplomacy/issues/109)) ([5f4af7d](https://github.com/The-Diplomats/Diplomacy/commit/5f4af7d9053c20edd223bfb3b3d90e1110340003))
* record the Azure hosting decisions and add Static Web Apps to the runbook ([#120](https://github.com/The-Diplomats/Diplomacy/issues/120)) ([90eec27](https://github.com/The-Diplomats/Diplomacy/commit/90eec2726ebd0ca8fb262678a73903290d6e5d9c))


### Performance Improvements

* **worker:** poll idle queues less often ([#111](https://github.com/The-Diplomats/Diplomacy/issues/111)) ([1210335](https://github.com/The-Diplomats/Diplomacy/commit/1210335a4627d207131d58851b1e9edf989f2a66))


### Tests

* added tests for sending and receiving public messages ([#104](https://github.com/The-Diplomats/Diplomacy/issues/104)) ([bfe5d03](https://github.com/The-Diplomats/Diplomacy/commit/bfe5d03668bbbcb7052735bc3c24404b2aa1a8aa))


### CI

* build and push backend and worker images to GHCR ([#116](https://github.com/The-Diplomats/Diplomacy/issues/116)) ([51ee572](https://github.com/The-Diplomats/Diplomacy/commit/51ee5720a46fd578e911f2a5bb7254e63179c2e4))
* deploy the frontend to the dev Static Web App ([#119](https://github.com/The-Diplomats/Diplomacy/issues/119)) ([604433a](https://github.com/The-Diplomats/Diplomacy/commit/604433a7817fa36312cd280df743430c3cbe924d))

## [1.2.0](https://github.com/The-Diplomats/Diplomacy/compare/diplomacy-v1.1.0...diplomacy-v1.2.0) (2026-11-16)


### Features

* chat database and POST methods ([#93](https://github.com/The-Diplomats/Diplomacy/issues/93)) ([90d7bf7](https://github.com/The-Diplomats/Diplomacy/commit/90d7bf798b56a06588d9f7cf91be83cbed1fff37))
* **db:** complete game database schema and migrations ([#96](https://github.com/The-Diplomats/Diplomacy/issues/96)) ([195f14f](https://github.com/The-Diplomats/Diplomacy/commit/195f14f6e4d9ea6a267b9b6624365d6c367ab625))
* **db:** game db + game_players as players db ([#92](https://github.com/The-Diplomats/Diplomacy/issues/92)) ([39bb184](https://github.com/The-Diplomats/Diplomacy/commit/39bb184af3bb1d4de8940e8e3b3fef2b9de21fe0))
* **email+ci:** resend template + docker env ref + basic branding ([#97](https://github.com/The-Diplomats/Diplomacy/issues/97)) ([45b88ab](https://github.com/The-Diplomats/Diplomacy/commit/45b88ab6203a556f86da7507ffcb0b90a3f0b342))
* **oAuth:** implemented Google and Microsoft authentication methods for sign in and register ([#99](https://github.com/The-Diplomats/Diplomacy/issues/99)) ([5e94403](https://github.com/The-Diplomats/Diplomacy/commit/5e9440323a02a607b394e28e5babf1c63f949a80))
* OpenAPI YAML boilerplate for remaining endpoints ([#95](https://github.com/The-Diplomats/Diplomacy/issues/95)) ([6644ad3](https://github.com/The-Diplomats/Diplomacy/commit/6644ad38236d593011b50889d97a97d1d53af0a1))
* persistent public chat ([#94](https://github.com/The-Diplomats/Diplomacy/issues/94)) ([ed8754f](https://github.com/The-Diplomats/Diplomacy/commit/ed8754ffbe9c0443f5b17d5ef468da2b3047d388))


### Bug Fixes

* **db:** align game schema with the design doc and API contract ([#100](https://github.com/The-Diplomats/Diplomacy/issues/100)) ([a2a483b](https://github.com/The-Diplomats/Diplomacy/commit/a2a483bfba0aba7fe709e59c782e8c645e95fc53))


### Documentation

* ai guidelines + updated design doc ([#84](https://github.com/The-Diplomats/Diplomacy/issues/84)) ([8351d0e](https://github.com/The-Diplomats/Diplomacy/commit/8351d0e37e770fc5f5cac0e470c7bfa6c22fdb0e))


### Code Refactoring

* **api:** categorize api contracts ([#98](https://github.com/The-Diplomats/Diplomacy/issues/98)) ([4d50b67](https://github.com/The-Diplomats/Diplomacy/commit/4d50b67adf65f6d88330c6e1bed7d0d1127a9d90))


### Miscellaneous

* **commitlint:** Allow any subject case ([#86](https://github.com/The-Diplomats/Diplomacy/issues/86)) ([71b48ed](https://github.com/The-Diplomats/Diplomacy/commit/71b48edb9c2e3f146f308ed6e08aea098a6dffd2))

## [1.1.0](https://github.com/The-Diplomats/Diplomacy/compare/diplomacy-v1.0.0...diplomacy-v1.1.0) (2026-11-09)


### Features

* auth email verification ([#81](https://github.com/The-Diplomats/Diplomacy/issues/81)) ([f212c2a](https://github.com/The-Diplomats/Diplomacy/commit/f212c2a09f8e04aca28d23d6b8e43cfad3301e0f))
* **db:** add player profiles schema and repository ([#28](https://github.com/The-Diplomats/Diplomacy/issues/28)) ([#80](https://github.com/The-Diplomats/Diplomacy/issues/80)) ([b13e588](https://github.com/The-Diplomats/Diplomacy/commit/b13e5889c6fd17693c0e96fdd8c8afc21b881284))
* **frontend:** add game rules page ([#68](https://github.com/The-Diplomats/Diplomacy/issues/68)) ([a200edd](https://github.com/The-Diplomats/Diplomacy/commit/a200eddf0f0008167d29cc979d5750d6153184bd))
* **frontend:** local public chat ([#75](https://github.com/The-Diplomats/Diplomacy/issues/75)) ([9e6b054](https://github.com/The-Diplomats/Diplomacy/commit/9e6b054d103a243e1f6464615743af20a4ffabb8))
* **register:** made routes for register and cleaned up routes for testing ([#73](https://github.com/The-Diplomats/Diplomacy/issues/73)) ([b5cb014](https://github.com/The-Diplomats/Diplomacy/commit/b5cb014c951b0809212438fa44d3ecfcdd37df84))

## 1.0.0 (2026-11-05)


### Features

* add Diplomacy game rules page ([#24](https://github.com/The-Diplomats/Diplomacy/issues/24)) ([b2f880e](https://github.com/The-Diplomats/Diplomacy/commit/b2f880ee0fd00a9e21fa17bdfef413317eb0dca9))
* add game rules page ([baeb59a](https://github.com/The-Diplomats/Diplomacy/commit/baeb59aea74ac3aa3891ac8454405b7e5c941853))
* **board:** added sample board to build off of (only france) ([5a2c88c](https://github.com/The-Diplomats/Diplomacy/commit/5a2c88c415daa1d3b9bc841c104ce5678263bd81))
* **board:** added sample board to build off of (only france) ([92a20b3](https://github.com/The-Diplomats/Diplomacy/commit/92a20b3c554e9f30f874267f2bf0835c9ce533bf))
* **board:** updated css to add highlighting to territories ([0628a17](https://github.com/The-Diplomats/Diplomacy/commit/0628a1756e54256b0a24be4432083a42b1c88830))
* **board:** updated css to add highlighting to territories ([6d03fd5](https://github.com/The-Diplomats/Diplomacy/commit/6d03fd5a2b3282f70221b224ecab4bd18b1f256e))


### Bug Fixes

* **scaffold:** scaffold foundation refinements ([#36](https://github.com/The-Diplomats/Diplomacy/issues/36)) ([d869595](https://github.com/The-Diplomats/Diplomacy/commit/d86959578d0072373cd7b9d90bb167a7e1684c9b))


### Documentation

* **release-notes:** init release notes + fix contracts missing schema ([864676c](https://github.com/The-Diplomats/Diplomacy/commit/864676c3692438d62b6486363379b619960d9d8e))
* **release-notes:** init release notes + fix contracts missing schema ([88f8ad3](https://github.com/The-Diplomats/Diplomacy/commit/88f8ad3f5e4bfe309ae26581be0341b1efaf1ae3))
* **scaffold:** add package READMEs for game-types, contracts, adjudicator ([#41](https://github.com/The-Diplomats/Diplomacy/issues/41)) ([f022792](https://github.com/The-Diplomats/Diplomacy/commit/f022792d6d1ef1b8f349727fb20f19a285f64df3))


### Code Refactoring

* organize game rules page layout ([893a704](https://github.com/The-Diplomats/Diplomacy/commit/893a704598aa1e3dc154e922c8a6d82d469a2b27))


### Miscellaneous

* **backend:** add session middleware and /auth/me stub ([#47](https://github.com/The-Diplomats/Diplomacy/issues/47)) ([4cd72da](https://github.com/The-Diplomats/Diplomacy/commit/4cd72da7a8e0ecae4635d508a9292c7810f3ac0b))
* **backend:** host-based surface routing + admin surface scaffold ([#49](https://github.com/The-Diplomats/Diplomacy/issues/49)) ([fc3c512](https://github.com/The-Diplomats/Diplomacy/commit/fc3c51276e4265d904b12f2fb533cbe8fab713f8))
* **backend:** openapi request validation + surface-scoped routing ([#50](https://github.com/The-Diplomats/Diplomacy/issues/50)) ([5f66515](https://github.com/The-Diplomats/Diplomacy/commit/5f66515d344afe5f8371a82960ee1a0dfc71db7d))
* **backend:** socket.io server with Redis adapter and session-cookie handshake ([#48](https://github.com/The-Diplomats/Diplomacy/issues/48)) ([51a77eb](https://github.com/The-Diplomats/Diplomacy/commit/51a77ebb936722d15f52923127549c617e1057a3))
* **deps:** bump @vitest/mocker ([#42](https://github.com/The-Diplomats/Diplomacy/issues/42)) ([6e6d46e](https://github.com/The-Diplomats/Diplomacy/commit/6e6d46ed1ae6c5cbf60f7fa4d44486573c8704cc))
* **format:** ignore generated CHANGELOG.md in prettier check ([#66](https://github.com/The-Diplomats/Diplomacy/issues/66)) ([63b398d](https://github.com/The-Diplomats/Diplomacy/commit/63b398d4bad36bfa176e98374075c08fef040f2e))
* **scaffold:** add @diplomacy/adjudicator package ([#39](https://github.com/The-Diplomats/Diplomacy/issues/39)) ([e274611](https://github.com/The-Diplomats/Diplomacy/commit/e274611903c1f3037c01542386e0c86a1178b326))
* **scaffold:** add @diplomacy/contracts package ([#38](https://github.com/The-Diplomats/Diplomacy/issues/38)) ([7327bd5](https://github.com/The-Diplomats/Diplomacy/commit/7327bd52a9202440236d7894fdc854100084319e))
* **scaffold:** add @diplomacy/db package ([#40](https://github.com/The-Diplomats/Diplomacy/issues/40)) ([d1cd30e](https://github.com/The-Diplomats/Diplomacy/commit/d1cd30e275a78e4904ad0843d0f38d0249b62b70))
* **scaffold:** add @diplomacy/game-types package ([#37](https://github.com/The-Diplomats/Diplomacy/issues/37)) ([850406d](https://github.com/The-Diplomats/Diplomacy/commit/850406d47a8cc32fcdb753f9c96e565cc06d326a))
* **scaffold:** add backend app ([#46](https://github.com/The-Diplomats/Diplomacy/issues/46)) ([d27505e](https://github.com/The-Diplomats/Diplomacy/commit/d27505ec9aec5da508191e0e73e281b426fd3132))
* **scaffold:** ci workflows + labeler + release-please ([#63](https://github.com/The-Diplomats/Diplomacy/issues/63)) ([a657b46](https://github.com/The-Diplomats/Diplomacy/commit/a657b4650012317ec5b8de277dd1c34ef17e61f3))
* **scaffold:** docker compose + pnpm dev for one command local stack up ([#53](https://github.com/The-Diplomats/Diplomacy/issues/53)) ([12591a0](https://github.com/The-Diplomats/Diplomacy/commit/12591a05884262cff7c6327959bba4c932e633a5))
* **scaffold:** frontend app ([#60](https://github.com/The-Diplomats/Diplomacy/issues/60)) ([33ee83f](https://github.com/The-Diplomats/Diplomacy/commit/33ee83f372550e2f6e6ab77a399275596ac4768a))
* **scaffold:** monorepo foundation ([#17](https://github.com/The-Diplomats/Diplomacy/issues/17)) ([3c560eb](https://github.com/The-Diplomats/Diplomacy/commit/3c560eb2873ef6d31d6f72a0d7bfd4b227433391))
* **scaffold:** worker app with notifications queue and typed broadcast primitive ([#52](https://github.com/The-Diplomats/Diplomacy/issues/52)) ([2faa0a6](https://github.com/The-Diplomats/Diplomacy/commit/2faa0a664116c6b314394396ffc758c6f9f56b5b))
